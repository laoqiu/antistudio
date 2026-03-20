import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkspaceTab, TabType, A2UIAction, Workflow } from '../../types';
import { Icons } from '../icons';
import { Terminal } from './Terminal';
import { ProjectView } from './ProjectView';
import { PreviewTab } from './PreviewTab';
import { BrowserTab } from './BrowserTab';
import { WorkflowEditor } from './WorkflowEditor';
import { WorkflowDetailTab } from './WorkflowDetailTab';

interface WorkspacePanelProps {
  theme: 'light' | 'dark';
  activeA2UI?: A2UIAction | null;
  onA2UISubmit?: (id: string, formData: any) => void;
  externalOpenTab?: WorkspaceTab | null; // Prop to receive open requests
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({ theme, activeA2UI, onA2UISubmit, externalOpenTab }) => {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([
    { id: 'preview', type: 'preview', title: '界面预览' },
    { id: 'proj-1', type: 'project', title: 'Nexus Client' },
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('preview');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Tab scrolling
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Switch to preview tab automatically when activeA2UI changes to a new pending item
  useEffect(() => {
    if (activeA2UI && activeA2UI.status === 'pending') {
      setActiveTabId('preview');
    }
  }, [activeA2UI]);

  // Check scroll position
  const checkScroll = useCallback(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Scroll tabs
  const scrollTabs = useCallback((direction: 'left' | 'right') => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }, []);

  // Handle external tab open requests
  useEffect(() => {
    if (externalOpenTab) {
      // Check if tab already exists
      const exists = tabs.find(t => t.id === externalOpenTab.id);
      if (!exists) {
        setTabs(prev => [...prev, externalOpenTab]);
      }
      setActiveTabId(externalOpenTab.id);
    }
  }, [externalOpenTab]);

  // Check scroll on mount and when tabs change
  useEffect(() => {
    checkScroll();
    const container = tabsContainerRef.current;
    if (!container) return;

    const handleScroll = () => checkScroll();
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [tabs, checkScroll]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTab = (type: TabType, title: string) => {
    const newTab: WorkspaceTab = {
      id: Date.now().toString(),
      type,
      title
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setIsAddMenuOpen(false);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Prevent closing the fixed preview tab
    if (id === 'preview') return;

    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#1e1e1e] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
      
      {/* Toolbar / Tab Bar */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1e1e1e]">

         {/* Left Scroll Button */}
         {canScrollLeft && (
           <button
             onClick={() => scrollTabs('left')}
             className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
             title="向左滚动"
           >
             <Icons.ArrowLeft className="w-3.5 h-3.5" />
           </button>
         )}

         {/* Tabs Container */}
         <div
           ref={tabsContainerRef}
           className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide"
           onScroll={checkScroll}
         >
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`
                   group relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200 rounded-lg max-w-[160px] border shrink-0
                   ${activeTabId === tab.id
                     ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50 shadow-sm'
                     : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}
                `}
                title={tab.title}
              >
                 <span className={`shrink-0 ${activeTabId === tab.id ? 'opacity-100' : 'opacity-70'}`}>
                    {tab.type === 'project' && <Icons.LayoutGrid className="w-3.5 h-3.5" />}
                    {tab.type === 'terminal' && <Icons.Code className="w-3.5 h-3.5" />}
                    {tab.type === 'preview' && <Icons.LayoutTemplate className="w-3.5 h-3.5" />}
                    {tab.type === 'browser' && <Icons.Globe className="w-3.5 h-3.5" />}
                    {tab.type === 'workflow' && <Icons.Zap className="w-3.5 h-3.5" />}
                    {tab.type === 'workflow-detail' && <Icons.File className="w-3.5 h-3.5" />}
                 </span>
                 <span className="truncate flex-1">{tab.title}</span>

                 {/* Close Button - Hidden for Preview Tab */}
                 {tab.id !== 'preview' && (
                   <button
                     onClick={(e) => closeTab(e, tab.id)}
                     className={`
                       p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all ml-1
                       ${activeTabId === tab.id
                          ? 'hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-300'
                          : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400'}
                     `}
                   >
                     <Icons.Close className="w-3 h-3" />
                   </button>
                 )}
              </div>
            ))}
         </div>

         {/* Right Scroll Button */}
         {canScrollRight && (
           <button
             onClick={() => scrollTabs('right')}
             className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
             title="向右滚动"
           >
             <Icons.ArrowRight className="w-3.5 h-3.5" />
           </button>
         )}

         {/* Add Button with Dropdown */}
         <div className="relative shrink-0" ref={addMenuRef}>
            <button 
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className={`
                    w-7 h-7 flex items-center justify-center rounded-lg transition-all
                    ${isAddMenuOpen 
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' 
                        : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}
                `}
                title="新建标签页"
            >
                <Icons.Plus className="w-4 h-4" />
            </button>

            {isAddMenuOpen && (
                <div className="absolute top-full right-0 mt-1 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                    <button 
                        onClick={() => addTab('project', 'Project')}
                        className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                        <Icons.LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
                        新建代码项目
                    </button>
                    <button 
                        onClick={() => addTab('terminal', 'Terminal')}
                        className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                        <Icons.Code className="w-3.5 h-3.5 text-green-500" />
                        新建终端
                    </button>
                    <button 
                        onClick={() => addTab('browser', 'Browser')}
                        className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                        <Icons.Globe className="w-3.5 h-3.5 text-purple-500" />
                        新建浏览器
                    </button>
                    <button 
                        onClick={() => addTab('workflow', 'Workflow')}
                        className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                        <Icons.Zap className="w-3.5 h-3.5 text-yellow-500" />
                        新建工作流
                    </button>
                </div>
            )}
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-white dark:bg-[#1e1e1e]">
         {tabs.map(tab => (
            <div
                key={tab.id}
                className="w-full h-full"
                style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
            >
                {tab.type === 'project' && <ProjectView theme={theme} />}
                {tab.type === 'terminal' && <Terminal />}
                {tab.type === 'preview' && (
                  <PreviewTab
                    data={activeA2UI}
                    onSubmit={onA2UISubmit}
                  />
                )}
                {tab.type === 'browser' && <BrowserTab />}
                {tab.type === 'workflow' && <WorkflowEditor />}
                {tab.type === 'workflow-detail' && tab.data?.workflow && (
                  <WorkflowDetailTab
                    workflow={tab.data.workflow as Workflow}
                    onEdit={() => {
                      // Open editor for this workflow
                      const editorTab: WorkspaceTab = {
                        id: `workflow-editor-${tab.data?.workflow.id}`,
                        type: 'workflow',
                        title: `${tab.data?.workflow.name} - 编辑`,
                        data: { workflow: tab.data?.workflow }
                      };
                      const exists = tabs.find(t => t.id === editorTab.id);
                      if (!exists) {
                        setTabs(prev => [...prev, editorTab]);
                      }
                      setActiveTabId(editorTab.id);
                    }}
                    onInstall={() => {
                      console.log('Installing workflow:', tab.data?.workflow.name);
                      // Handle installation logic
                    }}
                  />
                )}
            </div>
         ))}
         
         {tabs.length === 0 && (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
                    <Icons.LayoutGrid className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-sm font-medium text-zinc-500">工作区为空</p>
                <p className="text-xs text-zinc-400 mt-1">点击右上角 + 号创建新页面</p>
            </div>
         )}
      </div>
    </div>
  );
};