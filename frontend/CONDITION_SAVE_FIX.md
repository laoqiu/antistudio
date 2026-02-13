# 条件保存问题修复

## 问题描述

逻辑判断节点和循环迭代节点中，使用 ConditionBuilder 添加条件后，条件没有被正确保存。

## 问题原因

### 原因 1: onChange 在 useEffect 依赖项中

```typescript
// ❌ 问题代码
useEffect(() => {
    const expression = buildConditionString(group);
    onChange(expression);
}, [group, onChange]);  // onChange 在依赖项中
```

**问题**:
- `onChange` 是从父组件传入的函数
- 每次父组件重新渲染，`onChange` 都会被重新创建（新的引用）
- 导致 useEffect 被频繁触发
- 造成不必要的重新渲染和状态更新

### 原因 2: 外部 value 变化时没有同步

```typescript
// ❌ 问题代码
const [group, setGroup] = useState<ConditionGroup>(() => {
    return parseConditionString(value);
});
// 没有监听 value 的变化
```

**问题**:
- `useState` 的初始化函数只在组件挂载时执行一次
- 当切换到不同的节点时，`value` 变化了
- 但内部 `group` 状态没有同步更新
- 导致显示的是旧节点的条件

### 原因 3: 循环更新

```
1. 用户添加条件
   ↓
2. group 状态更新
   ↓
3. useEffect 检测到 group 变化
   ↓
4. 调用 onChange(expression)
   ↓
5. 父组件更新节点数据
   ↓
6. 触发重新渲染
   ↓
7. onChange 引用变化
   ↓
8. useEffect 再次触发
   ↓
9. 回到步骤 4，形成循环
```

## 解决方案

### 核心思路

使用 `useRef` 来存储函数引用和状态，避免不必要的 useEffect 触发。

### 修复后的代码

```typescript
const ConditionBuilder: React.FC<{
    value: string;
    onChange: (value: string) => void;
    availableReferences: string[];
    label?: string;
}> = ({ value, onChange, availableReferences, label }) => {
    const [group, setGroup] = useState<ConditionGroup>(() => {
        return parseConditionString(value);
    });

    // ✅ 使用 ref 存储 onChange，避免它在依赖项中
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // ✅ 使用 ref 跟踪最后一次发送给父组件的表达式
    const lastSentExpressionRef = useRef(value);

    // ✅ 监听外部 value 变化，同步到内部状态
    useEffect(() => {
        const currentExpression = buildConditionString(group);
        // 只在 value 真正从外部变化时才更新
        if (value !== currentExpression && value !== lastSentExpressionRef.current) {
            setGroup(parseConditionString(value));
            lastSentExpressionRef.current = value;
        }
    }, [value]);

    // ✅ 当 group 变化时调用 onChange
    useEffect(() => {
        const expression = buildConditionString(group);
        // 只在表达式实际变化时才调用 onChange
        if (expression !== lastSentExpressionRef.current) {
            lastSentExpressionRef.current = expression;
            onChangeRef.current(expression);
        }
    }, [group]);  // 不包含 onChange

    // ... 其余代码
};
```

## 修复详解

### 1. 使用 useRef 存储 onChange

```typescript
const onChangeRef = useRef(onChange);
useEffect(() => {
    onChangeRef.current = onChange;
}, [onChange]);
```

**优点**:
- `onChangeRef` 的引用永远不变
- `onChangeRef.current` 总是指向最新的 onChange 函数
- 可以在其他 useEffect 中使用 `onChangeRef.current()`，而不需要将 onChange 加入依赖项

### 2. 使用 useRef 跟踪最后发送的表达式

```typescript
const lastSentExpressionRef = useRef(value);
```

**作用**:
- 记录最后一次发送给父组件的表达式
- 用于判断是否需要更新（避免重复更新）
- 区分变化来源（外部 vs 内部）

### 3. 智能同步逻辑

#### 外部 → 内部（切换节点时）

```typescript
useEffect(() => {
    const currentExpression = buildConditionString(group);
    if (value !== currentExpression && value !== lastSentExpressionRef.current) {
        setGroup(parseConditionString(value));
        lastSentExpressionRef.current = value;
    }
}, [value]);
```

**判断条件**:
- `value !== currentExpression`: 外部值与当前内部状态不同
- `value !== lastSentExpressionRef.current`: 外部值不是我们自己刚发送的

**效果**:
- 只在真正切换节点时才更新内部状态
- 避免自己发送的更新又触发自己的状态更新

#### 内部 → 外部（用户编辑时）

```typescript
useEffect(() => {
    const expression = buildConditionString(group);
    if (expression !== lastSentExpressionRef.current) {
        lastSentExpressionRef.current = expression;
        onChangeRef.current(expression);
    }
}, [group]);
```

**判断条件**:
- `expression !== lastSentExpressionRef.current`: 表达式实际发生了变化

**效果**:
- 只在条件实际变化时才通知父组件
- 避免重复发送相同的值

## 数据流图

### 正确的数据流

```
用户添加条件
    ↓
setGroup (更新内部状态)
    ↓
useEffect 检测到 group 变化
    ↓
生成表达式 expression
    ↓
检查: expression !== lastSentExpressionRef.current
    ↓ (true)
更新 lastSentExpressionRef.current = expression
    ↓
调用 onChangeRef.current(expression)
    ↓
父组件更新节点数据
    ↓
React 重新渲染
    ↓
ConditionBuilder 接收新的 value
    ↓
useEffect 检测到 value 变化
    ↓
检查: value !== currentExpression && value !== lastSentExpressionRef.current
    ↓ (false, 因为 value == lastSentExpressionRef.current)
不执行更新，避免循环 ✅
```

### 切换节点的数据流

```
用户点击不同的节点
    ↓
ConfigPanel 接收新的 node
    ↓
useEffect 检测到 node.id 变化
    ↓
setLocalData({ ...node.data })
    ↓
ConditionBuilder 接收新的 value (来自新节点)
    ↓
useEffect 检测到 value 变化
    ↓
检查: value !== currentExpression && value !== lastSentExpressionRef.current
    ↓ (true, 这是真正的外部变化)
setGroup(parseConditionString(value))
更新 lastSentExpressionRef.current = value
    ↓
显示新节点的条件 ✅
```

## 测试场景

### 场景 1: 添加新条件

**操作步骤**:
1. 打开逻辑判断节点配置
2. 点击"添加条件"
3. 选择变量: `state.user_type`
4. 选择操作符: `==`
5. 输入值: `premium`
6. 关闭配置面板
7. 重新打开配置面板

**预期结果**:
- ✅ 条件被正确保存
- ✅ 重新打开时显示: `state.user_type == "premium"`

### 场景 2: 修改现有条件

**操作步骤**:
1. 已有条件: `state.score > 80`
2. 修改值为: `90`
3. 关闭配置面板
4. 重新打开配置面板

**预期结果**:
- ✅ 修改被正确保存
- ✅ 重新打开时显示: `state.score > 90`

### 场景 3: 添加多条件（AND）

**操作步骤**:
1. 添加条件 1: `state.user_type == "vip"`
2. 点击"添加条件"
3. 添加条件 2: `state.score > 80`
4. 逻辑保持 AND
5. 关闭配置面板
6. 重新打开配置面板

**预期结果**:
- ✅ 两个条件都被保存
- ✅ 显示: `state.user_type == "vip" && state.score > 80`

### 场景 4: 切换逻辑运算符

**操作步骤**:
1. 已有两个条件，AND 逻辑
2. 点击 AND 按钮，切换为 OR
3. 关闭配置面板
4. 重新打开配置面板

**预期结果**:
- ✅ 逻辑运算符被正确保存
- ✅ 显示: `state.user_type == "vip" || state.score > 80`

### 场景 5: 删除条件

**操作步骤**:
1. 已有两个条件
2. 删除第一个条件
3. 关闭配置面板
4. 重新打开配置面板

**预期结果**:
- ✅ 删除操作被正确保存
- ✅ 只显示剩余的一个条件

### 场景 6: 切换节点

**操作步骤**:
1. 配置节点 A 的条件: `state.x == "a"`
2. 切换到节点 B
3. 查看节点 B 的条件（应该是空或不同的）
4. 切换回节点 A
5. 查看节点 A 的条件

**预期结果**:
- ✅ 节点 A 的条件被保留: `state.x == "a"`
- ✅ 节点 B 不受影响
- ✅ 切换回节点 A 时，显示正确的条件

## 性能优化

### 减少不必要的渲染

**优化前**:
- 每次 onChange 引用变化都触发 useEffect
- 每次都调用父组件的 onChange
- 导致频繁的重新渲染

**优化后**:
- 只在表达式实际变化时才调用 onChange
- 使用 ref 避免不必要的依赖
- 大幅减少重新渲染次数

### 避免循环更新

**优化前**:
```
onChange → 父组件更新 → 子组件重新渲染 → useEffect 触发 → onChange → ...
```

**优化后**:
```
onChange → 父组件更新 → 子组件重新渲染 → 检查是否重复 → 停止 ✅
```

## 注意事项

### 1. 空条件处理

```typescript
function buildConditionString(group: ConditionGroup): string {
    return group.rules
        .map(rule => {
            if (!rule.variable || !rule.value) return '';  // 过滤空条件
            // ...
        })
        .filter(Boolean)  // 移除空字符串
        .join(separator);
}
```

**行为**:
- 如果用户添加了条件但没有填写完整，该条件不会被保存
- 这是预期行为，避免保存无效的条件

### 2. 初始化逻辑

```typescript
const [group, setGroup] = useState<ConditionGroup>(() => {
    return parseConditionString(value);
});
```

**注意**:
- `useState` 的初始化函数只执行一次
- 必须配合 useEffect 来同步外部 value 的变化

### 3. 引用相等性

```typescript
onChangeRef.current === onChange  // 可能为 false
onChangeRef.current()  // 但调用的是最新的 onChange
```

**理解**:
- ref 存储的是引用，引用可能会变化
- 但通过 `.current` 总能访问到最新的值

## 总结

通过这次修复，我们实现了：

✅ **正确保存** - 条件添加后能够正确保存到节点数据
✅ **避免循环** - 消除了 useEffect 的循环触发
✅ **性能优化** - 减少了不必要的重新渲染
✅ **状态同步** - 外部和内部状态正确同步
✅ **节点切换** - 切换节点时正确加载各自的条件

---

**修复完成时间**: 2026-02-11
**影响文件**: `frontend/components/workspace/WorkflowEditor.tsx`
**核心改动**: ConditionBuilder 组件的 useEffect 依赖项优化
**代码行数**: ~20 行修改
