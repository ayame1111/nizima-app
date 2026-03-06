import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/auth';
import { getStoragePaths } from '@/lib/paths';

// Simple API Key check for demo purposes
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'admin-secret';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const session = await auth();
  
  let isSystemAdmin = authHeader === `Bearer ${ADMIN_API_KEY}`;
  let isSessionAdmin = session?.user?.role === 'ADMIN';
  let isCreator = session?.user?.role === 'CREATOR';

  if (!isSystemAdmin && !isSessionAdmin && !isCreator) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let whereClause = {};
  if (isCreator && !isSystemAdmin && !isSessionAdmin) {
      // @ts-ignore
      whereClause = { creatorId: session.user.id };
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const session = await auth();

    let isSystemAdmin = authHeader === `Bearer ${ADMIN_API_KEY}`;
    let isSessionAdmin = session?.user?.role === 'ADMIN';
    let isCreator = session?.user?.role === 'CREATOR';

    if (!isSystemAdmin && !isSessionAdmin && !isCreator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const sex = formData.get('sex') as string;
    const eyeColor = formData.get('eyeColor') as string;
    const hairColor = formData.get('hairColor') as string;
    const bodyType = formData.get('bodyType') as string;
    const theme = formData.get('theme') as string;
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    const isSold = formData.get('isSold') === 'true';

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
    
    // Define paths using helper to ensure consistency across environments
    const { publicUploadsDir, secureStorageDir: storageBaseDir } = getStoragePaths();
    
    console.log('[Upload] Using paths:', { publicUploadsDir, storageBaseDir });

    const publicUploadDir = path.join(publicUploadsDir, productId);
    const secureStorageDir = path.join(storageBaseDir, productId);
    
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
                 iconUrl = `/file-proxy/${productId}/${iconFilename}`;
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

    // -------------------------------------------------------------------------
    // FIX: Resolve Case-Sensitivity Issues in .model3.json
    // -------------------------------------------------------------------------
    try {
        const modelDir = path.dirname(model3Path);
        let modelJsonChanged = false;
        const modelJson = JSON.parse(fs.readFileSync(model3Path, 'utf8'));

        const resolvePathCaseInsensitive = (baseDir: string, relativePath: string): string | null => {
            if (!relativePath) return null;
            const parts = relativePath.split(/[/\\]/);
            let currentPath = baseDir;
            let correctedParts = [];

            for (const part of parts) {
                if (part === '.' || part === '..') {
                    correctedParts.push(part);
                    currentPath = path.join(currentPath, part);
                    continue;
                }

                const checkPath = path.join(currentPath, part);
                if (fs.existsSync(checkPath)) {
                    correctedParts.push(part);
                    currentPath = checkPath;
                    continue;
                }

                try {
                    if (!fs.existsSync(currentPath)) return null;
                    const entries = fs.readdirSync(currentPath);
                    const match = entries.find(e => e.toLowerCase() === part.toLowerCase());
                    if (match) {
                        correctedParts.push(match);
                        currentPath = path.join(currentPath, match);
                    } else {
                        return null; // Not found even case-insensitively
                    }
                } catch (e) {
                    return null;
                }
            }
            return correctedParts.join('/');
        };

        const fixReference = (ref: string): string => {
            const resolved = resolvePathCaseInsensitive(modelDir, ref);
            if (resolved && resolved !== ref.split('\\').join('/')) {
                console.log(`[AutoFix] Fixed path: "${ref}" -> "${resolved}"`);
                modelJsonChanged = true;
                return resolved;
            }
            return ref;
        };

        if (modelJson.FileReferences) {
            // Fix Textures
            if (Array.isArray(modelJson.FileReferences.Textures)) {
                modelJson.FileReferences.Textures = modelJson.FileReferences.Textures.map((t: string) => fixReference(t));
            }
            // Fix Physics
            if (typeof modelJson.FileReferences.Physics === 'string') {
                modelJson.FileReferences.Physics = fixReference(modelJson.FileReferences.Physics);
            }
            // Fix Expressions
            if (Array.isArray(modelJson.FileReferences.Expressions)) {
                modelJson.FileReferences.Expressions = modelJson.FileReferences.Expressions.map((exp: any) => {
                    if (exp.File) exp.File = fixReference(exp.File);
                    return exp;
                });
            }
            // Fix Motions
            if (modelJson.FileReferences.Motions) {
                for (const groupKey in modelJson.FileReferences.Motions) {
                    const group = modelJson.FileReferences.Motions[groupKey];
                    if (Array.isArray(group)) {
                        modelJson.FileReferences.Motions[groupKey] = group.map((motion: any) => {
                            if (motion.File) motion.File = fixReference(motion.File);
                            return motion;
                        });
                    }
                }
            }
        }

        if (modelJsonChanged) {
            fs.writeFileSync(model3Path, JSON.stringify(modelJson, null, 2));
            console.log('Updated .model3.json with fixed paths');
        }
    } catch (fixErr) {
        console.error('Error fixing model references:', fixErr);
        // Continue anyway, don't fail upload just because auto-fix failed
    }
    // -------------------------------------------------------------------------

    // Convert absolute path to relative public URL
    // We need to be careful here: we want the path relative to the public uploads root
    const relativePath = path.relative(publicUploadsDir, model3Path);
    // Normalize path separators to forward slashes for URL
    const normalizedRelativePath = relativePath.split(path.sep).join('/');
    // Encode parts
    const relativePreviewUrl = '/file-proxy/' + normalizedRelativePath.split('/').map(part => encodeURIComponent(part)).join('/');
    console.log('Preview URL:', relativePreviewUrl);

    // Generate unique slug
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    if (!slug) slug = 'product';

    let uniqueSlug = slug;
    let counter = 1;
    
    while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Handle Media Uploads (Screenshots, GIFs, Videos)
    const mediaFiles = formData.getAll('media');
    const mediaUrls: string[] = [];

    if (mediaFiles && mediaFiles.length > 0) {
        console.log(`Processing ${mediaFiles.length} media files...`);
        for (const mediaEntry of mediaFiles) {
             const media = (mediaEntry && typeof mediaEntry === 'object' && 'name' in mediaEntry) ? (mediaEntry as any) : null;
             
             if (media && media.size > 0) {
                 // Validate file type (image or video)
                 if (!media.type.startsWith('image/') && !media.type.startsWith('video/')) {
                     console.warn(`Skipping invalid media type: ${media.type}`);
                     continue;
                 }
                 
                 // Validate size (50MB limit)
                 if (media.size > 50 * 1024 * 1024) {
                     console.warn(`Skipping large file: ${media.name} (${media.size} bytes)`);
                     continue;
                 }

                 try {
                     let mediaBuffer: Buffer | null = null;
                     if (typeof media.arrayBuffer === 'function') {
                         mediaBuffer = Buffer.from(await media.arrayBuffer());
                     } else if (media.stream) {
                         const chunks = [];
                         for await (const chunk of media.stream()) {
                             chunks.push(chunk);
                         }
                         mediaBuffer = Buffer.concat(chunks);
                     }

                     if (mediaBuffer) {
                         const mediaExt = path.extname(media.name) || '.bin';
                         // Generate unique filename to prevent collisions
                         const mediaFilename = `media-${uuidv4().substring(0, 8)}${mediaExt}`;
                         const mediaPath = path.join(publicUploadDir, mediaFilename);
                         
                         fs.writeFileSync(mediaPath, mediaBuffer);
                         mediaUrls.push(`/file-proxy/${productId}/${mediaFilename}`);
                         console.log('Media saved to:', mediaPath);
                     }
                 } catch (mediaErr) {
                     console.error(`Failed to save media ${media.name}:`, mediaErr);
                 }
             }
        }
    }

    // Create product in DB
    try {
        const product = await prisma.product.create({
          data: {
            id: productId,
            slug: uniqueSlug,
            title,
            description,
            price,
            sex,
            eyeColor,
            hairColor,
            bodyType,
            theme,
            tags,
            previewUrl: relativePreviewUrl,
            fileUrl: path.join(secureStorageDir, 'model.zip'), // Store absolute path for secure access
            iconUrl,
            mediaUrls, // Save media URLs
            isSold: isSold,
            status: isSessionAdmin ? 'APPROVED' : 'PENDING',
            // @ts-ignore
            creatorId: session?.user?.id || null,
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
