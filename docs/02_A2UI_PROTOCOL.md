# A2UI Protocol (Agent-to-UI)

This document defines the JSON structure used for communication between the Backend Agent and the Frontend UI.

## 1. Message Structure

All messages via Wails events or streamed responses follow this base envelope:

```json
{
  "id": "msg_uuid",
  "type": "text" | "thinking" | "tool_call" | "tool_result" | "ui_render" | "control",
  "content": "...", 
  "meta": { ... }
}
```

## 2. Message Types

### 2.1 Text (Streaming)
Standard chat response.
```json
{
  "type": "text",
  "content": "Hello, I can help you with that.",
  "delta": true // if streaming
}
```

### 2.2 Thinking (Chain of Thought)
Collapsible thought process blocks.
```json
{
  "type": "thinking",
  "content": "Analyzing user request...",
  "status": "processing" | "completed"
}
```

### 2.3 UI Render (A2UI Core)
Agent instructs the frontend to render a specific interactive component in the **Chat Stream** or **Preview Window**.

**Targeting the Preview Window:**
```json
{
  "type": "ui_render",
  "target": "preview_tab", // or "chat_stream"
  "component": "form",
  "title": "Collect User Info",
  "data": {
    "schema": {
      "fields": [
        { "name": "api_key", "type": "password", "label": "API Key" },
        { "name": "region", "type": "select", "options": ["us-east-1", "eu-west-1"] }
      ]
    },
    "submit_action_id": "save_config_01"
  }
}
```

### 2.4 Control Instructions
Agent controlling the application state.

**Opening a Preview Tab:**
```json
{
  "type": "control",
  "action": "preview.open",
  "payload": {
    "tab_type": "browser",
    "url": "https://google.com",
    "focus": true
  }
}
```

**Requesting Confirmation (HITL):**
```json
{
  "type": "control",
  "action": "hitl.request_approval",
  "payload": {
    "message": "I am about to execute 'rm -rf ./temp'. Allow?",
    "risk_level": "high",
    "approve_token": "token_yes",
    "deny_token": "token_no"
  }
}
```

## 3. Frontend to Agent (User Input)

When user interacts with A2UI components:

```json
{
  "event": "ui_interaction",
  "action_id": "save_config_01",
  "payload": {
    "api_key": "sk-...",
    "region": "us-east-1"
  }
}
```
