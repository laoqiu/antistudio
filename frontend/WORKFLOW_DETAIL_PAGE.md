# 工作流详情页实现

## 功能概述

实现了类似 VSCode 插件市场的工作流详情页，点击工作流时优先显示详情页，详情页中有"安装"和"编辑"按钮。

## 实现内容

### 1. 新增类型定义

**文件**: `types.ts`

#### Workflow 类型扩展
```typescript
export interface Workflow {
  id: string;
  name: string;
  description: string;
  source: 'official' | 'community' | 'user';
  author?: string;
  updatedAt: number;
  tags?: string[];
  nodes?: any[];
  edges?: any[];
  readme?: string;        // 新增: Markdown 详情内容
  version?: string;       // 新增: 版本号
  downloads?: number;     // 新增: 下载/安装次数
  rating?: number;        // 新增: 评分
}
```

#### TabType 扩展
```typescript
export type TabType =
  | 'project'
  | 'terminal'
  | 'preview'
  | 'browser'
  | 'workflow'
  | 'workflow-detail';  // 新增
```

#### WorkspaceTab data 扩展
```typescript
export interface WorkspaceTab {
  id: string;
  type: TabType;
  title: string;
  data?: {
    activeFileId?: string;
    workflowId?: string;
    workflow?: Workflow;  // 新增: 存储完整的 workflow 对象
  };
}
```

### 2. 新组件: WorkflowDetailTab

**文件**: `components/workspace/WorkflowDetailTab.tsx`

#### 组件功能

1. **顶部 Header 区域**:
   - 工作流图标（渐变背景）
   - 工作流名称和徽章（Official/Community）
   - 描述文本
   - 元数据信息（作者、版本、下载量、评分、更新时间）
   - 操作按钮（安装/编辑）
   - 标签列表

2. **内容区域**:
   - 支持 Markdown 内容渲染
   - 自定义样式的 markdown 解析器
   - 空状态处理

#### 组件接口
```typescript
interface WorkflowDetailTabProps {
  workflow: Workflow;
  onEdit?: () => void;      // 编辑按钮回调
  onInstall?: () => void;   // 安装按钮回调
}
```

#### 安装按钮逻辑
```typescript
- 未安装 (source !== 'user'): 显示蓝色"安装工作流"按钮
- 已安装: 显示绿色"已安装"状态标签
- 用户创建的 (source === 'user'): 默认为已安装
```

#### Markdown 解析器

简化的 markdown 解析器，支持：
- **标题**: `#`, `##`, `###`
- **加粗/斜体**: `**bold**`, `*italic*`
- **代码**: `` `code` ``
- **链接**: `[text](url)`
- **列表**: `- item`
- **引用**: `> quote`

### 3. Mock 数据更新

**文件**: `components/WorkflowList.tsx`

为每个工作流添加了详细的 README 内容和元数据：

```typescript
{
  id: 'wf-1',
  name: '代码审查助手 Agent',
  description: '...',
  source: 'official',
  author: 'Ant Studio',
  version: '2.1.0',
  downloads: 12453,
  rating: 4.8,
  readme: `# 代码审查助手 Agent

  ## 概述
  ...

  ## 主要功能
  ...

  ## 使用场景
  ...`
}
```

### 4. WorkspacePanel 更新

**文件**: `components/workspace/WorkspacePanel.tsx`

#### 导入新组件
```typescript
import { WorkflowDetailTab } from './WorkflowDetailTab';
```

#### Tab 图标支持
```typescript
{tab.type === 'workflow-detail' && <Icons.File className="w-3.5 h-3.5" />}
```

#### 内容渲染
```typescript
{tab.type === 'workflow-detail' && tab.data?.workflow && (
  <WorkflowDetailTab
    workflow={tab.data.workflow as Workflow}
    onEdit={() => {
      // 打开编辑器
      const editorTab: WorkspaceTab = {
        id: `workflow-editor-${tab.data?.workflow.id}`,
        type: 'workflow',
        title: `${tab.data?.workflow.name} - 编辑`,
        data: { workflow: tab.data?.workflow }
      };
      const exists = tabs.find(t => t.id === editorTab.id);
      if (!exists) {
        setTabs(prev => [...prev, editorTab]);
      }
      setActiveTabId(editorTab.id);
    }}
    onInstall={() => {
      console.log('Installing workflow:', tab.data?.workflow.name);
    }}
  />
)}
```

### 5. App.tsx 更新

**文件**: `App.tsx`

#### handleSelectWorkflow 修改

**优化前**:
```typescript
const handleSelectWorkflow = (workflow: Workflow) => {
  const newTab: WorkspaceTab = {
    id: `wf-editor-${workflow.id}`,
    type: 'workflow',  // 直接打开编辑器
    title: workflow.name,
    data: { workflowId: workflow.id }
  };
  setExternalOpenTab(newTab);
};
```

**优化后**:
```typescript
const handleSelectWorkflow = (workflow: Workflow) => {
  // 先打开详情页
  const newTab: WorkspaceTab = {
    id: `wf-detail-${workflow.id}`,
    type: 'workflow-detail',  // 打开详情页
    title: workflow.name,
    data: { workflow }        // 传递完整的 workflow 对象
  };
  setExternalOpenTab(newTab);
};
```

### 6. 图标更新

**文件**: `components/icons.tsx`

新增图标：
```typescript
import {
  // ... existing
  Download,
  Star,
  Calendar,
  Tag
} from 'lucide-react';

export const Icons = {
  // ... existing
  Download,
  Star,
  Calendar,
  Tag
};
```

## 用户交互流程

### 流程 1: 查看工作流详情

```
1. 用户在工作流列表点击工作流
   ↓
2. 触发 handleSelectWorkflow(workflow)
   ↓
3. 创建 workflow-detail 类型的 tab
   ↓
4. WorkspacePanel 渲染 WorkflowDetailTab 组件
   ↓
5. 显示工作流详情页（Header + Markdown 内容）
```

### 流程 2: 安装工作流

```
1. 用户在详情页点击"安装工作流"按钮
   ↓
2. 触发 onInstall 回调
   ↓
3. 按钮状态变为"已安装"（绿色标签）
   ↓
4. 本地状态更新（setIsInstalled(true)）
```

### 流程 3: 编辑工作流

```
1. 用户在详情页点击"编辑工作流"按钮
   ↓
2. 触发 onEdit 回调
   ↓
3. 创建新的 workflow 类型的 tab
   ↓
4. 切换到编辑器 tab
   ↓
5. 显示 WorkflowEditor 组件
```

## UI 设计

### 详情页布局

```
┌─────────────────────────────────────────────────────────┐
│ Header (固定高度)                                        │
│ ┌──────┐  ┌────────────────────────┐  ┌──────────────┐ │
│ │ ICON │  │ 标题 + 徽章            │  │ 安装  编辑   │ │
│ │      │  │ 描述                    │  └──────────────┘ │
│ └──────┘  │ 元数据 (作者/版本/...)  │                   │
│           └────────────────────────┘                    │
│           ┌────────────────────────┐                    │
│           │ #Tag1  #Tag2  #Tag3   │                    │
│           └────────────────────────┘                    │
├─────────────────────────────────────────────────────────┤
│ Markdown 内容区 (可滚动)                                 │
│                                                          │
│ # 标题                                                   │
│                                                          │
│ ## 功能介绍                                              │
│ - 功能1                                                  │
│ - 功能2                                                  │
│                                                          │
│ ## 使用方法                                              │
│ ...                                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 样式设计

#### Header 区域
- **背景**: 白色/深色模式适配
- **边框**: 底部分隔线
- **内边距**: 充足的空间 (px-8 py-6)
- **图标**: 渐变背景 (blue-500 to purple-600)
- **徽章**: Official (蓝色) / Community (紫色)

#### 操作按钮
- **安装按钮**: 蓝色主题，带阴影
- **已安装标签**: 绿色主题，带边框
- **编辑按钮**: 灰色主题

#### Markdown 内容
- **最大宽度**: 4xl (合适的阅读宽度)
- **标题**: 渐进式字体大小
- **代码**: 浅色背景，圆角边框
- **链接**: 蓝色，悬停下划线

## 技术细节

### 1. Markdown 渲染策略

不依赖外部库，使用正则表达式解析：

```typescript
const parseMarkdown = (markdown: string) => {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // ...
};
```

使用 `dangerouslySetInnerHTML` 渲染：
```typescript
<div dangerouslySetInnerHTML={{ __html: parsedReadme }} />
```

### 2. Tab 状态管理

```typescript
// 详情页 tab
{
  id: 'wf-detail-wf-1',
  type: 'workflow-detail',
  title: '代码审查助手',
  data: { workflow: {...} }
}

// 编辑器 tab (从详情页打开)
{
  id: 'workflow-editor-wf-1',
  type: 'workflow',
  title: '代码审查助手 - 编辑',
  data: { workflow: {...} }
}
```

### 3. 安装状态管理

```typescript
const [isInstalled, setIsInstalled] = useState(
  workflow.source === 'user'  // 用户创建的默认已安装
);
```

### 4. 编辑器打开逻辑

```typescript
onEdit={() => {
  const editorTab: WorkspaceTab = {
    id: `workflow-editor-${tab.data?.workflow.id}`,
    type: 'workflow',
    title: `${tab.data?.workflow.name} - 编辑`,
    data: { workflow: tab.data?.workflow }
  };

  // 避免重复打开
  const exists = tabs.find(t => t.id === editorTab.id);
  if (!exists) {
    setTabs(prev => [...prev, editorTab]);
  }

  // 切换到编辑器
  setActiveTabId(editorTab.id);
}}
```

## 测试场景

### 场景 1: 打开官方工作流

**操作**:
1. 点击"代码审查助手 Agent"

**预期**:
- ✅ 打开详情页 tab
- ✅ 显示 Official 徽章
- ✅ 显示版本、下载量、评分
- ✅ 显示"安装工作流"按钮（蓝色）
- ✅ 显示"编辑工作流"按钮
- ✅ 显示完整的 README 内容

### 场景 2: 安装工作流

**操作**:
1. 打开详情页
2. 点击"安装工作流"按钮

**预期**:
- ✅ 按钮变为"已安装"标签（绿色）
- ✅ 触发 onInstall 回调
- ✅ 控制台输出安装信息

### 场景 3: 编辑工作流

**操作**:
1. 打开详情页
2. 点击"编辑工作流"按钮

**预期**:
- ✅ 创建新的编辑器 tab
- ✅ 切换到编辑器 tab
- ✅ 编辑器 tab 标题显示"工作流名称 - 编辑"
- ✅ 显示 WorkflowEditor 组件

### 场景 4: 社区工作流

**操作**:
1. 点击社区来源的工作流

**预期**:
- ✅ 显示 Community 徽章（紫色）
- ✅ 显示作者名称
- ✅ 安装按钮可用

### 场景 5: 用户工作流

**操作**:
1. 点击用户创建的工作流

**预期**:
- ✅ 没有 Official/Community 徽章
- ✅ 显示"已安装"状态
- ✅ 可以点击编辑

### 场景 6: Markdown 渲染

**操作**:
1. 查看详情页内容

**预期**:
- ✅ 标题渲染正确（h1, h2, h3）
- ✅ 加粗文本正确显示
- ✅ 代码块有背景和样式
- ✅ 链接可点击
- ✅ 列表正确缩进

### 场景 7: 空 README

**操作**:
1. 查看没有 readme 的工作流

**预期**:
- ✅ 显示空状态占位符
- ✅ 提示"暂无详细说明"
- ✅ 显示图标和说明文字

### 场景 8: 重复打开编辑器

**操作**:
1. 从详情页打开编辑器
2. 返回详情页
3. 再次点击"编辑工作流"

**预期**:
- ✅ 不创建重复的 tab
- ✅ 直接切换到已存在的编辑器 tab

## 优点总结

### 用户体验

✅ **信息丰富**: 详情页展示完整的工作流信息
✅ **操作清晰**: 安装和编辑按钮位置明显
✅ **状态反馈**: 安装状态有明确的视觉反馈
✅ **渐进式访问**: 先查看详情，再决定是否编辑
✅ **类似 VSCode**: 熟悉的插件市场体验

### 代码质量

✅ **类型安全**: 完整的 TypeScript 类型定义
✅ **组件复用**: WorkflowDetailTab 可独立使用
✅ **状态管理**: 清晰的 tab 和安装状态管理
✅ **可扩展性**: 易于添加更多元数据和功能
✅ **轻量实现**: 不依赖外部 markdown 库

## 未来增强

1. **评论系统**: 允许用户评论和评分
2. **版本历史**: 显示工作流的版本更新历史
3. **依赖检查**: 检查和显示工作流依赖
4. **相关推荐**: 推荐类似的工作流
5. **分享功能**: 生成分享链接
6. **收藏功能**: 允许用户收藏工作流
7. **搜索高亮**: Markdown 内容支持搜索高亮
8. **导出功能**: 导出工作流配置

## 总结

成功实现了工作流详情页功能：

✅ **新增 workflow-detail tab 类型**
✅ **创建 WorkflowDetailTab 组件**
✅ **更新 Workflow 类型，添加 readme 等字段**
✅ **修改点击逻辑，优先显示详情页**
✅ **实现安装和编辑按钮功能**
✅ **添加丰富的 mock 数据**
✅ **支持 Markdown 内容渲染**
✅ **完整的状态管理和交互流程**

为用户提供了类似 VSCode 插件市场的专业体验！

---

**实现完成时间**: 2026-02-12
**影响文件**:
- `types.ts`
- `components/workspace/WorkflowDetailTab.tsx` (新建)
- `components/workspace/WorkspacePanel.tsx`
- `components/WorkflowList.tsx`
- `components/icons.tsx`
- `App.tsx`

**代码行数**: ~400 行新增
