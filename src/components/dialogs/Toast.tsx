import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  let Icon = CheckCircle2;
  let bgClass = 'bg-emerald-50 border-emerald-300 text-emerald-900';
  let iconClass = 'text-emerald-600';

  if (toast.type === 'error') {
    Icon = AlertCircle;
    bgClass = 'bg-rose-50 border-rose-300 text-rose-900';
    iconClass = 'text-rose-600';
  } else if (toast.type === 'warning') {
    Icon = AlertCircle;
    bgClass = 'bg-amber-50 border-amber-300 text-amber-900';
    iconClass = 'text-amber-600';
  } else if (toast.type === 'info') {
    Icon = Info;
    bgClass = 'bg-blue-50 border-blue-300 text-blue-900';
    iconClass = 'text-blue-600';
  }

  return (
    <div
      className={`pointer-events-auto border rounded-md shadow-md p-3 flex items-start gap-2.5 transition-all animate-in slide-in-from-right-5 ${bgClass}`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconClass}`} />
      <div className="flex-1 text-xs">
        {toast.title && <div className="font-semibold mb-0.5">{toast.title}</div>}
        <div className="leading-normal">{toast.message}</div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
