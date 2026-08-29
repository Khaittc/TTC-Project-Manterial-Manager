import React, { useState, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Save,
  Key,
  Info,
  ChevronLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FormField } from '../../components/forms/FormField';
import { SpecBadge } from '../../components/common/SpecBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionIconBtn } from '../../components/common/ActionIconBtn';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { User, Role, MenuKey, MasterStatus } from '../../domain/types';

const ALL_MENU_KEYS: { key: MenuKey; label: string; group: string }[] = [
  { key: 'dashboard', label: 'Dashboard điều hành', group: 'ĐIỀU HÀNH' },
  { key: 'monitoring', label: 'Giám sát vật tư dự án', group: 'ĐIỀU HÀNH' },
  { key: 'projects', label: 'Quản lý dự án & BOM', group: 'DỰ ÁN & VẬT TƯ' },
  { key: 'materials', label: 'Danh mục vật tư', group: 'DỰ ÁN & VẬT TƯ' },
  { key: 'stock-in', label: 'Quản lý Nhập kho', group: 'QUẢN LÝ KHO' },
  { key: 'stock-out', label: 'Quản lý Xuất kho', group: 'QUẢN LÝ KHO' },
  { key: 'history', label: 'Lịch sử giao dịch kho', group: 'QUẢN LÝ KHO' },
  { key: 'system-masters', label: 'Danh mục hệ thống', group: 'HỆ THỐNG' },
  { key: 'administration', label: 'Người dùng & Phân quyền', group: 'HỆ THỐNG' },
];

const DOMAIN_ACTIONS: { domain: string; domainName: string; actions: string[] }[] = [
  { domain: 'material', domainName: 'Danh mục vật tư', actions: ['view', 'create', 'edit', 'delete', 'import'] },
  { domain: 'supplierPrice', domainName: 'Bảng giá nhà cung cấp', actions: ['view', 'edit', 'set_preferred', 'import'] },
  { domain: 'project', domainName: 'Quản lý dự án', actions: ['view', 'create', 'edit', 'delete'] },
  { domain: 'bom', domainName: 'Quản lý BOM', actions: ['view', 'edit', 'import', 'select_supplier'] },
  { domain: 'warehouse', domainName: 'Quản lý Kho', actions: ['stock_in', 'stock_out', 'receive_goods'] },
  { domain: 'systemMasters', domainName: 'Danh mục hệ thống', actions: ['view', 'create', 'edit', 'delete'] },
  { domain: 'administration', domainName: 'Quản trị hệ thống', actions: ['view', 'manage_users', 'manage_roles'] },
];

export const AdministrationPage: React.FC = () => {
  const {
    users,
    roles,
    saveUser,
    deleteUser,
    updateRolePermissions,
    updateRoleActionPermissions,
    setCurrentUserId,
    currentUserId,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  // --- USER TAB STATE ---
  const [userModal, setUserModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    user: Partial<User>;
  }>({ isOpen: false, mode: 'create', user: {} });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    userId: string | null;
  }>({ isOpen: false, userId: null });

  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    userId: string;
    newPassword: '';
    confirmPassword: '';
  } | null>(null);

  // --- ROLE TAB STATE ---
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleDetailTab, setRoleDetailTab] = useState<'ui' | 'action'>('ui');

  // User Handlers
  const handleOpenAddUser = () => {
    setUserModal({
      isOpen: true,
      mode: 'create',
      user: {
        username: '',
        fullName: '',
        password: '',
        roleIds: [roles[0]?.id || ''],
        status: 'ACTIVE',
      },
    });
  };

  const handleOpenEditUser = (u: User) => {
    setUserModal({
      isOpen: true,
      mode: 'edit',
      user: { ...u, roleIds: [...u.roleIds] }, // Do not include password field for edit
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userModal.user.username || !userModal.user.fullName) return;
    if (userModal.mode === 'create' && !userModal.user.password) {
      addToast('error', 'Mật khẩu là bắt buộc khi tạo mới.');
      return;
    }

    const res = saveUser({
      ...userModal.user,
      roleIds: userModal.user.roleIds || [roles[0]?.id],
      status: userModal.user.status || 'ACTIVE',
    });

    if (res.success) {
      setUserModal({ isOpen: false, mode: 'create', user: {} });
    } else {
      addToast('error', res.message || 'Có lỗi xảy ra.');
    }
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModal) return;
    if (resetPasswordModal.newPassword !== resetPasswordModal.confirmPassword) {
      addToast('error', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!resetPasswordModal.newPassword) {
      addToast('error', 'Mật khẩu không được để trống.');
      return;
    }

    saveUser({
      id: resetPasswordModal.userId,
      password: resetPasswordModal.newPassword,
    });
    setResetPasswordModal(null);
    addToast('success', 'Đặt lại mật khẩu thành công.');
  };

  const handleDeleteUser = () => {
    if (deleteConfirm.userId) {
      const res = deleteUser(deleteConfirm.userId);
      if (!res.success) {
        addToast('error', res.message || 'Lỗi xóa người dùng');
      }
    }
    setDeleteConfirm({ isOpen: false, userId: null });
  };

  // Role Handlers
  const handleToggleUIPermission = (menuKey: MenuKey) => {
    if (!selectedRole || selectedRole.isSystemProtected) return;

    const currentMenus = selectedRole.uiVisibility || selectedRole.allowedMenus || [];
    const newMenus = currentMenus.includes(menuKey)
      ? currentMenus.filter((k) => k !== menuKey)
      : [...currentMenus, menuKey];

    updateRolePermissions(selectedRole.id, newMenus);
    setSelectedRole({ ...selectedRole, uiVisibility: newMenus }); // optimistically update local state for fast UI
  };

  const handleToggleActionPermission = (domain: string, action: string) => {
    if (!selectedRole || selectedRole.isSystemProtected) return;

    const currentActions = { ...(selectedRole.actionPermissions as any) };
    if (!currentActions[domain]) currentActions[domain] = {};
    
    currentActions[domain] = {
       ...currentActions[domain],
       [action]: !currentActions[domain][action]
    };

    updateRoleActionPermissions(selectedRole.id, currentActions);
    setSelectedRole({ ...selectedRole, actionPermissions: currentActions });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Người dùng & Phân quyền</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý tài khoản nhân sự, vai trò nghiệp vụ và ma trận quyền hạn truy cập hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SpecBadge label="Role-Based Access Control" tooltip="Mô phỏng phân quyền động trực tiếp trong phiên làm việc" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 rounded-t-lg">
        <button
          type="button"
          onClick={() => { setActiveTab('users'); setSelectedRole(null); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh sách người dùng ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('roles'); setSelectedRole(null); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Danh sách Vai trò ({roles.length})</span>
        </button>
      </div>

      {/* TAB 1: DANH SÁCH NGƯỜI DÙNG */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 flex items-center gap-4">
              <div>
                Có tổng cộng <span className="font-bold text-slate-900">{users.length}</span> tài khoản được cấp quyền
              </div>
              
              {/* Demo Persona Switcher outside governed table */}
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                <span className="font-semibold text-blue-800 uppercase tracking-wider text-[10px]">Demo Persona:</span>
                <select
                  value={currentUserId}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                  className="text-xs bg-white border border-blue-200 rounded px-2 py-0.5 font-bold text-blue-900 focus:outline-none"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddUser}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm người dùng</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Tài khoản</th>
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {users.map((u) => {
                  const userRoles = roles.filter((r) => (u.roleIds || []).includes(r.id));

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50 transition`}>
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">{u.username}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{u.fullName}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {userRoles.map((r) => (
                            <span
                              key={r.id}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {r.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={u.status} type="master" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ActionIconBtn
                            icon={Key}
                            label="Đặt lại mật khẩu"
                            onClick={() => setResetPasswordModal({ userId: u.id, newPassword: '', confirmPassword: '' })}
                          />
                          <ActionIconBtn
                            icon={Pencil}
                            label="Sửa thông tin"
                            onClick={() => handleOpenEditUser(u)}
                          />
                          <ActionIconBtn
                            icon={Trash2}
                            label="Xóa tài khoản"
                            variant="danger"
                            onClick={() => setDeleteConfirm({ isOpen: true, userId: u.id })}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VAI TRÒ & PHÂN QUYỀN */}
      {activeTab === 'roles' && !selectedRole && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Tên vai trò</th>
                  <th className="px-4 py-3 text-center">Số lượng User</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {roles.map((r) => {
                  const assignedCount = users.filter((u) => u.roleIds?.includes(r.id)).length;
                  
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{r.description || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {assignedCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.isSystemProtected ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            Hệ thống
                          </span>
                        ) : (
                          <StatusBadge status={r.status || 'ACTIVE'} type="master" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedRole(r)}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-[10px] font-semibold transition"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROLE DETAIL VIEW */}
      {activeTab === 'roles' && selectedRole && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedRole(null)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại danh sách Vai trò</span>
          </button>
          
          <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-2xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">{selectedRole.name}</h2>
                {selectedRole.isSystemProtected ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    Vai trò hệ thống — Toàn quyền — Chỉ đọc
                  </span>
                ) : (
                  <StatusBadge status={selectedRole.status || 'ACTIVE'} type="master" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedRole.description}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Người dùng</div>
              <div className="text-base font-bold text-slate-900">
                {users.filter(u => u.roleIds?.includes(selectedRole.id)).length}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-slate-200">
            <button
              onClick={() => setRoleDetailTab('ui')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
                roleDetailTab === 'ui' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Quyền giao diện
            </button>
            <button
              onClick={() => setRoleDetailTab('action')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
                roleDetailTab === 'action' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Quyền thao tác
            </button>
          </div>

          {/* Quyền giao diện (UI Visibility) */}
          {roleDetailTab === 'ui' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-2xs p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Hiển thị Menu / Phân hệ</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {['ĐIỀU HÀNH', 'DỰ ÁN & VẬT TƯ', 'QUẢN LÝ KHO', 'HỆ THỐNG'].map((group) => {
                  const groupMenus = ALL_MENU_KEYS.filter(m => m.group === group);
                  if (groupMenus.length === 0) return null;
                  return (
                    <div key={group} className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group}</h4>
                      <div className="space-y-1.5">
                        {groupMenus.map(menu => {
                          const hasAccess = selectedRole.isSystemProtected || (selectedRole.uiVisibility || []).includes(menu.key);
                          return (
                            <label key={menu.key} className={`flex items-center gap-2 text-xs ${selectedRole.isSystemProtected ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50 rounded p-1 -ml-1'}`}>
                              <input
                                type="checkbox"
                                checked={hasAccess}
                                disabled={selectedRole.isSystemProtected}
                                onChange={() => handleToggleUIPermission(menu.key)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 disabled:opacity-50"
                              />
                              <span className="font-semibold text-slate-700">{menu.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quyền thao tác (Action Permissions) */}
          {roleDetailTab === 'action' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
               <div className="p-4 border-b border-slate-200 bg-slate-50">
                 <h3 className="text-sm font-bold text-slate-900">Ma trận Quyền thao tác</h3>
                 <p className="text-xs text-slate-500 mt-1">Cấu hình chi tiết các hành động được phép trên từng phân hệ dữ liệu.</p>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-xs">
                    <thead className="bg-white text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3 min-w-[180px]">Phân hệ dữ liệu</th>
                        <th className="px-4 py-3 min-w-[300px]">Thao tác khả dụng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {DOMAIN_ACTIONS.map(domainConfig => {
                        const roleDomainPerms = (selectedRole.actionPermissions as any)?.[domainConfig.domain] || {};
                        return (
                          <tr key={domainConfig.domain} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-4 font-semibold text-slate-900 align-top">
                              {domainConfig.domainName}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-4">
                                {domainConfig.actions.map(action => {
                                  const hasAccess = selectedRole.isSystemProtected || Boolean(roleDomainPerms[action]);
                                  return (
                                    <label key={action} className={`flex items-center gap-1.5 ${selectedRole.isSystemProtected ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:text-blue-700'}`}>
                                      <input 
                                        type="checkbox"
                                        checked={hasAccess}
                                        disabled={selectedRole.isSystemProtected}
                                        onChange={() => handleToggleActionPermission(domainConfig.domain, action)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 disabled:opacity-50"
                                      />
                                      <span className="font-medium font-mono text-[11px] uppercase text-slate-600">{action}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      )}

      {/* User Create/Edit Modal */}
      {userModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {userModal.mode === 'create' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}
              </h3>
              <button
                type="button"
                onClick={() => setUserModal({ isOpen: false, mode: 'create', user: {} })}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="p-5 space-y-3.5 text-xs">
                <FormField label="Tài khoản" required>
                  <input
                    type="text"
                    required
                    value={userModal.user.username || ''}
                    onChange={(e) =>
                      setUserModal({
                        ...userModal,
                        user: { ...userModal.user, username: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-semibold"
                    placeholder="VD: engineer02"
                  />
                </FormField>

                <FormField label="Họ tên" required>
                  <input
                    type="text"
                    required
                    value={userModal.user.fullName || ''}
                    onChange={(e) =>
                      setUserModal({
                        ...userModal,
                        user: { ...userModal.user, fullName: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                    placeholder="VD: Trần Văn Kỹ Sư"
                  />
                </FormField>

                {userModal.mode === 'create' && (
                  <FormField label="Mật khẩu" required>
                    <input
                      type="password"
                      required
                      value={userModal.user.password || ''}
                      onChange={(e) =>
                        setUserModal({
                          ...userModal,
                          user: { ...userModal.user, password: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                      placeholder="Nhập mật khẩu..."
                    />
                  </FormField>
                )}

                <FormField label="Role (Vai trò)" required>
                  <div className="space-y-1.5 pt-1">
                    {roles.map((r) => {
                      const isChecked = Boolean(userModal.user.roleIds?.includes(r.id));
                      return (
                        <label
                          key={r.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = userModal.user.roleIds || [];
                              const updated = e.target.checked
                                ? [...current, r.id]
                                : current.filter((id) => id !== r.id);
                              setUserModal({
                                ...userModal,
                                user: { ...userModal.user, roleIds: updated },
                              });
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0"
                          />
                          <span className="font-semibold text-slate-800">{r.name}</span>
                          <span className="text-[10px] text-slate-400">({r.description})</span>
                        </label>
                      );
                    })}
                  </div>
                </FormField>

                <FormField label="Trạng thái">
                  <select
                    value={userModal.user.status || 'ACTIVE'}
                    onChange={(e) =>
                      setUserModal({
                        ...userModal,
                        user: { ...userModal.user, status: e.target.value as MasterStatus },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </FormField>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModal({ isOpen: false, mode: 'create', user: {} })}
                  className="px-3.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu tài khoản</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Đặt lại mật khẩu</h3>
              <button
                type="button"
                onClick={() => setResetPasswordModal(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword}>
              <div className="p-5 space-y-3.5 text-xs">
                <FormField label="Mật khẩu mới" required>
                  <input
                    type="password"
                    required
                    value={resetPasswordModal.newPassword}
                    onChange={(e) =>
                      setResetPasswordModal({
                        ...resetPasswordModal,
                        newPassword: e.target.value as any,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </FormField>

                <FormField label="Xác nhận mật khẩu" required>
                  <input
                    type="password"
                    required
                    value={resetPasswordModal.confirmPassword}
                    onChange={(e) =>
                      setResetPasswordModal({
                        ...resetPasswordModal,
                        confirmPassword: e.target.value as any,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </FormField>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordModal(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Xóa tài khoản người dùng?"
        message="Tài khoản này sẽ bị thu hồi toàn bộ quyền truy cập hệ thống."
        confirmLabel="Xác nhận xóa"
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteConfirm({ isOpen: false, userId: null })}
      />
    </div>
  );
};
