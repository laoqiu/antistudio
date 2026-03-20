import React, { useState, useMemo } from 'react';
import { Workflow } from '../../types';
import { Icons } from '../icons';

// Simple markdown parser for basic formatting
const parseMarkdown = (markdown: string) => {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-zinc-100">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4 text-zinc-900 dark:text-zinc-100">$1</h1>')
    // Bold & Italic
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
    // Code
    .replace(/`([^`]+)`/g, '<code class="text-sm bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-zinc-700 dark:text-zinc-300">$1</li>')
    // Blockquotes
    .replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-zinc-600 dark:text-zinc-400">$1</blockquote>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">')
    .replace(/\n/g, '<br/>');
};

interface WorkflowDetailTabProps {
  workflow: Workflow;
  onEdit?: () => void;
  onInstall?: () => void;
}

export const WorkflowDetailTab: React.FC<WorkflowDetailTabProps> = ({ workflow, onEdit, onInstall }) => {
  const [isInstalled, setIsInstalled] = useState(workflow.source === 'user');

  const parsedReadme = useMemo(() => {
    if (!workflow.readme) return '';
    const parsed = parseMarkdown(workflow.readme);
    return `<p class="mb-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">${parsed}</p>`;
  }, [workflow.readme]);

  const handleInstall = () => {
    setIsInstalled(true);
    onInstall?.();
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden">
      {/* Header - Non-scrollable */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1e1e1e]">
        <div className="px-8 py-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
              <Icons.Zap className="w-8 h-8 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {workflow.name}
                </h1>
                {workflow.source === 'official' && (
                  <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs font-bold text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                    OFFICIAL
                  </span>
                )}
                {workflow.source === 'community' && (
                  <span className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-xs font-bold text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30">
                    COMMUNITY
                  </span>
                )}
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                {workflow.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-zinc-500">
                {workflow.author && (
                  <div className="flex items-center gap-1.5">
                    <Icons.User className="w-3.5 h-3.5" />
                    <span>{workflow.author}</span>
                  </div>
                )}
                {workflow.version && (
                  <div className="flex items-center gap-1.5">
                    <Icons.Tag className="w-3.5 h-3.5" />
                    <span>v{workflow.version}</span>
                  </div>
                )}
                {workflow.downloads !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <Icons.Download className="w-3.5 h-3.5" />
                    <span>{workflow.downloads.toLocaleString()} 次安装</span>
                  </div>
                )}
                {workflow.rating !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <Icons.Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span>{workflow.rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Icons.Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(workflow.updatedAt).toLocaleDateString()} 更新</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {workflow.tags && workflow.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {workflow.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons - Below Tags */}
          <div className="flex items-center gap-3">
            {!isInstalled && workflow.source !== 'user' ? (
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-95"
              >
                <Icons.Download className="w-4 h-4" />
                安装工作流
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium rounded-lg border border-green-200 dark:border-green-800/30">
                <Icons.Check className="w-4 h-4" />
                已安装
              </div>
            )}

            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold rounded-lg transition-all active:scale-95"
              >
                <Icons.Edit className="w-4 h-4" />
                编辑工作流
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {workflow.readme ? (
            <div
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: parsedReadme }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
                <Icons.File className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm font-medium text-zinc-500">暂无详细说明</p>
              <p className="text-xs text-zinc-400 mt-1">此工作流还没有添加 README 文档</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
