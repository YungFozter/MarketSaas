import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './Toast.css';

export const Toast = () => {
  const { toast } = useStore();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />
  };

  const bgColors = {
    success: 'bg-white border-emerald-200 text-emerald-950 shadow-emerald-500/10',
    warning: 'bg-white border-amber-200 text-amber-950 shadow-amber-500/10',
    error: 'bg-white border-rose-200 text-rose-950 shadow-rose-500/10',
    info: 'bg-white border-blue-200 text-blue-950 shadow-blue-500/10'
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-bounce-gentle max-w-sm w-[calc(100%-2rem)] sm:w-full transition-all duration-300">
      <div className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-xl ${bgColors[toast.type] || bgColors.success}`}>
        {icons[toast.type] || icons.success}
        <p className="text-xs sm:text-sm font-medium leading-snug flex-1">{toast.message}</p>
      </div>
    </div>
  );
};
