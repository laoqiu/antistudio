import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './icons';

// Mock Config Data with Descriptions
const MOCK_CONFIG = {
  agents: [
    { id: 'default', name: '基础对话模型', desc: '通用对话和简单任务', builtIn: true },
    { id: 'gpt4', name: 'GPT-4o', desc: '复杂逻辑推理和创意写作', builtIn: false },
    { id: 'claude35', name: 'Claude 3.5 Sonnet', desc: '代码编写和长文本分析', builtIn: false },
  ],
  mcp: [
    { id: 'fs', name: '文件系统读取', desc: '读取和分析本地文件', builtIn: true },
    { id: 'browser', name: '网页浏览', desc: '实时搜索并提取网页信息', builtIn: false },
    { id: 'terminal', name: '终端命令执行', desc: '沙箱环境中执行 Shell 命令', builtIn: false },
  ],
  workflows: [
    { id: 'research', name: '深度研究模式', desc: '自动多轮搜索生成报告', builtIn: false },
    { id: 'coding', name: '全栈开发辅助', desc: '代码审查、重构和测试生成', builtIn: true },
  ],
  skills: [
    { id: 'python', name: 'Python 解释器', desc: '执行数据分析和绘图', builtIn: true },
    { id: 'image', name: 'DALL-E 绘图', desc: '根据文本描述生成图像', builtIn: false },
  ]
};

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  setAgentName: (name: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  selectedConfig: Set<string>;
  toggleConfigItem: (id: string, builtIn: boolean) => void;
}

// Enhanced Switch Component with correct hover states
const Switch: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={(e) => {
        e.preventDefault();
        if(!disabled) onChange();
    }}
    disabled={disabled}
    className={`
      relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none 
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${checked 
        ? 'bg-blue-600 hover:bg-blue-700' 
        : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'}
    `}
  >
    <span
      aria-hidden="true"
      className={`
        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
        ${checked ? 'translate-x-4' : 'translate-x-0'}
      `}
    />
  </button>
);

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  agentName,
  setAgentName,
  systemPrompt,
  setSystemPrompt,
  selectedConfig,
  toggleConfigItem
}) => {
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Reset expansion state when opening
  useEffect(() => {
    if (isOpen) setIsPromptExpanded(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(systemPrompt);
  };

  const renderSection = (title: string, Icon: React.ElementType, iconColor: string, items: typeof MOCK_CONFIG.agents) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        {items.map(item => (
          <div 
            key={item.id} 
            onClick={() => toggleConfigItem(item.id, item.builtIn)}
            className={`
              flex items-center justify-between gap-4 px-4 py-3 cursor-pointer transition-colors group
              ${item.builtIn ? 'cursor-default' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
            `}
          >
            {/* Left Side: Name + Badge */}
            <div className="flex items-center gap-2 shrink-0">
                <span className={`text-sm font-medium ${selectedConfig.has(item.id) ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {item.name}
                </span>
                {item.builtIn && (
                  <span className="text-[10px] leading-none bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                    内置
                  </span>
                )}
            </div>

            {/* Middle: Description (Right Aligned) */}
            {item.desc && (
                <div className="flex-1 text-right min-w-0 mx-2">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors">
                        {item.desc}
                    </p>
                </div>
            )}

            {/* Right Side: Switch */}
            <div className="shrink-0 flex items-center">
              <Switch 
                  checked={selectedConfig.has(item.id)} 
                  onChange={() => toggleConfigItem(item.id, item.builtIn)}
                  disabled={item.builtIn}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`
        bg-zinc-50 dark:bg-[#18181b] w-full rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col transition-all duration-300
        ${isPromptExpanded ? 'h-[90vh] max-w-5xl' : 'max-h-[85vh] max-w-2xl'}
      `}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shrink-0">
          <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-100">
            {isPromptExpanded ? '编辑系统提示词' : '配置智能体'}
          </h3>
          <div className="flex items-center gap-2">
            {isPromptExpanded && (
               <button 
                 onClick={() => setIsPromptExpanded(false)}
                 className="px-4 py-1.5 text-xs leading-none font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm shadow-blue-500/20"
               >
                 完成编辑
               </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
              <Icons.Close className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* Main Layout: If expanded, only show prompt area full size. If not, show normal form. */}
          {!isPromptExpanded && (
             <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-1">
                   <Icons.Bot className="w-4 h-4 text-blue-500" />
                   <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">智能体名称</span>
                </div>
                <input 
                  type="text" 
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 shadow-sm"
                />
             </div>
          )}

          {/* Prompt Editor Section */}
          <div className={`flex flex-col ${isPromptExpanded ? 'h-full' : 'mb-8'}`}>
            {!isPromptExpanded && (
               <div className="flex items-center justify-between mb-3 px-1">
                 <div className="flex items-center gap-2">
                    <Icons.Code className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">系统提示词</span>
                 </div>
                 <div className="flex items-center gap-1">
                    <button 
                      onClick={handleCopyPrompt}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                      title="复制"
                    >
                      <Icons.Copy className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setIsPromptExpanded(true)}
                      className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="放大编辑"
                    >
                      <Icons.Maximize className="w-3.5 h-3.5" />
                    </button>
                 </div>
               </div>
            )}
            
            <div className={`
              relative flex flex-col border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all
              ${isPromptExpanded ? 'flex-1' : ''}
            `}>
              <textarea 
                ref={promptRef}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="在此输入系统提示词，定义智能体的行为模式、角色设定和限制条件..."
                className={`
                  w-full resize-none bg-transparent border-none outline-none text-sm text-zinc-800 dark:text-zinc-200 p-4 font-mono leading-relaxed custom-scrollbar
                  ${isPromptExpanded ? 'flex-1 text-base' : 'h-32'}
                `}
                spellCheck={false}
              />
              {/* Footer inside Textarea Container */}
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800">
                 <div className="text-[10px] text-zinc-400">
                    支持 Markdown 格式
                 </div>
                 <div className="text-[10px] font-mono text-zinc-400">
                    {systemPrompt.length} / 10000
                 </div>
              </div>
            </div>
          </div>

          {/* Configuration Lists - Hide when prompt is expanded */}
          {!isPromptExpanded && (
            <div className="space-y-4">
              {renderSection('基础模型', Icons.Brain, 'text-sky-500', MOCK_CONFIG.agents)}
              {renderSection('MCP 工具集成', Icons.Tools, 'text-orange-500', MOCK_CONFIG.mcp)}
              {renderSection('工作流模版', Icons.LayoutGrid, 'text-indigo-500', MOCK_CONFIG.workflows)}
              {renderSection('特定技能', Icons.Cpu, 'text-emerald-500', MOCK_CONFIG.skills)}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isPromptExpanded && (
          <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end shrink-0">
            <button 
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              完成配置
            </button>
          </div>
        )}
      </div>
    </div>
  );
};