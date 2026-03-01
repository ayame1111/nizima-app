import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Simple API Key check for demo purposes
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'admin-secret';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${ADMIN_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete files
    const publicUploadDir = path.join(process.cwd(), 'public/uploads', id);
    const secureStorageDir = path.join(process.cwd(), 'storage/uploads', id);

    if (fs.existsSync(publicUploadDir)) {
      fs.rmSync(publicUploadDir, { recursive: true, force: true });
    }
    if (fs.existsSync(secureStorageDir)) {
      fs.rmSync(secureStorageDir, { recursive: true, force: true });
    }

    // Delete from DB
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
