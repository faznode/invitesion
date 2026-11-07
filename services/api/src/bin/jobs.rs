//! B-019 (09 §8.6): runs the due jobs once, for a cron invocation, or every minute with `--watch` (the container
//! fallback, 09 §8.8). Needs `DATABASE_URL` (or `POSTGRES_URL`) and the upload store: `S3_*` as in Next.js, or
//! `UPLOAD_ROOT`. Prints one JSON summary line per pass on stdout; exits 2 on configuration, 1 on a failed pass.

use std::time::Duration;

use invitesion_api::config::install_crypto_provider;
use invitesion_api::jobs::run_due;
use invitesion_api::storage::Storage;
use invitesion_api::telemetry;
use invitesion_api::views::utc_now;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};

fn setting(name: &str) -> Option<String> {
    std::env::var(name).ok().map(|v| v.trim().to_string()).filter(|v| !v.is_empty())
}

fn refuse(message: &str) -> ! {
    tracing::error!(message, "jobs refused to start");
    std::process::exit(2);
}

#[tokio::main]
async fn main() {
    telemetry::init();
    install_crypto_provider();
    let watch = std::env::args().skip(1).any(|arg| arg == "--watch");
    let database_url = setting("DATABASE_URL")
        .or_else(|| setting("POSTGRES_URL"))
        .unwrap_or_else(|| refuse("DATABASE_URL or POSTGRES_URL is not set"));
    let storage = Storage::from_env().unwrap_or_else(|error| refuse(&error.to_string()));
    let batch: i64 = setting("JOBS_BATCH")
        .map(|raw| raw.parse().unwrap_or_else(|_| refuse("JOBS_BATCH is not a number")))
        .unwrap_or(10);
    let statement_cache: usize = setting("DATABASE_STATEMENT_CACHE")
        .map(|raw| raw.parse().unwrap_or_else(|_| refuse("DATABASE_STATEMENT_CACHE is not a number")))
        .unwrap_or(0);
    let options: PgConnectOptions = database_url.parse().unwrap_or_else(|_| refuse("DATABASE_URL is not valid"));
    let pool = PgPoolOptions::new()
        .max_connections(2)
        .acquire_timeout(Duration::from_secs(5))
        .connect_lazy_with(options.statement_cache_capacity(statement_cache).application_name("invitesion-jobs"));

    loop {
        match run_due(&pool, &storage, utc_now(), batch).await {
            Ok(summary) => println!(
                "{{\"claimed\":{},\"done\":{},\"retried\":{},\"gaveUp\":{},\"storage\":\"{}\"}}",
                summary.claimed,
                summary.done,
                summary.retried,
                summary.gave_up,
                storage.name()
            ),
            Err(error) => {
                tracing::error!(%error, "jobs pass failed");
                if !watch {
                    std::process::exit(1);
                }
            }
        }
        if !watch {
            break;
        }
        tokio::time::sleep(Duration::from_secs(60)).await;
    }
}
