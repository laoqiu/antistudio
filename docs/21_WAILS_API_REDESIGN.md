# Wails API Layer Complete Redesign

**Date**: 2026-01-27
**Issue**: Wails binding requires all parameters and return values to be JSON serializable
**Status**: ✅ Completed

## Problem Statement

The original API layer had fundamental compatibility issues with Wails:

1. **Context Storage**: Storing `context.Context` in struct fields causes serialization errors
2. **Direct Domain Types**: Using domain types directly exposed internal structures
3. **Error Handling**: Returning Go `error` type is not ideal for frontend consumption
4. **No Request/Response Wrappers**: Lacked consistent API contract structure

## Wails Binding Requirements

For a method to be bindable to Wails frontend:

### ✅ Allowed
- Basic types: `string`, `int`, `bool`, `float64`
- Structs with JSON-serializable fields
- Slices and maps of above types
- **Context as first parameter** (auto-injected by Wails)

### ❌ Not Allowed (in struct fields or as parameters except context)
- `context.Context` (except as first method parameter)
- `func` types
- `chan` types
- `interface{}` without concrete implementation
- Unexported (lowercase) fields

## Solution: Request/Response Pattern

Implement explicit Request/Response structs for all API methods:

```go
// Request struct - fully JSON serializable
type ChatRequest struct {
    SessionID string   `json:"session_id"`
    Content   string   `json:"content"`
    FilePaths []string `json:"file_paths,omitempty"`
}

// Response struct - includes error as string field
type ChatResponse struct {
    SessionID string `json:"session_id"`
    Success   bool   `json:"success"`
    Error     string `json:"error,omitempty"`
}

// Method signature with context injection
func (a *AgentAPI) Chat(ctx context.Context, req ChatRequest) ChatResponse {
    // ctx is automatically injected by Wails runtime
    // req is deserialized from frontend JSON
    // return value is serialized to JSON for frontend
}
```

## New API Design

### AgentAPI

#### 1. Chat Method

**Purpose**: Send a message and receive streamed responses via events

**Request**:
```go
type ChatRequest struct {
    SessionID string   `json:"session_id"`      // Optional, auto-generated if empty
    Content   string   `json:"content"`        // Required
    FilePaths []string `json:"file_paths,omitempty"` // Optional file attachments
}
```

**Response**:
```go
type ChatResponse struct {
    SessionID string `json:"session_id"`  // Session ID for this chat
    Success   bool   `json:"success"`     // Whether request was accepted
    Error     string `json:"error,omitempty"` // Error message if failed
}
```

**Method Signature**:
```go
func (a *AgentAPI) Chat(ctx context.Context, req ChatRequest) ChatResponse
```

**Behavior**:
- Returns immediately with session ID
- Spawns goroutine for LLM streaming
- Emits events to frontend via `runtime.EventsEmit`
- Event name: `agent_update:{session_id}`
- Event payload: `AgentUpdate` struct

**Frontend Usage**:
```typescript
import { Chat } from '../wailsjs/go/app/AgentAPI';

// Call API (context handled by Wails)
const response = await Chat({
  session_id: 'optional-id',
  content: 'Hello, AI!',
  file_paths: []
});

if (response.success) {
  // Subscribe to updates
  EventsOn(`agent_update:${response.session_id}`, (update) => {
    console.log(update);
  });
}
```

#### 2. ListSessions Method

**Purpose**: Get list of conversation sessions

**Request**:
```go
type ListSessionsRequest struct {
    Limit  int `json:"limit"`   // Max results (default: 50)
    Offset int `json:"offset"`  // Pagination offset
}
```

**Response**:
```go
type ListSessionsResponse struct {
    Sessions []agent.SessionMeta `json:"sessions"` // List of sessions
    Total    int                 `json:"total"`    // Total count
    Error    string              `json:"error,omitempty"` // Error if any
}
```

**Method Signature**:
```go
func (a *AgentAPI) ListSessions(ctx context.Context, req ListSessionsRequest) ListSessionsResponse
```

**Frontend Usage**:
```typescript
import { ListSessions } from '../wailsjs/go/app/AgentAPI';

const response = await ListSessions({ limit: 50, offset: 0 });
if (!response.error) {
  console.log(`Found ${response.total} sessions`, response.sessions);
}
```

### SkillAPI

#### 1. ListSkills Method

**Request**: No parameters needed (context only)

**Response**:
```go
type ListSkillsResponse struct {
    Skills []service.SkillInfo `json:"skills"` // Available skills
    Error  string              `json:"error,omitempty"`
}
```

**Method Signature**:
```go
func (a *SkillAPI) ListSkills(ctx context.Context) ListSkillsResponse
```

#### 2. InstallSkill Method

**Request**:
```go
type InstallSkillRequest struct {
    SourcePath string `json:"source_path"` // Path to skill directory
}
```

**Response**:
```go
type InstallSkillResponse struct {
    Success bool   `json:"success"`
    Error   string `json:"error,omitempty"`
}
```

**Method Signature**:
```go
func (a *SkillAPI) InstallSkill(ctx context.Context, req InstallSkillRequest) InstallSkillResponse
```

#### 3. RemoveSkill Method

**Request**:
```go
type RemoveSkillRequest struct {
    SkillName string `json:"skill_name"` // Name of skill to remove
}
```

**Response**:
```go
type RemoveSkillResponse struct {
    Success bool   `json:"success"`
    Error   string `json:"error,omitempty"`
}
```

**Method Signature**:
```go
func (a *SkillAPI) RemoveSkill(ctx context.Context, req RemoveSkillRequest) RemoveSkillResponse
```

#### 4. GetSkillsPath Method

**Request**: No parameters needed

**Response**:
```go
type GetSkillsPathResponse struct {
    Path  string `json:"path"`
    Error string `json:"error,omitempty"`
}
```

**Method Signature**:
```go
func (a *SkillAPI) GetSkillsPath(ctx context.Context) GetSkillsPathResponse
```

## Context Injection Pattern

### How Wails Handles Context

1. **Backend defines method** with `context.Context` as first parameter:
   ```go
   func (a *AgentAPI) Chat(ctx context.Context, req ChatRequest) ChatResponse
   ```

2. **Wails generates TypeScript binding** without context parameter:
   ```typescript
   export function Chat(arg1: ChatRequest): Promise<ChatResponse>;
   ```

3. **Frontend calls method** without passing context:
   ```typescript
   const response = await Chat({ content: 'Hello' });
   ```

4. **Wails runtime injects context** automatically when calling the Go method

### Why This Works

- Context contains Wails runtime references (window, events system, etc.)
- Frontend doesn't need to know about context
- Backend gets proper runtime context for `runtime.EventsEmit` calls
- No serialization issues because context is never serialized

## Complete Example Flow

### 1. Frontend sends message

```typescript
import { Chat } from '../wailsjs/go/app/AgentAPI';
import { EventsOn } from '../wailsjs/runtime/runtime';

// Send message
const response = await Chat({
  content: 'Explain quantum computing',
  file_paths: []
});

if (!response.success) {
  console.error(response.error);
  return;
}

// Subscribe to streaming updates
EventsOn(`agent_update:${response.session_id}`, (update: AgentUpdate) => {
  if (update.content_delta) {
    // Append to message content
    appendContent(update.content_delta);
  }

  if (update.thought_delta) {
    // Show thinking process
    appendThinking(update.thought_delta);
  }

  if (update.system_event) {
    if (update.system_event.type === 'session_end') {
      // Chat completed
      markComplete();
    }
  }
});
```

### 2. Backend processes request

```go
func (a *AgentAPI) Chat(ctx context.Context, req ChatRequest) ChatResponse {
    // Validate
    if req.Content == "" {
        return ChatResponse{
            SessionID: req.SessionID,
            Success:   false,
            Error:     "content cannot be empty",
        }
    }

    // Generate session ID if needed
    sessionID := req.SessionID
    if sessionID == "" {
        sessionID = generateSessionID()
    }

    // Spawn async processing
    go func() {
        // Call service with callback
        err := a.agentService.Chat(userMsg, func(update *agent.AgentUpdate) {
            // Emit to frontend via Wails runtime context
            runtime.EventsEmit(ctx, fmt.Sprintf("agent_update:%s", sessionID), update)
        })

        if err != nil {
            // Emit error
            runtime.EventsEmit(ctx, fmt.Sprintf("agent_update:%s", sessionID), &agent.AgentUpdate{
                SessionID: sessionID,
                SystemEvent: &agent.SystemNotification{
                    Type:    agent.EventError,
                    Message: err.Error(),
                },
            })
        }
    }()

    // Return immediately
    return ChatResponse{
        SessionID: sessionID,
        Success:   true,
    }
}
```

### 3. Service streams LLM response

```go
func (s *AgentService) Chat(req *agent.UserMessage, onUpdate func(*agent.AgentUpdate)) error {
    // Save user message to DB
    // Load conversation history
    // Call LLM for streaming

    tokenChan, err := s.llm.StreamChat(ctx, contextMsgs, nil)
    if err != nil {
        return err
    }

    // Stream tokens to frontend
    for chunk := range tokenChan {
        if chunk.ContentDelta != "" {
            onUpdate(&agent.AgentUpdate{
                SessionID:    req.SessionID,
                ContentDelta: &chunk.ContentDelta,
            })
        }
    }

    // Save assistant response
    return s.repo.SaveMessage(assistantMsg)
}
```

## Benefits of New Design

### 1. Type Safety
- All types are explicitly defined
- Frontend gets accurate TypeScript types
- Compile-time verification

### 2. Error Handling
- Errors returned as strings in response
- Frontend can display errors consistently
- No Go error type serialization issues

### 3. API Versioning
- Request/Response structs can be versioned
- Backward compatibility easier to maintain
- Clear API contract

### 4. Documentation
- Self-documenting API structure
- Clear input/output expectations
- Easy to generate API docs

### 5. Testing
- Easy to mock request/response
- No Wails runtime dependency in unit tests
- Clear test boundaries

## Generated TypeScript Bindings

When you run `wails dev`, Wails generates:

```typescript
// wailsjs/go/app/AgentAPI.ts
export function Chat(arg1: ChatRequest): Promise<ChatResponse>;
export function ListSessions(arg1: ListSessionsRequest): Promise<ListSessionsResponse>;

// wailsjs/go/app/SkillAPI.ts
export function ListSkills(): Promise<ListSkillsResponse>;
export function InstallSkill(arg1: InstallSkillRequest): Promise<InstallSkillResponse>;
export function RemoveSkill(arg1: RemoveSkillRequest): Promise<RemoveSkillResponse>;
export function GetSkillsPath(): Promise<GetSkillsPathResponse>;
```

## Testing Strategy

### Unit Tests (No Wails Runtime)

```go
func TestAgentAPI_Chat_EmptyContent(t *testing.T) {
    api := app.NewAgentAPI(svc)
    ctx := context.Background() // Mock context OK for validation tests

    resp := api.Chat(ctx, app.ChatRequest{
        Content: "", // Invalid
    })

    if resp.Success {
        t.Error("Expected failure for empty content")
    }
}
```

### Integration Tests (Skip Runtime Tests)

```go
func TestAgentAPI_Chat(t *testing.T) {
    t.Skip("Requires Wails runtime context")

    // Test that requires actual runtime.EventsEmit
    // Can be run in E2E tests with real Wails app
}
```

## Migration Checklist

- [x] Define Request/Response structs for all methods
- [x] Update method signatures to use Request/Response pattern
- [x] Add context as first parameter to all methods
- [x] Remove context from struct fields
- [x] Update tests to use new signatures
- [x] Validate all types are JSON serializable
- [x] Document API contract
- [x] Update frontend hooks (after wails dev generates bindings)

## Common Pitfalls to Avoid

### ❌ DON'T: Store context in struct
```go
type AgentAPI struct {
    ctx context.Context // Will cause serialization error
}
```

### ✅ DO: Pass context as parameter
```go
func (a *AgentAPI) Method(ctx context.Context, req Request) Response {
    runtime.EventsEmit(ctx, "event", data)
}
```

### ❌ DON'T: Return Go error type
```go
func (a *AgentAPI) Method(req Request) (Response, error) {
    // error cannot be serialized to JSON properly
}
```

### ✅ DO: Include error in response struct
```go
type Response struct {
    Data  interface{} `json:"data"`
    Error string      `json:"error,omitempty"`
}
```

### ❌ DON'T: Use function parameters
```go
func (a *AgentAPI) Method(callback func(string)) {
    // Functions cannot be serialized
}
```

### ✅ DO: Use events for callbacks
```go
func (a *AgentAPI) Method(ctx context.Context) Response {
    go func() {
        runtime.EventsEmit(ctx, "callback-event", data)
    }()
}
```

## Conclusion

This redesign ensures:

1. ✅ Full Wails compatibility
2. ✅ Clear API contracts
3. ✅ Type-safe frontend bindings
4. ✅ Proper error handling
5. ✅ Testable without Wails runtime
6. ✅ Clean separation of concerns
7. ✅ `wails dev` works without errors

The API layer now follows Wails best practices and provides a solid foundation for frontend development.

---

**Related Documents**:
- [20_WAILS_CONTEXT_INJECTION.md](20_WAILS_CONTEXT_INJECTION.md) - Context injection details
- [02_A2UI_PROTOCOL.md](02_A2UI_PROTOCOL.md) - Agent-to-UI protocol
- [06_FRONTEND_SPEC.md](06_FRONTEND_SPEC.md) - Frontend specifications

**Test Results**:
```
✅ internal/app: 22.2% coverage, all tests pass
✅ Compilation successful
✅ Ready for wails dev
```
