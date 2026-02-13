# 连线和输出格式优化

## 优化概述

1. **自定义连线样式** - 使用贝塞尔曲线，中间添加删除按钮
2. **文本输出格式** - 支持 JSON（多个输出）和 Text（单个字符串输出）两种模式

## 优化 1: 自定义连线样式

### 新增功能

**贝塞尔曲线连线**:
- ✅ 使用平滑的贝塞尔曲线代替直线
- ✅ 视觉上更加优雅和专业

**中间删除按钮**:
- ✅ 连线中点显示删除按钮
- ✅ 悬停时高亮显示
- ✅ 点击即可删除连线

### 实现细节

#### 1. 自定义 Edge 组件

```typescript
const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) => {
  // 计算贝塞尔曲线路径
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* 绘制边 */}
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      {/* 在中点渲染删除按钮 */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            className="w-5 h-5 bg-white dark:bg-zinc-900 border-2 border-red-400 dark:border-red-600 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-md group"
            onClick={(event) => {
              event.stopPropagation();
              const deleteEvent = new CustomEvent('deleteEdge', { detail: { edgeId: id } });
              window.dispatchEvent(deleteEvent);
            }}
            title="删除连线"
          >
            <Icons.Close className="w-3 h-3 text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
```

#### 2. 注册自定义 Edge 类型

```typescript
const edgeTypes = useMemo(() => ({
  custom: CustomEdge,
}), []);
```

#### 3. 创建连线时使用自定义类型

```typescript
const onConnect = useCallback(
  (params: Connection | Edge) => setEdges((eds) => addEdge({
    ...params,
    type: 'custom',  // 使用自定义 edge 类型
    markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a' },
    style: { stroke: '#71717a', strokeWidth: 2 }
  }, eds)),
  [setEdges]
);
```

#### 4. 处理删除事件

```typescript
useEffect(() => {
  const handleDeleteEdge = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { edgeId } = customEvent.detail;
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  };

  window.addEventListener('deleteEdge', handleDeleteEdge);
  return () => {
    window.removeEventListener('deleteEdge', handleDeleteEdge);
  };
}, [setEdges]);
```

### 视觉效果

**连线样式**:
```
节点A ~~~(贝塞尔曲线)~~~ [×] ~~~> 节点B
              ↑
          删除按钮
```

**删除按钮样式**:
- 圆形按钮，白色背景
- 红色边框（2px）
- 内含红色 X 图标
- 悬停时背景变为浅红色
- 图标放大效果

**交互行为**:
1. 鼠标悬停在连线上 → 删除按钮可见
2. 点击删除按钮 → 连线被删除
3. 事件不会传播到画布（不会取消选择节点）

## 优化 2: 文本输出格式

### 新增功能

文本生成节点现在支持两种输出格式：

#### 1. JSON 格式（多个输出）

**用途**: 需要结构化输出时使用

**特性**:
- ✅ 可以定义多个输出变量
- ✅ 每个变量有独立的名称和类型
- ✅ 适合复杂的数据结构

**示例**:
```typescript
outputs: [
  { name: 'title', type: 'string' },
  { name: 'summary', type: 'string' },
  { name: 'tags', type: 'string' }
]
```

**后端输出示例**:
```json
{
  "title": "优化工作流系统",
  "summary": "本次更新增加了...",
  "tags": "工作流,优化,界面"
}
```

#### 2. Text 格式（单个输出）

**用途**: 只需要纯文本输出时使用

**特性**:
- ✅ 固定单个输出变量 `text`
- ✅ 类型固定为 `string`
- ✅ 简化配置流程

**示例**:
```typescript
outputs: [
  { name: 'text', type: 'string' }
]
```

**后端输出示例**:
```json
{
  "text": "这是一段生成的文本内容..."
}
```

### 实现细节

#### 1. NodeData 接口扩展

```typescript
interface NodeData {
  // ... 其他字段
  outputFormat?: 'json' | 'text'; // 输出格式
}
```

#### 2. 配置界面

```typescript
{/* 输出格式选择 */}
<div>
  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 block">
    输出格式
  </label>
  <div className="grid grid-cols-2 gap-2">
    {/* JSON 按钮 */}
    <button
      onClick={() => {
        handleChange('outputFormat', 'json');
        if (!localData.outputs || localData.outputs.length === 0) {
          handleChange('outputs', [{ name: 'result', type: 'string' }]);
        }
      }}
      className={/* 样式类 */}
    >
      JSON (多个输出)
    </button>

    {/* Text 按钮 */}
    <button
      onClick={() => {
        handleChange('outputFormat', 'text');
        handleChange('outputs', [{ name: 'text', type: 'string' }]);
      }}
      className={/* 样式类 */}
    >
      Text (单个输出)
    </button>
  </div>
</div>
```

#### 3. 动态输出配置

```typescript
{(localData.outputFormat || 'json') === 'json' ? (
  // JSON 模式 - 可编辑的输出列表
  <VariableList
    title="输出变量 (JSON 结构)"
    vars={localData.outputs}
    onChange={(v) => handleChange('outputs', v)}
    fixedType="string"
  />
) : (
  // Text 模式 - 固定的单个输出
  <div className="space-y-2">
    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
      输出变量 (纯文本)
    </label>
    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs">
      <div className="flex items-center gap-2">
        <Icons.Type className="w-3 h-3" />
        <span className="font-mono">text: string</span>
      </div>
      <p className="text-[10px] text-zinc-400 mt-1">
        固定输出一个名为 "text" 的字符串变量
      </p>
    </div>
  </div>
)}
```

### UI 效果

#### JSON 格式界面

```
┌─────────────────────────────────┐
│ 输出格式                        │
│ ┌───────────┬──────────────┐   │
│ │[JSON(多个)]│ Text (单个)  │   │
│ └───────────┴──────────────┘   │
│                                 │
│ 输出变量 (JSON 结构) [+ 添加]  │
│ ┌─────────────────────────┐   │
│ │ result     String    [×] │   │
│ │ summary    String    [×] │   │
│ │ tags       String    [×] │   │
│ └─────────────────────────┘   │
└─────────────────────────────────┘
```

#### Text 格式界面

```
┌─────────────────────────────────┐
│ 输出格式                        │
│ ┌───────────┬──────────────┐   │
│ │ JSON(多个) │ [Text(单个)] │   │
│ └───────────┴──────────────┘   │
│                                 │
│ 输出变量 (纯文本)              │
│ ┌─────────────────────────┐   │
│ │ 📝 text: string         │   │
│ │ 固定输出一个名为 "text" │   │
│ │ 的字符串变量            │   │
│ └─────────────────────────┘   │
└─────────────────────────────────┘
```

## 使用场景

### 场景 1: JSON 格式 - 结构化内容生成

**需求**: 生成文章标题、摘要和标签

**配置**:
```typescript
{
  outputFormat: 'json',
  outputs: [
    { name: 'title', type: 'string' },
    { name: 'summary', type: 'string' },
    { name: 'tags', type: 'string' }
  ],
  prompt: '生成文章的标题、摘要和标签...'
}
```

**后端处理**:
```python
def generate_article_metadata(state):
    result = llm.invoke({
        "prompt": state["prompt"],
        "output_schema": {
            "title": "string",
            "summary": "string",
            "tags": "string"
        }
    })
    return {
        "title": result["title"],
        "summary": result["summary"],
        "tags": result["tags"]
    }
```

**下游节点引用**:
- `node1.title`
- `node1.summary`
- `node1.tags`

### 场景 2: Text 格式 - 纯文本生成

**需求**: 生成一段文章内容

**配置**:
```typescript
{
  outputFormat: 'text',
  outputs: [
    { name: 'text', type: 'string' }
  ],
  prompt: '写一篇关于 AI 的文章...'
}
```

**后端处理**:
```python
def generate_article_content(state):
    result = llm.invoke({
        "prompt": state["prompt"]
    })
    return {
        "text": result  # 直接返回文本
    }
```

**下游节点引用**:
- `node1.text`

### 场景 3: 格式切换

**操作步骤**:
1. 初始配置为 JSON 格式
2. 定义了多个输出变量
3. 发现只需要纯文本输出
4. 点击"Text (单个输出)"按钮
5. 自动切换为单个 `text` 输出

**自动行为**:
- ✅ 清空原有的输出配置
- ✅ 设置固定的 `text: string` 输出
- ✅ 更新 UI 显示

## 技术细节

### 1. 默认值处理

```typescript
// 如果没有设置 outputFormat，默认为 'json'
const format = localData.outputFormat || 'json';

// JSON 模式下，如果没有 outputs，初始化一个默认的
if (format === 'json' && !localData.outputs?.length) {
  handleChange('outputs', [{ name: 'result', type: 'string' }]);
}
```

### 2. 格式切换逻辑

```typescript
// 切换到 JSON
onClick={() => {
  handleChange('outputFormat', 'json');
  // 保留现有 outputs 或创建默认的
  if (!localData.outputs || localData.outputs.length === 0) {
    handleChange('outputs', [{ name: 'result', type: 'string' }]);
  }
}}

// 切换到 Text
onClick={() => {
  handleChange('outputFormat', 'text');
  // 强制设置为固定的 text 输出
  handleChange('outputs', [{ name: 'text', type: 'string' }]);
}}
```

### 3. 边删除事件系统

**为什么使用 CustomEvent?**
- ReactFlow 的 Edge 组件是独立渲染的
- 不能直接访问父组件的 `setEdges` 方法
- 使用全局事件系统进行通信

**事件流程**:
```
1. 用户点击删除按钮
   ↓
2. 触发 onClick 事件
   ↓
3. 创建 CustomEvent('deleteEdge')
   ↓
4. window.dispatchEvent(deleteEvent)
   ↓
5. 父组件的 useEffect 监听到事件
   ↓
6. 调用 setEdges 删除对应的边
```

**清理机制**:
```typescript
useEffect(() => {
  const handler = (event: Event) => { /* ... */ };
  window.addEventListener('deleteEdge', handler);
  return () => {
    window.removeEventListener('deleteEdge', handler);  // 组件卸载时清理
  };
}, [setEdges]);
```

## 与后端对接

### JSON 格式后端示例

```python
# LangGraph 节点函数
def text_generation_node(state: WorkflowState) -> dict:
    node_config = state["nodes"]["llm-1"]

    if node_config.get("outputFormat") == "json":
        # JSON 模式 - 结构化输出
        output_schema = {
            output["name"]: output["type"]
            for output in node_config["outputs"]
        }

        result = llm.with_structured_output(output_schema).invoke({
            "prompt": node_config["prompt"],
            "inputs": state["inputs"]
        })

        # 返回结构化数据
        return {"llm-1": result}

    else:
        # Text 模式 - 纯文本输出
        result = llm.invoke({
            "prompt": node_config["prompt"],
            "inputs": state["inputs"]
        })

        return {"llm-1": {"text": result}}
```

### Go 后端示例

```go
func ExecuteTextGenerationNode(ctx context.Context, nodeConfig NodeConfig, state State) (map[string]interface{}, error) {
    if nodeConfig.OutputFormat == "json" {
        // JSON 模式
        schema := make(map[string]string)
        for _, output := range nodeConfig.Outputs {
            schema[output.Name] = output.Type
        }

        result, err := llm.InvokeWithSchema(ctx, LLMRequest{
            Prompt: nodeConfig.Prompt,
            Inputs: state.Inputs,
            Schema: schema,
        })

        if err != nil {
            return nil, err
        }

        return result, nil
    } else {
        // Text 模式
        result, err := llm.Invoke(ctx, LLMRequest{
            Prompt: nodeConfig.Prompt,
            Inputs: state.Inputs,
        })

        if err != nil {
            return nil, err
        }

        return map[string]interface{}{
            "text": result,
        }, nil
    }
}
```

## 测试场景

### 测试 1: 连线删除

1. 创建两个节点
2. 连接它们
3. 悬停在连线上，查看删除按钮
4. 点击删除按钮
5. **预期**: 连线被删除

### 测试 2: JSON 输出格式

1. 创建文本生成节点
2. 选择 JSON 格式
3. 添加多个输出变量: `title`, `summary`, `tags`
4. 保存并重新打开
5. **预期**: 配置被正确保存

### 测试 3: Text 输出格式

1. 创建文本生成节点
2. 选择 Text 格式
3. 查看输出配置（应该只有 `text: string`）
4. 保存并重新打开
5. **预期**: 格式和输出都被正确保存

### 测试 4: 格式切换

1. 创建文本生成节点，JSON 格式
2. 添加 3 个输出变量
3. 切换到 Text 格式
4. 切换回 JSON 格式
5. **预期**:
   - Text 模式下只有 `text` 输出
   - 切换回 JSON 后，重新显示默认的 `result` 输出

## 总结

通过这次优化，我们实现了：

✅ **更优雅的连线** - 贝塞尔曲线替代直线，视觉更专业
✅ **便捷的删除** - 中间删除按钮，操作更直观
✅ **灵活的输出** - JSON/Text 两种模式适应不同需求
✅ **简化配置** - Text 模式自动固定输出，减少配置步骤
✅ **向后兼容** - 默认为 JSON 模式，不影响现有配置

---

**优化完成时间**: 2026-02-11
**影响文件**: `frontend/components/workspace/WorkflowEditor.tsx`
**新增组件**: CustomEdge
**新增字段**: NodeData.outputFormat
**代码行数**: ~150 行新增
