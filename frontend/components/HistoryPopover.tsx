import React, { useState, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './icons';

interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
}

interface HistoryPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  theme: 'light' | 'dark';
}

// Helper to format timestamps
const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < 24 * hour) return `${Math.floor(diff / hour)}小时前`;
  if (diff < 48 * hour) return '昨天';
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;
  
  return new Date(timestamp).toLocaleDateString('zh-CN');
};

// Mock Data Generator
const getMockHistory = (): HistoryItem[] => {
  const now = Date.now();
  const hour = 3600 * 1000;
  const day = 24 * hour;
  
  return [
    { id: '1', title: 'Go 模块依赖升级分析', timestamp: now - 2 * 60 * 1000 },
    { id: '2', title: 'React 性能优化方案', timestamp: now - 1.5 * hour },
    { id: '3', title: 'Kubernetes 部署脚本生成', timestamp: now - 1 * day },
    { id: '4', title: 'SQL 慢查询日志分析', timestamp: now - 2 * day },
    { id: '5', title: 'Python 数据可视化大屏', timestamp: now - 5 * day },
    { id: '6', title: '遗留认证服务重构', timestamp: now - 6 * day },
    { id: '7', title: 'Docker 镜像瘦身指南', timestamp: now - 14 * day },
  ];
};

export const HistoryPopover: React.FC<HistoryPopoverProps> = ({ isOpen, onClose, onSelect, triggerRef, theme }) => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<HistoryItem[]>(getMockHistory());
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Positioning State
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  // Renaming State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Calculate position when opening
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
          setPosition({
            top: rect.bottom + 12,
            right: window.innerWidth - rect.right 
          });
        }
      };
      
      updatePosition();
      // Update on resize or scroll to keep it attached
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    } else {
      // Reset position when closed
      setPosition(null);
      setEditingId(null);
      setActiveMenuId(null);
      setQuery('');
    }
  }, [isOpen, triggerRef]);

  // Search Logic
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      const results = items.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredItems(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, items]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    console.log(`[Mock] Deleting session ${id}`);
    setItems(prev => prev.filter(item => item.id !== id));
    setActiveMenuId(null);
  };

  const handleStartRename = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditValue(item.title);
    setActiveMenuId(null);
  };

  const submitRename = () => {
    if (editingId && editValue.trim()) {
      console.log(`[Mock] Renaming session ${editingId} to "${editValue}"`);
      setItems(prev => prev.map(item => 
        item.id === editingId ? { ...item, title: editValue.trim() } : item
      ));
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Do not render until we have a valid position
  if (!isOpen || !position) return null;

  return createPortal(
    <div className="font-sans">
      {/* Backdrop - z-index high but below popover */}
      <div 
        className="fixed inset-0 bg-transparent z-[9998]" 
        onClick={onClose} 
      />
      
      {/* Popover Container - z-index highest */}
      <div 
        className="fixed w-80 border rounded-xl shadow-2xl p-3 flex flex-col gap-3 animate-in fade-in zoom-in-95 z-[9999] bg-white dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800"
        style={{ 
          top: position.top, 
          right: position.right,
          // Removed inline border colors to fix FOUC issues
        }}
        onClick={(e) => e.stopPropagation()} 
      >
         
         {/* Search Bar */}
         <div className="relative">
           <Icons.Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-400 pointer-events-none" />
           <input 
             type="text" 
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             placeholder="搜索历史会话..." 
             className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-zinc-400"
             style={{
               // Zinc-100 (#f4f4f5) for light, Zinc-950/50 (rgba(9,9,11,0.5)) for dark
               backgroundColor: theme === 'dark' ? 'rgba(9, 9, 11, 0.5)' : '#f4f4f5',
               // Zinc-200 (#e4e4e7) for light, Zinc-800 (#27272a) for dark
               borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
               color: theme === 'dark' ? '#f4f4f5' : '#18181b'
             }}
             autoFocus
             autoComplete="off"
           />
         </div>

         {/* Content List */}
         <div className="flex flex-col min-h-[100px]">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                <Icons.Spinner className="w-5 h-5 animate-spin mb-2" />
                <span className="text-xs">搜索中...</span>
              </div>
            ) : filteredItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-500 gap-2">
                  <Icons.MessageSquare className="w-8 h-8 opacity-20" />
                  <span className="text-xs">未找到相关历史记录</span>
               </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredItems.slice(0, 5).map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => { onSelect(item.id); onClose(); }}
                    className="group relative flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    {/* Left: Summary or Input */}
                    <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-white dark:group-hover:bg-zinc-700 group-hover:text-blue-500 transition-colors">
                        <Icons.MessageSquare className="w-4 h-4" />
                      </div>
                      
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={submitRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRename();
                            if (e.key === 'Escape') cancelRename();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 border border-blue-500 rounded px-1.5 py-0.5 text-sm outline-none"
                          style={{
                             backgroundColor: theme === 'dark' ? '#09090b' : '#ffffff',
                             color: theme === 'dark' ? '#f4f4f5' : '#18181b'
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate font-medium">
                          {item.title}
                        </span>
                      )}
                    </div>

                    {/* Right: Time + Menu */}
                    <div className="flex items-center gap-2 shrink-0">
                      {editingId !== item.id && (
                        <span className="text-[10px] text-zinc-400 font-medium group-hover:hidden transition-all whitespace-nowrap">
                          {formatTime(item.timestamp)}
                        </span>
                      )}
                      
                      {/* Action Button */}
                      <div className={`relative ${activeMenuId === item.id ? 'block' : 'hidden group-hover:block'}`}>
                        <button 
                          onClick={(e) => toggleMenu(e, item.id)}
                          className={`p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors ${activeMenuId === item.id ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-200' : ''}`}
                        >
                          <Icons.MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === item.id && (
                          <>
                             <div className="fixed inset-0 z-[10000] cursor-default" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                             
                             <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-[10001] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                               <button 
                                 onClick={(e) => handleStartRename(e, item)}
                                 className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                               >
                                 <Icons.Edit className="w-3.5 h-3.5" />
                                 重命名
                               </button>
                               <button 
                                 onClick={(e) => handleDelete(e, item.id)}
                                 className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                               >
                                 <Icons.Trash className="w-3.5 h-3.5" />
                                 删除
                               </button>
                             </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
         </div>

         {/* Footer Hint */}
         <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400">
               仅显示最近 5 条记录
            </span>
         </div>
      </div>
    </div>,
    document.body
  );
};