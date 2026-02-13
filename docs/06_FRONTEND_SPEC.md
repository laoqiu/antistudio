# Frontend Technical Specification

## 1. Core Stack
- **Framework**: React 18+ (TypeScript)
- **Build Tool**: Vite (Bundled with Wails)
- **State Management**: **MobX** (v6+)
  - Use `mobx-react-lite` for observer components.
  - Store structure: `RootStore` containing `ChatStore`, `UIStore`, `SettingsStore`.
- **Styling**: TailwindCSS
- **UI Components**: Shadcn/ui (Radix Primitives) or Ant Design (TBD based on user preference).

## 2. Key Components

### 2.1 Code Editor
- **Library**: `@monaco-editor/react`
- **Configuration**:
  - Dark mode support (One Dark Pro theme).
  - Minimap disabled by default for cleanliness.
  - Read-only mode for Agent outputs, Editable for User corrections.

### 2.2 Terminal Emulator
- **Library**: `xterm.js`
- **Addons**:
  - `xterm-addon-fit`: For responsive resizing.
  - `xterm-addon-webgl`: For performance (optional).
- **Integration**:
  - Frontend sends keystrokes via Wails Runtime.
  - Backend (Go) uses `creack/pty` to spawn a real shell (`/bin/zsh` on Mac).
  - Stdout/Stderr from PTY is streamed back to `xterm.js`.

### 2.3 Agent UI (A2UI)
- **Renderer**: A dynamic component resolver that maps JSON Schema to React Components.
- **Form Engine**: `react-hook-form` + `zod` for validation (if complex forms are needed).

## 3. Directory Structure (src/)
```
src/
├── assets/
├── components/
│   ├── ui/           # Generic UI atoms (Button, Input)
│   ├── chat/         # Chat bubbles, Input area
│   ├── preview/      # Monaco, Browser, Terminal wrappers
│   └── layout/       # Sidebar, Split panes
├── stores/           # MobX Stores
│   ├── root-store.ts
│   ├── chat-store.ts
│   └── ...
├── hooks/            # Custom React Hooks
├── lib/              # Utilities (A2UI parsers, formatters)
└── App.tsx
```

## 4. State Management (MobX Pattern)

```typescript
// stores/chat-store.ts
import { makeAutoObservable } from "mobx";

class ChatStore {
  messages = [];
  isThinking = false;

  constructor() {
    makeAutoObservable(this);
  }

  addMessage(msg) {
    this.messages.push(msg);
  }
  
  updateLastMessage(content) {
    // Efficient streaming update
  }
}
```
