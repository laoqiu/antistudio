# 快速启动指南 - 新布局系统 🚀

## 新布局预览

```
┌──┬────────────┬─────────────┐
│🎯│            │             │
│💬│   Agent    │   Preview   │
│🔧│   Chat     │   Panel     │
│⚡│   Area     │  (optional) │
│🤖│            │             │
│  │            │             │
│☀️│            │             │
│⚙️│            │             │
└──┴────────────┴─────────────┘
```

## 快速启动

```bash
# 1. 设置 API 密钥
export LLM_API_KEY=your-api-key

# 2. 启动应用
wails dev

# 3. 应用会自动打开（默认暗色主题）
```

## 界面说明

### 左侧 Icon Menu（64px）
- 点击图标切换不同功能
- 底部有主题切换按钮（☀️/🌙）

### 中间 Side Panel
- 显示当前选中功能的内容
- 默认显示 AI Agent 聊天界面

### 右侧 Preview Panel（可选）
- 点击输入框右上角可打开
- 包含多个 tabs
- 可随时关闭

## 主要功能

### 1. AI Agent 聊天 💬
1. 确保左侧 Agent 图标高亮
2. 在底部输入消息
3. 选择模型（12个可选）
4. 按 Enter 发送

### 2. 主题切换 ☀️/🌙
1. 点击左下角的太阳/月亮图标
2. 主题立即切换
3. 刷新页面主题保持

### 3. 模型配置 🤖
1. 点击左侧 Models 图标
2. 查看所有可用模型
3. 按提供商分组显示

### 4. Tools & Workflow（开发中）
- 点击对应图标查看占位页面
- 功能正在开发中

## 快捷键（规划中）

- `Cmd+K` - 快速切换模型
- `Cmd+B` - 切换侧边栏
- `Cmd+Shift+P` - 切换预览面板
- `Cmd+T` - 切换主题

## 支持的模型

### OpenAI (4个)
- gpt-4o, gpt-4-turbo, gpt-4, gpt-3.5-turbo

### DeepSeek (2个)
- deepseek-chat, deepseek-coder

### Anthropic (3个)
- claude-3-opus, claude-3-sonnet, claude-3-haiku

### ZhipuAI (3个)
- glm-4, glm-4v, glm-3-turbo

## 主题预览

### Dark Mode（默认）
- 黑色背景，舒适的夜间使用
- 低对比度，减少眼睛疲劳

### Light Mode
- 白色背景，清晰的日间使用
- 高对比度，更清晰的文字

## 故障排查

### 问题：界面显示空白
**解决**:
1. 刷新页面 (Cmd+R)
2. 清除缓存
3. 重新编译：`cd frontend && npx vite build`

### 问题：主题切换不生效
**解决**:
1. 检查浏览器控制台错误
2. 确认 localStorage 可用
3. 尝试手动刷新

### 问题：Icon Menu 不响应
**解决**:
1. 检查控制台 JavaScript 错误
2. 确认通过 `wails dev` 启动
3. 不要用 `npm run dev`

## 完整文档

详细信息请查看：
- `NEW_LAYOUT_COMPLETE.md` - 完整实现文档
- `DEBUG_FIRST_RUN.md` - 调试指南
- `GLM_INTEGRATION_GUIDE.md` - GLM 模型配置

---

**版本**: v0.2.0
**状态**: ✅ 可用
**更新**: 2026-01-28
