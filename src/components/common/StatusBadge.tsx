import React from 'react';
import { ProjectStatus, MasterStatus, MaterialStatus, BOMMaterialStatus, PriceTrend } from '../../domain/types';

interface StatusBadgeProps {
  status:
    | ProjectStatus
    | MasterStatus
    | MaterialStatus
    | BOMMaterialStatus
    | PriceTrend
    | 'AVAILABLE'
    | 'NOT_AVAILABLE'
    | 'PARTIALLY_RECEIVED'
    | 'NOT_RECEIVED'
    | string;
  type?: 'project' | 'master' | 'material' | 'bom' | 'price' | 'invoice' | 'receiving';
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type, customLabel }) => {
  // Styles based on status value according to prompt rules:
  // Active/Complete/Available -> Green
  // In Progress/Purchasing -> Blue
  // Warning/Partial -> Yellow/Orange
  // Error/Missing/Delete/Attention -> Red
  // Archived/Inactive/Placeholder -> Gray

  let label = customLabel || status;
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    // Green
    case 'ACTIVE':
      label = customLabel || 'Đang hoạt động';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'COMPLETED':
      label = customLabel || 'Hoàn thành';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'FULFILLED':
    case 'FULLY_RECEIVED':
      label = customLabel || 'Đã nhận đủ';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'AVAILABLE':
      label = customLabel || 'Đã có HĐ';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;

    // Blue
    case 'IN_PROGRESS':
      label = customLabel || 'Đang thực hiện';
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'PURCHASING':
    case 'ORDERED':
      label = customLabel || 'Đã đặt hàng';
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;

    // Orange/Yellow
    case 'PARTIALLY_RECEIVED':
      label = customLabel || 'Nhận 1 phần';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
      break;
    case 'AWAITING_PAYMENT':
      label = customLabel || 'Chờ thanh toán';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
      break;
    case 'ON_HOLD':
      label = customLabel || 'Tạm dừng';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
      break;
    case 'INCREASED':
      label = customLabel || 'Tăng giá ▲';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'DECREASED':
      label = customLabel || 'Giảm giá ▼';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'UNCHANGED':
      label = customLabel || 'Không đổi ━';
      colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
    case 'NO_PRICE':
      label = customLabel || 'Chưa có giá';
      colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
      break;

    // Red
    case 'RETURN_OR_EXCHANGE':
      label = customLabel || 'Đang trả / đổi hàng';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'ATTENTION_NEEDED':
      label = customLabel || 'Cần chú ý';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'NOT_PURCHASED':
    case 'AWAITING_QUOTATION':
      label = customLabel || 'Đang chờ báo giá';
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
    case 'INTERNAL_REVIEW':
      label = customLabel || 'Kiểm tra nội bộ';
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
    case 'NOT_AVAILABLE':
      label = customLabel || 'Chưa có';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'NOT_RECEIVED':
      label = customLabel || 'Chưa nhận';
      colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
      break;

    // Gray
    case 'INACTIVE':
      label = customLabel || 'Ngưng hoạt động';
      colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
      break;
    case 'ARCHIVED':
      label = customLabel || 'Lưu trữ';
      colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${colorClass}`}
    >
      {label}
    </span>
  );
};
