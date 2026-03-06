'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableDescriptionProps {
  description: string;
}

export default function ExpandableDescription({ description }: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 250;

  // Check if description needs truncation
  const shouldTruncate = description.length > maxLength;
  
  // Get visible content
  const content = isExpanded || !shouldTruncate 
    ? description 
    : description.slice(0, maxLength).trim() + '...';

  return (
    <div className="prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-300 mb-10 flex-grow transition-colors duration-300">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide text-sm opacity-70">About this Model</h3>
      <p className="whitespace-pre-wrap leading-relaxed opacity-90">{content}</p>
      
      {shouldTruncate && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>Show Less <ChevronUp size={16} /></>
          ) : (
            <>Show More <ChevronDown size={16} /></>
          )}
        </button>
      )}
    </div>
  );
}
