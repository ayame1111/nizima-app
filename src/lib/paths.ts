import path from 'path';

export function getStoragePaths() {
  // Use APP_ROOT if set (e.g. /app in Docker), otherwise default to process.cwd()
  const rootDir = process.env.APP_ROOT || process.cwd();
  
  // Use a dedicated persistent volume path in production/Docker if PERSISTENT_STORAGE_PATH is set
  // Otherwise, default to local development paths
  const persistentRoot = process.env.PERSISTENT_STORAGE_PATH || rootDir;

  return {
    // Public uploads (images, extracted models) - served via /uploads/...
    // In Docker, this should be mapped to a volume like /app/public/uploads
    publicUploadsDir: path.join(persistentRoot, 'public', 'uploads'),
    
    // Secure storage (original zips) - not publicly accessible
    // In Docker, this should be mapped to a volume like /app/storage/uploads
    secureStorageDir: path.join(persistentRoot, 'storage', 'uploads'),
  };
}
