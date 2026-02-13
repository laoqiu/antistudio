import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../icons';

interface TerminalLine {
  type: 'input' | 'output';
  content: string;
  cwd?: string;
}

export const Terminal: React.FC = () => {
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'output', content: 'Nexus Agent Terminal [Version 1.0.0]' },
    { type: 'output', content: '(c) 2024 Nexus Corp. All rights reserved.\n' },
    { type: 'input', content: 'npm run dev', cwd: '~/project' },
    { type: 'output', content: '> next dev\n> ready started server on 0.0.0.0:3000, url: http://localhost:3000\n> info  - loaded env from .env.local' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const cmd = currentInput.trim();
      setHistory(prev => [
        ...prev, 
        { type: 'input', content: currentInput, cwd: '~/project' }
      ]);
      setCurrentInput('');

      // Simulate response
      setTimeout(() => {
        let response = '';
        if (cmd === 'ls') response = 'src  public  package.json  tsconfig.json  README.md';
        else if (cmd === 'pwd') response = '/home/user/project';
        else if (cmd === 'clear') {
            setHistory([]);
            return;
        } else if (cmd) {
            response = `command not found: ${cmd}`;
        }

        if (response) {
            setHistory(prev => [...prev, { type: 'output', content: response }]);
        }
      }, 200);
    }
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e] text-zinc-300 font-mono text-xs p-4 overflow-y-auto custom-scrollbar flex flex-col">
      <div className="flex-1">
        {history.map((line, idx) => (
          <div key={idx} className="mb-1 break-all whitespace-pre-wrap">
            {line.type === 'input' && (
              <span className="text-green-500 mr-2">➜  {line.cwd}</span>
            )}
            <span className={line.type === 'input' ? 'text-zinc-100' : 'text-zinc-400'}>
              {line.content}
            </span>
          </div>
        ))}
        
        <div className="flex items-center mt-2">
           <span className="text-green-500 mr-2 shrink-0">➜  ~/project</span>
           <input
             type="text"
             value={currentInput}
             onChange={(e) => setCurrentInput(e.target.value)}
             onKeyDown={handleKeyDown}
             className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-600"
             autoFocus
           />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};