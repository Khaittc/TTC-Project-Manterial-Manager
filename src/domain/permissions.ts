// Role permissions and effective evaluation engine
import { Role, User, MenuKey, ActionType } from './types';

export const SYSTEM_MENU_ITEMS: { key: MenuKey; label: string; group: string }[] = [
  { key: 'dashboard', label: 'Dashboard', group: 'ĐIỀU HÀNH' },
  { key: 'monitoring', label: 'Giám sát vật tư dự án', group: 'ĐIỀU HÀNH' },
  { key: 'projects', label: 'Quản lý dự án', group: 'DỰ ÁN & VẬT TƯ' },
  { key: 'materials', label: 'Danh mục vật tư', group: 'DỰ ÁN & VẬT TƯ' },
  { key: 'stock-in', label: 'Nhập kho', group: 'QUẢN LÝ KHO' },
  { key: 'stock-out', label: 'Xuất kho', group: 'QUẢN LÝ KHO' },
  { key: 'history', label: 'Lịch sử', group: 'QUẢN LÝ KHO' },
  { key: 'system-masters', label: 'Danh mục hệ thống', group: 'HỆ THỐNG' },
  { key: 'administration', label: 'Người dùng', group: 'HỆ THỐNG' },
];

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'ROLE-ADMIN',
    name: 'Admin',
    description: 'Quản trị viên toàn quyền hệ thống (Protected)',
    isSystemProtected: true,
    status: 'ACTIVE',
    uiVisibility: [
      'dashboard',
      'monitoring',
      'projects',
      'materials',
      'stock-in',
      'stock-out',
      'history',
      'system-masters',
      'administration',
    ],
    actionPermissions: {
      material: { view: true, create: true, edit: true, delete: true, import: true },
      supplierPrice: { view: true, edit: true, set_preferred: true, import: true },
      project: { view: true, create: true, edit: true, delete: true },
      bom: { view: true, edit: true, import: true, select_supplier: true },
      warehouse: { stock_in: true, stock_out: true, receive_goods: true },
      systemMasters: { view: true, create: true, edit: true, delete: true },
      administration: { view: true, manage_users: true, manage_roles: true },
    },
  },
  {
    id: 'ROLE-WAREHOUSE',
    name: 'Quản lý kho',
    description: 'Nhân viên theo dõi tồn kho và phân bổ nhận hàng',
    isSystemProtected: false,
    status: 'ACTIVE',
    uiVisibility: ['dashboard', 'monitoring', 'projects', 'materials', 'stock-in', 'stock-out', 'history'],
    actionPermissions: {
      material: { view: true, create: false, edit: false, delete: false, import: false },
      supplierPrice: { view: true, edit: false, set_preferred: false, import: false },
      project: { view: true, create: false, edit: false, delete: false },
      bom: { view: true, edit: false, import: false, select_supplier: false },
      warehouse: { stock_in: true, stock_out: true, receive_goods: true },
      systemMasters: { view: true, create: false, edit: false, delete: false },
      administration: { view: false, manage_users: false, manage_roles: false },
    },
  },
  {
    id: 'ROLE-ENGINEER',
    name: 'Kỹ sư',
    description: 'Kỹ sư thiết kế BOM dự án và giám sát tiến độ vật tư',
    isSystemProtected: false,
    status: 'ACTIVE',
    uiVisibility: ['dashboard', 'monitoring', 'projects', 'materials'],
    actionPermissions: {
      material: { view: true, create: true, edit: true, delete: false, import: false },
      supplierPrice: { view: true, edit: false, set_preferred: false, import: false },
      project: { view: true, create: false, edit: true, delete: false },
      bom: { view: true, edit: true, import: true, select_supplier: true },
      warehouse: { stock_in: false, stock_out: false, receive_goods: false },
      systemMasters: { view: true, create: false, edit: false, delete: false },
      administration: { view: false, manage_users: false, manage_roles: false },
    },
  },
  {
    id: 'ROLE-ESTIMATOR',
    name: 'Kỹ sư dự toán',
    description: 'Chuyên viên quản lý giá nhà cung cấp và tối ưu chi phí BOM',
    isSystemProtected: false,
    status: 'ACTIVE',
    uiVisibility: ['dashboard', 'monitoring', 'projects', 'materials', 'system-masters'],
    actionPermissions: {
      material: { view: true, create: true, edit: true, delete: false, import: false },
      supplierPrice: { view: true, edit: true, set_preferred: true, import: true },
      project: { view: true, create: false, edit: false, delete: false },
      bom: { view: true, edit: true, import: true, select_supplier: true },
      warehouse: { stock_in: false, stock_out: false, receive_goods: false },
      systemMasters: { view: true, create: false, edit: false, delete: false },
      administration: { view: false, manage_users: false, manage_roles: false },
    },
  },
];

/**
 * Computes Effective UI Visibility: Union of all assigned roles' visible menus.
 * Allow-only, Default-deny policy.
 */
export function getEffectiveUIVisibility(user?: User | null, allRoles?: Role[] | null): Set<MenuKey> {
  const visible = new Set<MenuKey>();
  if (!user || !user.roleIds || !Array.isArray(user.roleIds) || !allRoles || !Array.isArray(allRoles)) {
    return visible;
  }

  const activeRoles = allRoles.filter(
    (r) => r && user.roleIds.includes(r.id) && (r.status === 'ACTIVE' || !r.status)
  );

  for (const role of activeRoles) {
    const menus = role.uiVisibility || role.allowedMenus || [];
    for (const key of menus) {
      visible.add(key);
    }
  }

  return visible;
}

/**
 * Checks if user has a specific action permission across any of their active roles (Union).
 */
export function hasActionPermission(
  user?: User | null,
  allRoles?: Role[] | null,
  domain?: keyof Role['actionPermissions'],
  action?: string
): boolean {
  if (!user || !user.roleIds || !Array.isArray(user.roleIds) || !allRoles || !Array.isArray(allRoles) || !domain || !action) {
    return false;
  }

  const activeRoles = allRoles.filter(
    (r) => r && user.roleIds.includes(r.id) && (r.status === 'ACTIVE' || !r.status)
  );

  for (const role of activeRoles) {
    if (!role.actionPermissions) continue;
    const domainPerms = role.actionPermissions[domain] as Record<string, boolean> | undefined;
    if (domainPerms && domainPerms[action] === true) {
      return true;
    }
  }
  return false;
}
