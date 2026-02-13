# Wails Dev 前端不更新问题解决方案

## 问题描述

运行 `wails dev` 时看到的不是最新的前端界面。

## 原因分析

Wails 开发模式的工作流程：
1. `wails dev` 启动后端 Go 程序
2. 同时运行 `npm run dev` (Vite 开发服务器)
3. 前端通过 Vite 热更新

可能的问题：
- Vite 开发服务器未正确启动
- 端口冲突
- 缓存问题
- 需要先构建一次

## 解决方案

### 方案 1: 先构建前端（推荐）✅

```bash
# 1. 进入前端目录
cd frontend

# 2. 构建前端
npm run build

# 3. 返回根目录
cd ..

# 4. 启动 Wails
wails dev
```

### 方案 2: 清除缓存重启

```bash
# 1. 清除前端缓存
cd frontend
rm -rf node_modules/.vite
rm -rf dist

# 2. 重新构建
npm run build

# 3. 返回根目录启动
cd ..
wails dev
```

### 方案 3: 分步启动（调试用）

**终端 1 - 启动 Vite 开发服务器**:
```bash
cd frontend
npm run dev
```

等待看到：
```
VITE vX.X.X ready in XXX ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**终端 2 - 启动 Wails（不带前端）**:
```bash
wails dev
```

### 方案 4: 修改 Wails 配置（如果需要）

编辑 `wails.json`，确保配置正确：

```json
{
  "frontend:install": "npm install",
  "frontend:build": "npm run build",
  "frontend:dev:watcher": "npm run dev",
  "frontend:dev:serverUrl": "auto"
}
```

## 验证步骤

### 1. 检查 Vite 是否启动

运行 `wails dev` 后，在终端查看是否有：
```
[Frontend] VITE vX.X.X ready
[Frontend] Local: http://localhost:5173/
```

### 2. 检查浏览器

打开应用后，按 `F12` 查看开发者工具：
- 检查 Console 是否有错误
- 检查 Network 标签，资源是否加载成功
- 刷新页面看是否更新

### 3. 验证前端版本

在浏览器控制台输入：
```javascript
// 检查是否有新组件
console.log(document.querySelector('[class*="IconMenu"]'))
console.log(document.querySelector('[class*="PreviewPanel"]'))
```

## 常见问题

### Q1: 端口被占用

**错误**: `Port 5173 is already in use`

**解决**:
```bash
# 查找占用端口的进程
lsof -i :5173

# 杀死进程
kill -9 <PID>
```

### Q2: Vite 开发服务器不启动

**症状**: 终端没有 `[Frontend]` 相关日志

**解决**:
```bash
# 手动测试 Vite
cd frontend
npm run dev

# 如果报错，检查 node_modules
rm -rf node_modules
npm install
npm run dev
```

### Q3: 看到旧界面

**解决**:
```bash
# 1. 强制刷新浏览器
Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)

# 2. 清除 Wails 缓存
rm -rf build/

# 3. 重新启动
wails dev
```

### Q4: 修改代码后不更新

**原因**: Vite HMR 失败

**解决**:
```bash
# 停止 wails dev (Ctrl+C)
# 重新启动
wails dev
```

## 最佳实践

### 开发流程

1. **首次启动**:
```bash
cd frontend
npm install
npm run build
cd ..
wails dev
```

2. **修改代码后**:
- 前端代码：Vite 会自动热更新
- 后端代码：Wails 会自动重启
- 如果不生效，按 `Cmd+R` 刷新应用

3. **遇到问题时**:
```bash
# 停止所有
Ctrl+C

# 清理并重新构建
cd frontend
npm run build
cd ..
wails dev
```

## Wails 开发模式工作原理

```
┌─────────────────────────────────────┐
│         wails dev                   │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │  Go Backend  │  │  Vite Dev   │ │
│  │              │◄─┤  Server     │ │
│  │  :34115      │  │  :5173      │ │
│  └──────────────┘  └─────────────┘ │
│         │                 │         │
│         └────────┬────────┘         │
│                  │                  │
│           ┌──────▼──────┐          │
│           │   Browser   │          │
│           │   (WebView) │          │
│           └─────────────┘          │
└─────────────────────────────────────┘
```

- Go Backend: 监听 API 调用
- Vite Dev Server: 提供前端资源 + HMR
- Browser/WebView: 显示界面

## 推荐方案总结

### 快速解决（90%情况有效）

```bash
# 一条命令解决
cd frontend && npm run build && cd .. && wails dev
```

### 彻底解决

```bash
# 清理所有缓存
cd frontend
rm -rf node_modules/.vite dist
npm run build
cd ..
rm -rf build/
wails dev
```

## 后续开发建议

1. **每次改动前端代码**:
   - 小改动：Vite 自动更新
   - 大改动：手动刷新应用
   - 不更新：重新运行 `npm run build`

2. **添加新依赖后**:
```bash
cd frontend
npm install
npm run build
cd ..
wails dev
```

3. **修改配置文件后**:
```bash
# 必须重启
Ctrl+C
wails dev
```

## 检查清单

在报告问题前，请检查：

- [ ] 运行了 `cd frontend && npm run build`
- [ ] 看到 Vite 开发服务器启动日志
- [ ] 浏览器控制台无错误
- [ ] 尝试了强制刷新 (Cmd+Shift+R)
- [ ] 清除了缓存目录
- [ ] Node.js 版本 >= 14
- [ ] 端口 5173 未被占用

---

**更新日期**: 2026-01-28
**状态**: 解决方案文档
