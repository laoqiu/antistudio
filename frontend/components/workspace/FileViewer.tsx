import React from 'react';
import { FileNode } from '../../types';
import { CodeEditor } from './CodeEditor';
import { Icons } from '../icons';

interface FileViewerProps {
  file: FileNode | null;
  theme: 'light' | 'dark';
}

export const FileViewer: React.FC<FileViewerProps> = ({ file, theme }) => {
  if (!file) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700">
        <Icons.File className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm">选择一个文件以查看内容</p>
      </div>
    );
  }

  if (file.fileType === 'image') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900 overflow-hidden p-8">
        <div className="relative shadow-lg border border-zinc-200 dark:border-zinc-700 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg">
           {/* Placeholder for actual image rendering */}
           <div className="w-64 h-64 flex items-center justify-center bg-zinc-200 dark:bg-black/20 rounded">
             <div className="text-center">
                 <Icons.Image className="w-12 h-12 mx-auto text-zinc-400 mb-2" />
                 <span className="text-xs text-zinc-500">{file.name}</span>
             </div>
           </div>
        </div>
        <p className="mt-4 text-xs text-zinc-500 font-mono">Image Preview</p>
      </div>
    );
  }

  // Default to Code Editor
  return (
    <CodeEditor 
      initialCode={file.content} 
      language={file.name.endsWith('.json') ? 'json' : 'typescript'}
      theme={theme}
    />
  );
};