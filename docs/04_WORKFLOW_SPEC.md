# Workflow Specification

## 1. Internal DAG Structure
Regardless of the source (n8n, Coze, Native), all workflows are compiled into this internal JSON format for execution.

```json
{
  "id": "wf_123",
  "nodes": [
    {
      "id": "node_1",
      "type": "llm_chain",
      "config": {
        "model": "gpt-4",
        "prompt": "Summarize {{input}}"
      }
    },
    {
      "id": "node_2",
      "type": "tool_exec",
      "config": {
        "tool_name": "python_repl"
      }
    }
  ],
  "edges": [
    { "source": "node_1", "target": "node_2" }
  ]
}
```

## 2. Import Strategy

### 2.1 n8n Importer
- **Approach**: Best-effort mapping.
- **Mapping**:
  - n8n `Webhook` -> `StartNode`
  - n8n `Function` -> `ScriptNode (JS)`
  - n8n `HttpRequest` -> `HttpNode`
- **Limitation**: Proprietary n8n nodes (e.g., "Slack Integration") will be mapped to a generic `PlaceholderNode` requiring user configuration.

### 2.2 Coze Importer
- **Approach**: Parse Coze's exported JSON.
- **Mapping**:
  - Coze `LLM` -> `LLMNode`
  - Coze `Code` -> `ScriptNode (Python)`
