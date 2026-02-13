# AntiStudio 快速启动 🚀

## 最简单的方法（推荐）✨

### Mac/Linux

```bash
./dev.sh
```

### Windows

```bash
dev.bat
```

这个脚本会自动：
1. ✅ 构建前端
2. ✅ 启动 Vite 开发服务器
3. ✅ 启动 Wails 应用

## 手动启动

### 方法 1: 标准流程

```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 返回根目录
cd ..

# 3. 启动
wails dev
```

### 方法 2: 首次启动

```bash
# 1. 安装前端依赖
cd frontend
npm install

# 2. 构建
npm run build

# 3. 返回根目录启动
cd ..
wails dev
```

## 验证启动成功

启动后应该看到：

```
[Frontend] VITE v5.4.21 ready in XXX ms
[Frontend] ➜ Local: http://localhost:5173/
[Wails] App started
```

应用窗口应该显示：
- ✅ 左侧 IconMenu（64px 宽）
- ✅ 中间 Agent 聊天界面
- ✅ 右侧 PreviewPanel（圆角边框）
- ✅ 默认暗色主题

## 常见问题

### 问题 1: 看到旧界面

**解决**:
```bash
# 停止应用 (Ctrl+C)
cd frontend
npm run build
cd ..
wails dev
```

### 问题 2: 端口被占用

**错误**: `Port 5173 is already in use`

**解决**:
```bash
# Mac/Linux
lsof -i :5173
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### 问题 3: Vite 不启动

**解决**:
```bash
cd frontend
rm -rf node_modules/.vite
npm run build
cd ..
wails dev
```

### 问题 4: 改代码不更新

**小改动**: 刷新应用 `Cmd+R`
**大改动**: 重新 `npm run build` + `wails dev`

## 开发流程

### 修改前端代码

1. 编辑 `frontend/src/` 下的文件
2. Vite 会自动热更新（HMR）
3. 如果不更新，按 `Cmd+R` 刷新

### 修改后端代码

1. 编辑 Go 文件
2. Wails 会自动重新编译并重启
3. 稍等片刻即可看到更新

### 添加新依赖

**前端**:
```bash
cd frontend
npm install <package>
npm run build
cd ..
wails dev
```

**后端**:
```bash
go get <package>
go mod tidy
wails dev
```

## 环境要求

- ✅ Go 1.21+
- ✅ Node.js 14+
- ✅ Wails v2
- ✅ npm 或 yarn

## 设置 API 密钥

```bash
# 根据使用的模型设置
export LLM_API_KEY=your-api-key

# 然后启动
./dev.sh
```

## 停止应用

按 `Ctrl+C` 停止

## 清理缓存

```bash
# 清理前端缓存
cd frontend
rm -rf node_modules/.vite dist

# 清理后端缓存
cd ..
rm -rf build/

# 重新构建
cd frontend
npm run build
cd ..
wails dev
```

## 生产构建

```bash
# 构建可执行文件
wails build

# 输出在 build/bin/ 目录
```

## 调试技巧

### 查看前端日志

打开应用后按 `F12` 或 `Cmd+Option+I`

### 查看后端日志

终端中直接显示 Go 的日志输出

### 分步启动（高级）

**终端 1 - 前端**:
```bash
cd frontend
npm run dev
```

**终端 2 - 后端**:
```bash
wails dev
```

## 更多信息

- `WAILS_DEV_FIX.md` - 详细故障排查
- `NEW_LAYOUT_COMPLETE.md` - 布局系统文档
- `DEBUG_FIRST_RUN.md` - 首次运行调试

---

**快速链接**:
- 问题？查看 `WAILS_DEV_FIX.md`
- 功能？查看 `NEW_LAYOUT_COMPLETE.md`
- 配置？查看 `.env.example`

🎉 祝开发愉快！
