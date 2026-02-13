import React, { useState } from 'react';
import { Workflow } from '../types';
import { Icons } from './icons';

interface WorkflowListProps {
  onSelectWorkflow: (workflow: Workflow) => void;
}

// Mock Workflow Data
const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    name: '代码审查助手 Agent',
    description: '自动分析 Pull Request 代码变更，检查潜在 Bug、安全漏洞并提供优化建议。',
    source: 'official',
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    tags: ['DevOps', 'Code Review']
  },
  {
    id: 'wf-2',
    name: '社交媒体文案生成器',
    description: '根据产品特性自动生成适用于 Twitter、LinkedIn 和小红书的多风格营销文案。',
    source: 'community',
    author: 'MarketingPro',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    tags: ['Marketing', 'Content']
  },
  {
    id: 'wf-3',
    name: '数据清洗与提取流水线',
    description: '从非结构化 PDF 和网页中提取关键字段，转换为 JSON 格式并存入数据库。',
    source: 'user',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    tags: ['Data', 'ETL']
  },
  {
    id: 'wf-4',
    name: '客户工单自动分类',
    description: '使用 NLP 模型分析客户工单情感与意图，自动分派给对应的支持团队。',
    source: 'official',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    tags: ['Support', 'Automation']
  }
];

export const WorkflowList: React.FC<WorkflowListProps> = ({ onSelectWorkflow }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim()) return;

    const newWorkflow: Workflow = {
      id: `wf-${Date.now()}`,
      name: newWfName,
      description: newWfDesc || '暂无描述',
      source: 'user',
      updatedAt: Date.now(),
      tags: ['New']
    };

    setWorkflows([newWorkflow, ...workflows]);
    onSelectWorkflow(newWorkflow);
    
    // Reset and close
    setNewWfName('');
    setNewWfDesc('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-black overflow-hidden h-full relative">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-900 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">工作流库</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            <Icons.Plus className="w-4 h-4" />
            新建工作流
          </button>
        </div>
        
        {/* Search & Filter */}
        <div className="relative">
          <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="搜索工作流..." 
            className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        {workflows.map((wf) => (
          <div 
            key={wf.id}
            onClick={() => onSelectWorkflow(wf)}
            className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg hover:border-blue-500/30 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                 {wf.source === 'official' ? (
                   <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                     <Icons.Zap className="w-4 h-4" />
                   </div>
                 ) : wf.source === 'community' ? (
                   <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                     <Icons.Globe className="w-4 h-4" />
                   </div>
                 ) : (
                   <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                     <Icons.User className="w-4 h-4" />
                   </div>
                 )}
                 <h3 className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                   {wf.name}
                 </h3>
              </div>
              
              <div className="flex items-center gap-2">
                 {wf.source === 'official' && (
                   <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                     OFFICIAL
                   </span>
                 )}
                 {wf.source === 'community' && (
                   <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-[10px] font-bold text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30">
                     COMMUNITY
                   </span>
                 )}
              </div>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-2">
              {wf.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
               <div className="flex gap-2">
                 {wf.tags?.map(tag => (
                   <span key={tag} className="text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded">
                     #{tag}
                   </span>
                 ))}
               </div>
               <div className="text-[10px] text-zinc-400">
                  {new Date(wf.updatedAt).toLocaleDateString()} 更新
               </div>
            </div>

            {/* Hover Action */}
            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
               <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg shadow-blue-500/20">
                 打开编辑器
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Creation Modal - Fixed Full Screen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-50 dark:bg-[#18181b] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800 flex flex-col">
             
             {/* Header */}
             <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] flex justify-between items-center">
               <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">新建工作流</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
                 <Icons.Close className="w-5 h-5" />
               </button>
             </div>
             
             {/* Body */}
             <form onSubmit={handleCreate} className="p-6 space-y-5">
                <div>
                   <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                     <Icons.Zap className="w-4 h-4 text-blue-500" />
                     名称
                   </label>
                   <input 
                     type="text" 
                     value={newWfName}
                     onChange={e => setNewWfName(e.target.value)}
                     placeholder="例如：自动数据分析流程"
                     className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 shadow-sm"
                     autoFocus
                   />
                </div>
                <div>
                   <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                     <Icons.File className="w-4 h-4 text-zinc-500" />
                     简介
                   </label>
                   <textarea 
                     value={newWfDesc}
                     onChange={e => setNewWfDesc(e.target.value)}
                     placeholder="描述这个工作流的主要功能..."
                     className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 resize-none h-32 custom-scrollbar shadow-sm"
                   />
                </div>
             </form>
             
             {/* Footer */}
             <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsModalOpen(false)}
                   className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleCreate}
                   disabled={!newWfName.trim()}
                   className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                 >
                   创建工作流
                 </button>
             </div>

          </div>
        </div>
      )}
    </div>
  );
};