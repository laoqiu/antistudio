# 输出格式选择器优化

## 优化概述

将文本生成节点的输出格式选择从两个按钮改为下拉选择器，并在单个输出模式（Text）下不显示添加按钮。

## 用户需求

1. **下拉选择器**: 将输出格式的两个按钮改为 select 下拉菜单
2. **按钮位置**: select 应该在输出变量列表之前
3. **隐藏添加按钮**: 当选择 Text (单个输出) 模式时，不显示"添加"按钮

## 实现方案

### 1. VariableList 组件增强

**添加 hideAddButton 属性**:
```typescript
const VariableList: React.FC<{
    title: string;
    vars?: Variable[];
    onChange: (vars: Variable[]) => void;
    fixedType?: 'string' | 'number' | 'image' | 'video' | null;
    allowedTypes?: string[];
    availableReferences?: string[];
    isInput?: boolean;
    hideAddButton?: boolean;  // 新增属性
}> = ({ ..., hideAddButton = false }) => {
```

**条件渲染添加按钮**:
```typescript
<div className="flex items-center justify-between">
    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{title}</label>
    {!hideAddButton && (  // 只在 hideAddButton 为 false 时显示
        <button onClick={addVar} className="text-[10px] text-blue-500 hover:underline flex items-center gap-1">
            <Icons.Plus className="w-3 h-3" /> 添加
        </button>
    )}
</div>
```

### 2. 输出格式选择器改造

**优化前 (两个按钮)**:
```typescript
<div className="grid grid-cols-2 gap-2 mb-3">
    <button onClick={() => { ... }}>
        JSON (多个输出)
    </button>
    <button onClick={() => { ... }}>
        Text (单个输出)
    </button>
</div>
```

**优化后 (下拉选择器)**:
```typescript
<select
    value={localData.outputFormat || 'json'}
    onChange={(e) => {
        const format = e.target.value as 'json' | 'text';
        handleChange('outputFormat', format);
        if (format === 'text') {
            // 切换到 text 模式，使用单个固定输出
            handleChange('outputs', [{ name: 'text', type: 'string' }]);
        } else if (!localData.outputs || localData.outputs.length === 0) {
            // 切换到 JSON 模式，确保至少有一个输出
            handleChange('outputs', [{ name: 'result', type: 'string' }]);
        }
    }}
    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
>
    <option value="json">JSON (多个输出)</option>
    <option value="text">Text (单个输出)</option>
</select>
```

### 3. 输出变量显示逻辑

**JSON 模式** (可添加多个输出):
```typescript
{(localData.outputFormat || 'json') === 'json' ? (
    <VariableList
        title="输出变量 (JSON 结构)"
        vars={localData.outputs}
        onChange={(v) => handleChange('outputs', v)}
        fixedType="string"
        // 不传 hideAddButton，默认显示添加按钮
    />
) : (
    // Text 模式...
)}
```

**Text 模式** (固定单个输出):
```typescript
<div className="space-y-2">
    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">输出变量 (纯文本)</label>
    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
            <Icons.Type className="w-3 h-3" />
            <span className="font-mono">text: string</span>
        </div>
        <p className="text-[10px] text-zinc-400 mt-1">固定输出一个名为 "text" 的字符串变量</p>
    </div>
</div>
```

## 效果对比

### 优化前

```
┌──────────────────────────────────┐
│ 输出格式                         │
│ ┌────────┐  ┌────────┐          │
│ │ JSON   │  │ Text   │  ← 两个按钮
│ └────────┘  └────────┘          │
├──────────────────────────────────┤
│ 输出变量          [+ 添加]      │
│ ...                              │
└──────────────────────────────────┘
```

### 优化后

```
┌──────────────────────────────────┐
│ 输出格式                         │
│ ┌──────────────────────────────┐ │
│ │ JSON (多个输出)       ▼     │ │ ← 下拉选择器
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ 输出变量 (JSON)   [+ 添加]     │ ← JSON 模式显示添加按钮
│ ...                              │
└──────────────────────────────────┘

或者

┌──────────────────────────────────┐
│ 输出格式                         │
│ ┌──────────────────────────────┐ │
│ │ Text (单个输出)       ▼     │ │ ← 下拉选择器
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ 输出变量 (纯文本)               │ ← Text 模式无添加按钮
│ ┌─────────────────────┐          │
│ │ 📝 text: string     │          │
│ │ 固定输出一个名为    │          │
│ │ "text" 的字符串变量 │          │
│ └─────────────────────┘          │
└──────────────────────────────────┘
```

## UI/UX 改进

### 1. 更清晰的选择界面

**优化前**:
- 两个并排的按钮
- 需要点击来切换
- 占用较多水平空间

**优化后**:
- 单个下拉选择器
- 统一的表单风格
- 节省界面空间
- 符合标准的表单设计模式

### 2. 模式关联更紧密

**JSON 模式**:
- 标题显示: `输出变量 (JSON 结构)`
- 显示 VariableList 组件
- 显示"添加"按钮
- 允许添加多个输出变量

**Text 模式**:
- 标题显示: `输出变量 (纯文本)`
- 显示静态信息卡片
- 没有"添加"按钮
- 固定为单个 `text: string` 输出

### 3. 视觉一致性

所有配置项现在都使用统一的样式：
```typescript
className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
```

与其他选择器（如模型选择）保持一致的视觉风格。

## 交互流程

### 切换到 JSON 模式

```
1. 用户打开下拉菜单
   ↓
2. 选择 "JSON (多个输出)"
   ↓
3. handleChange('outputFormat', 'json')
   ↓
4. 检查是否有输出变量
   ↓ (如果没有)
5. 自动添加默认输出: [{ name: 'result', type: 'string' }]
   ↓
6. 显示 VariableList 组件（带添加按钮）
   ↓
7. 用户可以添加/删除/编辑输出变量
```

### 切换到 Text 模式

```
1. 用户打开下拉菜单
   ↓
2. 选择 "Text (单个输出)"
   ↓
3. handleChange('outputFormat', 'text')
   ↓
4. 强制设置输出为: [{ name: 'text', type: 'string' }]
   ↓
5. 显示静态信息卡片（无添加按钮）
   ↓
6. 用户无法修改输出配置（固定为 text: string）
```

## 代码改动位置

### 文件
`frontend/components/workspace/WorkflowEditor.tsx`

### 改动点

1. **VariableList 组件签名** (~861 行)
   - 添加 `hideAddButton?: boolean` 属性
   - 默认值: `false`

2. **VariableList 添加按钮渲染** (~886 行)
   - 添加条件判断: `{!hideAddButton && ( ... )}`
   - 只在 `hideAddButton` 为 `false` 时渲染按钮

3. **llm-text 配置面板** (~1066-1124 行)
   - 移除两个按钮的 `grid` 布局
   - 替换为 `<select>` 元素
   - 更新 onChange 逻辑
   - 保持相同的状态管理逻辑

## 技术细节

### 状态管理

```typescript
// 默认值处理
value={localData.outputFormat || 'json'}

// 类型转换
const format = e.target.value as 'json' | 'text';

// 条件更新
if (format === 'text') {
    // 强制单个输出
    handleChange('outputs', [{ name: 'text', type: 'string' }]);
} else if (!localData.outputs || localData.outputs.length === 0) {
    // JSON 模式需要至少一个输出
    handleChange('outputs', [{ name: 'result', type: 'string' }]);
}
```

### 样式一致性

Select 元素使用与其他表单控件相同的 Tailwind 类：
```typescript
className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
```

### 暗色模式支持

所有样式都包含 `dark:` 前缀变体，确保在暗色模式下正常显示。

## 测试场景

### 场景 1: 切换输出格式

**操作步骤**:
1. 打开文本生成节点配置
2. 点击"输出格式"下拉菜单
3. 选择 "Text (单个输出)"
4. 观察输出变量区域

**预期结果**:
- ✅ 下拉菜单正确切换
- ✅ 输出变量显示固定的 `text: string`
- ✅ 没有"添加"按钮
- ✅ 显示说明文字

### 场景 2: JSON 模式多输出

**操作步骤**:
1. 选择 "JSON (多个输出)" 格式
2. 点击"添加"按钮
3. 添加多个输出变量
4. 关闭并重新打开配置

**预期结果**:
- ✅ 显示"添加"按钮
- ✅ 可以添加多个输出
- ✅ 输出被正确保存
- ✅ 重新打开时显示所有输出

### 场景 3: 默认行为

**操作步骤**:
1. 创建新的文本生成节点
2. 首次打开配置面板
3. 查看输出格式默认值

**预期结果**:
- ✅ 默认为 "JSON (多个输出)"
- ✅ 默认有一个 `result: string` 输出
- ✅ 显示"添加"按钮

### 场景 4: 格式切换数据处理

**操作步骤**:
1. JSON 模式下添加 3 个输出变量
2. 切换到 Text 模式
3. 再切换回 JSON 模式

**预期结果**:
- ✅ 切换到 Text 时，输出变量被替换为固定的 `text`
- ✅ 切换回 JSON 时，会有一个默认的 `result` 输出
- ⚠️ 注意: 之前的 3 个输出变量会丢失（这是预期行为）

## 优点总结

### 用户体验

✅ **统一的交互模式** - 与其他配置项使用相同的选择器样式
✅ **减少误操作** - Text 模式下不显示添加按钮，避免用户尝试添加
✅ **清晰的模式区分** - 两种模式的界面显示明显不同
✅ **节省空间** - 下拉菜单比两个按钮更紧凑

### 代码质量

✅ **可扩展性** - VariableList 的 hideAddButton 属性可用于其他场景
✅ **类型安全** - 使用 TypeScript 类型断言确保正确性
✅ **一致性** - 样式和行为与其他表单控件保持一致
✅ **可维护性** - 逻辑清晰，易于理解和修改

## 未来增强

1. **格式切换确认**: 当从 JSON 切换到 Text 时，如果已有多个输出，可以显示确认对话框
2. **自定义 Text 输出名**: 允许用户自定义 Text 模式下的输出变量名
3. **格式预览**: 在选择器旁边显示当前格式的示例输出
4. **更多格式**: 支持更多输出格式（如 Markdown, HTML 等）

## 总结

通过这次优化，我们成功实现了：

✅ **下拉选择器** - 用 select 替代了两个按钮
✅ **条件按钮显示** - Text 模式下不显示添加按钮
✅ **视觉一致性** - 与其他表单控件风格统一
✅ **清晰的模式区分** - JSON 和 Text 模式有明显的界面差异

这为用户提供了更加直观和统一的配置体验！

---

**优化完成时间**: 2026-02-12
**影响文件**: `frontend/components/workspace/WorkflowEditor.tsx`
**核心改动**: VariableList 添加 hideAddButton 属性，输出格式改为 select
**代码行数**: ~30 行修改
