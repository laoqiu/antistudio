# Database Schema (Turso/SQLite)

## 1. Tables

### `conversations`
Stores the metadata of chat sessions.
```sql
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,           -- UUID
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata JSON                  -- e.g., {"model": "gpt-4", "mode": "react"}
);
```

### `messages`
Stores actual chat logs including user inputs, agent thoughts, and tool results.
```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,            -- "user", "assistant", "system", "tool"
    content TEXT,                  -- Main text content
    content_type TEXT DEFAULT 'text', -- "text", "image", "mixed"
    extra_data JSON,               -- Stores UI component definitions, tool call args, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
```

### `memories` (Local RAG)
Stores long-term memory.
```sql
CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    embedding BLOB,                -- Vector data (if using vector extension)
    tags JSON,                     -- ["python", "project_x"]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `workflows`
Stores defined agent workflows.
```sql
CREATE TABLE workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    source_type TEXT,              -- "native", "n8n", "coze"
    definition JSON NOT NULL,      -- The internal DAG structure
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `settings`
Key-value store for app configuration.
```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,           -- Encrypted value if sensitive
    is_secure BOOLEAN DEFAULT 0
);
```
