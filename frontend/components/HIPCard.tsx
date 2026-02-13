import React from 'react';
import { Icons } from './icons';

interface HIPCardProps {
  actionName: string;
  description?: string;
  payload?: string;
  status: 'pending' | 'approved' | 'rejected';
  onAction: (action: 'reject' | 'always' | 'allow') => void;
}

export const HIPCard: React.FC<HIPCardProps> = ({ actionName, description, payload, status, onAction }) => {
  const isPending = status === 'pending';
  const isCompact = !description && !payload && isPending;

  const getStatusText = (s: string) => {
    switch(s) {
      case 'approved': return '已批准';
      case 'rejected': return '已拒绝';
      default: return '待确认';
    }
  };

  return (
    <div className={`
      my-4 rounded-lg border overflow-hidden
      ${status === 'pending' ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm' : ''}
      ${status === 'approved' ? 'border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-900/10' : ''}
      ${status === 'rejected' ? 'border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10 opacity-90' : ''} 
    `}>
      <div className={`px-4 py-3 ${isCompact ? 'flex items-center justify-between gap-4' : ''}`}>
        
        {/* Header / Title Section */}
        <div className={`${isCompact ? '' : 'flex items-start justify-between gap-4'}`}>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className={`
                p-1.5 rounded-md
                ${status === 'pending' ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' : ''}
                ${status === 'approved' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : ''}
                ${status === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : ''}
              `}>
                <Icons.HIP className="w-4 h-4" />
              </div>
              <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{actionName}</h4>
              
              {!isPending && (
                <span className={`
                  ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded border
                  ${status === 'approved' ? 'border-green-200 text-green-600 dark:border-green-800 dark:text-green-400' : ''}
                  ${status === 'rejected' ? 'border-red-200 text-red-600 dark:border-red-800 dark:text-red-400' : ''}
                `}>
                  {getStatusText(status)}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 ml-1">{description}</p>
            )}
          </div>
        </div>

        {/* Payload / Code Block */}
        {payload && (
          <div className="mt-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-3 overflow-x-auto">
            <pre className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 leading-tight">
              <code>{payload}</code>
            </pre>
          </div>
        )}

        {/* Actions - Three Buttons */}
        {isPending && (
          <div className={`flex flex-wrap items-center gap-2 ${isCompact ? 'shrink-0' : 'mt-4 justify-end'}`}>
            
            <button
              onClick={() => onAction('always')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-500 rounded-md shadow-sm shadow-green-500/20 transition-all"
            >
              <Icons.CheckCheck className="w-3.5 h-3.5" />
              始终允许
            </button>

            <button
              onClick={() => onAction('allow')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-sm shadow-blue-500/20 transition-all"
            >
              <Icons.Check className="w-3.5 h-3.5" />
              仅此次
            </button>
            
            <button
              onClick={() => onAction('reject')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-md shadow-sm shadow-red-500/20 transition-all"
            >
              <Icons.Close className="w-3.5 h-3.5" />
              拒绝
            </button>

          </div>
        )}
      </div>
    </div>
  );
};