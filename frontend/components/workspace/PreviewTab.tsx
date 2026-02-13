import React, { useState, useEffect } from 'react';
import { Icons } from '../icons';
import { A2UIAction } from '../../types';

interface PreviewTabProps {
  data?: A2UIAction | null;
  onSubmit?: (id: string, formData: any) => void;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({ data, onSubmit }) => {
  const [formValues, setFormValues] = useState<any>({});

  // Reset form values when data changes
  useEffect(() => {
    if (data?.formSchema?.fields) {
      const initialvalues: any = {};
      data.formSchema.fields.forEach(field => {
        initialvalues[field.name] = field.defaultValue ?? '';
      });
      // If already submitted, use the submitted data
      if (data.status === 'submitted' && data.submissionData) {
        setFormValues(data.submissionData);
      } else {
        setFormValues(initialvalues);
      }
    }
  }, [data]);

  const handleChange = (name: string, value: any) => {
    if (data?.status === 'submitted') return;
    setFormValues((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (data && onSubmit) {
      onSubmit(data.id, formValues);
    }
  };

  if (!data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-6">
           <Icons.LayoutTemplate className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
        </div>
        <h3 className="text-zinc-900 dark:text-zinc-100 font-medium mb-2 text-lg">暂无预览内容</h3>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
          当 Agent 生成交互式表单时，点击左侧对话中的操作卡片即可在此处预览并填写。
        </p>
      </div>
    );
  }

  const isSubmitted = data.status === 'submitted';
  const { title, description, fields } = data.formSchema;

  return (
    <div className="w-full h-full bg-zinc-50/50 dark:bg-[#1e1e1e] p-4 sm:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-md mx-auto border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
        
        {/* Form Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm">
           <div className="flex items-center gap-2 mb-1">
             <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Icons.Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
             </div>
             <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
           </div>
           {description && <p className="text-xs text-zinc-500 ml-9">{description}</p>}
        </div>

        {/* Form Fields */}
        <div className="p-6 space-y-5">
           {fields.map((field, idx) => (
             <div key={idx} className="space-y-1.5 group">
               <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                 {field.label}
               </label>
               
               {field.type === 'select' ? (
                 <div className="relative">
                   <select 
                     disabled={isSubmitted}
                     value={formValues[field.name] || ''}
                     onChange={(e) => handleChange(field.name, e.target.value)}
                     className="w-full appearance-none px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed"
                   >
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                   </select>
                   <Icons.ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                 </div>
               ) : field.type === 'checkbox' ? (
                 <label className={`flex items-center gap-3 p-3 border border-zinc-100 dark:border-zinc-800/50 rounded-lg transition-colors ${!isSubmitted ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                    <input 
                      type="checkbox" 
                      disabled={isSubmitted}
                      checked={!!formValues[field.name]}
                      onChange={(e) => handleChange(field.name, e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 select-none">启用该选项</span>
                 </label>
               ) : (
                 <input 
                   type={field.type} 
                   disabled={isSubmitted}
                   placeholder={field.placeholder}
                   value={formValues[field.name] || ''}
                   onChange={(e) => handleChange(field.name, e.target.value)}
                   className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 disabled:opacity-60 disabled:cursor-not-allowed"
                 />
               )}
             </div>
           ))}

           <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-6">
             {isSubmitted ? (
               <div className="w-full py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-green-200 dark:border-green-800/50">
                 <Icons.Check className="w-4 h-4" />
                 已提交
               </div>
             ) : (
               <div className="flex gap-3">
                  <button className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    重置
                  </button>
                  <button 
                    onClick={handleSubmit}
                    className="flex-1 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-zinc-500/10"
                  >
                    提交配置
                  </button>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};