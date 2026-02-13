# 智谱AI (GLM) 模型集成指南

## 概述

AntiStudio 现已支持智谱AI的GLM系列模型，包括：
- **GLM-4** - 最新的GLM-4模型，综合性能强
- **GLM-4V** - 支持视觉能力的GLM-4
- **GLM-3 Turbo** - 快速高效的GLM-3

## 后端集成说明

### 1. 架构设计

智谱AI的API与OpenAI兼容，因此复用了现有的 `OpenAIProvider` 实现：

```
用户请求 (model: "glm-4")
    ↓
ProviderFactory.CreateProvider("glm-4")
    ↓
检测到 isGLMModel() = true
    ↓
createGLMProvider() 创建 OpenAIProvider
    - API Key: 从 LLM_API_KEY 读取
    - Base URL: https://open.bigmodel.cn/api/paas/v4
    - Model: glm-4
    ↓
使用智谱API进行对话
```

### 2. 修改的文件

#### 后端文件
**`/internal/infra/llm/factory.go`**

添加的内容：
1. **模型检测函数** (第119-127行):
```go
func isGLMModel(model string) bool {
	models := []string{"glm-4", "glm-4v", "glm-3-turbo"}
	for _, m := range models {
		if model == m {
			return true
		}
	}
	return false
}
```

2. **GLM Provider 创建方法** (第82-92行):
```go
func (f *ProviderFactory) createGLMProvider(model string) (port.LLMProvider, error) {
	apiKey := f.apiKey
	if apiKey == "" {
		return nil, fmt.Errorf("GLM_API_KEY not set")
	}

	baseURL := "https://open.bigmodel.cn/api/paas/v4"

	return NewOpenAIProvider(apiKey, baseURL, model), nil
}
```

3. **在 CreateProvider switch 中添加** (第34行):
```go
case isGLMModel(model):
	return f.createGLMProvider(model)
```

4. **在支持模型列表中添加** (第139-141行):
```go
"glm-4",
"glm-4v",
"glm-3-turbo",
```

#### 前端文件
**`/frontend/src/config/models.ts`**

添加的内容：
1. **Provider 类型定义** (第4行):
```typescript
provider: 'OpenAI' | 'DeepSeek' | 'Anthropic' | 'ZhipuAI';
```

2. **GLM 模型配置** (第63-81行):
```typescript
// ZhipuAI Models
{
  id: 'glm-4',
  name: 'GLM-4',
  provider: 'ZhipuAI',
  category: 'balanced',
  description: 'Latest GLM-4 model',
},
{
  id: 'glm-4v',
  name: 'GLM-4V',
  provider: 'ZhipuAI',
  category: 'balanced',
  description: 'GLM-4 with vision capabilities',
},
{
  id: 'glm-3-turbo',
  name: 'GLM-3 Turbo',
  provider: 'ZhipuAI',
  category: 'chat',
  description: 'Fast and efficient GLM-3',
}
```

## 配置步骤

### 1. 获取智谱AI API密钥

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 在控制台创建API密钥
4. 复制你的API Key

### 2. 配置环境变量

在项目根目录创建或修改 `.env` 文件：

```bash
# 智谱AI API配置
LLM_API_KEY=your-glm-api-key-here

# 可选：如果需要覆盖默认URL
# LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
```

**注意**：
- 环境变量 `LLM_API_KEY` 是通用的，支持多个提供商
- 如果同时使用OpenAI、DeepSeek、Claude和GLM，需要在应用层面做密钥切换
- 建议为不同提供商使用不同的实例或配置管理

### 3. 启动应用

```bash
# 开发模式
wails dev

# 或者直接设置环境变量启动
LLM_API_KEY=your-key wails dev
```

## 使用方法

### 前端选择GLM模型

1. 启动应用后，在聊天界面点击模型选择器
2. 从下拉列表中选择 ZhipuAI 提供商的模型：
   - **GLM-4** - 综合性能最强
   - **GLM-4V** - 支持图像理解
   - **GLM-3 Turbo** - 速度更快
3. 输入消息开始对话

### API调用示例

**前端发送请求**:
```typescript
const response = await api.chat({
  session_id: sessionID || '',
  content: "你好，请介绍一下自己",
  model: "glm-4",  // 指定使用GLM-4模型
  file_paths: [],
});
```

**后端处理流程**:
```go
// 1. 接收请求
req := ChatRequest{
    SessionID: "session-123",
    Content:   "你好，请介绍一下自己",
    Model:     "glm-4",
}

// 2. 创建GLM Provider
provider, err := llmFactory.CreateProvider("glm-4")
// 返回: OpenAIProvider with baseURL="https://open.bigmodel.cn/api/paas/v4"

// 3. 调用智谱API
response, err := provider.Chat(ctx, messages, options)
```

## 智谱API特性

### 支持的功能

1. **流式对话** - 支持 `StreamChat` 方法
2. **多轮对话** - 自动管理会话上下文
3. **系统提示** - 支持 system role 消息
4. **函数调用** - GLM-4 支持 Function Calling（需要额外配置）

### API限制

1. **并发限制**: 根据你的套餐不同
2. **Token限制**:
   - GLM-4: 最大128K tokens
   - GLM-4V: 支持图像+文本
   - GLM-3-Turbo: 最大8K tokens
3. **Rate Limit**: 查看官方文档了解详情

## 模型对比

| 模型 | 上下文长度 | 特点 | 适用场景 |
|------|-----------|------|---------|
| GLM-4 | 128K | 最新最强，支持复杂推理 | 代码生成、复杂任务、长文本 |
| GLM-4V | 128K | 支持图像理解 | 多模态任务、图像问答 |
| GLM-3-Turbo | 8K | 速度快，成本低 | 简单对话、快速响应 |

## 故障排查

### 问题 1: "GLM_API_KEY not set" 错误

**原因**: 环境变量未设置

**解决**:
```bash
export LLM_API_KEY=your-glm-api-key
# 或在 .env 文件中配置
```

### 问题 2: API调用失败 401 Unauthorized

**原因**: API密钥无效或过期

**解决**:
1. 检查API密钥是否正确
2. 确认密钥未过期
3. 检查账户余额是否充足

### 问题 3: 模型不在下拉列表中

**原因**: 前端配置未加载或缓存问题

**解决**:
1. 清除浏览器缓存
2. 重新编译前端: `cd frontend && npm run build`
3. 重启 Wails 开发服务器

### 问题 4: 流式响应不工作

**原因**: 网络或代理问题

**解决**:
1. 检查网络连接
2. 如果使用代理，确保支持 Server-Sent Events (SSE)
3. 查看后端日志获取详细错误信息

## 高级配置

### 多密钥管理

如果需要为不同提供商使用不同的API密钥，可以修改 `factory.go`:

```go
func (f *ProviderFactory) createGLMProvider(model string) (port.LLMProvider, error) {
	// 优先使用GLM专用密钥
	apiKey := os.Getenv("GLM_API_KEY")
	if apiKey == "" {
		// 回退到通用密钥
		apiKey = f.apiKey
	}
	if apiKey == "" {
		return nil, fmt.Errorf("GLM_API_KEY not set")
	}

	baseURL := "https://open.bigmodel.cn/api/paas/v4"
	return NewOpenAIProvider(apiKey, baseURL, model), nil
}
```

然后设置环境变量：
```bash
LLM_API_KEY=general-key       # 通用密钥
GLM_API_KEY=glm-specific-key  # GLM专用密钥
```

### 自定义Base URL

如果使用代理或企业部署：

```bash
export LLM_BASE_URL=https://your-proxy.com/api/v4
```

注意：当 `LLM_BASE_URL` 被设置时，可能影响其他提供商。建议为不同提供商分别管理URL。

## API文档参考

- [智谱AI官方文档](https://open.bigmodel.cn/dev/api)
- [GLM-4 模型介绍](https://open.bigmodel.cn/dev/howuse/model)
- [API调用示例](https://open.bigmodel.cn/dev/howuse/glm-4)

## 更新日志

### v0.1.0 (2026-01-28)
- ✅ 添加 GLM-4、GLM-4V、GLM-3-Turbo 支持
- ✅ 前端模型选择器集成 ZhipuAI 提供商
- ✅ 复用 OpenAI 兼容实现
- ✅ 配置文档和使用指南

## 后续计划

- [ ] 添加 GLM-4 Function Calling 支持
- [ ] GLM-4V 图像上传功能
- [ ] 智谱AI 特有参数配置（如 do_sample、temperature）
- [ ] Token 用量统计和成本计算
- [ ] GLM 模型切换的智能推荐

---

**实现团队**: AntiStudio Development Team
**联系方式**: 如有问题请提交 Issue
**许可证**: 根据项目主许可证
