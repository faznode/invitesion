use std::io::ErrorKind;
use std::path::{Path, PathBuf};

use super::{StorageError, assert_safe_key};

/// Local disk (`LocalStorageDriver` in `lib/storage/local-driver.ts`): development, a single server or a mounted
/// volume. Writes go to a sibling temporary file and are renamed into place, so `/media` never serves half a variant.
pub struct LocalStorage {
    root: PathBuf,
}

impl LocalStorage {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        let root = root.into();
        let root = std::path::absolute(&root).unwrap_or(root);
        Self { root }
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    fn resolve(&self, key: &str) -> Result<PathBuf, StorageError> {
        Ok(self.root.join(assert_safe_key(key)?))
    }

    pub async fn get(&self, key: &str) -> Result<Option<Vec<u8>>, StorageError> {
        let path = self.resolve(key)?;
        match tokio::fs::read(&path).await {
            Ok(bytes) => Ok(Some(bytes)),
            Err(error)
                if matches!(error.kind(), ErrorKind::NotFound | ErrorKind::NotADirectory | ErrorKind::IsADirectory) =>
            {
                Ok(None)
            }
            Err(error) => Err(error.into()),
        }
    }

    pub async fn put(&self, key: &str, bytes: &[u8]) -> Result<(), StorageError> {
        let path = self.resolve(key)?;
        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }
        let file_name = path.file_name().and_then(|n| n.to_str()).ok_or(StorageError::InvalidKey)?;
        let temporary = path.with_file_name(format!(".{file_name}.{}.tmp", uuid::Uuid::new_v4().simple()));
        tokio::fs::write(&temporary, bytes).await?;
        if let Err(error) = tokio::fs::rename(&temporary, &path).await {
            let _ = tokio::fs::remove_file(&temporary).await;
            return Err(error.into());
        }
        Ok(())
    }
}
