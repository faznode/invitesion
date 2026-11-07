use time::OffsetDateTime;
use url::Url;

use super::sigv4::{SignInput, sha256_hex, sign_request, uri_encode};
use super::{StorageError, assert_safe_key};

const EMPTY_SHA256: &str = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

#[derive(Clone)]
pub struct S3Config {
    pub bucket: String,
    pub region: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub session_token: Option<String>,
    /// Custom endpoint for S3-compatible providers (Cloudflare R2, MinIO, Backblaze B2); `None` for AWS itself.
    pub endpoint: Option<String>,
    /// `endpoint/bucket/key` instead of `bucket.endpoint/key` (`S3_FORCE_PATH_STYLE=true`).
    pub force_path_style: bool,
}

/// S3-compatible object storage (`S3StorageDriver` in `lib/storage/s3-driver.ts`): single-object GET and PUT, signed
/// in-repo with SigV4 rather than through an SDK.
pub struct S3Storage {
    config: S3Config,
    client: reqwest::Client,
}

impl S3Storage {
    pub fn new(config: S3Config) -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());
        Self { config, client }
    }

    /// Same addressing as the TypeScript driver with the configuration `getStorage()` builds: path-style exactly when
    /// `S3_FORCE_PATH_STYLE=true`, otherwise the bucket as a subdomain of the endpoint (AWS by default).
    pub fn endpoint_for(&self, key: &str) -> Result<String, StorageError> {
        let encoded = uri_encode(assert_safe_key(key)?, false);
        let base = match &self.config.endpoint {
            Some(endpoint) => endpoint.trim_end_matches('/').to_string(),
            None => format!("https://s3.{}.amazonaws.com", self.config.region),
        };
        if self.config.force_path_style {
            return Ok(format!("{base}/{}/{encoded}", self.config.bucket));
        }
        let mut url = Url::parse(&base).map_err(|e| StorageError::Http(format!("endpoint: {e}")))?;
        let host = url.host_str().ok_or_else(|| StorageError::Http("endpoint has no host".into()))?.to_string();
        url.set_host(Some(&format!("{}.{host}", self.config.bucket)))
            .map_err(|e| StorageError::Http(format!("endpoint: {e}")))?;
        url.set_path(&format!("/{encoded}"));
        Ok(url.to_string())
    }

    fn sign(
        &self,
        method: &str,
        url: &str,
        payload_hash: &str,
        extra: &[(&str, &str)],
    ) -> Result<Vec<(String, String)>, StorageError> {
        let mut headers: Vec<(&str, &str)> = vec![("x-amz-content-sha256", payload_hash)];
        headers.extend_from_slice(extra);
        sign_request(&SignInput {
            method,
            url,
            region: &self.config.region,
            service: "s3",
            access_key_id: &self.config.access_key_id,
            secret_access_key: &self.config.secret_access_key,
            session_token: self.config.session_token.as_deref(),
            payload_hash,
            headers: &headers,
            date: OffsetDateTime::now_utc(),
        })
        .map_err(|e| StorageError::Http(format!("sign: {e}")))
    }

    pub async fn get(&self, key: &str) -> Result<Option<Vec<u8>>, StorageError> {
        let url = self.endpoint_for(key)?;
        let mut request = self.client.get(&url);
        for (name, value) in self.sign("GET", &url, EMPTY_SHA256, &[])? {
            if name != "host" {
                request = request.header(name, value);
            }
        }
        let response = request.send().await.map_err(|e| StorageError::Http(format!("GET: {e}")))?;
        if response.status() == reqwest::StatusCode::NOT_FOUND {
            return Ok(None);
        }
        if !response.status().is_success() {
            return Err(StorageError::Http(format!("GET {}", response.status().as_u16())));
        }
        let bytes = response.bytes().await.map_err(|e| StorageError::Http(format!("GET body: {e}")))?;
        Ok(Some(bytes.to_vec()))
    }

    pub async fn put(&self, key: &str, bytes: Vec<u8>, content_type: &str) -> Result<(), StorageError> {
        let url = self.endpoint_for(key)?;
        let payload_hash = sha256_hex(&bytes);
        let length = bytes.len().to_string();
        let mut request = self.client.put(&url);
        for (name, value) in
            self.sign("PUT", &url, &payload_hash, &[("content-type", content_type), ("content-length", &length)])?
        {
            if name != "host" {
                request = request.header(name, value);
            }
        }
        let response = request.body(bytes).send().await.map_err(|e| StorageError::Http(format!("PUT: {e}")))?;
        if !response.status().is_success() {
            return Err(StorageError::Http(format!("PUT {}", response.status().as_u16())));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn storage(endpoint: Option<&str>, force_path_style: bool) -> S3Storage {
        S3Storage::new(S3Config {
            bucket: "invitesion-media".into(),
            region: "ap-southeast-1".into(),
            access_key_id: "k".into(),
            secret_access_key: "s".into(),
            session_token: None,
            endpoint: endpoint.map(str::to_string),
            force_path_style,
        })
    }

    #[test]
    fn addressing_matches_the_typescript_driver() {
        let key = "variants/12/0123456789abcdef01234567/standard-640.webp";
        assert_eq!(
            storage(None, false).endpoint_for(key).unwrap(),
            format!("https://invitesion-media.s3.ap-southeast-1.amazonaws.com/{key}")
        );
        assert_eq!(
            storage(Some("http://127.0.0.1:9000/"), true).endpoint_for(key).unwrap(),
            format!("http://127.0.0.1:9000/invitesion-media/{key}")
        );
        assert_eq!(
            storage(Some("https://account.r2.cloudflarestorage.com"), false).endpoint_for(key).unwrap(),
            format!("https://invitesion-media.account.r2.cloudflarestorage.com/{key}")
        );
        assert!(storage(None, false).endpoint_for("../x").is_err());
    }
}
