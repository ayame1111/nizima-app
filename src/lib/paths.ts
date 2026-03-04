import path from 'path';

export function getStoragePaths() {
  // Use APP_ROOT if set (e.g. /app in Docker), otherwise default to process.cwd()
  const rootDir = process.env.APP_ROOT || process.cwd();
  
  // Use a dedicated persistent volume path in production/Docker if PERSISTENT_STORAGE_PATH is set
  // Otherwise, default to local development paths
  let persistentRoot = process.env.PERSISTENT_STORAGE_PATH || rootDir;

  // Fix for Docker Standalone mode: 
  // If we are in .next/standalone, process.cwd() is deeply nested.
  // If PERSISTENT_STORAGE_PATH is NOT set, we might want to try to fallback to a common path if we detect Docker?
  // But explicit is better. However, let's log for debugging.
  // console.log('[Paths] Root:', rootDir, 'Persistent:', persistentRoot);

  return {
    // Public uploads (images, extracted models) - served via /uploads/...
    // In Docker, this should be mapped to a volume like /app/public/uploads
    publicUploadsDir: path.join(persistentRoot, 'public', 'uploads'),
    
    // Secure storage (original zips) - not publicly accessible
    // In Docker, this should be mapped to a volume like /app/storage/uploads
    secureStorageDir: path.join(persistentRoot, 'storage', 'uploads'),
  };
}
