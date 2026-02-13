# 工作流编辑器优化总结

## 优化概述

针对 LangGraph 后端集成和用户交互体验，对工作流配置界面进行了全面优化。

## 解决的问题

### 1. ✅ 分支节点高度自适应问题

**问题描述**: 当分支节点有多个输出时，使用固定高度导致输出 handle 显示到节点容器外部。

**解决方案**:
- 将 `BranchNode` 从使用 `BaseNode` 改为自定义渲染
- 根据分支数量动态计算节点高度: `minHeight = 60 + branchCount * 28px`
- 每个分支 handle 的垂直位置也相应调整

**代码位置**: `WorkflowEditor.tsx:218-268`

```typescript
const dynamicHeight = Math.max(minHeight, 60 + branchCount * heightPerBranch);
```

### 2. ✅ 条件表达式参数引用不明确

**问题描述**:
- 分支流程的条件表达式不知道从哪引用参数
- 循环迭代的条件也不知道可用变量来源
- 决策节点同样缺少变量提示

**解决方案**:
新增 `ConditionInput` 组件 (311-406行)，提供:
- 🔍 智能变量引用下拉建议
- ⌨️ 输入时自动显示匹配的变量
- 📋 可用变量预览列表
- 🎯 点击变量快速插入到条件表达式

**特性**:
```typescript
// 自动过滤匹配的变量
const filteredReferences = availableReferences.filter(ref => {
    const lastWord = beforeCursor.match(/[\w.]*$/)?.[0] || '';
    return ref.toLowerCase().includes(lastWord.toLowerCase());
});
```

### 3. ✅ LangGraph 风格的状态管理支持

**问题描述**: 前端变量引用系统需要与 LangGraph 的状态管理理念对齐。

**解决方案**:
优化 `availableReferences` 计算逻辑 (517-580行):

#### 全局状态引用
```typescript
refs.push('state.input');       // 初始输入
refs.push('state.messages');    // 消息历史
refs.push('state.context');     // 共享上下文
```

#### 节点类型感知的输出
根据不同节点类型自动推断输出变量:
- **文本生成**: `{nodeId}.text`, `{nodeId}.tokens`
- **图片生成**: `{nodeId}.image`, `{nodeId}.url`
- **视频生成**: `{nodeId}.video`, `{nodeId}.url`
- **工具调用**: `{nodeId}.result`, `{nodeId}.success`
- **循环迭代**: `{nodeId}.loop_count`, `{nodeId}.iteration_result`

#### 循环专用变量
```typescript
if (node.type === 'iteration') {
    refs.push('loop.index');        // 当前迭代索引
    refs.push('loop.count');        // 已完成迭代次数
    refs.push('loop.prev_result');  // 上次迭代结果
}
```

#### 人性化标签引用
```typescript
// 除了 nodeId，还支持使用节点标签
if (n.data.label) {
    const cleanLabel = n.data.label.replace(/\s+/g, '_').toLowerCase();
    refs.push(`${cleanLabel}.result`);
}
```

## 配置界面增强

### 决策节点 (Decision Node)
- ✅ 使用 `ConditionInput` 组件
- ✅ 显示可用变量引用
- ✅ 添加帮助文本说明条件逻辑

### 分支节点 (Branch Node)
- ✅ 改进分支列表 UI
- ✅ 每个分支条件配置更清晰
- ✅ 添加分支路由说明面板
- ✅ 显示所有可用变量引用

**分支路由逻辑**:
```
按顺序评估条件表达式 → 第一个满足的分支执行 → 建议添加默认分支
```

### 循环迭代节点 (Iteration Node)
- ✅ 使用 `ConditionInput` 组件
- ✅ 最大循环次数配置
- ✅ 循环变量管理
- ✅ 详细的循环说明面板

**循环迭代说明**:
- 每次循环重新评估条件
- 可使用 `loop.index` 访问当前迭代次数
- 循环体内的输出传递到下一次迭代

## 技术亮点

### 1. 动态节点高度计算
```typescript
const dynamicHeight = Math.max(minHeight, 60 + branchCount * heightPerBranch);
```

### 2. 智能变量建议
- 实时过滤匹配变量
- 支持点记法 (dot notation)
- 自动完成部分输入的变量名

### 3. 类型感知的输出推断
根据节点类型自动生成合理的输出变量名，无需手动配置。

### 4. 去重处理
```typescript
return [...new Set(refs)]; // 移除重复引用
```

## 与 LangGraph 后端对接建议

### 状态管理映射
```python
# Python (LangGraph)
class WorkflowState(TypedDict):
    input: str
    messages: list
    context: dict
    # 节点输出会自动添加到 state
```

### 条件路由实现
```python
def route_condition(state: WorkflowState) -> str:
    # 前端条件表达式: "node1.score > 80"
    # 后端评估
    if state.get("node1", {}).get("score", 0) > 80:
        return "high_score_branch"
    return "default_branch"
```

### 循环迭代实现
```python
def should_continue(state: WorkflowState) -> bool:
    # 前端条件: "loop.index < items.length"
    return state.get("loop", {}).get("index", 0) < len(state.get("items", []))
```

## 使用示例

### 示例 1: 条件分支
```
决策节点条件: state.user_type == "premium"
- True 分支 → 高级功能节点
- False 分支 → 标准功能节点
```

### 示例 2: 循环处理列表
```
循环节点配置:
- 最大循环: 100
- 条件: loop.index < state.items.length
- 循环体: 处理单个 item
```

### 示例 3: 多路分支
```
分支节点:
- Branch 1: category == "tech" → 技术内容处理
- Branch 2: category == "business" → 商业内容处理
- Default: true → 通用内容处理
```

## 未来改进方向

1. **表达式验证**: 实时验证条件表达式语法
2. **可视化调试**: 显示变量当前值和表达式评估结果
3. **表达式构建器**: 提供图形化的条件构建界面
4. **变量类型检查**: 根据变量类型提供类型安全的操作提示
5. **性能优化**: 大规模工作流的渲染性能优化

## 兼容性说明

所有改动向后兼容，不影响现有工作流配置的加载和运行。

## 测试建议

1. 测试分支节点在 5+ 分支时的高度自适应
2. 测试变量引用下拉菜单的过滤和插入
3. 测试循环节点的特殊变量 (loop.index 等)
4. 测试复杂嵌套条件表达式的可用性

---

**优化完成时间**: 2026-02-11
**影响文件**: `frontend/components/workspace/WorkflowEditor.tsx`
**代码行数变更**: ~150 行新增/修改
