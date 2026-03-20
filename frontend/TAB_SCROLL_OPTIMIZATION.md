# Tab 滚动优化

## 优化概述

优化预览界面（WorkspacePanel）的 tab 栏滚动体验，通过左右滚动按钮替代滚动条，提升用户体验。

## 问题描述

**优化前**:
- Tab 过多时出现水平滚动条
- 滚动条占用空间，影响美观
- 用户需要手动拖动滚动条

## 解决方案

### 1. 隐藏滚动条

**添加 CSS 类** (`index.html`):
```css
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;      /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;              /* Chrome, Safari, Opera */
}
```

**应用到 Tab 容器**:
```tsx
<div
  ref={tabsContainerRef}
  className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide"
  onScroll={checkScroll}
>
```

### 2. 添加滚动按钮

**状态管理**:
```tsx
const tabsContainerRef = useRef<HTMLDivElement>(null);
const [canScrollLeft, setCanScrollLeft] = useState(false);
const [canScrollRight, setCanScrollRight] = useState(false);
```

**检查滚动状态**:
```tsx
const checkScroll = useCallback(() => {
  const container = tabsContainerRef.current;
  if (!container) return;

  const { scrollLeft, scrollWidth, clientWidth } = container;
  setCanScrollLeft(scrollLeft > 0);
  setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
}, []);
```

**滚动函数**:
```tsx
const scrollTabs = useCallback((direction: 'left' | 'right') => {
  const container = tabsContainerRef.current;
  if (!container) return;

  const scrollAmount = 200;
  container.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth'
  });
}, []);
```

**监听滚动和窗口大小变化**:
```tsx
useEffect(() => {
  checkScroll();
  const container = tabsContainerRef.current;
  if (!container) return;

  const handleScroll = () => checkScroll();
  container.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', handleScroll);

  return () => {
    container.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleScroll);
  };
}, [tabs, checkScroll]);
```

### 3. UI 实现

**左滚动按钮**:
```tsx
{canScrollLeft && (
  <button
    onClick={() => scrollTabs('left')}
    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
    title="向左滚动"
  >
    <Icons.ArrowLeft className="w-3.5 h-3.5" />
  </button>
)}
```

**Tab 容器**:
```tsx
<div
  ref={tabsContainerRef}
  className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide"
  onScroll={checkScroll}
>
  {tabs.map(tab => (
    <div
      key={tab.id}
      className="... shrink-0"  {/* 添加 shrink-0 防止 tab 被压缩 */}
    >
      {/* Tab 内容 */}
    </div>
  ))}
</div>
```

**右滚动按钮**:
```tsx
{canScrollRight && (
  <button
    onClick={() => scrollTabs('right')}
    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
    title="向右滚动"
  >
    <Icons.ArrowRight className="w-3.5 h-3.5" />
  </button>
)}
```

## 布局结构

### 优化前

```
┌────────────────────────────────────────────────┐
│ [Tab1] [Tab2] [Tab3] [Tab4] [Tab5]... [+]     │ ← 有滚动条
└────────────────────────────────────────────────┘
                                    ↕ 滚动条
```

### 优化后

```
┌────────────────────────────────────────────────┐
│ [<] [Tab1] [Tab2] [Tab3] [Tab4]... [>] [+]    │ ← 无滚动条
└────────────────────────────────────────────────┘
  ↑                                   ↑
左按钮                              右按钮
(动态显示)                         (动态显示)
```

## 技术细节

### 1. 滚动状态检测

```typescript
const { scrollLeft, scrollWidth, clientWidth } = container;

// 左边是否可滚动
canScrollLeft = scrollLeft > 0;

// 右边是否可滚动
canScrollRight = scrollLeft < scrollWidth - clientWidth - 1;
```

**解释**:
- `scrollLeft`: 当前滚动位置
- `scrollWidth`: 内容总宽度
- `clientWidth`: 可见区域宽度
- `-1`: 容错处理，避免浮点数精度问题

### 2. 平滑滚动

```typescript
container.scrollBy({
  left: scrollAmount,
  behavior: 'smooth'  // CSS 原生平滑滚动
});
```

### 3. 防止 Tab 被压缩

```tsx
<div className="... shrink-0">
  {/* Tab 内容保持最小宽度 */}
</div>
```

### 4. 响应式监听

```typescript
// 监听三种变化
1. tabs 数组变化 - 重新检查滚动状态
2. 容器滚动事件 - 更新按钮显示状态
3. 窗口大小变化 - 重新计算可滚动性
```

## 交互流程

### 场景 1: 初始加载

```
1. 组件挂载
   ↓
2. checkScroll() 检查初始状态
   ↓
3. 如果 tabs 超出可见区域
   ↓
4. canScrollRight = true
   ↓
5. 显示右滚动按钮
```

### 场景 2: 点击右滚动按钮

```
1. 用户点击 [>]
   ↓
2. scrollTabs('right')
   ↓
3. container.scrollBy({ left: 200, behavior: 'smooth' })
   ↓
4. 触发 onScroll 事件
   ↓
5. checkScroll() 更新状态
   ↓
6. 如果到达右边界: canScrollRight = false
   ↓
7. 隐藏右按钮，显示左按钮
```

### 场景 3: 新增 Tab

```
1. 用户点击 [+] 新建 tab
   ↓
2. tabs 数组更新
   ↓
3. useEffect 检测到 tabs 变化
   ↓
4. checkScroll() 重新计算
   ↓
5. 更新按钮显示状态
```

### 场景 4: 窗口大小变化

```
1. 用户调整窗口大小
   ↓
2. window 'resize' 事件触发
   ↓
3. checkScroll() 重新计算
   ↓
4. 窗口变宽: 可能不需要滚动
   ↓
5. canScrollLeft = false, canScrollRight = false
   ↓
6. 隐藏所有滚动按钮
```

## 代码改动

### 文件 1: index.html

**添加 CSS 类**:
```css
/* Hide Scrollbar */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

### 文件 2: WorkspacePanel.tsx

**改动点**:

1. **新增状态和 ref** (~21 行):
```typescript
const tabsContainerRef = useRef<HTMLDivElement>(null);
const [canScrollLeft, setCanScrollLeft] = useState(false);
const [canScrollRight, setCanScrollRight] = useState(false);
```

2. **新增滚动函数** (~40 行):
```typescript
const checkScroll = useCallback(() => { ... }, []);
const scrollTabs = useCallback((direction: 'left' | 'right') => { ... }, []);
```

3. **新增 useEffect** (~15 行):
```typescript
useEffect(() => {
  checkScroll();
  // 监听滚动和 resize
}, [tabs, checkScroll]);
```

4. **修改 UI 结构** (~50 行):
```tsx
{canScrollLeft && <LeftButton />}
<TabsContainer ref={tabsContainerRef} className="scrollbar-hide">
  {tabs.map(...)}
</TabsContainer>
{canScrollRight && <RightButton />}
```

5. **Tab 添加 shrink-0**:
```tsx
<div className="... shrink-0">
```

## 优点总结

### 用户体验

✅ **美观**: 无滚动条，界面更简洁
✅ **直观**: 按钮清晰指示滚动方向
✅ **平滑**: CSS 原生平滑滚动动画
✅ **智能**: 按钮根据滚动状态自动显示/隐藏

### 技术优势

✅ **性能**: 使用原生 scrollBy，无需额外库
✅ **兼容性**: 支持所有现代浏览器
✅ **响应式**: 自动适配窗口大小变化
✅ **可维护**: 代码逻辑清晰，易于理解

## 浏览器兼容性

### scrollBy 方法
- ✅ Chrome 45+
- ✅ Firefox 36+
- ✅ Safari 10.1+
- ✅ Edge 12+

### CSS scrollbar-width
- ✅ Firefox 64+
- ⚠️ Chrome/Safari: 需要 `::-webkit-scrollbar`
- ✅ Edge 79+

### CSS smooth scrolling
- ✅ Chrome 61+
- ✅ Firefox 36+
- ✅ Safari 15.4+
- ✅ Edge 79+

## 测试场景

### 测试 1: 少量 Tab (不需要滚动)

**初始状态**: 2 个 tab
**预期**:
- ✅ 不显示左右按钮
- ✅ Tab 正常显示
- ✅ 无滚动条

### 测试 2: 大量 Tab (需要滚动)

**操作**: 新建 10 个 tab
**预期**:
- ✅ 显示右滚动按钮 [>]
- ✅ 不显示左滚动按钮 [<]
- ✅ Tab 容器无滚动条

### 测试 3: 点击右滚动按钮

**操作**: 点击 [>]
**预期**:
- ✅ 容器向右滚动 200px
- ✅ 平滑滚动动画
- ✅ 左按钮出现
- ✅ 到达末尾时右按钮消失

### 测试 4: 点击左滚动按钮

**操作**: 点击 [<]
**预期**:
- ✅ 容器向左滚动 200px
- ✅ 平滑滚动动画
- ✅ 右按钮出现
- ✅ 到达开头时左按钮消失

### 测试 5: 调整窗口大小

**操作**: 拖动浏览器窗口边缘
**预期**:
- ✅ 窗口变宽: 可能不需要滚动，按钮消失
- ✅ 窗口变窄: 可能需要滚动，按钮出现
- ✅ 按钮状态实时更新

### 测试 6: 关闭 Tab

**操作**: 关闭多个 tab
**预期**:
- ✅ Tab 减少
- ✅ 可能不再需要滚动
- ✅ 按钮状态正确更新

## 未来增强

1. **键盘快捷键**: 支持方向键滚动
2. **鼠标滚轮**: 支持横向滚轮滚动
3. **触摸滑动**: 优化移动端触摸体验
4. **滚动指示器**: 添加滚动进度指示
5. **自动滚动**: 新建 tab 时自动滚动到可见区域

## 性能优化

### 1. 使用 useCallback

```typescript
const checkScroll = useCallback(() => { ... }, []);
const scrollTabs = useCallback((direction) => { ... }, []);
```
避免每次渲染创建新函数。

### 2. 事件监听清理

```typescript
return () => {
  container.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', handleScroll);
};
```
防止内存泄漏。

### 3. 条件渲染

```typescript
{canScrollLeft && <LeftButton />}
{canScrollRight && <RightButton />}
```
按钮不显示时不渲染，节省 DOM 节点。

## 总结

通过这次优化，我们实现了：

✅ **隐藏滚动条** - 更美观的 tab 栏
✅ **滚动按钮** - 直观的滚动控制
✅ **自动检测** - 智能显示/隐藏按钮
✅ **平滑滚动** - 流畅的用户体验
✅ **响应式** - 适配各种屏幕尺寸

为用户提供了类似浏览器 tab 栏的专业体验！

---

**优化完成时间**: 2026-02-12
**影响文件**:
- `index.html` - 添加 scrollbar-hide CSS 类
- `components/workspace/WorkspacePanel.tsx` - 实现滚动逻辑和 UI

**代码行数**: ~80 行新增
