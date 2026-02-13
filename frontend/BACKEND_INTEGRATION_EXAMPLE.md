# 工作流后端对接示例

## 概述

本文档展示如何将前端工作流配置与 LangGraph 风格的后端引擎对接。

## 前端数据结构

### 节点配置示例

```typescript
// 文本生成节点
{
  id: "llm-1",
  type: "llm-text",
  data: {
    label: "意图分析",
    model: "GPT-4o",
    prompt: "Analyze user intent...",
    temperature: 0.7,
    inputs: [
      { name: "user_query", type: "string", value: "start.user_query", isReference: true }
    ],
    outputs: [
      { name: "intent", type: "string" },
      { name: "confidence", type: "number" }
    ]
  }
}

// 决策节点
{
  id: "dec-1",
  type: "decision",
  data: {
    label: "是否需要搜索",
    condition: "llm-1.confidence > 0.8 && llm-1.intent == 'search'",
    inputs: [...]
  }
}

// 分支节点
{
  id: "branch-1",
  type: "branch",
  data: {
    label: "内容类型路由",
    branches: [
      { id: "b-1", label: "技术", condition: "state.category == 'tech'" },
      { id: "b-2", label: "商业", condition: "state.category == 'business'" },
      { id: "b-3", label: "默认", condition: "true" }
    ]
  }
}

// 循环节点
{
  id: "iter-1",
  type: "iteration",
  data: {
    label: "批量处理",
    maxLoops: 50,
    loopCondition: "loop.index < state.items.length",
    inputs: [
      { name: "items", type: "string", value: "state.items", isReference: true }
    ]
  }
}
```

## Go 后端实现示例

### 1. 工作流状态定义

```go
// internal/core/workflow/state.go
package workflow

import "encoding/json"

// State represents the shared state across workflow nodes
type State map[string]interface{}

func (s State) Get(path string) (interface{}, bool) {
    // Support dot notation: "node1.result.score"
    keys := strings.Split(path, ".")
    current := interface{}(s)

    for _, key := range keys {
        if m, ok := current.(map[string]interface{}); ok {
            if val, exists := m[key]; exists {
                current = val
            } else {
                return nil, false
            }
        } else {
            return nil, false
        }
    }
    return current, true
}

func (s State) Set(path string, value interface{}) {
    keys := strings.Split(path, ".")
    s.setNested(keys, value)
}

func (s State) setNested(keys []string, value interface{}) {
    if len(keys) == 1 {
        s[keys[0]] = value
        return
    }

    if _, exists := s[keys[0]]; !exists {
        s[keys[0]] = make(map[string]interface{})
    }

    if nested, ok := s[keys[0]].(map[string]interface{}); ok {
        State(nested).setNested(keys[1:], value)
    }
}
```

### 2. 节点接口定义

```go
// internal/core/workflow/node.go
package workflow

import "context"

type NodeType string

const (
    NodeTypeLLMText  NodeType = "llm-text"
    NodeTypeLLMImage NodeType = "llm-image"
    NodeTypeDecision NodeType = "decision"
    NodeTypeBranch   NodeType = "branch"
    NodeTypeIteration NodeType = "iteration"
    NodeTypeTool     NodeType = "tool"
)

type Node interface {
    ID() string
    Type() NodeType
    Execute(ctx context.Context, state State) error
}

// BaseNode contains common node properties
type BaseNode struct {
    id     string
    nodeType NodeType
    config NodeConfig
}

type NodeConfig struct {
    Label   string                 `json:"label"`
    Inputs  []Variable             `json:"inputs"`
    Outputs []Variable             `json:"outputs"`
    Data    map[string]interface{} `json:"data"`
}

type Variable struct {
    Name        string `json:"name"`
    Type        string `json:"type"`
    Value       string `json:"value"`
    IsReference bool   `json:"isReference"`
}
```

### 3. 决策节点实现

```go
// internal/core/workflow/decision_node.go
package workflow

import (
    "context"
    "fmt"
    "github.com/antonmedv/expr"
)

type DecisionNode struct {
    BaseNode
    condition string
}

func NewDecisionNode(id string, config NodeConfig) (*DecisionNode, error) {
    condition, ok := config.Data["condition"].(string)
    if !ok {
        return nil, fmt.Errorf("missing condition in decision node")
    }

    return &DecisionNode{
        BaseNode: BaseNode{
            id:       id,
            nodeType: NodeTypeDecision,
            config:   config,
        },
        condition: condition,
    }, nil
}

func (n *DecisionNode) Execute(ctx context.Context, state State) error {
    // Build evaluation environment
    env := n.buildEnvironment(state)

    // Compile and evaluate expression
    program, err := expr.Compile(n.condition, expr.Env(env))
    if err != nil {
        return fmt.Errorf("condition compilation error: %w", err)
    }

    result, err := expr.Run(program, env)
    if err != nil {
        return fmt.Errorf("condition evaluation error: %w", err)
    }

    // Store result
    state.Set(fmt.Sprintf("%s.condition_result", n.id), result)

    return nil
}

func (n *DecisionNode) buildEnvironment(state State) map[string]interface{} {
    env := make(map[string]interface{})

    // Add state references
    env["state"] = state

    // Add all node outputs to environment
    for key, value := range state {
        env[key] = value
    }

    return env
}

// Evaluate returns the decision result (true/false)
func (n *DecisionNode) Evaluate(state State) (bool, error) {
    val, exists := state.Get(fmt.Sprintf("%s.condition_result", n.id))
    if !exists {
        return false, fmt.Errorf("condition not evaluated")
    }

    result, ok := val.(bool)
    if !ok {
        return false, fmt.Errorf("condition result is not boolean")
    }

    return result, nil
}
```

### 4. 分支节点实现

```go
// internal/core/workflow/branch_node.go
package workflow

import (
    "context"
    "fmt"
    "github.com/antonmedv/expr"
)

type Branch struct {
    ID        string `json:"id"`
    Label     string `json:"label"`
    Condition string `json:"condition"`
}

type BranchNode struct {
    BaseNode
    branches []Branch
}

func NewBranchNode(id string, config NodeConfig) (*BranchNode, error) {
    branchesData, ok := config.Data["branches"].([]interface{})
    if !ok {
        return nil, fmt.Errorf("missing branches in branch node")
    }

    branches := make([]Branch, 0, len(branchesData))
    for _, b := range branchesData {
        bMap := b.(map[string]interface{})
        branches = append(branches, Branch{
            ID:        bMap["id"].(string),
            Label:     bMap["label"].(string),
            Condition: bMap["condition"].(string),
        })
    }

    return &BranchNode{
        BaseNode: BaseNode{
            id:       id,
            nodeType: NodeTypeBranch,
            config:   config,
        },
        branches: branches,
    }, nil
}

func (n *BranchNode) Execute(ctx context.Context, state State) error {
    // Branch node doesn't execute, it only routes
    return nil
}

// SelectBranch evaluates conditions and returns the first matching branch
func (n *BranchNode) SelectBranch(state State) (string, error) {
    env := buildEnvironment(state)

    // Evaluate branches in order
    for _, branch := range n.branches {
        // Empty condition or "true" means default branch
        if branch.Condition == "" || branch.Condition == "true" {
            return branch.ID, nil
        }

        program, err := expr.Compile(branch.Condition, expr.Env(env))
        if err != nil {
            continue // Skip invalid conditions
        }

        result, err := expr.Run(program, env)
        if err != nil {
            continue
        }

        if matched, ok := result.(bool); ok && matched {
            return branch.ID, nil
        }
    }

    return "", fmt.Errorf("no matching branch found")
}

func buildEnvironment(state State) map[string]interface{} {
    env := make(map[string]interface{})
    env["state"] = state
    for key, value := range state {
        env[key] = value
    }
    return env
}
```

### 5. 循环节点实现

```go
// internal/core/workflow/iteration_node.go
package workflow

import (
    "context"
    "fmt"
    "github.com/antonmedv/expr"
)

type IterationNode struct {
    BaseNode
    maxLoops      int
    loopCondition string
    loopBody      []Node // Nodes to execute in each iteration
}

func NewIterationNode(id string, config NodeConfig) (*IterationNode, error) {
    maxLoops, ok := config.Data["maxLoops"].(float64)
    if !ok {
        maxLoops = 10 // default
    }

    loopCondition, ok := config.Data["loopCondition"].(string)
    if !ok {
        return nil, fmt.Errorf("missing loopCondition")
    }

    return &IterationNode{
        BaseNode: BaseNode{
            id:       id,
            nodeType: NodeTypeIteration,
            config:   config,
        },
        maxLoops:      int(maxLoops),
        loopCondition: loopCondition,
        loopBody:      []Node{},
    }, nil
}

func (n *IterationNode) Execute(ctx context.Context, state State) error {
    // Initialize loop state
    loopState := map[string]interface{}{
        "index":       0,
        "count":       0,
        "prev_result": nil,
    }
    state.Set("loop", loopState)

    for i := 0; i < n.maxLoops; i++ {
        // Update loop index
        loopState["index"] = i
        loopState["count"] = i
        state.Set("loop", loopState)

        // Evaluate loop condition
        shouldContinue, err := n.evaluateCondition(state)
        if err != nil {
            return fmt.Errorf("loop condition error: %w", err)
        }

        if !shouldContinue {
            break // Exit loop
        }

        // Execute loop body
        for _, node := range n.loopBody {
            if err := node.Execute(ctx, state); err != nil {
                return fmt.Errorf("loop body execution error: %w", err)
            }
        }

        // Store iteration result
        if result, exists := state.Get(fmt.Sprintf("%s.result", n.loopBody[len(n.loopBody)-1].ID())); exists {
            loopState["prev_result"] = result
        }
    }

    // Store final loop count
    state.Set(fmt.Sprintf("%s.loop_count", n.id), loopState["count"])

    return nil
}

func (n *IterationNode) evaluateCondition(state State) (bool, error) {
    env := buildEnvironment(state)

    program, err := expr.Compile(n.loopCondition, expr.Env(env))
    if err != nil {
        return false, err
    }

    result, err := expr.Run(program, env)
    if err != nil {
        return false, err
    }

    if boolResult, ok := result.(bool); ok {
        return boolResult, nil
    }

    return false, fmt.Errorf("loop condition must return boolean")
}
```

### 6. 工作流引擎

```go
// internal/core/workflow/engine.go
package workflow

import (
    "context"
    "fmt"
)

type Edge struct {
    Source      string
    Target      string
    SourceHandle string // For branch nodes
}

type Workflow struct {
    nodes map[string]Node
    edges []Edge
}

func NewWorkflow() *Workflow {
    return &Workflow{
        nodes: make(map[string]Node),
        edges: []Edge{},
    }
}

func (w *Workflow) AddNode(node Node) {
    w.nodes[node.ID()] = node
}

func (w *Workflow) AddEdge(source, target, sourceHandle string) {
    w.edges = append(w.edges, Edge{
        Source:      source,
        Target:      target,
        SourceHandle: sourceHandle,
    })
}

func (w *Workflow) Execute(ctx context.Context) (State, error) {
    state := make(State)

    // Initialize state
    state["input"] = "Initial input"
    state["messages"] = []string{}
    state["context"] = map[string]interface{}{}

    // Find start node
    startNode, exists := w.nodes["start"]
    if !exists {
        return nil, fmt.Errorf("no start node found")
    }

    // Execute workflow starting from start node
    if err := w.executeFrom(ctx, startNode.ID(), state); err != nil {
        return nil, err
    }

    return state, nil
}

func (w *Workflow) executeFrom(ctx context.Context, nodeID string, state State) error {
    node, exists := w.nodes[nodeID]
    if !exists {
        return fmt.Errorf("node %s not found", nodeID)
    }

    // Check if we reached the end
    if node.Type() == "end" {
        return nil
    }

    // Execute current node
    if err := node.Execute(ctx, state); err != nil {
        return fmt.Errorf("node %s execution failed: %w", nodeID, err)
    }

    // Find next node(s)
    nextNodeID, err := w.getNextNode(nodeID, node, state)
    if err != nil {
        return err
    }

    if nextNodeID != "" {
        return w.executeFrom(ctx, nextNodeID, state)
    }

    return nil
}

func (w *Workflow) getNextNode(currentNodeID string, node Node, state State) (string, error) {
    switch n := node.(type) {
    case *DecisionNode:
        // Get decision result
        result, err := n.Evaluate(state)
        if err != nil {
            return "", err
        }

        // Find edge based on decision
        handle := "false"
        if result {
            handle = "true"
        }

        for _, edge := range w.edges {
            if edge.Source == currentNodeID && edge.SourceHandle == handle {
                return edge.Target, nil
            }
        }

    case *BranchNode:
        // Select branch
        branchID, err := n.SelectBranch(state)
        if err != nil {
            return "", err
        }

        // Find edge for selected branch
        for _, edge := range w.edges {
            if edge.Source == currentNodeID && edge.SourceHandle == branchID {
                return edge.Target, nil
            }
        }

    default:
        // Regular node, find single outgoing edge
        for _, edge := range w.edges {
            if edge.Source == currentNodeID {
                return edge.Target, nil
            }
        }
    }

    return "", nil
}
```

### 7. API 端点示例

```go
// internal/app/workflow_api.go
package app

import (
    "encoding/json"
    "net/http"
    "your-project/internal/core/workflow"
)

type WorkflowHandler struct {
    // dependencies
}

type ExecuteWorkflowRequest struct {
    Nodes []NodeData `json:"nodes"`
    Edges []EdgeData `json:"edges"`
}

type NodeData struct {
    ID   string                 `json:"id"`
    Type string                 `json:"type"`
    Data map[string]interface{} `json:"data"`
}

type EdgeData struct {
    Source       string `json:"source"`
    Target       string `json:"target"`
    SourceHandle string `json:"sourceHandle"`
}

func (h *WorkflowHandler) ExecuteWorkflow(w http.ResponseWriter, r *http.Request) {
    var req ExecuteWorkflowRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // Build workflow
    wf := workflow.NewWorkflow()

    for _, nodeData := range req.Nodes {
        node, err := h.createNode(nodeData)
        if err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        wf.AddNode(node)
    }

    for _, edgeData := range req.Edges {
        wf.AddEdge(edgeData.Source, edgeData.Target, edgeData.SourceHandle)
    }

    // Execute
    state, err := wf.Execute(r.Context())
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Return result
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "state":   state,
    })
}

func (h *WorkflowHandler) createNode(data NodeData) (workflow.Node, error) {
    config := workflow.NodeConfig{
        Data: data.Data,
    }

    switch data.Type {
    case "decision":
        return workflow.NewDecisionNode(data.ID, config)
    case "branch":
        return workflow.NewBranchNode(data.ID, config)
    case "iteration":
        return workflow.NewIterationNode(data.ID, config)
    // ... other node types
    default:
        return nil, fmt.Errorf("unknown node type: %s", data.Type)
    }
}
```

## 依赖安装

```bash
# Expression evaluation library
go get github.com/antonmedv/expr
```

## 测试示例

```go
// internal/core/workflow/engine_test.go
package workflow

import (
    "context"
    "testing"
)

func TestWorkflowExecution(t *testing.T) {
    wf := NewWorkflow()

    // Create nodes
    start := &StartNode{BaseNode{id: "start", nodeType: "start"}}
    decision := &DecisionNode{
        BaseNode:  BaseNode{id: "dec-1", nodeType: "decision"},
        condition: "state.score > 50",
    }
    endTrue := &EndNode{BaseNode{id: "end-true", nodeType: "end"}}
    endFalse := &EndNode{BaseNode{id: "end-false", nodeType: "end"}}

    wf.AddNode(start)
    wf.AddNode(decision)
    wf.AddNode(endTrue)
    wf.AddNode(endFalse)

    wf.AddEdge("start", "dec-1", "")
    wf.AddEdge("dec-1", "end-true", "true")
    wf.AddEdge("dec-1", "end-false", "false")

    // Execute
    state, err := wf.Execute(context.Background())
    if err != nil {
        t.Fatalf("workflow execution failed: %v", err)
    }

    // Verify result
    if state["dec-1.condition_result"] == nil {
        t.Error("decision result not found")
    }
}
```

## 注意事项

1. **表达式安全**: 使用 `expr` 库的安全模式，禁止访问危险函数
2. **超时控制**: 为每个节点执行设置超时
3. **错误恢复**: 实现节点失败时的重试和回退机制
4. **状态持久化**: 长时间运行的工作流需要持久化状态
5. **并发控制**: 某些节点可能需要并发执行优化

---

**文档版本**: 1.0
**更新时间**: 2026-02-11
