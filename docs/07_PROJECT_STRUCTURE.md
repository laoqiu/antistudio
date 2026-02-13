# Project Directory Structure

This document outlines the source code organization for AntiStudio, updated to reflect a domain-driven, flat-service architecture.

## 1. Root Directory

- **`main.go`**: The entry point.
- **`wails.json`**: Wails project configuration.
- **`go.mod` / `go.sum`**: Go dependency management.

## 2. `internal/` (Backend Core)

### `internal/core` (Domain Layer)
**Pure Go code. Contains Entities and Ports (Interfaces). No external dependencies.**
- **`agent/`**: Entities: `Agent`, `Conversation`, `Message`.
- **`workflow/`**: Entities: `Node`, `Edge`, `Graph`.
- **`port/`**: **Interfaces (Ports)** for Dependency Inversion.
  - `repository.go`: Interfaces for `ConversationRepo`, `WorkflowRepo`.
  - `llm_provider.go`: Interface for `LLMClient`.
  - `sandbox.go`: Interface for `CodeExecutor`.
  - `mcp_client.go`: Interface for `MCPClient`.

### `internal/infra` (Infrastructure Layer)
**Adapters/Implementations of ports defined in `core/port`.**
- **`database/`**: SQLite/Turso implementation of `Repository` interfaces.
- **`llm/`**: OpenAI/DeepSeek implementation of `LLMClient`.
- **`sandbox/`**: Implementation of `CodeExecutor` (managing Python/Node subprocesses & PTYs).
- **`mcp/`**: Implementation of `MCPClient`.

### `internal/service` (Application Layer)
**Business Logic. Orchestrates Core entities using Ports.**
- **`agent.go`**: `AgentService` (Chat loop, Memory retrieval).
- **`workflow.go`**: `WorkflowEngine` (DAG execution).
- **`skill.go`**: `SkillManager` (Tool registration).
- **`provider.go`**: Dependency Injection wiring (Wire/Manual).

### `internal/app` (Presentation Layer / Wails Bindings)
**The Bridge to Frontend.**
- **`agent_api.go`**: Exposes `AgentService` methods to Frontend.
- **`flow_api.go`**: Exposes `WorkflowEngine` methods.
- **`app.go`**: Wails Lifecycle & Event definitions.

## 3. `frontend/` (React App)

Standard React + Vite structure.

```text
frontend/
├── src/
│   ├── components/       
│   ├── stores/           # MobX Stores
│   ├── lib/              
│   └── App.tsx
```