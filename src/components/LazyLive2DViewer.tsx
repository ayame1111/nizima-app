'use client';

import dynamic from 'next/dynamic';

const Live2DViewer = dynamic(() => import('./Live2DViewer'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">Loading Preview...</div>
});

interface Live2DViewerProps {
  modelUrl: string;
  interactive?: boolean;
  className?: string;
}

export default function LazyLive2DViewer({ modelUrl, interactive, className }: Live2DViewerProps) {
  return <Live2DViewer modelUrl={modelUrl} interactive={interactive} className={className} />;
}
