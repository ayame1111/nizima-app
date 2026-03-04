import path from 'path';

export function getStoragePaths() {
  // Use APP_ROOT if set (e.g. /app in Docker), otherwise default to process.cwd()
  const rootDir = process.env.APP_ROOT || process.cwd();
  
  return {
    // Public uploads (images, extracted models) - served via /uploads/...
    publicUploadsDir: path.join(rootDir, 'public', 'uploads'),
    
    // Secure storage (original zips) - not publicly accessible
    secureStorageDir: path.join(rootDir, 'storage', 'uploads'),
  };
}
