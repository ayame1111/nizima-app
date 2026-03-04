import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { getStoragePaths } from '@/lib/paths';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  const filePath = params.path.join('/');
  
  // Construct the absolute path to the file in the persistent volume
  // In Docker/Coolify, we mapped this to /app/public/uploads
  const { publicUploadsDir: uploadsDir } = getStoragePaths();
  const fullPath = path.join(uploadsDir, filePath);

  // Security check: Prevent directory traversal
  if (!fullPath.startsWith(uploadsDir)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!fs.existsSync(fullPath)) {
    return new NextResponse('File not found', { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(fullPath);
    
    // Determine content type
    const contentType = mime.lookup(fullPath) || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
