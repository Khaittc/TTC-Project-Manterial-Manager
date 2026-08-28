import React, { useState, useMemo } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Save,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Info,
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

export const AdministrationPage: React.FC = () => {
  const {
    users,
    roles,
    saveUser,
    deleteUser,
    updateRolePermissions,
    setCurrentUserId,
    currentUserId,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  // User Modal State
  const [userModal, setUserModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    user: Partial<User>;
  }>({ isOpen: false, mode: 'create', user: {} });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    userId: string | null;
  }>({ isOpen: false, userId: null });

  const handleOpenAddUser = () => {
    setUserModal({
      isOpen: true,
      mode: 'create',
      user: {
        username: '',
        fullName: '',
        email: '',
        roleIds: [roles[0]?.id || ''],
        status: 'ACTIVE',
      },
    });
  };

  const handleOpenEditUser = (u: User) => {
    setUserModal({
      isOpen: true,
      mode: 'edit',
      user: { ...u, roleIds: [...u.roleIds] },
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userModal.user.username || !userModal.user.fullName) return;

    saveUser({
      ...userModal.user,
      roleIds: userModal.user.roleIds || [roles[0]?.id],
      status: userModal.user.status || 'ACTIVE',
    });

    setUserModal({ isOpen: false, mode: 'create', user: {} });
  };

  const handleToggleRolePermission = (roleId: string, menuKey: MenuKey) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    const currentMenus = role.uiVisibility || role.allowedMenus || [];
    const newMenus = currentMenus.includes(menuKey)
      ? currentMenus.filter((k) => k !== menuKey)
      : [...currentMenus, menuKey];

    updateRolePermissions(roleId, newMenus);
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
          onClick={() => setActiveTab('users')}
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
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Ma trận phân quyền vai trò ({roles.length})</span>
        </button>
      </div>

      {/* TAB 1: DANH SÁCH NGƯỜI DÙNG */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              Có tổng cộng <span className="font-bold text-slate-900">{users.length}</span> tài khoản được cấp quyền
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
                  <th className="px-4 py-3">Tên đăng nhập</th>
                  <th className="px-4 py-3">Họ và tên</th>
                  <th className="px-4 py-3">Email liên hệ</th>
                  <th className="px-4 py-3">Vai trò đảm nhiệm</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-center">Chuyển Persona</th>
                  <th className="px-4 py-3 text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {users.map((u) => {
                  const userRoles = roles.filter((r) => (u.roleIds || []).includes(r.id));
                  const isCurrent = u.id === currentUserId;

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50 transition ${isCurrent ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">{u.username}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{u.fullName}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
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
                      <td className="px-4 py-3 text-center">
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                            Đang đăng nhập
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCurrentUserId(u.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                          >
                            Đóng vai
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
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

      {/* TAB 2: MA TRẬN PHÂN QUYỀN VAI TRÒ */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Mô phỏng ma trận phân quyền trực tiếp (Live Simulation):</span>
              <p className="mt-0.5 text-blue-800">
                Nhấp chuột vào các ô đánh dấu bên dưới để bật/tắt quyền truy cập từng menu cho từng vai trò. Thay đổi có hiệu lực ngay lập tức lên giao diện Menu và TopBar khi bạn chọn Persona tương ứng.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 min-w-[220px]">Chức năng / Phân hệ Menu</th>
                  {roles.map((role) => (
                    <th key={role.id} className="px-4 py-3 text-center min-w-[130px]">
                      <div className="font-bold text-slate-900">{role.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal lowercase">{role.code}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {ALL_MENU_KEYS.map((menu) => (
                  <tr key={menu.key} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{menu.group}</span>
                      <span className="font-semibold text-slate-900">{menu.label}</span>
                    </td>

                    {roles.map((role) => {
                      const menus = role.uiVisibility || role.allowedMenus || [];
                      const hasAccess = Boolean(menus.includes(menu.key));
                      return (
                        <td
                          key={role.id}
                          className="px-4 py-3 text-center cursor-pointer hover:bg-blue-50/50 transition"
                          onClick={() => handleToggleRolePermission(role.id, menu.key)}
                        >
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={hasAccess}
                              onChange={() => {}} // Handled by td click
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <FormField label="Tên đăng nhập (Username)" required>
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

                <FormField label="Họ và tên" required>
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

                <FormField label="Email">
                  <input
                    type="email"
                    value={userModal.user.email || ''}
                    onChange={(e) =>
                      setUserModal({
                        ...userModal,
                        user: { ...userModal.user, email: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                    placeholder="user@ttc.com.vn"
                  />
                </FormField>

                <FormField label="Gán vai trò đảm nhiệm">
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
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="INACTIVE">Khóa tài khoản</option>
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

      {/* Delete User Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Xóa tài khoản người dùng?"
        message="Tài khoản này sẽ bị thu hồi toàn bộ quyền truy cập hệ thống."
        confirmLabel="Xác nhận xóa"
        onConfirm={() => {
          if (deleteConfirm.userId) deleteUser(deleteConfirm.userId);
          setDeleteConfirm({ isOpen: false, userId: null });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, userId: null })}
      />
    </div>
  );
};
