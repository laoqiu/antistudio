# 节点高度自适应优化

## 优化概述

解决逻辑判断节点和循环迭代节点的输出 handle 超出节点高度的问题，实现动态高度自适应。

## 问题分析

### 原有问题

**逻辑判断节点 (DecisionNode)** 和 **循环迭代节点 (IterationNode)** 都使用了 `BaseNode` 组件，存在以下问题：

1. **固定 Handle 位置**: 输出 handle 位置硬编码为 `top-8` 和 `top-20`
2. **内容动态变化**: 当配置了 inputs/outputs 时，节点会显示 IO 指示器，增加节点高度
3. **位置不匹配**: 节点高度增加，但 handle 位置不变，导致 handle 位置不合理

### 具体表现

```
优化前 (有 IO 指示器时):
┌─────────────────┐
│ 逻辑判断        │
├─────────────────┤
│ 未命名节点      │
│ If condition    │
│ ━━━━━━━━━━━━━━ │
│ In: 2  Out: 1   │  ← IO 指示器增加高度
└─────────────────┘
         ↑ True (top-8, 位置偏上)
         ↓ False (top-20, 位置偏上)
```

## 解决方案

### 核心思路

参考 `BranchNode` 的实现，将 `DecisionNode` 和 `IterationNode` 改为自定义渲染：

1. **动态高度计算**: 根据是否有 IO 指示器计算节点高度
2. **动态 Handle 定位**: 根据节点高度居中定位两个 handle
3. **保持间距**: 两个 handle 之间保持固定间距

### 高度计算公式

```typescript
// 检测是否有 IO 指示器
const hasIO = (data.inputs?.length || 0) > 0 || (data.outputs?.length || 0) > 0;

// 基础高度
const baseHeight = 100;

// IO 指示器高度
const ioHeight = hasIO ? 35 : 0;

// 总高度
const dynamicHeight = baseHeight + ioHeight;
```

### Handle 位置计算

```typescript
// Handle 之间的间距
const handleSpacing = 36;

// 起始位置（垂直居中，然后向上偏移一半间距）
const startY = (dynamicHeight / 2) - (handleSpacing / 2);

// 第一个 handle: startY
// 第二个 handle: startY + handleSpacing
```

## 实现细节

### 1. 逻辑判断节点 (DecisionNode)

**优化前**:
```typescript
const DecisionNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => (
  <BaseNode
    icon={Icons.Decision}
    colorClass="yellow"
    typeLabel="逻辑判断"
    // ...
    hideDefaultHandles={true}
  >
    {/* Fixed position handles */}
    <div className="absolute -right-3 top-8">True</div>
    <div className="absolute -right-3 top-20">False</div>
  </BaseNode>
);
```

**优化后**:
```typescript
const DecisionNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  // 动态计算高度
  const hasIO = (data.inputs?.length || 0) > 0 || (data.outputs?.length || 0) > 0;
  const baseHeight = 100;
  const ioHeight = hasIO ? 35 : 0;
  const dynamicHeight = baseHeight + ioHeight;

  // 动态计算 handle 位置
  const handleSpacing = 36;
  const startY = (dynamicHeight / 2) - (handleSpacing / 2);

  return (
    <div style={{ minHeight: `${dynamicHeight}px` }}>
      {/* 节点内容 */}

      {/* 动态定位的 handles */}
      <div style={{ top: `${startY}px` }}>True</div>
      <div style={{ top: `${startY + handleSpacing}px` }}>False</div>
    </div>
  );
};
```

**特性**:
- ✅ 两个输出: **True** (绿色) 和 **False** (红色)
- ✅ 动态高度: 基础 100px + IO 35px (如果有)
- ✅ 居中对齐: handles 垂直居中分布
- ✅ 固定间距: 36px

### 2. 循环迭代节点 (IterationNode)

**优化前**:
```typescript
const IterationNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => (
  <BaseNode
    icon={Icons.Iteration}
    colorClass="pink"
    typeLabel="循环迭代"
    // ...
    hideDefaultHandles={true}
  >
    {/* Fixed position handles */}
    <div className="absolute -right-3 top-8">Loop</div>
    <div className="absolute -right-3 top-20">Done</div>
  </BaseNode>
);
```

**优化后**:
```typescript
const IterationNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  // 动态计算高度（同 DecisionNode）
  const hasIO = (data.inputs?.length || 0) > 0 || (data.outputs?.length || 0) > 0;
  const baseHeight = 100;
  const ioHeight = hasIO ? 35 : 0;
  const dynamicHeight = baseHeight + ioHeight;

  // 动态计算 handle 位置
  const handleSpacing = 36;
  const startY = (dynamicHeight / 2) - (handleSpacing / 2);

  return (
    <div style={{ minHeight: `${dynamicHeight}px` }}>
      {/* 节点内容 */}

      {/* 动态定位的 handles */}
      <div style={{ top: `${startY}px` }}>Loop</div>
      <div style={{ top: `${startY + handleSpacing}px` }}>Done</div>
    </div>
  );
};
```

**特性**:
- ✅ 两个输出: **Loop** (粉色) 和 **Done** (灰色)
- ✅ 动态高度: 基础 100px + IO 35px (如果有)
- ✅ 居中对齐: handles 垂直居中分布
- ✅ 固定间距: 36px

## 效果对比

### 无 IO 指示器

**优化前**:
```
┌─────────────────┐
│ 逻辑判断        │ → True (top-8, 固定)
├─────────────────┤
│ 判断用户等级    │
│ If user == vip  │ → False (top-20, 固定)
└─────────────────┘
高度: ~100px
True 位置: 8px
False 位置: 20px
```

**优化后**:
```
┌─────────────────┐
│ 逻辑判断        │
├─────────────────┤ → True (32px, 居中上方)
│ 判断用户等级    │
│ If user == vip  │ → False (68px, 居中下方)
└─────────────────┘
高度: 100px
True 位置: (100/2 - 36/2) = 32px
False 位置: 32 + 36 = 68px
```

### 有 IO 指示器

**优化前**:
```
┌─────────────────┐
│ 逻辑判断        │ → True (8px, 太靠上)
├─────────────────┤
│ 判断用户等级    │
│ If user == vip  │
│ ━━━━━━━━━━━━━━ │ → False (20px, 太靠上)
│ In: 2  Out: 1   │
└─────────────────┘
高度: ~135px
True 位置: 8px (不合理)
False 位置: 20px (不合理)
```

**优化后**:
```
┌─────────────────┐
│ 逻辑判断        │
├─────────────────┤
│ 判断用户等级    │ → True (49.5px, 居中上方)
│ If user == vip  │
│ ━━━━━━━━━━━━━━ │
│ In: 2  Out: 1   │ → False (85.5px, 居中下方)
└─────────────────┘
高度: 135px
True 位置: (135/2 - 36/2) = 49.5px
False 位置: 49.5 + 36 = 85.5px
```

## 技术细节

### 高度自适应逻辑

```typescript
// 1. 检测内容
const hasIO = (data.inputs?.length || 0) > 0 || (data.outputs?.length || 0) > 0;

// 2. 计算总高度
const baseHeight = 100;      // 基础高度（标题 + 内容）
const ioHeight = hasIO ? 35 : 0;  // IO 指示器高度
const dynamicHeight = baseHeight + ioHeight;

// 3. 应用到容器
<div style={{ minHeight: `${dynamicHeight}px` }}>
```

### Handle 居中对齐算法

```typescript
// 目标: 两个 handle 垂直居中，间距固定

const handleSpacing = 36;  // 两个 handle 之间的间距

// 计算第一个 handle 的起始位置
// 公式: (总高度 / 2) - (间距 / 2)
const startY = (dynamicHeight / 2) - (handleSpacing / 2);

// 两个 handle 位置
const trueHandleY = startY;              // 第一个
const falseHandleY = startY + handleSpacing;  // 第二个
```

### 视觉效果

```
  dynamicHeight = 135px
  ┌─────────────────────┐
  │                     │
  │                     │
  │    startY = 49.5    │ ← True Handle
  │         ↓           │
  │    [   18px   ]     │ ← 间距 36px 的一半
  │    [  中心线  ]     │ ← 67.5px (总高度的一半)
  │    [   18px   ]     │
  │         ↓           │
  │  startY + 36 = 85.5 │ ← False Handle
  │                     │
  │                     │
  └─────────────────────┘
```

## 统一的节点高度策略

现在所有特殊节点都实现了动态高度：

| 节点类型 | Handle 数量 | 高度计算策略 |
|---------|------------|-------------|
| **分支流程** | 动态（n个分支） | `60 + branchCount * 28` |
| **逻辑判断** | 固定（2个） | `100 + (hasIO ? 35 : 0)` |
| **循环迭代** | 固定（2个） | `100 + (hasIO ? 35 : 0)` |

## 代码改动

### 文件位置
`frontend/components/workspace/WorkflowEditor.tsx`

### 改动节点
1. **DecisionNode** (第 192-265 行)
   - 从 BaseNode 改为自定义渲染
   - 添加动态高度计算
   - 添加动态 handle 定位

2. **IterationNode** (第 337-410 行)
   - 从 BaseNode 改为自定义渲染
   - 添加动态高度计算
   - 添加动态 handle 定位

### 代码行数
- 删除: ~50 行 (旧的 BaseNode 使用)
- 新增: ~150 行 (自定义渲染实现)
- 净增加: ~100 行

## 测试场景

### 场景 1: 无 IO 配置
```
节点配置:
- 无 inputs
- 无 outputs

预期:
- 节点高度: 100px
- True handle: 32px
- False handle: 68px
```

### 场景 2: 有 inputs
```
节点配置:
- 2 个 inputs
- 无 outputs

预期:
- 节点高度: 135px
- True handle: 49.5px
- False handle: 85.5px
- 显示 "In: 2"
```

### 场景 3: 有 inputs 和 outputs
```
节点配置:
- 2 个 inputs
- 1 个 output

预期:
- 节点高度: 135px
- True handle: 49.5px
- False handle: 85.5px
- 显示 "In: 2  Out: 1"
```

### 场景 4: 长条件文本截断
```
节点配置:
- condition: "state.user_type == 'premium' && state.score > 80 && state.active == true"

预期:
- 条件显示: "If state.user_type == 'premiu..."
- 超过 30 字符自动截断
- 不影响节点高度
```

## 视觉效果示意

### 逻辑判断节点

```
无 IO:                    有 IO:
┌─────────────┐          ┌─────────────┐
│ 逻辑判断    │          │ 逻辑判断    │
├─────────────┤          ├─────────────┤
│ VIP判断     │ → T      │ VIP判断     │
│ If user..   │          │ If user..   │
│             │ → F      │ ━━━━━━━━━━ │ → T
└─────────────┘          │ In: 2       │
  100px                  │             │ → F
                         └─────────────┘
                           135px
```

### 循环迭代节点

```
无 IO:                    有 IO:
┌─────────────┐          ┌─────────────┐
│ 循环迭代    │          │ 循环迭代    │
├─────────────┤          ├─────────────┤
│ 批量处理    │ → Loop   │ 批量处理    │
│ Max: 50次   │          │ Max: 50次   │
│             │ → Done   │ ━━━━━━━━━━ │ → Loop
└─────────────┘          │ In: 1       │
  100px                  │             │ → Done
                         └─────────────┘
                           135px
```

## 优化效果

### 用户体验
- ✅ **Handle 对齐**: 输出 handle 始终与节点内容居中对齐
- ✅ **视觉平衡**: 节点高度随内容自适应，保持美观
- ✅ **统一体验**: 所有特殊节点都使用动态高度策略

### 技术优势
- ✅ **可维护性**: 逻辑清晰，易于理解和修改
- ✅ **可扩展性**: 可以轻松添加更多动态内容
- ✅ **性能优化**: 避免固定位置导致的视觉错位

## 未来增强

1. **更多内容支持**: 支持更多类型的动态内容（如错误提示、警告等）
2. **动画过渡**: 高度变化时添加平滑动画
3. **自定义间距**: 允许用户自定义 handle 间距
4. **智能布局**: 当 handle 过多时自动调整布局

## 总结

通过这次优化，我们成功解决了逻辑判断和循环迭代节点的高度自适应问题：

✅ **动态高度** - 节点高度根据内容自动调整
✅ **居中对齐** - 输出 handle 始终保持居中和固定间距
✅ **统一策略** - 所有特殊节点使用相同的自适应理念
✅ **视觉优化** - 提升整体工作流的视觉一致性

这为构建复杂工作流提供了更加稳定和美观的节点基础！

---

**优化完成时间**: 2026-02-11
**影响文件**: `frontend/components/workspace/WorkflowEditor.tsx`
**优化节点**: DecisionNode, IterationNode
**代码净增加**: ~100 行
