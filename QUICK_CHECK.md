# 快速检查清单 ⚡

## 修复完成 ✅

- ✅ 移除阻塞式加载
- ✅ UI 立即显示
- ✅ 添加调试日志
- ✅ 前端重新编译

## 现在启动应用

### 1. 设置 API 密钥
```bash
export LLM_API_KEY=your-api-key-here
```

### 2. 启动
```bash
wails dev
```

### 3. 预期看到
✅ 黑色背景的聊天界面
✅ 左侧侧边栏（"+ New Chat" 按钮）
✅ 中间聊天区域（"Start a conversation" 提示）
✅ 底部输入框和模型选择器

## 测试第一条消息

1. **选择模型** - 点击输入框旁边的模型选择器
2. **输入消息** - 输入：`你好`
3. **发送** - 按 Enter
4. **查看控制台** - 按 F12 打开开发者工具

### 控制台应该显示：
```
[useAgentAPI] Calling Chat API with request: {...}
[useAgentAPI] Chat API response: {...}
```

## 如果出问题

### 问题：UI 空白
- 刷新页面 (Cmd+R)
- 查看控制台错误

### 问题：无法选择模型
- 刷新页面
- 检查控制台错误

### 问题：发送消息无响应
1. 检查环境变量：`echo $LLM_API_KEY`
2. 查看控制台日志
3. 查看后端日志（wails dev 终端）

## 详细调试

查看：`DEBUG_FIRST_RUN.md`

---

**状态**: ✅ 可以测试
**时间**: 2026-01-28
