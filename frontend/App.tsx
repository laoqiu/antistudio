import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Attachment, CodeReference, A2UIAction, Workflow, WorkspaceTab } from './types';
import { InputArea } from './components/InputArea';
import { MessageBubble } from './components/MessageBubble';
import { Icons } from './components/icons';
import { HistoryPopover } from './components/HistoryPopover';
import { ConfigModal } from './components/ConfigModal';
import { WorkspacePanel } from './components/workspace/WorkspacePanel';
import { WorkflowList } from './components/WorkflowList';

type NavItem = 'chat' | 'workflow' | 'mcp' | 'skills';

const App: React.FC = () => {
  // Initialize theme based on what the index.html script set up
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const historyBtnRef = useRef<HTMLButtonElement>(null);

  // Layout State
  const [activeNav, setActiveNav] = useState<NavItem>('chat');
  const [rightPanelWidth, setRightPanelWidth] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // UI State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Agent Config State
  const [agentName, setAgentName] = useState('默认智能体');
  const [systemPrompt, setSystemPrompt] = useState('You are an expert API testing specialist with deep knowledge of REST, GraphQL, and gRPC protocols. You excel at designing and executing comprehensive test suites that validate functionality, performance, reliability, and contract compliance.');

  // Config Selection State
  const [selectedConfig, setSelectedConfig] = useState<Set<string>>(new Set([
    'default', 'fs', 'coding', 'python'
  ]));

  // A2UI State
  const [activeA2UI, setActiveA2UI] = useState<A2UIAction | null>(null);

  // Workspace External Control
  const [externalOpenTab, setExternalOpenTab] = useState<WorkspaceTab | null>(null);

  // Sync theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Remove Loading Mask
  useEffect(() => {
    const mask = document.getElementById('loading-mask');
    if (mask) {
      requestAnimationFrame(() => {
        mask.style.opacity = '0';
        setTimeout(() => {
          mask.remove();
        }, 300);
      });
    }
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (messages.length > 0 && activeNav === 'chat') {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, activeNav]);

  // Dragging Logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const minPx = 450;
    // Total width available for the two columns is window.innerWidth - 64px (left sidebar)
    const availableWidth = window.innerWidth - 64;
    
    // Safety check for very small screens
    if (availableWidth < minPx * 2) return;

    // Calculate generic right width first
    const mouseXRelative = e.clientX - 64;
    let newRightWidthPixels = availableWidth - mouseXRelative;
    
    // Constraint 1: Right panel min width
    if (newRightWidthPixels < minPx) {
      newRightWidthPixels = minPx;
    }
    
    // Constraint 2: Middle panel min width (implies Right panel max width)
    // Middle Width = Available - Right Width
    // We want (Available - Right) >= minPx  =>  Right <= Available - minPx
    if (newRightWidthPixels > availableWidth - minPx) {
      newRightWidthPixels = availableWidth - minPx;
    }
    
    // Convert to percentage
    const newPercentage = (newRightWidthPixels / availableWidth) * 100;
    setRightPanelWidth(newPercentage);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);


  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const handleStop = () => {
    setIsTyping(false);
    clearTimeouts();
  };

  const handleNewChat = () => {
    handleStop();
    setMessages([]);
    setActiveA2UI(null);
  };

  const handleHistorySelect = (id: string) => {
    console.log("Selected history:", id);
    setMessages([]);
    setIsHistoryOpen(false);
  };

  const toggleConfigItem = (id: string, builtIn: boolean) => {
    if (builtIn) return;
    const next = new Set(selectedConfig);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedConfig(next);
  };

  const handleSendMessage = async (text: string, attachments: Attachment[], refs: CodeReference[]) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      type: 'user',
      content: text,
      timestamp: Date.now(),
      attachments,
      codeReferences: refs
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const t1 = setTimeout(() => {
      const agentId = (Date.now() + 1).toString();
      const thinkingContent = `分析请求上下文...\n用户需要部署一个新的微服务实例。\n我需要收集部署所需的详细配置参数，如服务名称、副本数和资源限制。`;
      
      const initialAgentMsg: Message = {
        id: agentId,
        role: 'assistant',
        type: 'agent',
        content: '',
        timestamp: Date.now(),
        thinking: thinkingContent,
        thinkingDuration: 1200,
        steps: [
            { title: '分析部署需求', status: 'running' },
            { title: '生成配置表单', status: 'pending' },
        ]
      };
      
      setMessages(prev => [...prev, initialAgentMsg]);

      const t2 = setTimeout(() => {
        setMessages(prev => prev.map(m => {
            if (m.id === agentId) {
                return {
                    ...m,
                    steps: [
                        { title: '分析部署需求', status: 'completed' },
                        { title: '生成配置表单', status: 'running' },
                    ]
                }
            }
            return m;
        }))
      }, 800);
      timeoutsRef.current.push(t2);

      const t3 = setTimeout(() => {
        setIsTyping(false);
        const a2uiData: A2UIAction = {
          id: `a2ui-${Date.now()}`,
          title: '配置服务部署参数',
          status: 'pending',
          formSchema: {
            title: "微服务部署配置",
            description: "请填写以下信息以生成 Kubernetes Deployment 清单。",
            fields: [
              { name: "serviceName", label: "服务名称", type: "text", placeholder: "例如：payment-service" },
              { name: "replicas", label: "副本数量", type: "number", defaultValue: 2 },
              { name: "env", label: "环境", type: "select", options: ["Development", "Staging", "Production"] },
              { name: "cpuRequest", label: "CPU Request", type: "text", defaultValue: "250m" },
              { name: "enableMetrics", label: "启用 Prometheus 指标监控", type: "checkbox", defaultValue: true }
            ]
          }
        };

        // Automatically set this as the active A2UI
        setActiveA2UI(a2uiData);

        setMessages(prev => prev.map(m => {
          if (m.id === agentId) {
            return {
              ...m,
              thinkingDuration: 1200,
              steps: [
                { title: '分析部署需求', status: 'completed' },
                { title: '生成配置表单', status: 'completed' },
              ],
              content: "我已为您准备了一个配置表单。请在右侧预览面板中填写部署参数，完成后点击提交，我将为您生成相应的 YAML 文件。",
              a2ui: a2uiData
            };
          }
          return m;
        }));
      }, 1800);
      timeoutsRef.current.push(t3);

    }, 600);
    timeoutsRef.current.push(t1);
  };

  const handleHIPAction = (msgId: string, action: 'reject' | 'always' | 'allow') => {
    const isApproved = action === 'allow' || action === 'always';
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.hipData) {
        return {
          ...m,
          hipData: {
            ...m.hipData,
            status: isApproved ? 'approved' : 'rejected'
          }
        };
      }
      return m;
    }));
  };

  const handleA2UIClick = (action: A2UIAction) => {
    setActiveA2UI(action);
  };

  const handleA2UISubmit = (id: string, formData: any) => {
    setActiveA2UI(prev => prev ? { ...prev, status: 'submitted', submissionData: formData } : null);
    setMessages(prev => prev.map(m => {
      if (m.a2ui && m.a2ui.id === id) {
        return {
          ...m,
          a2ui: { ...m.a2ui, status: 'submitted', submissionData: formData }
        };
      }
      return m;
    }));

    setIsTyping(true);
    setTimeout(() => {
        setIsTyping(false);
        const responseMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            type: 'agent',
            content: `收到配置！\n服务名称: \`${formData.serviceName}\`\n环境: \`${formData.env}\`\n\n正在为您生成 YAML 文件...`,
            timestamp: Date.now(),
            codeReferences: [{ id: 'yaml', name: 'deployment.yaml', type: 'code' }]
        };
        setMessages(prev => [...prev, responseMsg]);
    }, 1000);
  };

  const handleSelectWorkflow = (workflow: Workflow) => {
    const newTab: WorkspaceTab = {
      id: `wf-editor-${workflow.id}`,
      type: 'workflow',
      title: workflow.name,
      data: { workflowId: workflow.id }
    };
    setExternalOpenTab(newTab);
  };

  const isChatEmpty = messages.length === 0;

  const NavButton = ({ id, icon: Icon, label }: { id: NavItem, icon: any, label: string }) => (
    <button
      onClick={() => setActiveNav(id)}
      className={`
        w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group relative
        ${activeNav === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
          : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
      `}
      title={label}
    >
      <Icon className="w-5 h-5" />
      <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
        {label}
      </div>
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
      
      {/* 1. Left Sidebar Navigation (Fixed) */}
      <aside className="w-[64px] shrink-0 flex flex-col items-center py-6 gap-6 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black z-20">
        <div className="mb-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
             <Icons.Bot className="w-5 h-5 text-white" />
           </div>
        </div>
        
        <div className="flex-1 flex flex-col gap-4 w-full items-center">
          <NavButton id="chat" icon={Icons.MessageSquare} label="Chat" />
          <NavButton id="workflow" icon={Icons.Zap} label="Workflow" />
          <NavButton id="mcp" icon={Icons.Database} label="MCP" />
          <NavButton id="skills" icon={Icons.Blocks} label="Skills" />
        </div>

        <div className="flex flex-col gap-4 w-full items-center">
           <button 
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
           >
            {theme === 'light' ? <Icons.Moon className="w-5 h-5" /> : <Icons.Sun className="w-5 h-5" />}
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 cursor-pointer hover:ring-2 ring-zinc-200 dark:ring-zinc-700 transition-all">
             <Icons.User className="w-4 h-4" />
          </div>
        </div>
      </aside>

      {/* Resizable Container */}
      <div 
        ref={containerRef}
        className="flex-1 flex overflow-hidden w-full h-full relative"
      >
        
        {/* 2. Middle Column - Main Content Area */}
        <div className="flex flex-col min-w-0 bg-white dark:bg-black relative h-full flex-1">
          
          {/* Conditional Content based on Nav */}
          {activeNav === 'chat' && (
            <>
              {/* Header */}
              <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 sticky top-0 shrink-0 h-[64px]">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base tracking-tight text-zinc-800 dark:text-zinc-100">{agentName}</h1>
                  <button 
                    onClick={() => setIsConfigOpen(true)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                    title="配置智能体"
                  >
                    <Icons.Settings className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                     onClick={handleNewChat}
                     className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                     title="新会话"
                  >
                    <Icons.Plus className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <button 
                      ref={historyBtnRef}
                      onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                      className={`p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${isHistoryOpen ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : ''}`}
                      title="历史会话"
                    >
                      <Icons.History className="w-5 h-5" />
                    </button>
                    <HistoryPopover 
                      isOpen={isHistoryOpen}
                      onClose={() => setIsHistoryOpen(false)}
                      onSelect={handleHistorySelect}
                      triggerRef={historyBtnRef}
                      theme={theme}
                    />
                  </div>
                </div>
              </header>

              {/* Chat Content + Input Container */}
              <div className="flex-1 flex flex-col relative overflow-hidden">
                 
                 {/* Messages Scroll Area */}
                 {!isChatEmpty && (
                    <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <div className="max-w-3xl mx-auto">
                          {messages.map((msg) => (
                            <MessageBubble 
                              key={msg.id} 
                              message={msg} 
                              onHIPAction={handleHIPAction}
                              onA2UIClick={handleA2UIClick}
                              isStreaming={isTyping && msg.id === messages[messages.length-1].id}
                            />
                          ))}
                          <div ref={scrollEndRef} className="h-4" />
                        </div>
                    </main>
                 )}

                 {/* Input Area - Conditional Layout */}
                 <div className={`
                   transition-all duration-500 ease-in-out w-full
                   ${isChatEmpty 
                     ? 'flex-1 flex flex-col items-center justify-center p-6 border-transparent border-t-0' 
                     : 'shrink-0 border-t border-zinc-100 dark:border-zinc-900 bg-white/80 dark:bg-black/80 backdrop-blur-md pb-2' 
                   }
                 `}>
                   {isChatEmpty && (
                     <div className="mb-8 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center mb-4">
                          <Icons.Brain className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                           今天想构建什么？
                        </h2>
                     </div>
                   )}

                   <div className={`w-full ${isChatEmpty ? 'max-w-3xl' : ''}`}>
                     <InputArea 
                       onSendMessage={handleSendMessage} 
                       onStop={handleStop} 
                       isStreaming={isTyping}
                       showSuggestions={isChatEmpty} 
                     />
                   </div>
                 </div>
              </div>
            </>
          )}

          {activeNav === 'workflow' && (
            <WorkflowList onSelectWorkflow={handleSelectWorkflow} />
          )}

          {(activeNav === 'mcp' || activeNav === 'skills') && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
               <Icons.Wrench className="w-12 h-12 mb-4 opacity-20" />
               <p>该模块正在开发中</p>
            </div>
          )}

        </div>

        {/* Drag Handle */}
        <div 
          className={`
             w-1 transition-all cursor-col-resize z-50 flex items-center justify-center
             hover:bg-blue-500/50 bg-zinc-100 dark:bg-zinc-800/50
             ${isDragging ? 'bg-blue-600' : ''}
          `}
          onMouseDown={handleMouseDown}
        >
           {/* Visual grip handle */}
           <div className="h-8 w-0.5 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
        </div>

        {/* 3. Right Sidebar - Resizable & Styled */}
        <aside 
           style={{ width: `${rightPanelWidth}%` }}
           className="shrink-0 hidden xl:flex flex-col bg-zinc-50 dark:bg-black p-4 h-full"
        >
          <WorkspacePanel 
            theme={theme} 
            activeA2UI={activeA2UI}
            onA2UISubmit={handleA2UISubmit}
            externalOpenTab={externalOpenTab}
          />
        </aside>

      </div>

      {/* Modals */}
      <ConfigModal 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        agentName={agentName}
        setAgentName={setAgentName}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        selectedConfig={selectedConfig}
        toggleConfigItem={toggleConfigItem}
      />

    </div>
  );
};

export default App;