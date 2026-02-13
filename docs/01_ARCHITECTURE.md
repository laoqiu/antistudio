# AntiStudio System Architecture

## 1. High-Level Overview

AntiStudio is a local-first Agent Orchestration Client built with:
- **Core**: Golang (1.24+)
- **GUI**: Wails v2 (WebView based on WebKit/WebView2)
- **Frontend**: React + TypeScript + TailwindCSS
- **Database**: Turso (libSQL/SQLite) - Local embedded mode
- **Runtimes**: Embedded Python & Node.js environments

## 2. System Modules

### 2.1 Frontend (Renderer Process)
- **Chat Interface**: Handles streaming text, "Thinking" blocks, and HITL (Human-in-the-Loop) interactions.
- **Preview Engine**: A multi-tab container capable of rendering:
  - **Webview**: For browsing tasks.
  - **Monaco Editor**: For code generation/editing tasks.
  - **Dynamic UI**: Renders JSON-defined UI components (Forms, Tables) from Agent (A2UI).
  - **Terminal**: xterm.js connected to local shell/runtimes.

### 2.2 Backend (Go Main Process)
- **App Core**: Wails bindings, Lifecycle management.
- **Agent Runtime**: 
  - LLM Client (OpenAI compatible + Local Models).
  - Context Manager (Handling Short-term & Long-term memory).
  - Planner (ReAct / Workflow Engine).
- **Tool Manager (MCP Client)**:
  - Connects to local MCP Servers.
  - Manages standard "Skills" (Go/Python scripts).
- **Runtime Manager**:
  - Manages subprocesses for Python/Node.js.
  - Handles environment isolation and permission checks.

### 2.3 Data Layer
- **Turso (Embedded)**:
  - `conversations`: Chat history.
  - `memories`: Vector embeddings (via extension) or text-based retrieval.
  - `workflows`: Saved workflow configurations.
  - `settings`: User preferences & API Keys.

## 3. Key Technical Decisions

### 3.1 Embedded Runtimes
- **Strategy**: "Minimal Portable Runtimes".
- **Location**: `~/.antistudio/runtimes/` or bundled within App resource path.
- **Execution**: Go `os/exec` with strict environment variable control (`PATH`, `PYTHONPATH`, etc.).

### 3.2 Workflow Engine
- **Internal Format**: A generic JSON DAG format.
- **Import Strategy**: Adapters convert external formats (n8n/Coze) into Internal Format at import time.
- **Execution**: Topological sort execution in Go.

### 3.3 Security
- **File Access**: Whitelist based. Agent can only access directories explicitly allowed by user.
- **Command Execution**: HITL confirmation required for sensitive shell commands (rm, sensitive network calls).
