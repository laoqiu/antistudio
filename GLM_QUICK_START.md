# GLM模型快速开始指南 🚀

## 已添加的模型

✅ **GLM-4** - 综合性能强大
✅ **GLM-4V** - 支持视觉能力
✅ **GLM-3-Turbo** - 快速高效

## 快速配置（3步）

### 1️⃣ 设置API密钥

```bash
export LLM_API_KEY=your-glm-api-key-here
```

或在项目根目录创建 `.env` 文件：
```
LLM_API_KEY=your-glm-api-key-here
```

### 2️⃣ 启动应用

```bash
wails dev
```

### 3️⃣ 使用GLM模型

1. 在聊天界面点击模型选择器
2. 选择 **ZhipuAI** 提供商下的模型
3. 开始对话！

## 修改的文件

### 后端
- ✅ `/internal/infra/llm/factory.go`
  - 添加 `isGLMModel()` 函数
  - 添加 `createGLMProvider()` 方法
  - 在支持模型列表中添加 GLM 模型

### 前端
- ✅ `/frontend/src/config/models.ts`
  - 添加 ZhipuAI 提供商类型
  - 添加 3 个 GLM 模型配置

## 技术细节

- **API端点**: https://open.bigmodel.cn/api/paas/v4
- **兼容性**: 使用 OpenAI 兼容格式
- **实现**: 复用 `OpenAIProvider`
- **流式支持**: ✅ 完全支持

## 验证状态

- ✅ Go 代码编译通过
- ✅ TypeScript 类型检查通过
- ✅ 前端模型选择器集成完成
- ✅ 后端路由配置完成

## 获取API密钥

访问: https://open.bigmodel.cn/
注册/登录 → 控制台 → 创建API密钥

## 需要帮助？

查看完整文档: `GLM_INTEGRATION_GUIDE.md`

---

**状态**: ✅ 已完成并可用
**日期**: 2026-01-28
