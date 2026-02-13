import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './icons';
import { Attachment, CodeReference } from '../types';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[], refs: CodeReference[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  showSuggestions?: boolean;
}

const SUGGESTION_SETS = [
  [
    { title: '解释代码', subtitle: '分析仓库结构与组件', text: '你能分析一下当前的仓库结构并解释主要的组件吗？' },
    { title: '代码重构', subtitle: '优化复杂函数的可读性', text: '我有一个复杂的函数需要重构，以提高可读性和性能。' },
    { title: '生成文档', subtitle: '创建 API 接口文档', text: '请为认证服务的 API 接口生成详细的文档。' },
  ],
  [
    { title: '安全审计', subtitle: '检查已知漏洞', text: '扫描依赖关系图中的已知安全漏洞并建议修复方案。' },
    { title: '单元测试', subtitle: '生成边缘情况测试用例', text: '为用户管理模块生成覆盖边缘情况的单元测试。' },
    { title: 'K8s 部署', subtitle: '创建高可用部署清单', text: '为高可用设置创建一个 Kubernetes 部署清单。' },
  ],
  [
    { title: 'Debug', subtitle: '追踪错误日志', text: '帮我调试后台工作进程中的内存泄漏问题。' },
    { title: 'SQL 优化', subtitle: '提高查询执行效率', text: '分析这个 SQL 查询计划并建议索引以提高执行时间。' },
    { title: '架构设计', subtitle: '微服务模式建议', text: '为新的支付网关提出一个可扩展的微服务架构方案。' },
  ]
];

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onStop, isStreaming, showSuggestions }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [codeRefs, setCodeRefs] = useState<CodeReference[]>([]);
  const [useReasoning, setUseReasoning] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [suggestionSetIndex, setSuggestionSetIndex] = useState(0);
  
  // Dropdown States
  const [activeMenu, setActiveMenu] = useState<'mode' | 'model' | null>(null);
  const [selectedMode, setSelectedMode] = useState('自动询问');
  const [selectedModel, setSelectedModel] = useState('GLM-4.7');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  
  // Responsive State for Suggestions
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  // Resize Observer to handle responsive layout based on container width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setIsNarrow(entry.contentRect.width < 600);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSend = () => {
    if (isStreaming) {
      if (onStop) onStop();
      return;
    }
    if (!text.trim() && attachments.length === 0 && codeRefs.length === 0) return;
    onSendMessage(text, attachments, codeRefs);
    setText('');
    setAttachments([]);
    setCodeRefs([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simulation helpers for the demo
  const addDemoAttachment = () => {
    const newFile: Attachment = {
      id: Math.random().toString(),
      name: `data_export_${Math.floor(Math.random() * 100)}.csv`,
      type: 'file'
    };
    setAttachments([...attachments, newFile]);
  };

  const addDemoRef = () => {
    const newRef: CodeReference = {
      id: Math.random().toString(),
      name: `@auth_service.go`,
      type: 'code'
    };
    setCodeRefs([...codeRefs, newRef]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const removeRef = (id: string) => {
    setCodeRefs(prev => prev.filter(r => r.id !== id));
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setText(suggestionText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const cycleSuggestions = () => {
    setSuggestionSetIndex((prev) => (prev + 1) % SUGGESTION_SETS.length);
  };

  const permissionModes = ['自动询问', '接受修改', '自动批准', '计划模式', '跳过权限'];
  const models = ['GLM-4.7', 'Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro'];

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto px-4 pb-6 flex flex-col gap-6">
      <div className={`
        relative group
        bg-white dark:bg-zinc-900 
        border-2 border-zinc-200 dark:border-zinc-700 
        focus-within:border-blue-500 dark:focus-within:border-blue-500
        focus-within:bg-zinc-900/30 dark:focus-within:bg-zinc-900/30
        rounded-3xl shadow-sm hover:shadow-md
      `}>
        
        {/* Top Section: Attachments (Exclusive Line) */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 px-4 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
            {attachments.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl group/item animate-in fade-in zoom-in duration-200"
              >
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Icons.File className="w-4 h-4 text-red-500 dark:text-red-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{file.name}</span>
                  <span className="text-[10px] text-zinc-500">MOD</span>
                </div>
                <button 
                  onClick={() => removeAttachment(file.id)}
                  className="ml-1 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <Icons.Close className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Middle Section: Inline Refs + Text Input */}
        <div className="flex flex-wrap items-center px-4 py-3 gap-2 min-h-[56px]">
          {/* Render Code References as 'Chips' in the flow */}
          {codeRefs.map((ref) => (
            <div 
              key={ref.id}
              className="flex items-center gap-1 bg-zinc-800 text-zinc-100 px-2 py-1 rounded-md text-sm font-mono select-none animate-in fade-in slide-in-from-left-2"
            >
              <span>{ref.name}</span>
              <button 
                onClick={() => removeRef(ref.id)}
                className="hover:text-red-400 transition-colors"
              >
                <Icons.Close className="w-3 h-3" />
              </button>
            </div>
          ))}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={codeRefs.length > 0 ? "" : "输入您的问题..."}
            className="flex-1 bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 text-base resize-none py-1 leading-relaxed max-h-[200px]"
            rows={1}
            disabled={isStreaming}
          />
        </div>

        {/* Bottom Section: Controls */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          
          {/* Left Actions */}
          <div className="flex items-center gap-1">
            <button 
              onClick={addDemoAttachment}
              className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              title="添加附件"
            >
              <Icons.Attachment className="w-5 h-5" />
            </button>
            
            <button 
              onClick={addDemoRef}
              className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              title="引用代码"
            >
              <Icons.Mention className="w-5 h-5" />
            </button>

            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

            {/* Toggleable Features */}
            <button 
              onClick={() => setUseReasoning(!useReasoning)}
              className={`
                p-2 rounded-xl transition-all duration-200 
                ${useReasoning 
                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' 
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
              `}
              title="深度思考"
            >
              <Icons.Brain className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setUseWebSearch(!useWebSearch)}
              className={`
                p-2 rounded-xl transition-all duration-200
                ${useWebSearch 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' 
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
              `}
              title="网络搜索"
            >
              <Icons.Globe className="w-5 h-5" />
            </button>
          </div>

          {/* Right Actions: Menus + Send */}
          <div className="flex items-center gap-2" ref={menuContainerRef}>
             <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 relative">
               
               {/* Mode Dropdown */}
               <div className="relative">
                 <button 
                   onClick={() => setActiveMenu(activeMenu === 'mode' ? null : 'mode')}
                   className="cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                 >
                   {selectedMode} <Icons.Expand className="w-3 h-3" />
                 </button>
                 
                 {activeMenu === 'mode' && (
                   <div className="absolute bottom-full mb-2 right-0 w-56 bg-[#1e1e1e] border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-bottom-right">
                     {permissionModes.map((mode) => (
                       <button
                         key={mode}
                         onClick={() => { setSelectedMode(mode); setActiveMenu(null); }}
                         className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-lg transition-colors
                           ${selectedMode === mode 
                             ? 'text-white font-medium' 
                             : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}
                         `}
                       >
                         <span>{mode}</span>
                         {selectedMode === mode && <Icons.Check className="w-4 h-4 text-white" />}
                       </button>
                     ))}
                   </div>
                 )}
               </div>

               {/* Model Dropdown */}
               <div className="relative">
                 <button 
                   onClick={() => setActiveMenu(activeMenu === 'model' ? null : 'model')}
                   className="cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                 >
                   {selectedModel} <Icons.Expand className="w-3 h-3" />
                 </button>
                 
                 {activeMenu === 'model' && (
                   <div className="absolute bottom-full mb-2 right-0 w-56 bg-[#1e1e1e] border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-bottom-right">
                     {models.map((m) => (
                       <button
                         key={m}
                         onClick={() => { setSelectedModel(m); setActiveMenu(null); }}
                         className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-lg transition-colors
                           ${selectedModel === m 
                             ? 'text-white font-medium' 
                             : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}
                         `}
                       >
                         <span>{m}</span>
                         {selectedModel === m && <Icons.Check className="w-4 h-4 text-white" />}
                       </button>
                     ))}
                   </div>
                 )}
               </div>

             </div>

            <button
              onClick={handleSend}
              disabled={(!text && attachments.length === 0 && codeRefs.length === 0 && !isStreaming)}
              className={`
                ml-1 relative p-2 rounded-xl transition-all duration-200 overflow-hidden group
                ${isStreaming 
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700' 
                  : (!text && attachments.length === 0 && codeRefs.length === 0)
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95'}
              `}
            >
              {isStreaming ? (
                <div className="relative w-5 h-5 flex items-center justify-center">
                  {/* Spinner Ring: Transparent border with a single colored side to create a spinning C-shape */}
                  <div className="absolute inset-[-3px] border-[2px] border-transparent border-t-zinc-800 dark:border-t-zinc-200 rounded-full animate-spin" />
                  <Icons.Stop className="w-3 h-3 fill-current relative z-10" />
                </div>
              ) : (
                <Icons.Submit className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Suggestion Section */}
      {showSuggestions && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
           <div className="flex items-center justify-between mb-3 px-1">
             <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">推荐提问</div>
             <button 
               onClick={cycleSuggestions}
               className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
               title="刷新"
             >
               <Icons.Refresh className="w-3.5 h-3.5" />
             </button>
           </div>
           
           <div className={`
             grid gap-3
             ${isNarrow ? 'grid-cols-1' : 'grid-cols-3'}
           `}>
             {SUGGESTION_SETS[suggestionSetIndex].map((item, idx) => (
               <button
                 key={idx}
                 onClick={() => handleSuggestionClick(item.text)}
                 className="flex flex-col text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 group"
               >
                 <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                   {item.title}
                 </span>
                 <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                   {item.subtitle}
                 </span>
               </button>
             ))}
           </div>
        </div>
      )}
      
    </div>
  );
};