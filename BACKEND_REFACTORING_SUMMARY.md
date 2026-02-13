# 后端重构总结

**日期**: 2026-01-27
**状态**: ✅ 完成

## 重构内容

### 1. 数据库层重写 - 使用原生 SQL ✅

**原因**: 移除 xorm 和 tursogo 依赖，改用标准的 `database/sql` + `mattn/go-sqlite3`

**改动**:
- `internal/infra/database/sqlite.go` - 完全重写
- 使用原生 SQL 语句替代 ORM
- 添加完整的错误处理

**新特性**:
```go
// 手动创建表结构
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gpt-4o',  // 新增：存储使用的模型
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER NOT NULL DEFAULT 0
);
```

**依赖变化**:
```
// Before
"turso.tech/database/tursogo"
"xorm.io/xorm"

// After
"github.com/mattn/go-sqlite3"
```

### 2. Core 层实体更新 ✅

**改动**: `internal/core/agent/entity.go`

**移除 xorm 标签**:
```go
// Before
type Conversation struct {
    ID string `xorm:"pk varchar(36)" json:"id"`
    //...
}

// After
type Conversation struct {
    ID    string `json:"id"`
    Model string `json:"model"`  // 新增字段
    //...
}
```

**新增字段**:
- `Model string` - 存储对话使用的 LLM 模型（如 "gpt-4o", "deepseek-chat"）

### 3. LLM Provider Factory ✅

**新文件**: `internal/infra/llm/factory.go`

**功能**: 根据模型名称动态创建 LLM provider

**支持的模型**:
- OpenAI: `gpt-4o`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`
- DeepSeek: `deepseek-chat`, `deepseek-coder`
- Claude: `claude-3-opus`, `claude-3-sonnet`, `claude-3-haiku`

**使用示例**:
```go
factory := llm.NewProviderFactory()
provider, err := factory.CreateProvider("gpt-4o")
if err != nil {
    // Handle error
}
```

**环境变量**:
```bash
LLM_API_KEY=your-api-key        # 通用 API Key
LLM_BASE_URL=https://...        # 自定义 API endpoint
```

### 4. API 层增强 - 模型选择 ✅

**改动**: `internal/app/agent_api.go`

**ChatRequest 新增字段**:
```go
type ChatRequest struct {
    SessionID string   `json:"session_id"`    // Optional
    Content   string   `json:"content"`       // Required
    Model     string   `json:"model"`         // Required - NEW!
    FilePaths []string `json:"file_paths,omitempty"`
}
```

**AgentAPI 新增字段**:
```go
type AgentAPI struct {
    agentService *service.AgentService
    llmFactory   *llm.ProviderFactory  // NEW!
}
```

**Chat 方法改进**:
```go
func (a *AgentAPI) Chat(ctx context.Context, req ChatRequest) ChatResponse {
    // 1. 验证 model 字段
    if req.Model == "" {
        return ChatResponse{Error: "model must be specified"}
    }

    // 2. 根据模型创建 LLM provider
    llmProvider, err := a.llmFactory.CreateProvider(req.Model)
    if err != nil {
        return ChatResponse{Error: "unsupported model"}
    }

    // 3. 调用 service 层，传入 provider 和 model
    go func() {
        a.agentService.ChatWithProvider(ctx, userMsg, req.Model, llmProvider, onUpdate)
    }()

    return ChatResponse{SessionID: sessionID, Success: true}
}
```

### 5. Service 层改进 ✅

**改动**: `internal/service/agent.go`

**新方法**: `ChatWithProvider`
```go
// 新方法：支持动态 LLM provider
func (s *AgentService) ChatWithProvider(
    ctx context.Context,
    req *agent.UserMessage,
    model string,
    llmProvider port.LLMProvider,
    onUpdate func(*agent.AgentUpdate),
) error {
    // 创建会话时保存 model
    conv := &agent.Conversation{
        ID:    sessionID,
        Model: model,  // 保存使用的模型
        //...
    }

    // 使用传入的 provider 而不是默认的
    tokenChan, err := llmProvider.StreamChat(ctx, contextMsgs, nil)
    //...
}
```

**向后兼容**:
```go
// 原有的 Chat 方法现在调用 ChatWithProvider
func (s *AgentService) Chat(ctx context.Context, req *agent.UserMessage, onUpdate func(*agent.AgentUpdate)) error {
    return s.ChatWithProvider(ctx, req, "gpt-4o", s.llm, onUpdate)
}
```

### 6. Main.go 集成 ✅

**改动**: `main.go`

```go
// Before
llmProvider := llm.NewOpenAIProvider(apiKey, baseURL, "gpt-4o")
agentSvc := service.NewAgentService(repo, llmProvider)
agentAPI := app.NewAgentAPI(agentSvc)

// After
llmFactory := llm.NewProviderFactory()
defaultProvider, _ := llmFactory.CreateProvider("gpt-4o")
agentSvc := service.NewAgentService(repo, defaultProvider)
agentAPI := app.NewAgentAPI(agentSvc, llmFactory)  // 传入 factory
```

## 使用示例

### 前端调用

```typescript
import { Chat } from '../wailsjs/go/app/AgentAPI';

// 使用 GPT-4o
const response = await Chat({
  content: '你好',
  model: 'gpt-4o',
  file_paths: []
});

// 使用 DeepSeek
const response2 = await Chat({
  content: 'Explain quantum computing',
  model: 'deepseek-chat',
  file_paths: []
});
```

### 后端流程

1. **用户选择模型** → 前端发送 `ChatRequest` 包含 `model` 字段
2. **API 层验证** → 检查 `model` 是否为空
3. **创建 Provider** → `llmFactory.CreateProvider(model)`
4. **Service 处理** → `ChatWithProvider(ctx, req, model, provider, onUpdate)`
5. **保存到数据库** → `Conversation` 记录使用的 `model`
6. **流式响应** → 使用指定的 provider 进行 LLM 调用

## 数据库 Schema 变化

### conversations 表

```sql
-- 新增 model 字段
ALTER TABLE conversations ADD COLUMN model TEXT NOT NULL DEFAULT 'gpt-4o';
```

如果你有现有数据库，需要运行迁移或删除旧数据库重新创建。

## 测试结果

```bash
$ go test ./internal/app/...
PASS
ok      antistudio/internal/app    0.014s

$ go build
# 编译成功
```

## 环境变量配置

### 单一 API Key（推荐）

```bash
# 使用 OpenAI
export LLM_API_KEY=sk-xxx
export LLM_BASE_URL=https://api.openai.com/v1

# 使用 DeepSeek
export LLM_API_KEY=sk-xxx
export LLM_BASE_URL=https://api.deepseek.com/v1
```

### 多 Provider（可选）

如果需要同时支持多个 provider，可以扩展 factory：

```go
// 在 factory.go 中添加
func (f *ProviderFactory) WithAPIKeys(keys map[string]string) *ProviderFactory {
    // OpenAI, DeepSeek, Claude 分别配置
}
```

## 关于 Wails App 结构的说明

### 为什么官方示例这样写？

```go
type App struct {
    ctx context.Context  // 可以存储 context
}

func (a *App) startup(ctx context.Context) {
    a.ctx = ctx  // 在 startup 中保存
}
```

**原因**:
1. `App` 结构体是**生命周期容器**，不是绑定到前端的 API
2. `startup/shutdown` 是 Wails 的**生命周期钩子**（小写开头）
3. `App` **不会被 Bind**，所以可以存储 `context.Context`

**正确模式**:
```go
// main.go
type App struct {
    ctx context.Context  // ✅ OK - 不会被绑定
}

func (a *App) startup(ctx context.Context) {
    a.ctx = ctx
    // 初始化资源
}

func main() {
    app := &App{}
    agentAPI := &AgentAPI{}  // 不存储 context

    wails.Run(&options.App{
        OnStartup:  app.startup,   // 生命周期钩子
        OnShutdown: app.shutdown,
        Bind: []interface{}{
            agentAPI,  // ✅ 只绑定 API
        },
    })
}
```

### startup/shutdown 的用途

**startup** (应用启动时调用):
- 初始化数据库连接
- 加载配置
- 启动后台服务
- 设置全局状态

**shutdown** (应用关闭时调用):
- 关闭数据库连接
- 保存状态
- 清理资源
- 停止后台服务

**示例**:
```go
func (a *App) startup(ctx context.Context) {
    a.ctx = ctx

    // 初始化数据库
    db, _ := database.NewSQLiteRepository("data.db")
    a.db = db

    // 启动清理任务
    go a.cleanupTask()
}

func (a *App) shutdown(ctx context.Context) {
    // 关闭数据库
    if a.db != nil {
        a.db.Close()
    }

    // 保存状态
    a.saveState()
}
```

## 迁移检查清单

- [x] 移除 xorm 和 tursogo 依赖
- [x] 重写 database layer 使用原生 SQL
- [x] 添加 Model 字段到 Conversation
- [x] 创建 LLMProviderFactory
- [x] 更新 ChatRequest 添加 model 字段
- [x] 修改 AgentAPI 支持动态 provider
- [x] 添加 ChatWithProvider 方法
- [x] 更新 main.go 集成
- [x] 修复所有测试
- [x] 验证编译成功
- [x] 运行 `wails dev` 测试 ✅ (2026-01-28)
- [ ] 前端调用测试
- [ ] 多模型切换测试

## 下一步

1. **运行 Wails 开发服务器**:
   ```bash
   wails dev
   ```

2. **测试模型切换**:
   - 尝试使用不同的模型发送消息
   - 验证会话正确保存 model 字段
   - 检查流式响应是否正常

3. **前端 UI 增强**:
   - 添加模型选择器
   - 显示当前会话使用的模型
   - 支持会话历史中查看模型信息

## 总结

✅ **完成的改进**:
1. 移除了 ORM 依赖，使用原生 SQL（更清晰、更可控）
2. 支持多模型选择（GPT-4, DeepSeek, Claude 等）
3. 会话记录使用的模型（便于追溯和分析）
4. 动态创建 LLM provider（节省资源）
5. 保持向后兼容（现有代码仍可工作）

🎯 **架构优势**:
- **灵活性**: 轻松添加新模型支持
- **可测试性**: 更容易 mock 和测试
- **性能**: 按需创建 provider
- **可维护性**: 代码结构清晰

---

**版本**: 2.0
**完成日期**: 2026-01-27
**状态**: Ready for Testing
