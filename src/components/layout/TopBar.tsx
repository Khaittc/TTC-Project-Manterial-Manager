import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  RotateCcw,
  UserCheck,
  Bell,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConfirmDialog } from '../dialogs/ConfirmDialog';

export const TopBar: React.FC = () => {
  const location = useLocation();
  const { isSidebarCollapsed, users, currentUserId, setCurrentUserId, resetDemoData, actionItems } = useApp();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Derive breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return ['Điều hành', 'Dashboard'];
    if (path.startsWith('/project-material-monitoring')) return ['Điều hành', 'Giám sát vật tư dự án'];
    if (path.startsWith('/projects/')) return ['Dự án & Vật tư', 'Quản lý dự án'];
    if (path === '/materials/new') return ['Dự án & Vật tư', 'Danh mục vật tư', 'Thêm mới'];
    if (path.includes('/materials/') && path.endsWith('/edit')) return ['Dự án & Vật tư', 'Danh mục vật tư', 'Chỉnh sửa'];
    if (path.startsWith('/materials/')) return ['Dự án & Vật tư', 'Danh mục vật tư', 'Chi tiết vật tư'];
    if (path.startsWith('/materials')) return ['Dự án & Vật tư', 'Danh mục vật tư'];
    if (path.startsWith('/suppliers/')) return ['Hệ thống', 'Danh mục hệ thống', 'Chi tiết Nhà cung cấp'];
    if (path.startsWith('/inventory/stock-in')) return ['Quản lý kho', 'Nhập kho'];
    if (path.startsWith('/inventory/stock-out')) return ['Quản lý kho', 'Xuất kho'];
    if (path.startsWith('/inventory/history')) return ['Quản lý kho', 'Lịch sử kho'];
    if (path.startsWith('/system-masters')) return ['Hệ thống', 'Danh mục hệ thống'];
    if (path.startsWith('/administration')) return ['Hệ thống', 'Người dùng & Phân quyền'];
    return ['Điều hành', 'Dashboard'];
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = breadcrumbs[breadcrumbs.length - 1];

  return (
    <>
      <header
        className={`fixed top-0 right-0 z-20 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 transition-all duration-200 ${
          isSidebarCollapsed ? 'left-16' : 'left-64'
        }`}
      >
        {/* Left: Breadcrumbs and Title */}
        <div className="flex items-center gap-3 min-w-0">
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? 'font-semibold text-slate-900 truncate'
                      : 'hover:text-slate-700'
                  }
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
          <div className="sm:hidden font-bold text-sm text-slate-900 truncate">{pageTitle}</div>
        </div>

        {/* Center/Right: Prototype Badge + Role Selector + Reset Button */}
        <div className="flex items-center gap-3">
          {/* Required Governance Badge */}
          <div
            title="Phiên bản thử nghiệm giao diện người dùng. Không kết nối cơ sở dữ liệu thật."
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold tracking-tight select-none shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>PROTOTYPE V0 · MOCK DATA · NOT PRODUCTION</span>
          </div>

          {/* Demo Persona Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-blue-600 ml-1 flex-shrink-0" />
            <select
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
              title="Đổi persona để xem mô phỏng phân quyền giao diện và thao tác"
              className="bg-transparent text-xs font-semibold text-slate-800 pr-2 py-0.5 focus:outline-none cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username === 'admin'
                    ? 'Admin Demo (Full Access)'
                    : u.username === 'warehouse.manager'
                    ? 'Quản lý kho'
                    : u.username === 'engineer01'
                    ? 'Kỹ sư dự án'
                    : 'Kỹ sư dự toán'}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Demo Data Button */}
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            title="Khôi phục toàn bộ dữ liệu demo về trạng thái ban đầu"
            className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs font-medium flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Khôi phục Demo</span>
          </button>

          {/* Notifications / Pending action count */}
          <div className="relative">
            <button
              type="button"
              title={`${actionItems.length} việc cần xử lý`}
              className="p-1.5 rounded-full text-slate-600 hover:bg-slate-100 transition relative"
            >
              <Bell className="w-4 h-4" />
              {actionItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {actionItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Khôi phục dữ liệu Demo ban đầu?"
        message="Thao tác này sẽ xóa tất cả các thay đổi mock data bạn vừa chỉnh sửa trong phiên làm việc và nạp lại 100% dữ liệu gốc ban đầu."
        warningNote="Toàn bộ lịch sử thêm mới, sửa giá, phân bổ kho mock sẽ được đặt lại."
        confirmLabel="Xác nhận khôi phục"
        cancelLabel="Hủy bỏ"
        type="warning"
        onConfirm={() => {
          resetDemoData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </>
  );
};
