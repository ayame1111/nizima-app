import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getStoragePaths } from '@/lib/paths';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { publicUploadsDir, secureStorageDir } = getStoragePaths();
    
    const listDir = (dir: string) => {
        if (!fs.existsSync(dir)) return ['Directory does not exist'];
        try {
            return fs.readdirSync(dir, { recursive: true }).map(f => {
                const fullPath = path.join(dir, f.toString());
                const stat = fs.statSync(fullPath);
                return `${f} (${stat.isDirectory() ? 'DIR' : stat.size + ' bytes'})`;
            });
        } catch (e: any) {
            return [`Error reading dir: ${e.message}`];
        }
    };

    return NextResponse.json({
      env: {
        APP_ROOT: process.env.APP_ROOT,
        cwd: process.cwd(),
      },
      paths: {
        publicUploadsDir,
        secureStorageDir
      },
      files: {
        public: listDir(publicUploadsDir),
        secure: listDir(secureStorageDir)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
