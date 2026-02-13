import React, { useState } from 'react';
import { Icons } from './icons';

interface ThinkingBlockProps {
  content: string;
  duration?: number;
  isStreaming?: boolean;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ content, duration, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-left group"
      >
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">
          <span>思考过程</span>
          {/* Always show duration if available or streaming, regardless of expanded state */}
          {(duration || isStreaming) && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
              {duration ? (duration / 1000).toFixed(1) + '秒' : '计算中...'}
            </span>
          )}
        </div>
        <div className="text-zinc-400">
          {isExpanded ? <Icons.Expand className="w-4 h-4" /> : <Icons.Collapse className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/30">
          <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {content}
            {isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-blue-500 animate-pulse" />}
          </div>
        </div>
      )}
    </div>
  );
};