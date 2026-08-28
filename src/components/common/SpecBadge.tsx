import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SpecBadgeProps {
  label?: string;
  tooltip?: string;
  className?: string;
}

export const SpecBadge: React.FC<SpecBadgeProps> = ({
  label = 'Chờ chốt SPEC',
  tooltip = 'Tính năng này đang là mô phỏng UI Prototype V0, chưa chốt SPEC production.',
  className = '',
}) => {
  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-300 select-none cursor-help ${className}`}
    >
      <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0" />
      <span>{label}</span>
    </span>
  );
};
