//! Write limits (B-013): fixed windows counted in `api_rate_limits`, so every instance of the function shares them.
//! A bucket names what is limited (`rsvp:link:<guest id>`, `rsvp:ip:<keyed hash>`); the N+1th hit inside a window is
//! refused with a 429 problem and writes nothing else. A client address is reduced to a keyed hash before it reaches the
//! database and is never logged (UU PDP). Rows older than a day are pruned as new windows open.

use hmac::{Hmac, KeyInit, Mac};
use sha2::Sha256;
use sqlx::PgPool;
use time::{Duration, PrimitiveDateTime};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Limit {
    pub max: i32,
    pub window_seconds: i64,
}

impl Limit {
    /// `"<count>/<seconds>"`, both positive.
    pub fn parse(raw: &str) -> Option<Self> {
        let (max, seconds) = raw.trim().split_once('/')?;
        let limit = Limit { max: max.trim().parse().ok()?, window_seconds: seconds.trim().parse().ok()? };
        (limit.max > 0 && limit.window_seconds > 0).then_some(limit)
    }
}

/// The limits per write path. Defaults allow a guest to change an answer several times and tolerate many guests behind
/// one carrier-grade NAT; `RATE_LIMIT_RSVP_LINK` / `RATE_LIMIT_RSVP_IP` override them.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Limits {
    pub rsvp_per_link: Limit,
    pub rsvp_per_ip: Limit,
}

impl Default for Limits {
    fn default() -> Self {
        Self {
            rsvp_per_link: Limit { max: 10, window_seconds: 600 },
            rsvp_per_ip: Limit { max: 60, window_seconds: 600 },
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Verdict {
    pub allowed: bool,
    /// Whole seconds until the window ends (at least 1).
    pub retry_after: u64,
}

/// The start of the epoch-aligned window holding `now`.
pub fn window_start(now: PrimitiveDateTime, window_seconds: i64) -> PrimitiveDateTime {
    let seconds = now.assume_utc().unix_timestamp();
    let start = seconds - seconds.rem_euclid(window_seconds);
    let start = time::OffsetDateTime::from_unix_timestamp(start).expect("window start is a valid timestamp");
    PrimitiveDateTime::new(start.date(), start.time())
}

/// Seconds from `now` to the end of its window, rounded up.
pub fn retry_after(now: PrimitiveDateTime, limit: Limit) -> u64 {
    let end = window_start(now, limit.window_seconds) + Duration::seconds(limit.window_seconds);
    let remaining = (end - now).whole_milliseconds();
    u64::try_from((remaining + 999) / 1000).unwrap_or(1).max(1)
}

/// Counts one hit for `bucket` at `now` (the caller's clock, so tests can move it) and says whether it is allowed. A
/// late request from an earlier window counts against the current one instead of rewinding it.
pub async fn hit(pool: &PgPool, bucket: &str, limit: Limit, now: PrimitiveDateTime) -> Result<Verdict, sqlx::Error> {
    let start = window_start(now, limit.window_seconds);
    let hits = sqlx::query_scalar!(
        r#"insert into api_rate_limits (bucket, window_start, hits) values ($1, $2, 1)
           on conflict (bucket) do update set
             hits = case when excluded.window_start > api_rate_limits.window_start then 1 else api_rate_limits.hits + 1 end,
             window_start = greatest(api_rate_limits.window_start, excluded.window_start)
           returning hits"#,
        bucket,
        start
    )
    .fetch_one(pool)
    .await?;
    if hits == 1 {
        sqlx::query!(
            "delete from api_rate_limits where bucket in \
             (select bucket from api_rate_limits where window_start < $1 order by window_start limit 100)",
            now - Duration::days(1)
        )
        .execute(pool)
        .await?;
    }
    Ok(Verdict { allowed: hits <= limit.max, retry_after: retry_after(now, limit) })
}

/// A bucket for a client address: `<scope>:ip:` and 32 hex digits of HMAC-SHA256 under a key derived from the service
/// secret, so the table never holds an address and the hash is useless without the secret.
pub fn ip_bucket(secret: &[u8], scope: &str, address: &str) -> String {
    let mut mac = Hmac::<Sha256>::new_from_slice(secret).expect("HMAC accepts any key length");
    mac.update(b"invitesion rate-limit address v1\0");
    mac.update(address.trim().as_bytes());
    let digest = hex::encode(mac.finalize().into_bytes());
    format!("{scope}:ip:{}", &digest[..32])
}

#[cfg(test)]
mod tests {
    use super::*;
    use time::{Date, Month, Time};

    /// 2026-11-06 at the given UTC wall time.
    fn datetime(hour: u8, minute: u8, second: u8, millis: u16) -> PrimitiveDateTime {
        PrimitiveDateTime::new(
            Date::from_calendar_date(2026, Month::November, 6).unwrap(),
            Time::from_hms_milli(hour, minute, second, millis).unwrap(),
        )
    }

    #[test]
    fn limits_parse_from_count_and_seconds() {
        assert_eq!(Limit::parse("10/600"), Some(Limit { max: 10, window_seconds: 600 }));
        assert_eq!(Limit::parse(" 3 / 60 "), Some(Limit { max: 3, window_seconds: 60 }));
        for raw in ["", "10", "0/60", "10/0", "-1/60", "a/60", "10/b"] {
            assert_eq!(Limit::parse(raw), None, "{raw:?}");
        }
    }

    /// The limiter's clock is injected: windows are epoch-aligned and Retry-After counts to the window's end.
    #[test]
    fn windows_align_and_retry_after_rounds_up() {
        let limit = Limit { max: 1, window_seconds: 600 };
        assert_eq!(window_start(datetime(10, 7, 30, 0), 600), datetime(10, 0, 0, 0));
        assert_eq!(window_start(datetime(10, 10, 0, 0), 600), datetime(10, 10, 0, 0));
        assert_eq!(retry_after(datetime(10, 7, 30, 0), limit), 150);
        assert_eq!(retry_after(datetime(10, 9, 59, 500), limit), 1);
        assert_eq!(retry_after(datetime(10, 10, 0, 0), limit), 600);
    }

    #[test]
    fn address_buckets_are_keyed_and_never_contain_the_address() {
        let a = ip_bucket(b"secret-one", "rsvp", "203.0.113.7");
        assert!(a.starts_with("rsvp:ip:") && a.len() == "rsvp:ip:".len() + 32);
        assert!(!a.contains("203.0.113.7"));
        assert_eq!(a, ip_bucket(b"secret-one", "rsvp", " 203.0.113.7 "));
        assert_ne!(a, ip_bucket(b"secret-two", "rsvp", "203.0.113.7"));
        assert_ne!(a, ip_bucket(b"secret-one", "rsvp", "203.0.113.8"));
    }
}
