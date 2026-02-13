# MVP Technical Scope (Phase 1)

This document defines the strict boundaries for the Minimum Viable Product (MVP) to ensure rapid delivery of a functional prototype.

## 1. Core Features

### 1.1 Chat Interface
- **Message Rendering**: 
  - Streaming Markdown.
  - "Thinking" block (collapsible).
- **Input**:
  - Text input only (No attachments yet).
  - Basic model selector (Fixed config in code or simple settings JSON).
- **Memory**:
  - Session-based memory (lost on restart) or simple SQLite storage without vector search.

### 1.2 Agent Engine (Backend)
- **Framework**: `langchaingo` or custom ReAct loop.
- **Model Support**: OpenAI API compatible endpoint (e.g., DeepSeek, OpenAI).
- **Tools (Hardcoded for MVP)**:
  - `fs_read_file`: Read local file.
  - `fs_write_file`: Write local file.
  - `shell_exec`: Execute bash command (with HITL confirmation).

### 1.3 Preview Window
- **Tabs**:
  - **Browser**: Simple iframe or Wails WebView tag to show URLs.
  - **Code Editor**: Monaco Editor (ReadOnly mode initially) to view file content opened by Agent.

### 1.4 Workflow
- **Scope**: Single linear chain execution.
- **Format**: Native JSON only.
- **Exclusion**: No n8n/Coze import support in MVP.

### 1.5 Environment
- **Runtime**: Rely on user's installed `python3` and `node` (No embedded runtime distribution in MVP).
- **Database**: `turso` (libSQL) embedded mode for storing simple chat history.

## 2. Technical Stack (MVP)

- **Frontend**: React 18, TailwindCSS, Lucide Icons, Monaco Editor React.
- **Backend**: Go 1.24, Wails v2.9.
- **Data**: `mattn/go-sqlite3` or `libsql-client-go`.

## 3. Success Criteria
1. User can configure an OpenAI Key.
2. User can ask: "Create a Python script that calculates Fibonacci and save it to ./fib.py".
3. Agent thinks -> Generates Code -> Calls `write_file` tool.
4. Agent opens the file in the Right-side Preview Window (Monaco).
5. User sees the code in the editor.
