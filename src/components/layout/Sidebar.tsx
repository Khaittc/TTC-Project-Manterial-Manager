import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  FolderKanban,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Sliders,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MenuKey } from '../../domain/types';

interface MenuItem {
  key: MenuKey;
  label: string;
  path: string;
  icon: React.ElementType;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'ĐIỀU HÀNH',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { key: 'monitoring', label: 'Giám sát vật tư dự án', path: '/project-material-monitoring', icon: Activity },
    ],
  },
  {
    title: 'DỰ ÁN & VẬT TƯ',
    items: [
      { key: 'projects', label: 'Quản lý dự án', path: '/projects/PRJ-001', icon: FolderKanban },
      { key: 'materials', label: 'Danh mục vật tư', path: '/materials', icon: Boxes },
    ],
  },
  {
    title: 'QUẢN LÝ KHO',
    items: [
      { key: 'stock-in', label: 'Nhập kho', path: '/inventory/stock-in', icon: ArrowDownToLine },
      { key: 'stock-out', label: 'Xuất kho', path: '/inventory/stock-out', icon: ArrowUpFromLine },
      { key: 'history', label: 'Lịch sử', path: '/inventory/history', icon: History },
    ],
  },
  {
    title: 'HỆ THỐNG',
    items: [
      { key: 'system-masters', label: 'Danh mục hệ thống', path: '/system-masters', icon: Sliders },
      { key: 'administration', label: 'Người dùng', path: '/administration', icon: Users },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { isSidebarCollapsed, toggleSidebar, effectiveUIVisibility, currentUser, roles } = useApp();

  const userRolesList = (roles || []).filter((r) => currentUser?.roleIds?.includes(r.id));
  const roleNames = userRolesList.map((r) => r.name).join(', ') || 'Chưa gán vai trò';

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 bg-slate-900 text-slate-300 z-30 flex flex-col border-r border-slate-800 transition-all duration-200 select-none ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800 bg-slate-950/60">
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-white tracking-wide truncate">TTC Project Material</h1>
              <p className="text-[10px] text-slate-400 truncate">Materials & Inventory</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              <Package className="w-4 h-4" />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          className={`p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition ${
            isSidebarCollapsed ? 'hidden' : 'block'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {MENU_GROUPS.map((group) => {
          // Filter visible items according to effective role visibility
          const visibleItems = group.items.filter((item) => effectiveUIVisibility.has(item.key));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {group.title}
                </div>
              )}

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapse button on collapsed view */}
      {isSidebarCollapsed && (
        <div className="p-2 border-t border-slate-800 flex justify-center">
          <button
            type="button"
            onClick={toggleSidebar}
            title="Mở rộng sidebar"
            className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer User Profile & Version */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {!isSidebarCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{currentUser.fullName}</p>
                <p className="text-[10px] text-blue-400 flex items-center gap-1 truncate">
                  <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                  <span>{roleNames}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Prototype v0.1.0</span>
              <span className="text-slate-400">Mock Data</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-center">
            <div
              title={`${currentUser.fullName} (${roleNames})`}
              className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs"
            >
              {currentUser.fullName.charAt(0)}
            </div>
            <span className="text-[9px] text-slate-400">v0.1</span>
          </div>
        )}
      </div>
    </aside>
  );
};
