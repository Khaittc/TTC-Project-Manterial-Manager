import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionIconBtnProps {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'danger' | 'primary' | 'success';
  disabled?: boolean;
  disabledTooltip?: string;
  size?: 'sm' | 'md';
}

export const ActionIconBtn: React.FC<ActionIconBtnProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
  disabledTooltip,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'p-1' : 'p-1.5';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  let colorClasses = 'text-slate-500 hover:text-slate-900 hover:bg-slate-100';
  if (variant === 'danger') {
    colorClasses = 'text-rose-500 hover:text-rose-700 hover:bg-rose-50';
  } else if (variant === 'primary') {
    colorClasses = 'text-blue-600 hover:text-blue-800 hover:bg-blue-50';
  } else if (variant === 'success') {
    colorClasses = 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50';
  }

  if (disabled) {
    colorClasses = 'text-slate-300 bg-transparent cursor-not-allowed';
  }

  return (
    <button
      type="button"
      title={disabled && disabledTooltip ? disabledTooltip : label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick(e);
      }}
      className={`rounded transition-colors flex items-center justify-center ${sizeClasses} ${colorClasses}`}
    >
      <Icon className={iconSize} />
    </button>
  );
};
