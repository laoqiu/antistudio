import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType,
  Handle,
  Position,
  Node,
  NodeProps,
  NodeMouseHandler,
  ProOptions,
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Icons } from '../icons';

// --- Types ---
interface Variable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'image' | 'file' | 'video';
  value?: string;
  isReference?: boolean;
}

interface Branch {
  id: string;
  label: string;
  condition?: string;
}

interface NodeData {
  label?: string;
  desc?: string;

  // Inputs/Outputs
  inputs?: Variable[];
  outputs?: Variable[];

  // Models
  model?: string;

  // Text Gen Params
  prompt?: string; // System Prompt
  temperature?: number;
  outputFormat?: 'json' | 'text'; // Output format for text generation
  
  // Image Gen Params
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  
  // Video Gen Params
  duration?: number;
  fps?: number;
  
  // Tool Params
  tool?: string;
  
  // Logic Params
  condition?: string;
  branches?: Branch[];
  maxLoops?: number;
  loopCondition?: string;
  
  // Workflow Params
  workflowId?: string;
}

// ReactFlow Pro Options to hide attribution
const proOptions: ProOptions = { hideAttribution: true };

// --- Custom Edge with Delete Button ---
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
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
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
              // The delete logic will be handled by the parent component
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

// --- Custom Nodes ---

const BaseNode = ({ icon: Icon, colorClass, title, subtitle, selected, typeLabel, inputs, outputs, badge, hideDefaultHandles, children }: any) => (
  <div className={`
    min-w-[200px] max-w-[240px] rounded-xl border-2 transition-all bg-white dark:bg-zinc-900 shadow-md group
    ${selected 
      ? `border-${colorClass}-500 shadow-${colorClass}-500/20` 
      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'}
  `}>
    {/* Header */}
    <div className={`
        flex items-center justify-between px-3 py-2 rounded-t-[9px] border-b border-zinc-100 dark:border-zinc-800/50
        ${selected ? `bg-${colorClass}-50 dark:bg-${colorClass}-900/10` : 'bg-zinc-50 dark:bg-zinc-900'}
    `}>
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 text-${colorClass}-500`} />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{typeLabel}</span>
      </div>
      {badge && (
         <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 text-zinc-500">
            {badge}
         </span>
      )}
    </div>
    
    {/* Body */}
    <div className="p-3 relative">
       <div className="font-medium text-sm text-zinc-800 dark:text-zinc-100 mb-1 truncate">{title || '未命名节点'}</div>
       <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mb-3">{subtitle || '点击配置参数'}</div>
       
       {/* IO Indicators */}
       {(inputs?.length > 0 || outputs?.length > 0) && (
         <div className="flex gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-2">
            {inputs?.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                <Icons.ArrowRight className="w-2.5 h-2.5" />
                In: {inputs.length}
              </div>
            )}
            {outputs?.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                <Icons.ArrowLeft className="w-2.5 h-2.5 rotate-180" />
                Out: {outputs.length}
              </div>
            )}
         </div>
       )}
       
       {children}
    </div>

    {!hideDefaultHandles && (
        <>
            <Handle type="target" position={Position.Left} className={`w-2.5 h-2.5 !bg-${colorClass}-500 border-2 !border-white dark:!border-zinc-900`} />
            <Handle type="source" position={Position.Right} className={`w-2.5 h-2.5 !bg-${colorClass}-500 border-2 !border-white dark:!border-zinc-900`} />
        </>
    )}
  </div>
);

// --- Specific Nodes ---

const TextNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => (
  <BaseNode 
    icon={Icons.Type} 
    colorClass="blue" 
    typeLabel="文本生成"
    title={data.label} 
    subtitle={data.model || 'GPT-4o'} 
    badge="TEXT"
    inputs={data.inputs}
    outputs={data.outputs}
    selected={selected} 
  />
);

const ImageNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => (
  <BaseNode 
    icon={Icons.Image} 
    colorClass="purple" 
    typeLabel="图片生成"
    title={data.label} 
    subtitle={data.model || 'DALL-E 3'} 
    badge="IMG"
    inputs={data.inputs}
    outputs={data.outputs}
    selected={selected} 
  />
);

const VideoNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => (
  <BaseNode 
    icon={Icons.Video} 
    colorClass="rose" 
    typeLabel="视频生成"
    title={data.label} 
    subtitle={data.model || 'Sora'} 
    badge="VID"
    inputs={data.inputs}
    outputs={data.outputs}
    selected={selected} 
  />
);

const ToolNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => (
  <BaseNode 
    icon={Icons.Wrench} 
    colorClass="orange" 
    typeLabel="工具调用"
    title={data.label} 
    subtitle={data.tool ? `调用: ${data.tool}` : '选择工具...'} 
    inputs={data.inputs}
    outputs={data.outputs}
    selected={selected} 
  />
);

const DecisionNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  // Calculate dynamic height based on content
  const hasIO = (data.inputs?.length || 0) > 0 || (data.outputs?.length || 0) > 0;
  const baseHeight = 100;
  const ioHeight = hasIO ? 35 : 0;
  const dynamicHeight = baseHeight + ioHeight;

  // Calculate handle positions (centered vertically, with spacing)
  const handleSpacing = 36;
  const startY = (dynamicHeight / 2) - (handleSpacing / 2);

  return (
    <div className={`
      min-w-[200px] max-w-[240px] rounded-xl border-2 transition-all bg-white dark:bg-zinc-900 shadow-md group
      ${selected
        ? 'border-yellow-500 shadow-yellow-500/20'
        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'}
    `} style={{ minHeight: `${dynamicHeight}px` }}>
      {/* Header */}
      <div className={`
          flex items-center justify-between px-3 py-2 rounded-t-[9px] border-b border-zinc-100 dark:border-zinc-800/50
          ${selected ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-zinc-50 dark:bg-zinc-900'}
      `}>
        <div className="flex items-center gap-2">
          <Icons.Decision className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">逻辑判断</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 relative">
         <div className="font-medium text-sm text-zinc-800 dark:text-zinc-100 mb-1 truncate">{data.label || '未命名节点'}</div>
         <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mb-3">
           {data.condition ? `If ${data.condition.substring(0, 30)}${data.condition.length > 30 ? '...' : ''}` : '设置条件...'}
         </div>

         {/* IO Indicators */}
         {hasIO && (
           <div className="flex gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-2">
              {data.inputs && data.inputs.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  <Icons.ArrowRight className="w-2.5 h-2.5" />
                  In: {data.inputs.length}
                </div>
              )}
              {data.outputs && data.outputs.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  <Icons.ArrowLeft className="w-2.5 h-2.5 rotate-180" />
                  Out: {data.outputs.length}
                </div>
              )}
           </div>
         )}
      </div>

      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-yellow-500 border-2 !border-white dark:!border-zinc-900" />

      {/* True Handle */}
      <div className="absolute -right-3 flex items-center" style={{ top: `${startY}px` }}>
          <span className="mr-2 text-[10px] font-bold text-green-500 bg-white dark:bg-zinc-900 px-1 rounded shadow-sm border border-zinc-100 dark:border-zinc-800">True</span>
          <Handle type="source" position={Position.Right} id="true" className="w-2.5 h-2.5 !bg-green-500 border-2 !border-white dark:!border-zinc-900" style={{ right: -12 }} />
      </div>

      {/* False Handle */}
      <div className="absolute -right-3 flex items-center" style={{ top: `${startY + handleSpacing}px` }}>
          <span className="mr-2 text-[10px] font-bold text-red-500 bg-white dark:bg-zinc-900 px-1 rounded shadow-sm border border-zinc-100 dark:border-zinc-800">False</span>
          <Handle type="source" position={Position.Right} id="false" className="w-2.5 h-2.5 !bg-red-500 border-2 !border-white dark:!border-zinc-900" style={{ right: -12 }} />
      </div>
    </div>
  );
};

const BranchNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  const branchCount = data.branches?.length || 0;
  const minHeight = 120;
  const heightPerBranch = 28;
  const dynamicHeight = Math.max(minHeight, 60 + branchCount * heightPerBranch);

  return (
    <div className={`
      min-w-[200px] max-w-[240px] rounded-xl border-2 transition-all bg-white dark:bg-zinc-900 shadow-md group
      ${selected
        ? 'border-cyan-500 shadow-cyan-500/20'
        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'}
    `} style={{ minHeight: `${dynamicHeight}px` }}>
      {/* Header */}
      <div className={`
          flex items-center justify-between px-3 py-2 rounded-t-[9px] border-b border-zinc-100 dark:border-zinc-800/50
          ${selected ? 'bg-cyan-50 dark:bg-cyan-900/10' : 'bg-zinc-50 dark:bg-zinc-900'}
      `}>
        <div className="flex items-center gap-2">
          <Icons.Branch className="w-3.5 h-3.5 text-cyan-500" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">分支流程</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 relative">
         <div className="font-medium text-sm text-zinc-800 dark:text-zinc-100 mb-1 truncate">{data.label || '未命名节点'}</div>
         <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mb-3">{`${branchCount} 个分支路径`}</div>
      </div>

      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-cyan-500 border-2 !border-white dark:!border-zinc-900" />

      {data.branches && data.branches.map((branch, index) => (
          <div key={branch.id} className="absolute -right-3 flex items-center" style={{ top: 60 + (index * heightPerBranch) }}>
              <span className="mr-2 text-[9px] text-zinc-500 bg-white dark:bg-zinc-900 px-1 rounded shadow-sm border border-zinc-100 dark:border-zinc-800 max-w-[60px] truncate">{branch.label}</span>
              <Handle
                  type="source"
                  position={Position.Right}
                  id={branch.id}
                  className="w-2.5 h-2.5 !bg-cyan-500 border-2 !border-white dark:!border-zinc-900"
                  style={{ right: -12 }}
              />
          </div>
      ))}
      {(!data.branches || data.branches.length === 0) && (
          <div className="absolute -right-3 top-16 flex items-center">
               <span className="mr-2 text-[9px] text-zinc-400 italic">No Branches</span>
          </div>
      )}
    </div>
  );
};

const IterationNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  // Calculate dynamic height based on content
  const hasIO = (data.inputs?.length || 0) > 0 || (data.outputs?.length || 0) > 0;
  const baseHeight = 100;
  const ioHeight = hasIO ? 35 : 0;
  const dynamicHeight = baseHeight + ioHeight;

  // Calculate handle positions (centered vertically, with spacing)
  const handleSpacing = 36;
  const startY = (dynamicHeight / 2) - (handleSpacing / 2);

  return (
    <div className={`
      min-w-[200px] max-w-[240px] rounded-xl border-2 transition-all bg-white dark:bg-zinc-900 shadow-md group
      ${selected
        ? 'border-pink-500 shadow-pink-500/20'
        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'}
    `} style={{ minHeight: `${dynamicHeight}px` }}>
      {/* Header */}
      <div className={`
          flex items-center justify-between px-3 py-2 rounded-t-[9px] border-b border-zinc-100 dark:border-zinc-800/50
          ${selected ? 'bg-pink-50 dark:bg-pink-900/10' : 'bg-zinc-50 dark:bg-zinc-900'}
      `}>
        <div className="flex items-center gap-2">
          <Icons.Iteration className="w-3.5 h-3.5 text-pink-500" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">循环迭代</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 relative">
         <div className="font-medium text-sm text-zinc-800 dark:text-zinc-100 mb-1 truncate">{data.label || '未命名节点'}</div>
         <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mb-3">
           {`Max: ${data.maxLoops || 10} 次`}
         </div>

         {/* IO Indicators */}
         {hasIO && (
           <div className="flex gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-2">
              {data.inputs && data.inputs.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  <Icons.ArrowRight className="w-2.5 h-2.5" />
                  In: {data.inputs.length}
                </div>
              )}
              {data.outputs && data.outputs.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  <Icons.ArrowLeft className="w-2.5 h-2.5 rotate-180" />
                  Out: {data.outputs.length}
                </div>
              )}
           </div>
         )}
      </div>

      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-pink-500 border-2 !border-white dark:!border-zinc-900" />

      {/* Loop Handle */}
      <div className="absolute -right-3 flex items-center" style={{ top: `${startY}px` }}>
          <span className="mr-2 text-[10px] font-bold text-pink-500 bg-white dark:bg-zinc-900 px-1 rounded shadow-sm border border-zinc-100 dark:border-zinc-800">Loop</span>
          <Handle type="source" position={Position.Right} id="loop" className="w-2.5 h-2.5 !bg-pink-500 border-2 !border-white dark:!border-zinc-900" style={{ right: -12 }} />
      </div>

      {/* Exit Handle */}
      <div className="absolute -right-3 flex items-center" style={{ top: `${startY + handleSpacing}px` }}>
          <span className="mr-2 text-[10px] font-bold text-zinc-500 bg-white dark:bg-zinc-900 px-1 rounded shadow-sm border border-zinc-100 dark:border-zinc-800">Done</span>
          <Handle type="source" position={Position.Right} id="exit" className="w-2.5 h-2.5 !bg-zinc-500 border-2 !border-white dark:!border-zinc-900" style={{ right: -12 }} />
      </div>
    </div>
  );
};

const WorkflowNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => (
  <BaseNode 
    icon={Icons.Workflow} 
    colorClass="indigo" 
    typeLabel="子工作流"
    title={data.label} 
    subtitle={data.workflowId ? `Ref: ${data.workflowId}` : '选择工作流...'} 
    inputs={data.inputs}
    outputs={data.outputs}
    selected={selected} 
  />
);

const StartNode: React.FC<NodeProps> = ({ selected }) => (
  <div className={`
     px-4 py-2 rounded-full border-2 bg-white dark:bg-zinc-900 flex items-center gap-2 shadow-lg transition-all
     ${selected ? 'border-green-500 ring-2 ring-green-500/20' : 'border-zinc-200 dark:border-zinc-700'}
  `}>
     <Icons.Play className="w-4 h-4 text-green-500 fill-current" />
     <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">开始</span>
     <Handle type="source" position={Position.Right} className="!bg-green-500 w-3 h-3" />
  </div>
);

const EndNode: React.FC<NodeProps> = ({ selected }) => (
  <div className={`
     px-4 py-2 rounded-full border-2 bg-white dark:bg-zinc-900 flex items-center gap-2 shadow-lg transition-all
     ${selected ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-200 dark:border-zinc-700'}
  `}>
     <Icons.Flag className="w-4 h-4 text-red-500 fill-current" />
     <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">结束</span>
     <Handle type="target" position={Position.Left} className="!bg-red-500 w-3 h-3" />
  </div>
);

// --- Config Panel Component ---

// Visual Condition Builder Component
interface ConditionRule {
    id: string;
    variable: string;
    operator: string;
    value: string;
}

interface ConditionGroup {
    id: string;
    logic: 'AND' | 'OR';
    rules: ConditionRule[];
}

const OPERATORS = [
    { value: '==', label: '等于 (==)' },
    { value: '!=', label: '不等于 (!=)' },
    { value: '>', label: '大于 (>)' },
    { value: '>=', label: '大于等于 (>=)' },
    { value: '<', label: '小于 (<)' },
    { value: '<=', label: '小于等于 (<=)' },
    { value: 'contains', label: '包含' },
    { value: 'startsWith', label: '开头是' },
    { value: 'endsWith', label: '结尾是' },
    { value: 'in', label: '在列表中' },
];

const ConditionBuilder: React.FC<{
    value: string;
    onChange: (value: string) => void;
    availableReferences: string[];
    label?: string;
}> = ({ value, onChange, availableReferences, label }) => {
    const [group, setGroup] = useState<ConditionGroup>(() => {
        // Parse existing condition string into visual format
        return parseConditionString(value);
    });

    // Use ref to store onChange to avoid it being in dependencies
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Use ref to track the last expression we sent to parent
    const lastSentExpressionRef = useRef(value);

    // Sync external value changes to internal state (when switching nodes)
    useEffect(() => {
        const currentExpression = buildConditionString(group);
        // Only update if value changed from outside (not from our own onChange)
        if (value !== currentExpression && value !== lastSentExpressionRef.current) {
            setGroup(parseConditionString(value));
            lastSentExpressionRef.current = value;
        }
    }, [value]);

    // Convert visual format back to expression string and call onChange
    useEffect(() => {
        const expression = buildConditionString(group);
        // Only call onChange if expression actually changed
        if (expression !== lastSentExpressionRef.current) {
            lastSentExpressionRef.current = expression;
            onChangeRef.current(expression);
        }
    }, [group]);

    const addRule = () => {
        setGroup({
            ...group,
            rules: [
                ...group.rules,
                {
                    id: `rule-${Date.now()}`,
                    variable: availableReferences[0] || '',
                    operator: '==',
                    value: ''
                }
            ]
        });
    };

    const removeRule = (ruleId: string) => {
        setGroup({
            ...group,
            rules: group.rules.filter(r => r.id !== ruleId)
        });
    };

    const updateRule = (ruleId: string, field: keyof ConditionRule, newValue: string) => {
        setGroup({
            ...group,
            rules: group.rules.map(r =>
                r.id === ruleId ? { ...r, [field]: newValue } : r
            )
        });
    };

    const toggleLogic = () => {
        setGroup({
            ...group,
            logic: group.logic === 'AND' ? 'OR' : 'AND'
        });
    };

    return (
        <div className="space-y-3">
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{label}</label>
                    <button
                        onClick={addRule}
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                    >
                        <Icons.Plus className="w-3 h-3" /> 添加条件
                    </button>
                </div>
            )}

            {group.rules.length === 0 ? (
                <div className="text-xs text-zinc-400 italic text-center py-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    点击"添加条件"开始构建
                </div>
            ) : (
                <div className="space-y-2">
                    {group.rules.map((rule, index) => (
                        <div key={rule.id}>
                            {/* Logic Toggle (show between rules) */}
                            {index > 0 && (
                                <div className="flex justify-center my-1">
                                    <button
                                        onClick={toggleLogic}
                                        className={`
                                            px-3 py-1 text-[10px] font-bold rounded-full border-2 transition-all
                                            ${group.logic === 'AND'
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                                                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                                            }
                                            hover:scale-105
                                        `}
                                        title="点击切换 AND/OR"
                                    >
                                        {group.logic}
                                    </button>
                                </div>
                            )}

                            {/* Condition Rule */}
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                                    {/* Variable Select */}
                                    <select
                                        value={rule.variable}
                                        onChange={(e) => updateRule(rule.id, 'variable', e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 font-mono"
                                    >
                                        <option value="">选择变量...</option>
                                        {availableReferences.map(ref => (
                                            <option key={ref} value={ref}>{ref}</option>
                                        ))}
                                    </select>

                                    {/* Operator Select */}
                                    <select
                                        value={rule.operator}
                                        onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                                        className="w-24 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                                    >
                                        {OPERATORS.map(op => (
                                            <option key={op.value} value={op.value}>{op.label}</option>
                                        ))}
                                    </select>

                                    {/* Value Input */}
                                    <input
                                        type="text"
                                        value={rule.value}
                                        onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 font-mono"
                                        placeholder="输入值..."
                                    />

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeRule(rule.id)}
                                        className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="删除条件"
                                    >
                                        <Icons.Close className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Expression */}
            {group.rules.length > 0 && (
                <div className="p-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                    <span className="text-zinc-400">表达式预览: </span>
                    {buildConditionString(group) || 'true'}
                </div>
            )}
        </div>
    );
};

// Helper functions to parse and build condition strings
function parseConditionString(conditionStr: string): ConditionGroup {
    if (!conditionStr || conditionStr.trim() === '') {
        return { id: 'group-1', logic: 'AND', rules: [] };
    }

    // Simple parser - for complex cases, user can manually edit
    // This handles basic patterns like: "var1 == 'value' && var2 > 10"
    const logic = conditionStr.includes('||') ? 'OR' : 'AND';
    const separator = logic === 'OR' ? '||' : '&&';
    const parts = conditionStr.split(separator).map(s => s.trim());

    const rules: ConditionRule[] = parts.map((part, idx) => {
        // Try to match pattern: variable operator value
        const match = part.match(/^(\S+)\s*(==|!=|>=|<=|>|<|contains|startsWith|endsWith|in)\s*(.+)$/);
        if (match) {
            return {
                id: `rule-${idx}`,
                variable: match[1],
                operator: match[2],
                value: match[3].replace(/['"]/g, '')
            };
        }
        return {
            id: `rule-${idx}`,
            variable: '',
            operator: '==',
            value: part
        };
    });

    return { id: 'group-1', logic, rules };
}

function buildConditionString(group: ConditionGroup): string {
    if (group.rules.length === 0) return '';

    const separator = group.logic === 'AND' ? ' && ' : ' || ';

    return group.rules
        .map(rule => {
            if (!rule.variable || !rule.value) return '';

            const value = rule.value.trim();
            // Check if value needs quotes (not a number or boolean)
            const needsQuotes = isNaN(Number(value)) && value !== 'true' && value !== 'false';
            const formattedValue = needsQuotes ? `"${value}"` : value;

            return `${rule.variable} ${rule.operator} ${formattedValue}`;
        })
        .filter(Boolean)
        .join(separator);
}

// Enhanced Condition Input with Variable Reference Support (kept for other nodes)
const ConditionInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    availableReferences: string[];
    placeholder?: string;
    label?: string;
    helpText?: string;
}> = ({ value, onChange, availableReferences, placeholder, label, helpText }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setCursorPosition(e.target.selectionStart || 0);

        // Show suggestions when typing variable patterns
        const text = e.target.value;
        const beforeCursor = text.substring(0, e.target.selectionStart || 0);
        const hasVarPattern = /[\w.]*$/.test(beforeCursor);
        setShowSuggestions(hasVarPattern && availableReferences.length > 0);
    };

    const insertReference = (ref: string) => {
        const beforeCursor = value.substring(0, cursorPosition);
        const afterCursor = value.substring(cursorPosition);

        // Replace partial variable name if exists
        const beforeMatch = beforeCursor.match(/[\w.]*$/);
        const newBefore = beforeMatch ? beforeCursor.substring(0, beforeCursor.length - beforeMatch[0].length) : beforeCursor;

        const newValue = newBefore + ref + afterCursor;
        onChange(newValue);
        setShowSuggestions(false);

        // Restore focus
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const filteredReferences = availableReferences.filter(ref => {
        const beforeCursor = value.substring(0, cursorPosition);
        const lastWord = beforeCursor.match(/[\w.]*$/)?.[0] || '';
        return lastWord.length === 0 || ref.toLowerCase().includes(lastWord.toLowerCase());
    });

    return (
        <div className="space-y-1.5">
            {label && <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">{label}</label>}

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => availableReferences.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono pr-8"
                    placeholder={placeholder || "e.g. node1.result > 10"}
                />

                {/* Variable Reference Button */}
                <button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    title="可用变量"
                >
                    <Icons.Code className="w-4 h-4" />
                </button>

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredReferences.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="text-[10px] text-zinc-400 font-medium">可用变量引用</span>
                        </div>
                        <div className="py-1">
                            {filteredReferences.map((ref) => (
                                <button
                                    key={ref}
                                    onClick={() => insertReference(ref)}
                                    className="w-full px-3 py-1.5 text-left text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
                                >
                                    <Icons.Variable className="w-3 h-3 text-blue-500" />
                                    {ref}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {helpText && (
                <p className="text-[10px] text-zinc-400 mt-1">{helpText}</p>
            )}

            {/* Available Variables Preview */}
            {!showSuggestions && availableReferences.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[9px] text-zinc-400">可用:</span>
                    {availableReferences.slice(0, 3).map((ref) => (
                        <span key={ref} className="text-[9px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                            {ref}
                        </span>
                    ))}
                    {availableReferences.length > 3 && (
                        <span className="text-[9px] text-zinc-400">+{availableReferences.length - 3} more</span>
                    )}
                </div>
            )}
        </div>
    );
};

const VariableList: React.FC<{
    title: string;
    vars?: Variable[];
    onChange: (vars: Variable[]) => void;
    fixedType?: 'string' | 'number' | 'image' | 'video' | null;
    allowedTypes?: string[];
    availableReferences?: string[];
    isInput?: boolean;
    hideAddButton?: boolean;
    disableAddButton?: boolean;
    formatSelector?: React.ReactNode;
}> = ({ title, vars = [], onChange, fixedType = null, allowedTypes = [], availableReferences = [], isInput = false, hideAddButton = false, disableAddButton = false, formatSelector }) => {
    
    const addVar = () => onChange([...vars, { name: `var_${vars.length + 1}`, type: (fixedType || (allowedTypes.length > 0 ? allowedTypes[0] : 'string')) as any, value: '', isReference: false }]);
    const removeVar = (idx: number) => onChange(vars.filter((_, i) => i !== idx));
    const updateVar = (idx: number, key: keyof Variable, val: any) => {
        const newVars = [...vars];
        newVars[idx] = { ...newVars[idx], [key]: val };
        onChange(newVars);
    };

    const allTypes = ['string', 'number', 'boolean', 'image', 'video', 'file'];
    const availableTypes = allowedTypes.length > 0 ? allowedTypes : allTypes;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{title}</label>
                <div className="flex items-center gap-2">
                    {formatSelector}
                    {!hideAddButton && (
                        <button
                            onClick={addVar}
                            disabled={disableAddButton}
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
            <div className="space-y-1">
                {vars.map((v, idx) => (
                    <div key={idx} className="flex flex-col gap-1 p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md">
                        <div className="flex items-center gap-2">
                            <input 
                                value={v.name}
                                onChange={(e) => updateVar(idx, 'name', e.target.value)}
                                className="flex-1 min-w-0 bg-transparent text-xs outline-none border-b border-transparent focus:border-blue-500 pb-0.5"
                                placeholder="变量名"
                            />
                            <select 
                                value={v.type}
                                onChange={(e) => updateVar(idx, 'type', e.target.value as any)}
                                disabled={!!fixedType}
                                className={`w-16 bg-transparent text-[10px] outline-none text-right ${fixedType ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {availableTypes.map(t => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                            <button onClick={() => removeVar(idx)} className="text-zinc-400 hover:text-red-500">
                                <Icons.Close className="w-3 h-3" />
                            </button>
                        </div>
                        
                        {isInput && (
                            <div className="flex items-center gap-2 mt-1">
                                <button 
                                   onClick={() => updateVar(idx, 'isReference', !v.isReference)}
                                   className={`text-[9px] px-1.5 py-0.5 rounded border ${v.isReference ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700'}`}
                                >
                                   {v.isReference ? 'REF' : 'VAL'}
                                </button>
                                
                                {v.isReference ? (
                                    <select 
                                        value={v.value || ''}
                                        onChange={(e) => updateVar(idx, 'value', e.target.value)}
                                        className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-[10px] outline-none"
                                    >
                                        <option value="">选择引用...</option>
                                        {availableReferences.map(ref => (
                                            <option key={ref} value={ref}>{ref}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input 
                                        value={v.value || ''}
                                        onChange={(e) => updateVar(idx, 'value', e.target.value)}
                                        className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-[10px] outline-none"
                                        placeholder="输入固定值..."
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {vars.length === 0 && (
                    <div className="text-[10px] text-zinc-400 italic px-2">暂无参数</div>
                )}
            </div>
        </div>
    );
};

interface ConfigPanelProps {
  node: Node<NodeData> | null;
  nodes: Node<NodeData>[];
  onClose: () => void;
  onChange: (nodeId: string, newData: NodeData) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ node, nodes, onClose, onChange }) => {
  const [localData, setLocalData] = useState<NodeData>({});

  useEffect(() => {
    if (node) {
      setLocalData({ ...node.data });
    }
  }, [node?.id]); // Only update when switching to a different node

  if (!node) return null;

  const availableReferences = useMemo(() => {
    const refs: string[] = [];

    // Global state references (LangGraph style)
    refs.push('state.input');       // Initial input from start
    refs.push('state.messages');    // Message history
    refs.push('state.context');     // Shared context

    nodes.forEach(n => {
        if (n.id === node.id) return; // Skip current node

        // Start node - initial state
        if (n.type === 'start') {
            refs.push('start.user_query');
            refs.push('start.session_id');
        }

        // Check explicit outputs from node configuration
        if (n.data.outputs && n.data.outputs.length > 0) {
            n.data.outputs.forEach(o => {
                refs.push(`${n.id}.${o.name}`);
            });
        } else if (n.type !== 'start' && n.type !== 'end') {
            // Default output for nodes without explicit outputs
            switch (n.type) {
                case 'llm-text':
                    refs.push(`${n.id}.text`);
                    refs.push(`${n.id}.tokens`);
                    break;
                case 'llm-image':
                    refs.push(`${n.id}.image`);
                    refs.push(`${n.id}.url`);
                    break;
                case 'llm-video':
                    refs.push(`${n.id}.video`);
                    refs.push(`${n.id}.url`);
                    break;
                case 'tool':
                    refs.push(`${n.id}.result`);
                    refs.push(`${n.id}.success`);
                    break;
                case 'decision':
                    refs.push(`${n.id}.condition_result`);
                    break;
                case 'iteration':
                    refs.push(`${n.id}.loop_count`);
                    refs.push(`${n.id}.iteration_result`);
                    break;
                default:
                    refs.push(`${n.id}.result`);
            }
        }

        // Add node label as reference if available (more readable)
        if (n.data.label) {
            const cleanLabel = n.data.label.replace(/\s+/g, '_').toLowerCase();
            refs.push(`${cleanLabel}.result`);
        }
    });

    // Special loop variables for iteration nodes
    if (node.type === 'iteration') {
        refs.push('loop.index');        // Current iteration index
        refs.push('loop.count');        // Total iterations done
        refs.push('loop.prev_result');  // Result from previous iteration
    }

    return [...new Set(refs)]; // Remove duplicates
  }, [nodes, node.id, node.type]);

  const handleChange = (key: keyof NodeData, value: any) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    onChange(node.id, newData);
  };

  const renderContent = () => {
    switch(node.type) {
      case 'llm-text':
        return (
          <div className="space-y-4">
             {/* Inputs / Outputs */}
             <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-lg space-y-4">
                <VariableList
                    title="输入参数 (Input Mapping)"
                    vars={localData.inputs}
                    onChange={(v) => handleChange('inputs', v)}
                    fixedType="string"
                    isInput={true}
                    availableReferences={availableReferences}
                />
                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                {/* Output Variables with format selector */}
                <VariableList
                  title="输出变量"
                  vars={localData.outputs}
                  onChange={(v) => {
                    // When in text mode, limit to 1 output
                    if ((localData.outputFormat || 'json') === 'text' && v.length > 1) {
                      handleChange('outputs', [v[0]]);
                    } else {
                      handleChange('outputs', v);
                    }
                  }}
                  fixedType="string"
                  disableAddButton={(localData.outputFormat || 'json') === 'text' && (localData.outputs?.length || 0) >= 1}
                  formatSelector={
                    <>
                      <span className="text-[10px] text-zinc-400">格式:</span>
                      <select
                        value={localData.outputFormat || 'json'}
                        onChange={(e) => {
                          const format = e.target.value as 'json' | 'text';
                          // Update both outputFormat and outputs in one call
                          const newData = { ...localData, outputFormat: format };
                          if (format === 'text') {
                            // Keep first output or create default
                            newData.outputs = localData.outputs && localData.outputs.length > 0
                              ? [localData.outputs[0]]
                              : [{ name: 'text', type: 'string' }];
                          } else if (!localData.outputs || localData.outputs.length === 0) {
                            newData.outputs = [{ name: 'result', type: 'string' }];
                          }
                          setLocalData(newData);
                          onChange(node.id, newData);
                        }}
                        className="w-20 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5 text-[10px] outline-none focus:border-blue-500"
                      >
                        <option value="json">JSON</option>
                        <option value="text">Text</option>
                      </select>
                    </>
                  }
                />
                {(localData.outputFormat || 'json') === 'text' && (
                  <p className="text-[10px] text-zinc-400 mt-1 ml-1">
                    💡 Text 模式下只能有一个输出变量
                  </p>
                )}
             </div>

             <div>
               <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">模型选择</label>
               <select 
                 value={localData.model || 'GPT-4o'}
                 onChange={(e) => handleChange('model', e.target.value)}
                 className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
               >
                  <option>GPT-4o</option>
                  <option>Claude 3.5 Sonnet</option>
                  <option>Gemini 1.5 Pro</option>
                  <option>Llama 3 70B</option>
               </select>
             </div>

             <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">Temperature ({localData.temperature ?? 0.7})</label>
                <input 
                  type="range" min="0" max="1" step="0.1"
                  value={localData.temperature ?? 0.7}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
            </div>
            <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">系统提示词</label>
                <textarea 
                value={localData.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                className="w-full h-32 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none font-mono custom-scrollbar"
                placeholder="You are a helpful assistant..."
                />
            </div>
          </div>
        );

      case 'llm-image':
        return (
          <div className="space-y-4">
            {/* Image Gen takes string prompt inputs or image inputs, outputs Image */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-lg space-y-4">
                <VariableList 
                    title="输入参数 (String/Image)" 
                    vars={localData.inputs} 
                    onChange={(v) => handleChange('inputs', v)} 
                    allowedTypes={['string', 'image']} 
                    isInput={true}
                    availableReferences={availableReferences}
                />
                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                <VariableList title="输出变量 (Image)" vars={localData.outputs} onChange={(v) => handleChange('outputs', v)} fixedType="image" />
             </div>

             <div>
               <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">绘图模型</label>
               <select 
                 value={localData.model || 'DALL-E 3'}
                 onChange={(e) => handleChange('model', e.target.value)}
                 className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500"
               >
                  <option>DALL-E 3</option>
                  <option>Stable Diffusion XL</option>
                  <option>Midjourney v6 (Bridge)</option>
               </select>
             </div>

            <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">正向提示词 (Prompt)</label>
                <textarea 
                    value={localData.prompt || ''}
                    onChange={(e) => handleChange('prompt', e.target.value)}
                    className="w-full h-24 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm outline-none focus:border-purple-500 resize-none font-mono custom-scrollbar"
                    placeholder="Describe the image..."
                />
            </div>
            <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">负向提示词 (Negative)</label>
                <textarea 
                    value={localData.negativePrompt || ''}
                    onChange={(e) => handleChange('negativePrompt', e.target.value)}
                    className="w-full h-16 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm outline-none focus:border-red-500 resize-none font-mono custom-scrollbar"
                    placeholder="Elements to avoid..."
                />
            </div>
            <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 block">宽高比</label>
                <div className="grid grid-cols-4 gap-2">
                    {['1:1', '16:9', '9:16', '4:3'].map(ratio => (
                        <button
                            key={ratio}
                            onClick={() => handleChange('aspectRatio', ratio)}
                            className={`
                                py-2 rounded-lg text-xs font-medium border transition-colors
                                ${localData.aspectRatio === ratio 
                                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' 
                                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}
                            `}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        );

      case 'llm-video':
        return (
          <div className="space-y-4">
             {/* Video Gen takes string/image inputs, outputs Video */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-lg space-y-4">
                <VariableList 
                    title="输入参数 (String/Image)" 
                    vars={localData.inputs} 
                    onChange={(v) => handleChange('inputs', v)} 
                    allowedTypes={['string', 'image']}
                    isInput={true}
                    availableReferences={availableReferences} 
                />
                <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                <VariableList title="输出变量 (Video)" vars={localData.outputs} onChange={(v) => handleChange('outputs', v)} fixedType="video" />
             </div>

             <div>
               <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">视频模型</label>
               <select 
                 value={localData.model || 'Sora'}
                 onChange={(e) => handleChange('model', e.target.value)}
                 className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-500"
               >
                  <option>Sora</option>
                  <option>Runway Gen-3</option>
                  <option>Stable Video Diffusion</option>
               </select>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">时长 (秒)</label>
                   <input 
                      type="number"
                      value={localData.duration || 5}
                      onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-500"
                   />
                </div>
                <div>
                   <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">FPS</label>
                   <select 
                     value={localData.fps || 24}
                     onChange={(e) => handleChange('fps', parseInt(e.target.value))}
                     className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-500"
                   >
                      <option value="24">24</option>
                      <option value="30">30</option>
                      <option value="60">60</option>
                   </select>
                </div>
             </div>

            <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">生成提示词</label>
                <textarea 
                    value={localData.prompt || ''}
                    onChange={(e) => handleChange('prompt', e.target.value)}
                    className="w-full h-24 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm outline-none focus:border-rose-500 resize-none font-mono custom-scrollbar"
                    placeholder="Describe the video motion..."
                />
            </div>
          </div>
        );

      case 'tool':
        return (
           <div className="space-y-4">
              <div>
                 <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">选择工具</label>
                 <select 
                   value={localData.tool || ''}
                   onChange={(e) => handleChange('tool', e.target.value)}
                   className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
                 >
                    <option value="">请选择...</option>
                    <option value="search">Google Search</option>
                    <option value="scraper">Web Scraper</option>
                    <option value="python">Python Interpreter</option>
                 </select>
               </div>
               
               <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-lg space-y-4">
                  <VariableList 
                    title="输入参数" 
                    vars={localData.inputs} 
                    onChange={(v) => handleChange('inputs', v)} 
                    isInput={true}
                    availableReferences={availableReferences}
                  />
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                  <VariableList title="输出参数" vars={localData.outputs} onChange={(v) => handleChange('outputs', v)} />
               </div>
           </div>
        );
      case 'decision':
        return (
           <div className="space-y-4">
              <ConditionBuilder
                  label="判断条件"
                  value={localData.condition || ''}
                  onChange={(v) => handleChange('condition', v)}
                  availableReferences={availableReferences}
              />

              <div className="p-3 bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                  <div className="flex items-start gap-2">
                     <Icons.HelpCircle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                     <div className="text-[10px] text-yellow-600 dark:text-yellow-400">
                        <p className="font-medium mb-1">逻辑判断说明:</p>
                        <ul className="space-y-0.5 list-disc list-inside">
                          <li>条件为 True 时走 True 分支</li>
                          <li>条件为 False 时走 False 分支</li>
                          <li>支持 AND/OR 组合多个条件</li>
                        </ul>
                     </div>
                  </div>
               </div>
           </div>
        );
      case 'branch':
        return (
            <div className="space-y-4">
               <div>
                  <div className="flex items-center justify-between mb-3">
                     <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">分支列表</label>
                     <button
                        onClick={() => {
                            const newBranch = { id: `b-${Date.now()}`, label: `Branch ${(localData.branches?.length || 0) + 1}`, condition: '' };
                            handleChange('branches', [...(localData.branches || []), newBranch]);
                        }}
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                     >
                        <Icons.Plus className="w-3 h-3" /> 添加分支
                     </button>
                  </div>

                  <div className="space-y-3">
                     {localData.branches?.map((branch, idx) => (
                        <div key={branch.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg space-y-3">
                           {/* Branch Name and Delete */}
                           <div className="flex items-center gap-2">
                               <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                                  {idx + 1}
                               </div>
                               <input
                                   value={branch.label}
                                   onChange={(e) => {
                                       const newBranches = [...(localData.branches || [])];
                                       newBranches[idx] = { ...branch, label: e.target.value };
                                       handleChange('branches', newBranches);
                                   }}
                                   className="flex-1 min-w-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1.5 text-xs font-medium outline-none focus:border-cyan-500"
                                   placeholder="分支名称"
                               />
                               <button
                                   onClick={() => handleChange('branches', localData.branches?.filter((_, i) => i !== idx))}
                                   className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                   title="删除分支"
                               >
                                   <Icons.Trash className="w-3.5 h-3.5" />
                               </button>
                           </div>

                           {/* Condition Builder */}
                           <div className="pl-8">
                              <ConditionBuilder
                                  value={branch.condition || ''}
                                  onChange={(newCondition) => {
                                      const newBranches = [...(localData.branches || [])];
                                      newBranches[idx] = { ...branch, condition: newCondition };
                                      handleChange('branches', newBranches);
                                  }}
                                  availableReferences={availableReferences}
                                  label="条件规则"
                              />
                           </div>
                        </div>
                     ))}
                     {(!localData.branches || localData.branches.length === 0) && (
                        <div className="text-xs text-zinc-400 italic text-center py-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                          点击"添加分支"开始配置
                        </div>
                     )}
                  </div>
               </div>

               <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                  <div className="flex items-start gap-2">
                     <Icons.HelpCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                     <div className="text-[10px] text-blue-600 dark:text-blue-400">
                        <p className="font-medium mb-1">分支路由说明:</p>
                        <ul className="space-y-0.5 list-disc list-inside">
                          <li>分支按顺序从上到下评估</li>
                          <li>第一个满足条件的分支将被执行</li>
                          <li>建议最后添加默认分支（无条件）</li>
                          <li>支持 AND/OR 逻辑组合多个条件</li>
                        </ul>
                     </div>
                  </div>
               </div>
            </div>
        );
      case 'iteration':
        return (
           <div className="space-y-4">
              <div>
                 <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">最大循环次数</label>
                 <input
                   type="number"
                   min="1"
                   max="1000"
                   value={localData.maxLoops || 10}
                   onChange={(e) => handleChange('maxLoops', parseInt(e.target.value) || 10)}
                   className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-500"
                 />
                 <p className="text-[10px] text-zinc-400 mt-1">防止无限循环的安全限制</p>
              </div>

              <ConditionBuilder
                  label="循环继续条件"
                  value={localData.loopCondition || ''}
                  onChange={(v) => handleChange('loopCondition', v)}
                  availableReferences={availableReferences}
              />

              <div className="p-3 bg-pink-50/50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30 rounded-lg">
                  <div className="flex items-start gap-2">
                     <Icons.HelpCircle className="w-3.5 h-3.5 text-pink-500 mt-0.5 shrink-0" />
                     <div className="text-[10px] text-pink-600 dark:text-pink-400">
                        <p className="font-medium mb-1">循环迭代说明:</p>
                        <ul className="space-y-0.5 list-disc list-inside">
                          <li>当条件为 True 时继续循环，否则退出</li>
                          <li>每次循环会重新评估条件</li>
                          <li>可使用 <code className="bg-pink-100 dark:bg-pink-900/30 px-1 rounded">loop.index</code> 访问当前迭代索引</li>
                          <li>可使用 <code className="bg-pink-100 dark:bg-pink-900/30 px-1 rounded">loop.count</code> 访问已完成次数</li>
                          <li>可使用 <code className="bg-pink-100 dark:bg-pink-900/30 px-1 rounded">loop.prev_result</code> 访问上次结果</li>
                        </ul>
                     </div>
                  </div>
               </div>
           </div>
        );
      case 'workflow':
        return (
           <div className="space-y-4">
              <div>
                 <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">选择工作流</label>
                 <select 
                   value={localData.workflowId || ''}
                   onChange={(e) => handleChange('workflowId', e.target.value)}
                   className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                 >
                    <option value="">请选择工作流...</option>
                    <option value="wf-1">代码审查助手 Agent</option>
                    <option value="wf-2">社交媒体文案生成器</option>
                    <option value="wf-3">数据清洗与提取</option>
                 </select>
              </div>
              
               <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-lg space-y-4">
                  <VariableList title="传递参数" vars={localData.inputs} onChange={(v) => handleChange('inputs', v)} isInput={true} availableReferences={availableReferences} />
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                  <VariableList title="返回结果" vars={localData.outputs} onChange={(v) => handleChange('outputs', v)} />
              </div>
           </div>
        );
      default:
        return <div className="text-sm text-zinc-500">该节点类型暂无配置项</div>;
    }
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-[440px] bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 z-50">
       {/* Header */}
       <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">节点配置</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">ID: {node.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 transition-colors">
            <Icons.Close className="w-4 h-4" />
          </button>
       </div>

       {/* Common Fields */}
       <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
          <div className="mb-5">
             <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">节点名称</label>
             <input 
               type="text"
               value={localData.label || ''}
               onChange={(e) => handleChange('label', e.target.value)}
               className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
               placeholder="输入节点名称..."
             />
          </div>
          
          <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4" />
          
          {renderContent()}
       </div>

       {/* Footer */}
       <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
          <button 
             onClick={onClose}
             className="w-full py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
             <Icons.Save className="w-4 h-4" />
             完成配置
          </button>
       </div>
    </div>
  );
};


// --- Main Component ---

const initialNodes: Node<NodeData>[] = [
  { id: 'start', type: 'start', data: {}, position: { x: 50, y: 300 } },
  { id: 'llm-1', type: 'llm-text', data: { label: '意图识别', model: 'GPT-4o' }, position: { x: 250, y: 280 } },
  { id: 'dec-1', type: 'decision', data: { label: '是否需要搜索?', condition: 'need_search == true' }, position: { x: 550, y: 280 } },
  { id: 'end', type: 'end', data: {}, position: { x: 850, y: 300 } },
];

const initialEdges: Edge[] = [
  {
    id: 'e1',
    source: 'start',
    target: 'llm-1',
    type: 'custom',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a' },
    style: { stroke: '#71717a', strokeWidth: 2 }
  },
  {
    id: 'e2',
    source: 'llm-1',
    target: 'dec-1',
    type: 'custom',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a' },
    style: { stroke: '#71717a', strokeWidth: 2 }
  },
];

export const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const handle = useFullScreenHandle();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const nodeTypes = useMemo(() => ({
    'llm-text': TextNode,
    'llm-image': ImageNode,
    'llm-video': VideoNode,
    tool: ToolNode,
    decision: DecisionNode,
    branch: BranchNode,
    iteration: IterationNode,
    workflow: WorkflowNode,
    start: StartNode,
    end: EndNode
  }), []);

  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({
      ...params,
      type: 'custom',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a' },
      style: { stroke: '#71717a', strokeWidth: 2 }
    }, eds)),
    [setEdges]
  );

  // Handle edge deletion
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

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleNodesChange = useCallback((changes: any) => {
    const filteredChanges = changes.filter((change: any) => {
        if (change.type === 'remove') {
            const node = nodes.find(n => n.id === change.id);
            if (node && (node.type === 'start' || node.type === 'end')) {
                return false;
            }
        }
        return true;
    });
    onNodesChange(filteredChanges);
  }, [nodes, onNodesChange]);

  const updateNodeData = (nodeId: string, newData: NodeData) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === nodeId) {
        return { ...node, data: newData };
      }
      return node;
    }));
  };

  const selectedNode = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId) || null
  , [nodes, selectedNodeId]);

  const addNode = (type: string, label: string) => {
    const id = `${type}-${Date.now()}`;
    const position = { 
        x: 300 + Math.random() * 100, 
        y: 200 + Math.random() * 100 
    };
    
    const newNode: Node = {
      id,
      type,
      position,
      data: { label, inputs: [], outputs: [] }
    };

    setNodes((nds) => nds.concat(newNode));
    setIsAddMenuOpen(false);
    setTimeout(() => setSelectedNodeId(id), 100);
  };

  return (
    <FullScreen handle={handle} className="w-full h-full relative flex flex-col bg-zinc-50 dark:bg-[#09090b]">
      
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800">
        
        <div className="relative">
            <button 
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-sm"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              添加节点
              <Icons.ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            
            {isAddMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 origin-top-left flex flex-col">
                   <button onClick={() => addNode('llm-text', '文本生成')} className="px-3 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Icons.Type className="w-3.5 h-3.5 text-blue-500" />
                      文本生成
                   </button>
                   <button onClick={() => addNode('llm-image', '图片生成')} className="px-3 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Icons.Image className="w-3.5 h-3.5 text-purple-500" />
                      图片生成
                   </button>
                   <button onClick={() => addNode('llm-video', '视频生成')} className="px-3 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Icons.Video className="w-3.5 h-3.5 text-rose-500" />
                      视频生成
                   </button>
                   
                   <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1"></div>
                   
                   <button onClick={() => addNode('tool', '工具调用')} className="px-3 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Icons.Wrench className="w-3.5 h-3.5 text-orange-500" />
                      工具节点
                   </button>
                   <button onClick={() => addNode('workflow', '子工作流')} className="px-3 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Icons.Workflow className="w-3.5 h-3.5 text-indigo-500" />
                      子工作流
                   </button>
                   
                   <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1"></div>
                   
                   <button onClick={() => addNode('decision', '逻辑判断')} className="px-3 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Icons.Decision className="w-3.5 h-3.5 text-yellow-500" />
                      逻辑判断
                   </button>
                   <button onClick={() => addNode('branch', '分支流程')} className="px-3 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Icons.Branch className="w-3.5 h-3.5 text-cyan-500" />
                      分支流程
                   </button>
                   <button onClick={() => addNode('iteration', '循环迭代')} className="px-3 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Icons.Iteration className="w-3.5 h-3.5 text-pink-500" />
                      循环迭代
                   </button>
                </div>
            )}
        </div>

        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
        <button 
          onClick={handle.active ? handle.exit : handle.enter}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          title={handle.active ? "退出全屏" : "全屏"}
        >
          {handle.active ? <Icons.Minimize className="w-4 h-4" /> : <Icons.Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          proOptions={proOptions}
          fitView
          className="bg-zinc-50 dark:bg-[#09090b]"
        >
          <Background 
             className="!bg-zinc-50 dark:!bg-[#09090b]" 
             color="#71717a" 
             gap={20} 
             size={1} 
             style={{ opacity: 0.15 }}
          />
          <Controls 
             className="!bg-white dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-800 !shadow-lg [&>button]:!bg-white dark:[&>button]:!bg-zinc-900 [&>button]:!border-b-zinc-200 dark:[&>button]:!border-b-zinc-800 [&>button]:!fill-zinc-700 dark:[&>button]:!fill-zinc-300 hover:[&>button]:!bg-zinc-100 dark:hover:[&>button]:!bg-zinc-800"
          />
        </ReactFlow>
      </div>

      {/* Side Config Panel */}
      {selectedNode && (selectedNode.type !== 'start' && selectedNode.type !== 'end') && (
        <ConfigPanel 
           node={selectedNode} 
           nodes={nodes}
           onClose={() => setSelectedNodeId(null)} 
           onChange={updateNodeData}
        />
      )}
      
    </FullScreen>
  );
};