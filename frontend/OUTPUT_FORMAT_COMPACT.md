# 输出格式选择器紧凑化设计

## 优化概述

将输出格式选择器与添加按钮设计在同一行，Text 模式下添加按钮禁用而非隐藏，参数名保持可编辑。

## 用户需求

1. **格式选择器与添加按钮同一行**: 节省垂直空间，更紧凑
2. **Text 模式添加按钮禁用**: 不是隐藏，而是显示为禁用状态
3. **Text 模式限制数量**: 只能有一个输出变量
4. **参数名可编辑**: Text 模式下参数名依然可以修改

## 实现方案

### 1. VariableList 组件增强

**新增属性**:
```typescript
const VariableList: React.FC<{
    title: string;
    vars?: Variable[];
    onChange: (vars: Variable[]) => void;
    fixedType?: 'string' | 'number' | 'image' | 'video' | null;
    allowedTypes?: string[];
    availableReferences?: string[];
    isInput?: boolean;
    hideAddButton?: boolean;
    disableAddButton?: boolean;  // 新增: 禁用添加按钮
    formatSelector?: React.ReactNode;  // 新增: 格式选择器插槽
}> = ({ ..., disableAddButton = false, formatSelector }) => {
```

**标题行布局**:
```typescript
<div className="flex items-center justify-between">
    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {title}
    </label>
    <div className="flex items-center gap-2">
        {formatSelector}  {/* 格式选择器 */}
        {!hideAddButton && (
            <button
                onClick={addVar}
                disabled={disableAddButton}  {/* 可禁用 */}
                className={`text-[10px] flex items-center gap-1 ${
                    disableAddButton
                        ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                        : 'text-blue-500 hover:underline'
                }`}
            >
                <Icons.Plus className="w-3 h-3" /> 添加
            </button>
        )}
    </div>
</div>
```

### 2. 格式选择器设计

**紧凑样式**:
```typescript
formatSelector={
    <>
        <span className="text-[10px] text-zinc-400">格式:</span>
        <select
            value={localData.outputFormat || 'json'}
            onChange={(e) => { /* ... */ }}
            className="w-20 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5 text-[10px] outline-none focus:border-blue-500"
        >
            <option value="json">JSON</option>
            <option value="text">Text</option>
        </select>
    </>
}
```

**特点**:
- 宽度: `w-20` (80px)
- 字体: `text-[10px]` (10px)
- 标签: "格式:" 前缀
- 位置: 标题行右侧，添加按钮左侧

### 3. 输出变量统一处理

**不再区分 JSON/Text 显示**:
```typescript
{/* 统一使用 VariableList */}
<VariableList
    title="输出变量"
    vars={localData.outputs}
    onChange={(v) => {
        // Text 模式下限制为 1 个
        if ((localData.outputFormat || 'json') === 'text' && v.length > 1) {
            handleChange('outputs', [v[0]]);
        } else {
            handleChange('outputs', v);
        }
    }}
    fixedType="string"
    disableAddButton={(localData.outputFormat || 'json') === 'text' && (localData.outputs?.length || 0) >= 1}
    formatSelector={/* ... */}
/>
```

### 4. 格式切换逻辑

**切换到 Text 模式**:
```typescript
if (format === 'text') {
    // 保留第一个输出或创建默认输出
    newData.outputs = localData.outputs && localData.outputs.length > 0
        ? [localData.outputs[0]]  // 保留第一个，参数名保持
        : [{ name: 'text', type: 'string' }];  // 默认名称
}
```

**切换到 JSON 模式**:
```typescript
else if (!localData.outputs || localData.outputs.length === 0) {
    newData.outputs = [{ name: 'result', type: 'string' }];
}
```

### 5. Text 模式提示

```typescript
{(localData.outputFormat || 'json') === 'text' && (
    <p className="text-[10px] text-zinc-400 mt-1 ml-1">
        💡 Text 模式下只能有一个输出变量
    </p>
)}
```

## UI 效果

### JSON 模式

```
┌──────────────────────────────────────────┐
│ 输出变量  格式: [JSON ▼]  [+ 添加]     │ ← 一行显示
├──────────────────────────────────────────┤
│ ├─ result: string               [×]     │
│ ├─ status: string               [×]     │
│ └─ count: string                [×]     │
└──────────────────────────────────────────┘
```

### Text 模式 (有输出)

```
┌──────────────────────────────────────────┐
│ 输出变量  格式: [Text ▼]  + 添加        │ ← 添加按钮禁用(灰色)
├──────────────────────────────────────────┤
│ └─ response: string             [×]     │ ← 参数名可编辑
│ 💡 Text 模式下只能有一个输出变量         │
└──────────────────────────────────────────┘
```

### Text 模式 (无输出)

```
┌──────────────────────────────────────────┐
│ 输出变量  格式: [Text ▼]  [+ 添加]     │ ← 添加按钮可用(蓝色)
├──────────────────────────────────────────┤
│ (空)                                     │
│ 💡 Text 模式下只能有一个输出变量         │
└──────────────────────────────────────────┘
```

## 交互流程

### 场景 1: JSON 模式添加多个输出

```
1. 用户选择 JSON 格式
   ↓
2. 添加按钮可用(蓝色)
   ↓
3. 点击添加，新增输出变量
   ↓
4. 可以继续添加更多
   ↓
5. 每个变量名都可以编辑
```

### 场景 2: 切换到 Text 模式

```
1. JSON 模式下有 3 个输出
   ↓
2. 选择 Text 格式
   ↓
3. 自动保留第一个输出，删除其他
   ↓
4. 添加按钮变为禁用(灰色)
   ↓
5. 显示提示信息
   ↓
6. 第一个输出的参数名依然可以修改
```

### 场景 3: Text 模式删除输出

```
1. Text 模式下有 1 个输出
   ↓
2. 点击删除按钮
   ↓
3. 输出被删除
   ↓
4. 添加按钮变为可用(蓝色)
   ↓
5. 可以重新添加 1 个输出
```

### 场景 4: Text 模式编辑参数名

```
1. Text 模式下有输出: text: string
   ↓
2. 点击参数名输入框
   ↓
3. 修改为: response
   ↓
4. 保存后变为: response: string
   ↓
5. 参数名自定义成功
```

## 技术细节

### 1. 添加按钮状态控制

```typescript
disableAddButton={
    (localData.outputFormat || 'json') === 'text' &&  // Text 模式
    (localData.outputs?.length || 0) >= 1              // 已有 1 个输出
}
```

### 2. 添加按钮样式

```typescript
className={`text-[10px] flex items-center gap-1 ${
    disableAddButton
        ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'  // 禁用样式
        : 'text-blue-500 hover:underline'                        // 正常样式
}`}
```

### 3. 数量限制逻辑

```typescript
onChange={(v) => {
    // Text 模式下限制为 1 个
    if ((localData.outputFormat || 'json') === 'text' && v.length > 1) {
        handleChange('outputs', [v[0]]);  // 只保留第一个
    } else {
        handleChange('outputs', v);        // JSON 模式无限制
    }
}}
```

### 4. 格式切换时保留数据

```typescript
if (format === 'text') {
    // 保留第一个输出(包括自定义的参数名)
    newData.outputs = localData.outputs && localData.outputs.length > 0
        ? [localData.outputs[0]]
        : [{ name: 'text', type: 'string' }];
}
```

## 代码改动位置

### 文件
`frontend/components/workspace/WorkflowEditor.tsx`

### 改动点

1. **VariableList 组件签名** (~861 行)
   - 添加 `disableAddButton?: boolean`
   - 添加 `formatSelector?: React.ReactNode`

2. **VariableList 标题行** (~886 行)
   - 添加 formatSelector 插槽
   - 添加按钮支持 disabled 状态
   - 禁用时显示灰色和不可点击样式

3. **llm-text 配置** (~1069-1130 行)
   - 统一使用 VariableList
   - 通过 formatSelector 属性传入格式选择器
   - 通过 disableAddButton 控制按钮状态
   - 添加 Text 模式提示信息

## 优点总结

### 用户体验

✅ **空间节省** - 格式选择器和添加按钮在同一行，节省垂直空间
✅ **状态清晰** - 添加按钮禁用而非隐藏，用户能看到按钮存在但不可用
✅ **灵活性高** - Text 模式下参数名可自定义，不强制为 "text"
✅ **反馈及时** - 禁用状态有明显的视觉反馈(灰色 + 不可点击光标)
✅ **提示友好** - 显示提示信息说明 Text 模式的限制

### 代码质量

✅ **组件复用** - 两种模式统一使用 VariableList，减少代码重复
✅ **插槽设计** - formatSelector 插槽设计灵活，可扩展
✅ **状态一致** - 统一的状态管理逻辑，避免不一致
✅ **可维护性** - 逻辑集中，易于理解和修改

## 对比总结

### 优化前

**问题**:
- 格式选择器独占一行，占用空间大
- Text 模式用静态卡片显示，与 JSON 模式不统一
- 参数名固定为 "text"，无法自定义

**界面**:
```
输出格式
┌──────────────────────┐
│ JSON (多个输出)  ▼  │  ← 独占一行
└──────────────────────┘

输出变量 (JSON 结构)  [+ 添加]
├─ result: string

或

输出变量 (纯文本)  (无添加按钮)
┌────────────────────┐
│ 📝 text: string   │  ← 静态显示
└────────────────────┘
```

### 优化后

**改进**:
- 格式选择器与添加按钮同一行，紧凑设计
- Text 和 JSON 模式使用相同的 VariableList 组件
- Text 模式参数名可自定义
- 添加按钮禁用而非隐藏，状态清晰

**界面**:
```
输出变量  格式: [JSON ▼]  [+ 添加]  ← 一行搞定
├─ result: string

或

输出变量  格式: [Text ▼]  + 添加   ← 添加按钮禁用
└─ response: string                  ← 可编辑
💡 Text 模式下只能有一个输出变量
```

## 测试场景

### 场景 1: 格式选择器位置

**操作**: 打开文本生成节点配置
**预期**:
- ✅ "输出变量"标题在左侧
- ✅ "格式:" 选择器在右侧
- ✅ "添加"按钮紧挨着格式选择器
- ✅ 三者在同一行

### 场景 2: JSON 模式多输出

**操作**:
1. 选择 JSON 格式
2. 添加 3 个输出变量
3. 编辑参数名

**预期**:
- ✅ 添加按钮始终可用(蓝色)
- ✅ 可以添加多个输出
- ✅ 每个参数名都可以编辑

### 场景 3: Text 模式限制

**操作**:
1. 选择 Text 格式
2. 已有 1 个输出
3. 尝试点击添加按钮

**预期**:
- ✅ 添加按钮显示为禁用(灰色)
- ✅ 鼠标悬停显示不可点击光标
- ✅ 点击无响应
- ✅ 显示提示信息

### 场景 4: Text 模式参数名编辑

**操作**:
1. Text 模式下有输出: text: string
2. 修改参数名为: response
3. 保存

**预期**:
- ✅ 参数名可以编辑
- ✅ 修改后保存成功
- ✅ 重新打开显示 response: string

### 场景 5: 格式切换保留数据

**操作**:
1. JSON 模式下有 3 个输出: result, status, count
2. 切换到 Text
3. 再切换回 JSON

**预期**:
- ✅ 切换到 Text 时保留第一个 (result)
- ✅ 切换回 JSON 时只有 1 个输出 (result)
- ⚠️ 其他输出已丢失(预期行为)

### 场景 6: Text 模式删除重新添加

**操作**:
1. Text 模式有 1 个输出
2. 删除该输出
3. 点击添加按钮

**预期**:
- ✅ 删除后添加按钮变为可用(蓝色)
- ✅ 可以点击添加
- ✅ 添加后按钮再次禁用(灰色)

## 未来增强

1. **Tooltip 提示**: 鼠标悬停在禁用的添加按钮上时，显示 tooltip 说明原因
2. **动画效果**: 格式切换时添加平滑的过渡动画
3. **更多格式**: 支持 Markdown、HTML 等其他输出格式
4. **格式图标**: 在格式选项前加上图标，更直观

## 总结

通过这次优化，我们实现了：

✅ **紧凑布局** - 格式选择器和添加按钮在同一行
✅ **状态可见** - 添加按钮禁用而非隐藏，状态清晰
✅ **灵活编辑** - Text 模式下参数名可自定义
✅ **统一组件** - 两种模式使用相同的 VariableList
✅ **数量控制** - Text 模式自动限制为 1 个输出
✅ **友好提示** - 显示模式限制说明

这为用户提供了更加紧凑、直观和灵活的配置体验！

---

**优化完成时间**: 2026-02-12
**影响文件**: `frontend/components/workspace/WorkflowEditor.tsx`
**核心改动**: VariableList 添加 formatSelector 和 disableAddButton
**代码行数**: ~40 行修改
