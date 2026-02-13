# 首次运行调试指南 🔍

## 问题：应用卡在 Loading 状态 ✅ 已修复

### 修复内容

**文件**: `frontend/src/App.tsx`

**改动**:
- ✅ 移除了阻塞式的 loading 检查
- ✅ 改为后台加载会话（非阻塞）
- ✅ 即使会话加载失败，UI 仍然可用
- ✅ 添加错误处理和日志

**效果**:
- 应用立即显示 UI
- 会话在后台加载
- 加载失败不影响使用（可以创建新会话）

### 调试日志

在 `useAgentAPI.ts` 中添加了详细日志：
- `[useAgentAPI] Calling Chat API`
- `[useAgentAPI] Calling ListSessions API`
- `[useAgentAPI] API response`
- `[useAgentAPI] API error`

## 启动步骤

### 1. 设置环境变量

根据要使用的模型设置 API 密钥：

```bash
# OpenAI
export LLM_API_KEY=sk-...

# DeepSeek
export LLM_API_KEY=sk-...

# GLM/智谱AI
export LLM_API_KEY=your-glm-key

# Anthropic (需要代理)
export LLM_API_KEY=sk-ant-...
export LLM_BASE_URL=your-proxy-url
```

### 2. 启动应用

```bash
# 开发模式
wails dev

# 或者指定API密钥启动
LLM_API_KEY=your-key wails dev
```

### 3. 打开浏览器开发者工具

启动后立即打开开发者工具查看日志：

**快捷键**:
- Chrome/Edge: `F12` 或 `Cmd+Option+I` (Mac)
- 切换到 Console 标签

**查看日志**:
```
[useAgentAPI] Calling ListSessions API with request: {limit: 50, offset: 0}
[useAgentAPI] ListSessions API response: {sessions: [], total: 0}
```

## 预期行为

### ✅ 正常情况

1. **立即显示 UI**
   - 看到黑色背景的聊天界面
   - 左侧有侧边栏（可能为空）
   - 中间是聊天区域
   - 底部有输入框

2. **控制台输出**
   ```
   [useAgentAPI] Calling ListSessions API with request: {limit: 50, offset: 0}
   [useAgentAPI] ListSessions API response: {sessions: [], total: 0}
   ```

3. **可以使用**
   - 点击 "New Chat" 创建会话
   - 选择模型
   - 输入消息测试

### ❌ 异常情况

#### 情况 1: Wails 绑定未加载

**现象**: 控制台报错
```
[useAgentAPI] ListSessions API error: window.go is undefined
```

**原因**: 应用不是通过 Wails 启动的

**解决**:
```bash
# 不要用这个
npm run dev  # ❌

# 使用这个
wails dev    # ✅
```

#### 情况 2: API 密钥未设置

**现象**: 控制台报错
```
[useAgentAPI] Chat API error: OPENAI_API_KEY not set
```

**解决**:
```bash
export LLM_API_KEY=your-api-key
wails dev
```

#### 情况 3: 后端编译失败

**现象**: `wails dev` 启动失败

**解决**:
```bash
# 检查 Go 代码
cd /Users/laoqiu/Project/antistudio
go build -o /tmp/test ./main.go

# 查看错误信息
```

## 测试第一个功能：发送消息

### 步骤 1: 创建新会话

1. 点击左侧边栏的 "**+ New Chat**" 按钮
2. UI 应该保持不变（等待你输入消息）

### 步骤 2: 选择模型

1. 在底部输入区域，找到模型选择器（显示当前模型名称）
2. 点击打开下拉菜单
3. 选择一个模型，例如：
   - `GPT-4o` (如果有 OpenAI API)
   - `GLM-4` (如果有智谱 API)
   - `DeepSeek Chat` (如果有 DeepSeek API)

### 步骤 3: 发送消息

1. 在输入框输入：`你好，请介绍一下你自己`
2. 按 **Enter** 发送（Shift+Enter 换行）
3. 观察控制台日志：

```
[useAgentAPI] Calling Chat API with request: {
  session_id: "",
  content: "你好，请介绍一下你自己",
  model: "gpt-4o",
  file_paths: []
}
[useAgentAPI] Chat API response: {
  session_id: "session-xxx",
  success: true
}
```

### 步骤 4: 查看响应

**预期**:
- 用户消息立即显示在聊天区域
- 助手回复逐字显示（流式响应）
- 回复完成后停止

**如果出错**:
- 检查控制台错误信息
- 检查 API 密钥是否正确
- 检查网络连接

## 常见问题排查

### Q1: UI 显示空白

**检查**:
1. 打开开发者工具，查看 Console 是否有错误
2. 查看 Network 标签，是否有资源加载失败
3. 尝试刷新页面 `Cmd+R`

**常见错误**:
```
Failed to load module script: Expected a JavaScript module script
```

**解决**: 清除缓存重新编译
```bash
cd frontend
rm -rf dist node_modules/.vite
npm run build
wails dev
```

### Q2: 模型选择器打不开

**可能原因**: JavaScript 事件未绑定

**解决**:
1. 刷新页面
2. 检查控制台错误
3. 确认 React 正确加载

### Q3: 发送消息后无响应

**调试步骤**:

1. **检查控制台日志**
   ```
   [useAgentAPI] Calling Chat API...
   ```
   如果没有，说明前端未调用 API

2. **检查后端日志**
   在运行 `wails dev` 的终端查看后端输出

3. **检查 API 密钥**
   ```bash
   echo $LLM_API_KEY
   # 应该输出你的密钥
   ```

4. **测试后端**
   ```bash
   # 直接测试 Go 编译
   go run main.go
   ```

### Q4: 流式响应不工作

**现象**: 响应一次性显示，不是逐字出现

**可能原因**:
- 后端未启用流式响应
- EventsOn 未正确订阅

**检查**:
```javascript
// 在控制台输入
window.runtime.EventsOn('agent_update:session-xxx', (data) => {
  console.log('Received update:', data);
});
```

## 后端调试

### 查看后端日志

`wails dev` 终端会显示后端日志：

**正常日志**:
```
[AgentAPI] Chat request received: session_id=, model=gpt-4o
[ProviderFactory] Creating provider for model: gpt-4o
[OpenAIProvider] Initializing with baseURL: https://api.openai.com/v1
[AgentService] Starting chat with provider: openai
```

**错误日志**:
```
[ProviderFactory] Error: OPENAI_API_KEY not set
[AgentService] Error: failed to create provider
```

### 启用详细日志

在 `main.go` 中可以添加更多日志：

```go
// 在 AgentAPI.Chat 方法开头添加
log.Printf("[DEBUG] Chat called: session_id=%s, model=%s, content_length=%d",
    req.SessionID, req.Model, len(req.Content))
```

## 成功标志 ✅

如果以下功能都正常，说明第一个功能已经调通：

- [x] 应用启动，显示 UI
- [x] 可以选择模型
- [x] 可以输入消息
- [x] 点击发送后：
  - [x] 用户消息显示
  - [x] 控制台显示 API 调用日志
  - [x] 助手回复逐字显示
  - [x] 回复完成后停止
- [x] 消息显示正确（Markdown 格式）
- [x] 可以继续发送消息

## 下一步

功能调通后，可以测试：

1. **会话管理**
   - 创建多个会话
   - 切换会话
   - 查看历史消息

2. **不同模型**
   - 测试 OpenAI 模型
   - 测试 GLM 模型
   - 测试 DeepSeek 模型

3. **Markdown 渲染**
   - 发送包含代码块的消息
   - 测试列表、粗体、斜体
   - 验证代码高亮

4. **错误处理**
   - 断网情况
   - 错误的 API 密钥
   - 超长消息

## 需要帮助？

如果遇到问题：

1. **查看控制台日志** - 最重要的调试信息
2. **查看后端日志** - 在 wails dev 终端
3. **检查环境变量** - `echo $LLM_API_KEY`
4. **重新编译** - `cd frontend && npm run build`
5. **清除缓存** - 删除 dist 和 node_modules/.vite

---

**调试版本**: v0.1.0-debug
**最后更新**: 2026-01-28
**状态**: ✅ 已添加调试日志，移除阻塞加载
