
export type Theme = 'light' | 'dark';

export interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image';
  size?: string;
}

export interface CodeReference {
  id: string;
  name: string;
  type: 'code';
}

export type MessageType = 'user' | 'agent' | 'hip';

export interface Step {
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

// A2UI specific types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  placeholder?: string;
  defaultValue?: any;
  options?: string[];
}

export interface A2UIAction {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'submitted';
  formSchema: {
    title: string;
    description?: string;
    fields: FormField[];
  };
  submissionData?: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  type: MessageType;
  content: string;
  timestamp: number;
  
  // Agent specific
  thinking?: string; // The chain of thought content
  thinkingDuration?: number; // Simulated duration in ms
  steps?: Step[]; // Execution steps/task list
  
  // User specific
  attachments?: Attachment[];
  codeReferences?: CodeReference[];

  // HIP specific (Human In the Loop)
  hipData?: {
    actionName: string;
    description?: string;
    status: 'pending' | 'approved' | 'rejected';
    payload?: string; // e.g., the code to apply
  };

  // A2UI specific
  a2ui?: A2UIAction;
}

// --- Workflow Types ---
export interface Workflow {
  id: string;
  name: string;
  description: string;
  source: 'official' | 'community' | 'user';
  author?: string;
  updatedAt: number;
  tags?: string[];
  nodes?: any[]; // Simplified for mock
  edges?: any[];
}

// --- Workspace Types ---

export type TabType = 'project' | 'terminal' | 'preview' | 'browser' | 'workflow';

export interface WorkspaceTab {
  id: string;
  type: TabType;
  title: string;
  // Specific data for each type can be stored here
  data?: {
    // For project tabs, we might track the active file path or content state
    activeFileId?: string; 
    // For workflow tabs
    workflowId?: string;
  };
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean; // for folders
  content?: string; // For mock file content
  fileType?: 'code' | 'image'; // Simple type distinction
}
