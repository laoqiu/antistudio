import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  theme: 'light' | 'dark';
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  initialCode = '// Type your code here...', 
  language = 'typescript', 
  theme 
}) => {
  return (
    <div className="w-full h-full pt-2 bg-[#fffffe] dark:bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={initialCode} // Changed from defaultValue to value to ensure updates
        path={initialCode.length > 100 ? undefined : undefined} // Optional: add path if you want Monaco to treat as different models
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: 'JetBrains Mono',
          scrollBeyondLastLine: false,
          padding: { top: 10 },
          automaticLayout: true,
          readOnly: false // Explicitly set if needed
        }}
      />
    </div>
  );
};