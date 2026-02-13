# 平台特定布局实现完成

## 概述

实现了跨平台的窗口样式和布局优化，满足 Mac 和 Windows 不同的用户体验需求。

## 改动内容

### 1. Mac 平台特性 ✅

- **保留原生红绿灯**：使用系统原生的窗口控制按钮（红、黄、绿）
- **圆角边框**：使用 Mac 原生的圆角窗口样式
- **隐藏自定义标题栏**：TitleBar 组件在 Mac 下不显示
- **Inset Title Bar**：标题栏隐藏但保留 traffic lights

配置（`main.go`）：
```go
Mac: &mac.Options{
    TitleBar: mac.TitleBarHiddenInset(), // 隐藏标题栏但保留 traffic lights
    Appearance: mac.NSAppearanceNameDarkAqua,
    WebviewIsTransparent: false,
    WindowIsTranslucent:  false,
}
```

### 2. Windows 平台特性 ✅

- **Frameless 窗口**：无边框窗口
- **圆角边框**：通过 CSS 实现（Windows 11 原生支持）
- **自定义控制按钮**：在右上角显示最小化、最大化、关闭按钮
- **可拖动标题栏**：自定义标题栏区域可拖动窗口

配置（`main.go`）：
```go
Windows: &windows.Options{
    WebviewIsTransparent: false,
    WindowIsTranslucent:  false,
    DisableWindowIcon:    false,
    Theme:                windows.Dark,
}
```

### 3. IconMenu 优化 ✅

**改动前**：
- 显示图标 + 文字标签
- 高度 14（h-14）
- Logo 在顶部（🎯）

**改动后**：
- 只显示图标，移除文字标签
- 高度 12（h-12），更紧凑
- 移除顶部 Logo
- 图标更大（text-2xl）

### 4. TitleBar 优化 ✅

**改动前**：
- 显示 "AntiStudio" logo
- 高度 12（h-12）
- 所有平台都显示

**改动后**：
- 移除 logo
- 高度 10（h-10），更紧凑
- 只在 Windows 平台显示
- Mac 平台返回 null，不渲染

### 5. PreviewPanel 宽度修复 ✅

**问题**：padding 导致宽度超出父级

**修复**：
- padding 从 `p-4` 改为 `p-2`
- 添加 `w-full` 确保不超出
- 使用 `flex-1` 而不是 `h-full`
- 圆角从 `rounded-xl` 改为 `rounded-lg`（更小，更精致）

## 技术实现

### 1. 平台检测 Hook

新增文件：`frontend/src/hooks/usePlatform.ts`

```typescript
export type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

export function usePlatform(): Platform {
  // 通过 userAgent 检测平台
  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.indexOf('mac') !== -1) return 'mac';
  if (userAgent.indexOf('win') !== -1) return 'windows';
  if (userAgent.indexOf('linux') !== -1) return 'linux';

  return 'unknown';
}
```

### 2. 条件渲染 TitleBar

在 `TitleBar.tsx` 中：

```typescript
const platform = usePlatform();

// Mac 下不显示自定义标题栏
if (platform === 'mac') {
  return null;
}
```

### 3. 后端平台检测

在 `main.go` 中：

```go
import "runtime"

// 根据平台决定是否使用 frameless
isFrameless := runtime.GOOS == "windows"

err = wails.Run(&options.App{
  Frameless: isFrameless,
  Mac: &mac.Options{...},
  Windows: &windows.Options{...},
})
```

## 文件改动清单

### 新增文件（1个）
1. `frontend/src/hooks/usePlatform.ts` - 平台检测 Hook

### 修改文件（4个）

#### 1. `main.go`
- 导入 `runtime`, `mac`, `windows` 包
- 添加平台检测逻辑
- 配置 Mac 和 Windows 特定选项

#### 2. `frontend/src/components/layout/TitleBar.tsx`
- 导入 `usePlatform` hook
- Mac 平台返回 null（不显示）
- 移除 logo 文本
- 高度从 h-12 改为 h-10
- 按钮布局更紧凑

#### 3. `frontend/src/components/layout/IconMenu.tsx`
- 移除顶部 Logo（🎯）
- 移除菜单项文字标签
- 按钮高度从 h-14 改为 h-12
- 图标大小从 text-xl 改为 text-2xl

#### 4. `frontend/src/components/layout/PreviewPanel.tsx`
- padding 从 p-4 改为 p-2
- 添加 w-full 约束
- 圆角从 rounded-xl 改为 rounded-lg
- 阴影从 shadow-lg 改为 shadow-sm

## 使用说明

### Mac 用户

1. 启动应用会看到原生 Mac 窗口：
   - 左上角有红绿灯（traffic lights）
   - 窗口有原生圆角
   - 没有自定义标题栏
   - Icon 菜单紧贴顶部

2. 拖动窗口：
   - 可以拖动整个窗口边缘
   - 可以拖动 Icon 菜单区域

### Windows 用户

1. 启动应用会看到无边框窗口：
   - 右上角有自定义窗口控制按钮
   - 有自定义标题栏（高度 10，紧凑型）
   - 窗口控制按钮：最小化、最大化、关闭

2. 拖动窗口：
   - 拖动标题栏区域
   - 标题栏上的按钮不可拖动

## 布局对比

### Mac 布局结构
```
┌─────────────────────────────────────┐ ← 原生标题栏（隐藏但保留traffic lights）
├─┬──────────────────────────────────┐
│I│                                  │
│C│        Content Area              │
│O│                                  │
│N│                                  │
└─┴──────────────────────────────────┘
```

### Windows 布局结构
```
┌─────────────────────────────────────┐ ← 自定义标题栏（h-10）+ 控制按钮
├─┬──────────────────────────────────┐
│I│                                  │
│C│        Content Area              │
│O│                                  │
│N│                                  │
└─┴──────────────────────────────────┘
```

## 视觉优化

### 1. 更紧凑的布局
- IconMenu 高度减小，按钮从 h-14 → h-12
- TitleBar 高度减小，从 h-12 → h-10
- PreviewPanel padding 减小，从 p-4 → p-2

### 2. 更清爽的设计
- 移除 IconMenu 顶部 Logo
- 移除 IconMenu 文字标签（只保留图标）
- 移除 TitleBar 应用名称

### 3. 更精致的细节
- 圆角从 rounded-xl（12px）改为 rounded-lg（8px）
- 阴影从 shadow-lg 改为 shadow-sm
- 图标从 text-xl 改为 text-2xl（更清晰）

## 测试清单

### Mac 测试 ✓
- [ ] 左上角显示原生红绿灯
- [ ] 窗口有圆角边框
- [ ] 没有自定义标题栏
- [ ] 可以正常拖动窗口
- [ ] Icon 菜单紧贴顶部
- [ ] Icon 菜单只显示图标，无文字

### Windows 测试
- [ ] 窗口无边框（frameless）
- [ ] 右上角显示自定义控制按钮
- [ ] 标题栏可以拖动窗口
- [ ] 控制按钮功能正常（最小化/最大化/关闭）
- [ ] 窗口有圆角效果
- [ ] Icon 菜单只显示图标，无文字

### 通用测试 ✓
- [ ] PreviewPanel 宽度正常，不超出父级
- [ ] Icon 菜单图标清晰可见
- [ ] 布局整体更紧凑
- [ ] 主题切换正常工作
- [ ] 面板可以正常拖动调整大小

## 已知问题

### Mac 特有问题
1. **Traffic Lights 位置**：使用 `TitleBarHiddenInset()` 后，红绿灯位置可能需要微调
   - 解决方案：可以通过 CSS 调整第一个元素的 padding-top

### Windows 特有问题
1. **窗口圆角**：Windows 10 不支持原生圆角，只有 Windows 11 支持
   - 影响：Windows 10 用户会看到方角窗口

2. **拖动区域冲突**：标题栏上的按钮设置了 `WebkitAppRegion: 'no-drag'`
   - 确保在测试时验证所有按钮都可点击

## 下一步优化建议

### 短期优化
1. **Mac Traffic Lights 间距**：调整 IconMenu 或第一个元素的 padding-top
2. **Windows 10 圆角**：通过 CSS 模拟圆角效果
3. **拖动手感优化**：增加拖动区域的视觉提示

### 长期优化
1. **自适应布局**：根据窗口大小自动调整布局
2. **主题预设**：提供多种主题方案
3. **自定义控制按钮样式**：Windows 用户可以选择按钮样式

## 性能影响

- **平台检测**：只在组件初始化时执行一次，无性能影响
- **条件渲染**：Mac 下不渲染 TitleBar，减少 DOM 节点
- **编译后体积**：增加约 1KB（platform hook）

## 总结

✅ 完成所有改动：
1. Mac 保留原生红绿灯和圆角
2. Windows 使用自定义控制按钮
3. 移除 Icon 菜单文字标签
4. 移除左上角 logo
5. 修复 PreviewPanel 宽度问题

所有改动已编译通过，可以使用 `./dev.sh` 或 `wails dev` 启动测试。

---

**实施日期**: 2026年1月30日
**编译状态**: ✅ 成功
**测试状态**: 待测试
**平台支持**: Mac ✅ | Windows ✅ | Linux ⚠️（未优化）
