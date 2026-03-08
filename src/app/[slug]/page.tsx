
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.pageContent.findUnique({
    where: { slug },
  });

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: `${page.title} - Avatar Atelier`,
  };
}

export default async function DynamicContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const page = await prisma.pageContent.findUnique({
    where: { slug },
  });

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{page.title}</h1>
            <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Link href="/" className="hover:text-gray-900 dark:hover:text-white">Home</Link>
                <span>/</span>
                <span>{page.title}</span>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose dark:prose-invert max-w-none">
            {/* 
              Security Note: In a real app, use a sanitizer like 'dompurify' or a library like 'html-react-parser' 
              to prevent XSS if content comes from untrusted sources. 
              Since only ADMINs edit this, we'll render strictly for now.
            */}
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </div>
    </div>
  );
}
