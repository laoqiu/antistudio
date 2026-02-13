import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../icons';

interface BrowserTabProps {
  initialUrl?: string;
}

export const BrowserTab: React.FC<BrowserTabProps> = ({ initialUrl = 'about:blank' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Agent Cursor State
  const [cursor, setCursor] = useState({ 
      x: 0, 
      y: 0, 
      visible: false, 
      clicking: false 
  });
  
  // Mock Dashboard State
  const [diagStatus, setDiagStatus] = useState<'idle' | 'running' | 'success'>('idle');

  // Handle URL input changes
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      let target = inputUrl;
      // Handle special internal pages
      if (target === 'about:blank') {
        setUrl('about:blank');
        return;
      }

      if (!target.startsWith('http') && target !== 'about:blank') {
        target = 'http://' + target;
      }
      setUrl(target);
      setIsLoading(true);
      // Reset simulator state if navigating away/back
      setDiagStatus('idle'); 
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setDiagStatus('idle');
    setTimeout(() => setIsLoading(false), 800);
  };

  // Simulate loading effect
  useEffect(() => {
    if (isLoading) {
      const t = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  // Scripted Agent Interaction Simulation
  useEffect(() => {
    // Only run simulation on localhost mock page
    // STOP simulation if on blank page or loading
    if (!url.includes('localhost') || isLoading) {
        setCursor(prev => ({ ...prev, visible: false }));
        return;
    }

    let isMounted = true;
    const runScript = async () => {
        const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
        
        // Initial delay before agent starts acting
        await wait(1500);
        if (!isMounted || !containerRef.current) return;

        const { width, height } = containerRef.current.getBoundingClientRect();
        const centerX = width / 2;
        const centerY = height / 2;

        // 1. Initialize Cursor (Start from bottom right)
        setCursor({ 
            x: width * 0.8, 
            y: height * 0.8, 
            visible: true, 
            clicking: false 
        });
        await wait(500);

        // 2. Move to "Run Diagnostics" button location
        // Assuming button is roughly below the center cards.
        // Adjust these offsets based on the rendered UI layout
        const buttonX = centerX; 
        const buttonY = centerY + 80; 

        setCursor(prev => ({ ...prev, x: buttonX, y: buttonY }));
        // Wait for movement transition (1s duration in CSS)
        await wait(1200); 
        if (!isMounted) return;

        // 3. Simulate Click
        setCursor(prev => ({ ...prev, clicking: true }));
        await wait(150);
        setCursor(prev => ({ ...prev, clicking: false }));
        
        // Trigger UI change immediately after click
        setDiagStatus('running');

        // 4. Wait for "processing"
        await wait(2000);
        if (!isMounted) return;
        setDiagStatus('success');

        // 5. Move away to observe results
        setCursor(prev => ({ ...prev, x: width * 0.85, y: height * 0.3 }));
        await wait(1500);

        // 6. Hide cursor when done
        if (isMounted) {
            setCursor(prev => ({ ...prev, visible: false }));
        }
    };

    runScript();

    return () => { isMounted = false; };
  }, [url, isLoading]);

  // Navigate to demo page helper
  const loadDemo = () => {
    setInputUrl('http://localhost:3000');
    setUrl('http://localhost:3000');
    setIsLoading(true);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#1e1e1e]">
      
      {/* Browser Chrome (Top Bar) */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
           <button className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-30" disabled>
             <Icons.ArrowLeft className="w-4 h-4" />
           </button>
           <button className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-30" disabled>
             <Icons.ArrowRight className="w-4 h-4" />
           </button>
           <button 
             onClick={handleRefresh}
             className={`p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors ${isLoading ? 'animate-spin' : ''}`}
           >
             <Icons.RotateCcw className="w-3.5 h-3.5" />
           </button>
        </div>

        {/* Address Bar */}
        <div className="flex-1 flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1.5 text-sm shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
           {url === 'about:blank' ? (
             <Icons.Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
           ) : url.startsWith('https') || url.includes('localhost') ? (
             <Icons.CheckCheck className="w-3.5 h-3.5 text-green-500 mr-2 shrink-0" />
           ) : (
             <Icons.Globe className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
           )}
           <input 
             type="text"
             value={inputUrl}
             onChange={(e) => setInputUrl(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="输入网址或搜索..."
             className="flex-1 bg-transparent border-none outline-none text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 truncate font-mono text-xs"
           />
        </div>

        <button className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 dark:text-zinc-400">
          <Icons.Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-white overflow-hidden" ref={containerRef}>
        {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl shadow-lg flex items-center gap-3 border border-zinc-100 dark:border-zinc-700">
                    <Icons.Spinner className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">正在加载...</span>
                </div>
            </div>
        )}

        {/* Browser Content Switcher */}
        <div className="w-full h-full bg-white dark:bg-[#1a1a1a]">
           {url === 'about:blank' ? (
               /* Default / Blank State */
               <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-zinc-50 dark:bg-[#18181b]">
                   <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-full shadow-lg flex items-center justify-center mb-6 border border-zinc-100 dark:border-zinc-800">
                       <Icons.Bot className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                   </div>
                   <h1 className="text-xl font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Agent 浏览器环境</h1>
                   <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-8 leading-relaxed">
                       此窗口由 Agent 自动化控制。网页内容将在任务执行过程中显示。
                   </p>
                   
                   <div className="flex gap-3">
                     <button 
                       className="px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors"
                       onClick={() => document.getElementById('url-input')?.focus()}
                     >
                       输入网址
                     </button>
                     <button 
                       onClick={loadDemo}
                       className="px-4 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg transition-colors flex items-center gap-2"
                     >
                       <Icons.Zap className="w-3.5 h-3.5" />
                       加载演示应用
                     </button>
                   </div>
               </div>
           ) : url.includes('localhost') ? (
               /* Mock Localhost Dashboard */
               <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-950 text-center p-8">
                   <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl flex items-center justify-center mb-6 border border-zinc-100 dark:border-zinc-800">
                       <Icons.Zap className="w-10 h-10 text-blue-500" />
                   </div>
                   <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Nexus Dashboard</h1>
                   <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mb-8">
                       System Status Monitor & Diagnostics
                   </p>
                   
                   <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
                       <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                           <div className="text-xs text-zinc-500 mb-1 font-medium">SERVICE STATUS</div>
                           <div className="text-green-500 font-bold flex items-center justify-center gap-1.5">
                               <span className="relative flex h-2.5 w-2.5">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                               </span>
                               Online
                           </div>
                       </div>
                       <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                           <div className="text-xs text-zinc-500 mb-1 font-medium">UPTIME</div>
                           <div className="text-zinc-900 dark:text-zinc-100 font-bold">99.98%</div>
                       </div>
                   </div>

                   {/* Interactive Area */}
                   <div className="relative">
                       <button 
                         className={`
                           px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 flex items-center gap-2 shadow-lg
                           ${diagStatus === 'success' 
                             ? 'bg-green-500 text-white shadow-green-500/30 cursor-default' 
                             : diagStatus === 'running'
                               ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-wait'
                               : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 active:scale-95 shadow-zinc-500/20'}
                         `}
                       >
                         {diagStatus === 'running' ? (
                           <>
                             <Icons.Spinner className="w-4 h-4 animate-spin" />
                             Running Diagnostics...
                           </>
                         ) : diagStatus === 'success' ? (
                           <>
                             <Icons.CheckCheck className="w-4 h-4" />
                             System Healthy
                           </>
                         ) : (
                           'Run System Check'
                         )}
                       </button>

                       {/* Success Message Pop */}
                       {diagStatus === 'success' && (
                         <div className="absolute top-full mt-4 w-full animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs px-3 py-2 rounded-lg border border-green-200 dark:border-green-800/30">
                              All systems operational. Latency 24ms.
                            </div>
                         </div>
                       )}
                   </div>
               </div>
           ) : (
               /* External Iframe */
               <iframe 
                 src={url} 
                 title="Browser View"
                 className="w-full h-full border-none bg-white"
                 sandbox="allow-scripts allow-same-origin allow-forms"
               />
           )}
        </div>

        {/* Agent Mouse Cursor Overlay */}
        <div 
            className={`
                absolute z-50 pointer-events-none transition-all duration-[1000ms] ease-in-out
                ${cursor.visible ? 'opacity-100' : 'opacity-0'}
            `}
            style={{ 
                transform: `translate(${cursor.x}px, ${cursor.y}px) scale(${cursor.clicking ? 0.8 : 1})`,
                top: 0, 
                left: 0,
                willChange: 'transform' 
            }}
        >
            <div className="relative">
                <Icons.MousePointer className="w-6 h-6 text-black dark:text-white fill-black dark:fill-white stroke-white dark:stroke-black stroke-2 drop-shadow-md" />
                <div 
                  className={`
                    absolute left-5 top-4 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap
                    transition-opacity duration-300 ${cursor.visible ? 'opacity-100' : 'opacity-0'}
                  `}
                >
                    Agent
                </div>
                
                {/* Click Ripple Effect */}
                {cursor.clicking && (
                    <span className="absolute top-0 left-0 -ml-2 -mt-2 w-10 h-10 rounded-full bg-blue-500/30 animate-ping"></span>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};