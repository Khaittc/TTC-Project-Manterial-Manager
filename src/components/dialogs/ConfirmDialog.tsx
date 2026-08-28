import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  warningNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isBlocked?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  warningNote,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  type = 'warning',
  onConfirm,
  onCancel,
  isBlocked = false,
}) => {
  if (!isOpen) return null;

  let Icon = AlertTriangle;
  let iconBg = 'bg-amber-100 text-amber-700';
  let confirmBtnClass = 'bg-amber-600 hover:bg-amber-700 text-white';

  if (type === 'danger') {
    Icon = AlertTriangle;
    iconBg = 'bg-rose-100 text-rose-700';
    confirmBtnClass = 'bg-rose-600 hover:bg-rose-700 text-white';
  } else if (type === 'info') {
    Icon = Info;
    iconBg = 'bg-blue-100 text-blue-700';
    confirmBtnClass = 'bg-blue-600 hover:bg-blue-700 text-white';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full flex-shrink-0 ${iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900 leading-6">{title}</h3>
              <div className="mt-2 text-sm text-slate-600">{message}</div>

              {warningNote && (
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span>{warningNote}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            {isBlocked ? 'Đóng' : cancelLabel}
          </button>
          {!isBlocked && (
            <button
              type="button"
              onClick={onConfirm}
              className={`px-3.5 py-1.5 text-xs font-medium rounded transition ${confirmBtnClass}`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
