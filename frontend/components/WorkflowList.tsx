import React, { useState } from 'react';
import { Workflow } from '../types';
import { Icons } from './icons';

interface WorkflowListProps {
  onSelectWorkflow: (workflow: Workflow) => void;
}

// Mock Workflow Data with README
const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    name: '代码审查助手 Agent',
    description: '自动分析 Pull Request 代码变更，检查潜在 Bug、安全漏洞并提供优化建议。',
    source: 'official',
    author: 'Ant Studio',
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    tags: ['DevOps', 'Code Review', 'AI'],
    version: '2.1.0',
    downloads: 12453,
    rating: 4.8,
    readme: `# 代码审查助手 Agent

## 概述

代码审查助手是一个基于 AI 的自动化代码审查工作流，能够智能分析 Pull Request 中的代码变更，识别潜在的 Bug、安全漏洞，并提供优化建议。

## 主要功能

### 🔍 智能代码分析
- **静态代码扫描**: 检测常见的代码错误和反模式
- **安全漏洞检测**: 识别 SQL 注入、XSS、CSRF 等安全问题
- **性能优化建议**: 分析代码性能瓶颈，提供优化方案

### 📊 详细的审查报告
- 按严重程度分类问题（Critical、High、Medium、Low）
- 提供具体的代码位置和修复建议
- 生成可视化的代码质量报告

### 🔄 无缝集成
- 支持 GitHub、GitLab、Bitbucket
- 与 CI/CD 流程深度整合
- 自动在 PR 中添加审查评论

## 使用场景

1. **代码提交前审查**: 在代码合并前自动检查质量
2. **定期代码扫描**: 周期性扫描代码库，发现潜在问题
3. **新人代码指导**: 为初级开发者提供即时反馈

## 快速开始

### 前置条件
- Git 代码仓库
- API Token（GitHub/GitLab）
- LLM API Key（GPT-4 或 Claude）

### 配置步骤

1. **安装工作流**: 点击右上角"安装工作流"按钮
2. **配置 Git 集成**: 在节点中填入仓库 URL 和 Token
3. **设置 AI 模型**: 选择 GPT-4 或 Claude 模型
4. **运行测试**: 创建一个测试 PR 验证功能

## 节点说明

### Start 节点
接收 PR 信息（PR URL、分支名称等）

### Code Fetch 节点
从 Git 仓库拉取代码变更

### AI Analysis 节点
使用 LLM 分析代码，识别问题

### Report Generator 节点
生成结构化的审查报告

### Comment Poster 节点
将审查结果自动发布到 PR 评论

## 自定义选项

- **检查规则**: 可自定义要检查的规则集
- **严重程度阈值**: 设置触发告警的最低严重级别
- **报告格式**: 支持 Markdown、HTML、JSON 多种格式
- **通知渠道**: 可配置 Slack、Email、钉钉通知

## 最佳实践

1. 建议在 CI pipeline 的早期阶段运行
2. 为不同项目配置不同的规则集
3. 结合人工审查，AI 建议仅作参考
4. 定期更新 AI 模型以获得最佳效果

## 技术支持

如遇到问题，请访问 [帮助文档](https://docs.antstudio.ai) 或联系 support@antstudio.ai`
  },
  {
    id: 'wf-2',
    name: '社交媒体文案生成器',
    description: '根据产品特性自动生成适用于 Twitter、LinkedIn 和小红书的多风格营销文案。',
    source: 'community',
    author: 'MarketingPro',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    tags: ['Marketing', 'Content', 'Social Media'],
    version: '1.5.2',
    downloads: 8932,
    rating: 4.6,
    readme: `# 社交媒体文案生成器

## 功能介绍

一键生成适配多个社交媒体平台的营销文案，支持 Twitter、LinkedIn、小红书、微博等主流平台。

## 主要特性

- **多平台适配**: 自动调整内容长度和风格
- **风格多样**: 正式、轻松、幽默等多种风格
- **SEO 优化**: 自动添加相关标签和关键词
- **A/B 测试**: 生成多个版本供选择

## 使用方法

1. 输入产品信息
2. 选择目标平台
3. 选择文案风格
4. 一键生成并复制`
  },
  {
    id: 'wf-3',
    name: '数据清洗与提取流水线',
    description: '从非结构化 PDF 和网页中提取关键字段，转换为 JSON 格式并存入数据库。',
    source: 'user',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    tags: ['Data', 'ETL', 'Automation'],
    version: '1.0.0',
    readme: `# 数据清洗与提取流水线

## 概述

自动从 PDF 和网页提取结构化数据的 ETL 工作流。

## 功能
- PDF 文本提取
- 网页爬取
- 数据清洗
- JSON 转换
- 数据库存储`
  },
  {
    id: 'wf-4',
    name: '客户工单自动分类',
    description: '使用 NLP 模型分析客户工单情感与意图，自动分派给对应的支持团队。',
    source: 'official',
    author: 'Ant Studio',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    tags: ['Support', 'Automation', 'NLP'],
    version: '3.0.1',
    downloads: 15672,
    rating: 4.9,
    readme: `# 客户工单自动分类

## 智能工单处理

使用先进的 NLP 模型自动分析客户工单，识别情感和意图，智能分派给最合适的支持团队。

## 核心功能

### 情感分析
- 识别客户情绪（正面、负面、中性）
- 检测紧急程度
- 优先级自动排序

### 意图识别
- 技术支持
- 账户问题
- 退款申请
- 功能咨询

### 自动分派
- 智能路由到对应团队
- 负载均衡
- SLA 监控`
  }
];

export const WorkflowList: React.FC<WorkflowListProps> = ({ onSelectWorkflow }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim()) return;

    const newWorkflow: Workflow = {
      id: `wf-${Date.now()}`,
      name: newWfName,
      description: newWfDesc || '暂无描述',
      source: 'user',
      updatedAt: Date.now(),
      tags: ['New']
    };

    setWorkflows([newWorkflow, ...workflows]);
    onSelectWorkflow(newWorkflow);
    
    // Reset and close
    setNewWfName('');
    setNewWfDesc('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-black overflow-hidden h-full relative">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-900 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">工作流库</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            <Icons.Plus className="w-4 h-4" />
            新建工作流
          </button>
        </div>
        
        {/* Search & Filter */}
        <div className="relative">
          <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="搜索工作流..." 
            className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        {workflows.map((wf) => (
          <div 
            key={wf.id}
            onClick={() => onSelectWorkflow(wf)}
            className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg hover:border-blue-500/30 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                 {wf.source === 'official' ? (
                   <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                     <Icons.Zap className="w-4 h-4" />
                   </div>
                 ) : wf.source === 'community' ? (
                   <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                     <Icons.Globe className="w-4 h-4" />
                   </div>
                 ) : (
                   <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                     <Icons.User className="w-4 h-4" />
                   </div>
                 )}
                 <h3 className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                   {wf.name}
                 </h3>
              </div>
              
              <div className="flex items-center gap-2">
                 {wf.source === 'official' && (
                   <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                     OFFICIAL
                   </span>
                 )}
                 {wf.source === 'community' && (
                   <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-[10px] font-bold text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30">
                     COMMUNITY
                   </span>
                 )}
              </div>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-2">
              {wf.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
               <div className="flex gap-2">
                 {wf.tags?.map(tag => (
                   <span key={tag} className="text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded">
                     #{tag}
                   </span>
                 ))}
               </div>
               <div className="text-[10px] text-zinc-400">
                  {new Date(wf.updatedAt).toLocaleDateString()} 更新
               </div>
            </div>

            {/* Hover Action */}
            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
               <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg shadow-blue-500/20">
                 打开编辑器
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Creation Modal - Fixed Full Screen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-50 dark:bg-[#18181b] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800 flex flex-col">
             
             {/* Header */}
             <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] flex justify-between items-center">
               <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">新建工作流</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
                 <Icons.Close className="w-5 h-5" />
               </button>
             </div>
             
             {/* Body */}
             <form onSubmit={handleCreate} className="p-6 space-y-5">
                <div>
                   <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                     <Icons.Zap className="w-4 h-4 text-blue-500" />
                     名称
                   </label>
                   <input 
                     type="text" 
                     value={newWfName}
                     onChange={e => setNewWfName(e.target.value)}
                     placeholder="例如：自动数据分析流程"
                     className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 shadow-sm"
                     autoFocus
                   />
                </div>
                <div>
                   <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                     <Icons.File className="w-4 h-4 text-zinc-500" />
                     简介
                   </label>
                   <textarea 
                     value={newWfDesc}
                     onChange={e => setNewWfDesc(e.target.value)}
                     placeholder="描述这个工作流的主要功能..."
                     className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 resize-none h-32 custom-scrollbar shadow-sm"
                   />
                </div>
             </form>
             
             {/* Footer */}
             <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsModalOpen(false)}
                   className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleCreate}
                   disabled={!newWfName.trim()}
                   className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                 >
                   创建工作流
                 </button>
             </div>

          </div>
        </div>
      )}
    </div>
  );
};