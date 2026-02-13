import React from 'react';
import { Message, Step, A2UIAction } from '../types';
import { Icons } from './icons';
import { ThinkingBlock } from './ThinkingBlock';
import { HIPCard } from './HIPCard';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
  onHIPAction?: (messageId: string, action: 'reject' | 'always' | 'allow') => void;
  onA2UIClick?: (action: A2UIAction) => void;
  isStreaming?: boolean;
}

const StepList: React.FC<{ steps: Step[] }> = ({ steps }) => (
  <div className="my-4 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900/50">
    <div className="flex flex-col">
      {steps.map((step, idx) => (
        <div key={idx} className={`
          flex items-center justify-between py-2.5 px-3 group
          ${idx !== steps.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800/50' : ''}
        `}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 w-4 text-right">{(idx + 1).toString().padStart(2, '0')}.</span>
            <span className={`text-sm ${step.status === 'completed' ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-500'}`}>
              {step.title}
            </span>
          </div>
          <div className="pl-4">
            {step.status === 'completed' && <Icons.Check className="w-4 h-4 text-green-500" />}
            {step.status === 'failed' && <Icons.Reject className="w-4 h-4 text-red-500" />}
            {step.status === 'running' && <Icons.Spinner className="w-3.5 h-3.5 animate-spin text-blue-500" />}
            {step.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-1.5" />}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const A2UIStrip: React.FC<{ action: A2UIAction; onClick: () => void }> = ({ action, onClick }) => {
  const isSubmitted = action.status === 'submitted';
  
  return (
    <div 
      onClick={onClick}
      className={`
        w-full my-4 flex items-center justify-between p-3 rounded-lg border border-l-4 cursor-pointer transition-all hover:shadow-md
        ${isSubmitted 
          ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 border-l-green-500' 
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 border-l-blue-500 shadow-sm'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isSubmitted ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
          <Icons.LayoutTemplate className={`w-4 h-4 ${isSubmitted ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{action.title}</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {isSubmitted ? '表单已提交' : '需要填写配置信息'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {isSubmitted && <span className="text-xs font-medium text-green-600 dark:text-green-400 mr-2">已完成</span>}
        <button className={`
          px-3 py-1.5 text-xs font-medium rounded-md transition-colors
          ${isSubmitted 
            ? 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400' 
            : 'text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20'}
        `}>
          {isSubmitted ? '查看详情' : '填写表单'}
        </button>
      </div>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onHIPAction, onA2UIClick, isStreaming }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex w-full justify-end mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-[85%] flex flex-col items-end">
          {/* User Attachments/Refs Display */}
          {(message.attachments?.length || 0) > 0 && (
            <div className="flex flex-wrap justify-end gap-2 mb-2">
              {message.attachments?.map(att => (
                <div key={att.id} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs py-1 px-2 rounded border border-zinc-200 dark:border-zinc-700">
                  <Icons.File className="w-3 h-3" />
                  {att.name}
                </div>
              ))}
              {message.codeReferences?.map(ref => (
                <div key={ref.id} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs py-1 px-2 rounded border border-blue-100 dark:border-blue-800/30">
                  <Icons.Code className="w-3 h-3" />
                  {ref.name}
                </div>
              ))}
            </div>
          )}

          <div className="bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2.5 rounded-2xl rounded-tr-sm text-zinc-800 dark:text-zinc-100 text-[15px] leading-relaxed">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  // Agent Message
  return (
    <div className="flex w-full justify-start mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-full flex flex-col items-start pl-1">
        
        {/* Thinking Block - Full Width */}
        {message.thinking && (
          <div className="w-full">
            <ThinkingBlock 
              content={message.thinking} 
              duration={message.thinkingDuration}
              isStreaming={isStreaming && message.id === 'streaming-msg'} 
            />
          </div>
        )}

        {/* Task Steps - Full Width */}
        {message.steps && message.steps.length > 0 && (
          <div className="w-full mb-4">
            <StepList steps={message.steps} />
          </div>
        )}

        {/* Main Content - Full Width, Plain Text, Larger Font */}
        {(message.content || isStreaming) && (
          <div className="w-full text-zinc-900 dark:text-zinc-100 text-base leading-relaxed">
            <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:my-3 prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900 prose-pre:border dark:prose-pre:border-zinc-800 prose-pre:rounded-lg">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {isStreaming && !message.content && (
                <span className="inline-block w-2 h-4 bg-current opacity-50 animate-pulse align-middle ml-1"/>
              )}
            </div>
          </div>
        )}

        {/* A2UI Action Strip - Full Width */}
        {message.a2ui && (
          <div className="w-full">
            <A2UIStrip 
              action={message.a2ui} 
              onClick={() => onA2UIClick && onA2UIClick(message.a2ui!)} 
            />
          </div>
        )}

        {/* HIP Card (Only for Agent) - Full Width */}
        {message.type === 'hip' && message.hipData && (
          <div className="w-full">
            <HIPCard 
              actionName={message.hipData.actionName}
              description={message.hipData.description}
              status={message.hipData.status}
              payload={message.hipData.payload}
              onAction={(action) => onHIPAction && onHIPAction(message.id, action)}
            />
          </div>
        )}

      </div>
    </div>
  );
};