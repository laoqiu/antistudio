import React, { useState } from 'react';
import { FileNode } from '../../types';
import { Icons } from '../icons';

// Mock File System
export const INITIAL_FILES: FileNode[] = [
  {
    id: 'root',
    name: 'nexus-agent',
    type: 'folder',
    isOpen: true,
    children: [
        {
            id: 'src',
            name: 'src',
            type: 'folder',
            isOpen: true,
            children: [
                {
                    id: 'components',
                    name: 'components',
                    type: 'folder',
                    isOpen: false,
                    children: [
                        { id: 'App.tsx', name: 'App.tsx', type: 'file', fileType: 'code' },
                        { id: 'InputArea.tsx', name: 'InputArea.tsx', type: 'file', fileType: 'code' },
                    ]
                },
                { id: 'assets', name: 'assets', type: 'folder', children: [
                    { id: 'logo.png', name: 'logo.png', type: 'file', fileType: 'image' },
                    { id: 'diagram.svg', name: 'diagram.svg', type: 'file', fileType: 'image' }
                ]},
                { id: 'main.tsx', name: 'main.tsx', type: 'file', fileType: 'code', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);` },
                { id: 'types.ts', name: 'types.ts', type: 'file', fileType: 'code' },
            ]
        },
        { id: 'public', name: 'public', type: 'folder', children: [] },
        { id: 'package.json', name: 'package.json', type: 'file', fileType: 'code' },
        { id: 'README.md', name: 'README.md', type: 'file', fileType: 'code', content: `# Nexus Agent\n\nA next-generation AI interface.` },
    ]
  }
];

interface FileExplorerProps {
  onOpenFile: (file: FileNode) => void;
  selectedFileId?: string;
}

const TreeNode: React.FC<{ 
    node: FileNode; 
    level: number; 
    onToggle: (id: string) => void;
    onSelect: (node: FileNode) => void;
    selectedId?: string;
}> = ({ node, level, onToggle, onSelect, selectedId }) => {
    
    const isFolder = node.type === 'folder';
    const paddingLeft = level * 12 + 12;
    const isSelected = node.id === selectedId;

    return (
        <div>
            <div 
                className={`
                    flex items-center gap-1.5 py-1 pr-2 cursor-pointer text-sm select-none transition-colors
                    ${isSelected 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' 
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}
                `}
                style={{ paddingLeft: `${paddingLeft}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    isFolder ? onToggle(node.id) : onSelect(node);
                }}
            >
                <span className="opacity-70 shrink-0">
                    {isFolder ? (
                        node.isOpen ? <Icons.FolderOpen className="w-4 h-4 text-blue-500" /> : <Icons.Folder className="w-4 h-4 text-blue-500" />
                    ) : (
                        node.fileType === 'image' 
                            ? <Icons.Image className="w-4 h-4 text-purple-500" /> 
                            : <Icons.File className="w-4 h-4 text-zinc-400" />
                    )}
                </span>
                <span className="truncate">{node.name}</span>
            </div>
            {isFolder && node.isOpen && node.children?.map(child => (
                <TreeNode 
                    key={child.id} 
                    node={child} 
                    level={level + 1} 
                    onToggle={onToggle}
                    onSelect={onSelect}
                    selectedId={selectedId}
                />
            ))}
        </div>
    );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ onOpenFile, selectedFileId }) => {
  const [data, setData] = useState<FileNode[]>(INITIAL_FILES);

  const toggleFolder = (id: string) => {
    const toggleRecursive = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
            if (node.id === id) {
                return { ...node, isOpen: !node.isOpen };
            }
            if (node.children) {
                return { ...node, children: toggleRecursive(node.children) };
            }
            return node;
        });
    };
    setData(prev => toggleRecursive(prev));
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar py-2">
        {data.map(node => (
            <TreeNode 
                key={node.id} 
                node={node} 
                level={0} 
                onToggle={toggleFolder} 
                onSelect={onOpenFile}
                selectedId={selectedFileId}
            />
        ))}
    </div>
  );
};