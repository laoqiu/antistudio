import React, { useState } from 'react';
import { FileNode } from '../../types';
import { FileExplorer, INITIAL_FILES } from './FileExplorer';
import { FileViewer } from './FileViewer';

interface ProjectViewProps {
  theme: 'light' | 'dark';
}

export const ProjectView: React.FC<ProjectViewProps> = ({ theme }) => {
  // Find a default file to show (e.g., main.tsx)
  const findDefault = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
          if (node.name === 'main.tsx') return node;
          if (node.children) {
              const found = findDefault(node.children);
              if (found) return found;
          }
      }
      return null;
  };

  const [activeFile, setActiveFile] = useState<FileNode | null>(() => findDefault(INITIAL_FILES));

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Sidebar: File Explorer */}
      <div className="w-[240px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">
            Explorer
        </div>
        <div className="flex-1 overflow-hidden">
            <FileExplorer 
                onOpenFile={setActiveFile} 
                selectedFileId={activeFile?.id}
            />
        </div>
      </div>

      {/* Main Area: Viewer */}
      <div className="flex-1 min-w-0 bg-white dark:bg-[#1e1e1e] relative">
         {/* Tab Breadcrumb / Header within viewer could go here */}
         <FileViewer file={activeFile} theme={theme} />
      </div>
    </div>
  );
};