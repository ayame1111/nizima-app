import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';

// Simple API Key check for demo purposes
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'admin-secret';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    const session = await auth();

    let isSystemAdmin = authHeader === `Bearer ${ADMIN_API_KEY}`;
    let isSessionAdmin = session?.user?.role === 'ADMIN';
    let isCreator = session?.user?.role === 'CREATOR';

    if (!isSystemAdmin && !isSessionAdmin && !isCreator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check ownership if not admin
    if (isCreator && !isSystemAdmin && !isSessionAdmin) {
        // @ts-ignore
        if (product.creatorId !== session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    const session = await auth();

    let isSystemAdmin = authHeader === `Bearer ${ADMIN_API_KEY}`;
    let isSessionAdmin = session?.user?.role === 'ADMIN';
    let isCreator = session?.user?.role === 'CREATOR';

    if (!isSystemAdmin && !isSessionAdmin && !isCreator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check ownership if not admin
    if (isCreator && !isSystemAdmin && !isSessionAdmin) {
        // @ts-ignore
        if (product.creatorId !== session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
    }

    const formData = await req.formData();
    const dataToUpdate: any = {};

    const title = formData.get('title');
    if (title !== null) dataToUpdate.title = title;

    const description = formData.get('description');
    if (description !== null) dataToUpdate.description = description;

    const priceStr = formData.get('price');
    if (priceStr !== null) {
        const price = parseFloat(priceStr as string);
        if (!isNaN(price)) dataToUpdate.price = price;
    }

    const sex = formData.get('sex');
    if (sex !== null) dataToUpdate.sex = sex;

    const eyeColor = formData.get('eyeColor');
    if (eyeColor !== null) dataToUpdate.eyeColor = eyeColor;

    const hairColor = formData.get('hairColor');
    if (hairColor !== null) dataToUpdate.hairColor = hairColor;

    const bodyType = formData.get('bodyType');
    if (bodyType !== null) dataToUpdate.bodyType = bodyType;

    const theme = formData.get('theme');
    if (theme !== null) dataToUpdate.theme = theme;

    const tagsStr = formData.get('tags');
    if (tagsStr !== null) {
         dataToUpdate.tags = (tagsStr as string).split(',').map(t => t.trim()).filter(Boolean);
    }

    const status = formData.get('status') as string;
    const icon = formData.get('icon') as File | null;

    // Only Admin can update status directly
    if (status && isSessionAdmin) {
        dataToUpdate.status = status;
    } else if (!isSessionAdmin) {
        // If creator edits, reset to PENDING for re-approval
        // Only if they are actually changing something else
        if (Object.keys(dataToUpdate).length > 0) {
            dataToUpdate.status = 'PENDING';
        }
    }

    // Handle Icon Update
    if (icon && icon.size > 0) {
      // Basic validation
      if (!icon.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Invalid icon file type' }, { status: 400 });
      }

      const publicUploadDir = path.join(process.cwd(), 'public/uploads', id);
      if (!fs.existsSync(publicUploadDir)) {
        fs.mkdirSync(publicUploadDir, { recursive: true });
      }

      const iconExt = path.extname(icon.name) || '.png';
      const iconFileName = `icon${iconExt}`; // Consistent naming or preserve original
      const iconPath = path.join(publicUploadDir, iconFileName);
      
      const buffer = Buffer.from(await icon.arrayBuffer());
      fs.writeFileSync(iconPath, buffer);
      
      dataToUpdate.iconUrl = `/uploads/${id}/${iconFileName}`;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
