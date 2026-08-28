import React from 'react';
import { Layers, X, AlertCircle } from 'lucide-react';
import { SpecBadge } from '../common/SpecBadge';

interface PlaceholderDialogProps {
  isOpen: boolean;
  title: string;
  capabilityName: string;
  description: string;
  notes?: string;
  onClose: () => void;
}

export const PlaceholderDialog: React.FC<PlaceholderDialogProps> = ({
  isOpen,
  title,
  capabilityName,
  description,
  notes,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-amber-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <SpecBadge />
              </div>
              <p className="text-xs text-slate-500">{capabilityName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-sm text-slate-700">
          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-md text-xs text-amber-900 space-y-1.5">
            <div className="font-semibold flex items-center gap-1 text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Ghi chú quản trị SPEC Prototype V0</span>
            </div>
            <p className="leading-relaxed">{description}</p>
          </div>

          {notes && (
            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
              <span className="font-semibold text-slate-800">Kế hoạch triển khai dự kiến:</span>
              <p>{notes}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded transition"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
