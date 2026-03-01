import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';

// Simple API Key check for demo purposes
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'admin-secret';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${ADMIN_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const fileEntry = formData.get('file');
    // More flexible check: if it has a 'name' (string) and 'size' (number), it's likely a File-like object
    const file = (fileEntry && typeof fileEntry === 'object' && 'name' in fileEntry) ? (fileEntry as any) : null;
    
    const iconEntry = formData.get('icon');
    const icon = (iconEntry && typeof iconEntry === 'object' && 'name' in iconEntry) ? (iconEntry as any) : null;

    if (!file) {
      console.error('File validation failed. Type:', typeof fileEntry);
      return NextResponse.json({ error: 'No file uploaded or invalid file' }, { status: 400 });
    }

    let buffer: Buffer;
    try {
        console.log('Reading file buffer...');
        // Try arrayBuffer() if available (standard File)
        if (typeof file.arrayBuffer === 'function') {
            buffer = Buffer.from(await file.arrayBuffer());
        } 
        // Fallback for some Node.js FormData implementations
        else if (file.stream) {
             const chunks = [];
             for await (const chunk of file.stream()) {
                 chunks.push(chunk);
             }
             buffer = Buffer.concat(chunks);
        }
        else {
             throw new Error('File object does not have arrayBuffer or stream method');
        }
        console.log('File buffer read, size:', buffer.length);
    } catch (err) {
        console.error('Error reading file buffer:', err);
        return NextResponse.json({ error: 'Failed to read file data' }, { status: 500 });
    }

    const productId = uuidv4();
    console.log('Generated productId:', productId);
    
    // Define paths
    const publicUploadDir = path.join(process.cwd(), 'public/uploads', productId);
    const secureStorageDir = path.join(process.cwd(), 'storage/uploads', productId);
    
    try {
        // Ensure directories exist
        if (!fs.existsSync(publicUploadDir)) {
            fs.mkdirSync(publicUploadDir, { recursive: true });
        }
        if (!fs.existsSync(secureStorageDir)) {
            fs.mkdirSync(secureStorageDir, { recursive: true });
        }
    } catch (fsErr) {
        console.error('Filesystem error (mkdir):', fsErr);
        return NextResponse.json({ error: 'Failed to create directories' }, { status: 500 });
    }

    // Handle Icon Upload
    let iconUrl = null;
    try {
        if (icon && icon.size > 0) {
            console.log('Processing icon...');
            let iconBuffer: Buffer | null = null;
            if (typeof icon.arrayBuffer === 'function') {
                 iconBuffer = Buffer.from(await icon.arrayBuffer());
            } else if (icon.stream) {
                 const chunks = [];
                 for await (const chunk of icon.stream()) {
                     chunks.push(chunk);
                 }
                 iconBuffer = Buffer.concat(chunks);
            }

            if (iconBuffer) {
                 const iconExt = path.extname(icon.name) || '.png';
                 const iconFilename = 'icon' + iconExt;
                 const iconPath = path.join(publicUploadDir, iconFilename);
                 fs.writeFileSync(iconPath, iconBuffer);
                 iconUrl = `/uploads/${productId}/${iconFilename}`;
                 console.log('Icon saved to:', iconPath);
            }
        }
    } catch (iconError) {
        console.error('Icon upload failed, continuing without icon:', iconError);
    }

    try {
        // Save original ZIP
        const secureZipPath = path.join(secureStorageDir, 'model.zip');
        fs.writeFileSync(secureZipPath, buffer);
        console.log('Zip saved to:', secureZipPath);

        // Unzip
        console.log('Extracting zip...');
        const zip = new AdmZip(buffer);
        zip.extractAllTo(publicUploadDir, true);
        console.log('Zip extracted to:', publicUploadDir);
    } catch (zipErr) {
        console.error('Zip extraction failed:', zipErr);
        return NextResponse.json({ error: 'Failed to save or extract zip file' }, { status: 500 });
    }

    // Find the .model3.json file
    const findFile = (dir: string, extension: string): string | null => {
      try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isFile() && entry.name.endsWith(extension)) {
              return fullPath;
            }
            if (entry.isDirectory()) {
              const found = findFile(fullPath, extension);
              if (found) return found;
            }
          }
      } catch (e) {
          console.error('Error scanning dir:', dir, e);
      }
      return null;
    };

    const model3Path = findFile(publicUploadDir, '.model3.json');
    console.log('Model3 path found:', model3Path);

    if (!model3Path) {
      // Cleanup if invalid
      try {
          fs.rmSync(publicUploadDir, { recursive: true, force: true });
          fs.rmSync(secureStorageDir, { recursive: true, force: true });
      } catch(cleanupErr) { console.error('Cleanup error:', cleanupErr); }
      
      return NextResponse.json({ error: 'No .model3.json file found in the zip archive' }, { status: 400 });
    }

    // Convert absolute path to relative public URL
    const relativePath = path.relative(path.join(process.cwd(), 'public/uploads'), model3Path);
    // Normalize path separators to forward slashes for URL
    const normalizedRelativePath = relativePath.split(path.sep).join('/');
    // Encode parts
    const relativePreviewUrl = '/uploads/' + normalizedRelativePath.split('/').map(part => encodeURIComponent(part)).join('/');
    console.log('Preview URL:', relativePreviewUrl);

    // Create product in DB
    try {
        const product = await prisma.product.create({
          data: {
            id: productId,
            title,
            description,
            price,
            previewUrl: relativePreviewUrl,
            fileUrl: path.join(secureStorageDir, 'model.zip'), // Store absolute path for secure access
            iconUrl,
            isSold: false,
          },
        });
        console.log('Product created in DB:', product.id);
        return NextResponse.json(product);
    } catch (dbErr) {
        console.error('Database error:', dbErr);
        return NextResponse.json({ error: 'Database error occurred' }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
