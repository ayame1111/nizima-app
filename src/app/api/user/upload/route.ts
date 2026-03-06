import { auth } from '@/auth';
import { getStoragePaths } from '@/lib/paths';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string; // 'banner' or 'avatar'

    if (!file || !type) {
      return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
    }

    if (!['banner', 'avatar'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const { publicUploadsDir } = getStoragePaths();
    // User specific directory: public/uploads/users/[userId]
    const userUploadDir = path.join(publicUploadsDir, 'users', session.user.id);

    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }

    const ext = path.extname(file.name) || '.png';
    const filename = `${type}-${Date.now()}${ext}`;
    const filePath = path.join(userUploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/file-proxy/users/${session.user.id}/${filename}`;

    // Update user profile in DB
    const updateData: any = {};
    if (type === 'banner') {
        updateData.bannerUrl = fileUrl;
    } else if (type === 'avatar') {
        updateData.image = fileUrl;
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: updateData
    });

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
