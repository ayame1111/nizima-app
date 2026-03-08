
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET all pages or a specific page
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  try {
    if (slug) {
      const page = await prisma.pageContent.findUnique({
        where: { slug },
      });
      return NextResponse.json(page || { slug, title: '', content: '' });
    } else {
      const pages = await prisma.pageContent.findMany();
      return NextResponse.json(pages);
    }
  } catch (error) {
    console.error('Failed to fetch pages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST/PUT to update page content (Admin only)
export async function POST(req: Request) {
  const session = await auth();
  
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug, title, content } = await req.json();

    if (!slug || !title) {
        return NextResponse.json({ error: 'Slug and Title are required' }, { status: 400 });
    }

    const page = await prisma.pageContent.upsert({
      where: { slug },
      update: { title, content },
      create: { slug, title, content },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('Failed to save page:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
