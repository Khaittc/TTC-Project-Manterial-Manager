import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Customer,
  Project,
  Category,
  UnitOfMeasure,
  Manufacturer,
  Supplier,
  Material,
  MaterialSupplierPrice,
  ProjectBOMItem,
  BOMProcurementStatus,
  ProjectInvoice,
  User,
  Role,
  ActionRequiredItem,
  MenuKey,
  Warehouse,
  InventoryStock,
  StockTransaction,
} from '../domain/types';
import { StorageService } from '../services/localStorageService';
import { INITIAL_ACTION_ITEMS } from '../data/mockData';
import { getEffectiveUIVisibility, hasActionPermission } from '../domain/permissions';
import { ToastMessage } from '../components/dialogs/Toast';
import { isBOMSupplierLocked } from '../domain/mockRules';

interface AppContextType {
  // State
  customers: Customer[];
  projects: Project[];
  categories: Category[];
  uoms: UnitOfMeasure[];
  manufacturers: Manufacturer[];
  suppliers: Supplier[];
  materials: Material[];
  prices: MaterialSupplierPrice[];
  boms: ProjectBOMItem[];
  invoices: ProjectInvoice[];
  warehouses: Warehouse[];
  inventory: InventoryStock[];
  stockTransactions: StockTransaction[];
  users: User[];
  roles: Role[];
  actionItems: ActionRequiredItem[];
  currentUserId: string;
  currentUser: User;
  activeRole: Role | null;
  effectiveUIVisibility: Set<MenuKey>;
  isSidebarCollapsed: boolean;
  toasts: ToastMessage[];

  // Mutators & Actions
  setCurrentUserId: (id: string) => void;
  toggleSidebar: () => void;
  addToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => void;
  dismissToast: (id: string) => void;
  resetDemoData: () => void;

  // Master Data CRUD
  saveCustomer: (customer: Partial<Customer>) => { success: boolean; message?: string };
  deleteCustomer: (id: string) => { success: boolean; message?: string };

  saveProject: (project: Partial<Project>) => { success: boolean; message?: string };
  deleteProject: (id: string) => { success: boolean; message?: string };

  saveCategory: (category: Partial<Category>) => { success: boolean; message?: string };
  deleteCategory: (id: string) => { success: boolean; message?: string };

  saveUOM: (uom: Partial<UnitOfMeasure>) => { success: boolean; message?: string };
  deleteUOM: (id: string) => { success: boolean; message?: string };

  saveManufacturer: (mfg: Partial<Manufacturer>) => { success: boolean; message?: string };
  deleteManufacturer: (id: string) => { success: boolean; message?: string };

  saveSupplier: (supplier: Partial<Supplier>) => { success: boolean; message?: string };
  deleteSupplier: (id: string) => { success: boolean; message?: string };

  saveWarehouse: (warehouse: Partial<Warehouse>) => { success: boolean; message?: string };
  deleteWarehouse: (id: string) => { success: boolean; message?: string };

  // Material & Pricing CRUD
  saveMaterial: (material: Partial<Material>) => { success: boolean; message?: string; id?: string };
  deleteMaterial: (id: string) => { success: boolean; message?: string; isReferenced?: boolean };
  toggleMaterialStatus: (id: string) => void;

  saveSupplierPrice: (price: Partial<MaterialSupplierPrice>) => { success: boolean; message?: string };
  saveBulkSupplierPrices: (
    supplierId: string,
    updates: { materialId: string; priceId?: string; currentPrice: number; isPreferred: boolean; supplierProductCode?: string }[]
  ) => { success: boolean; message?: string };
  setPreferredSupplier: (materialId: string, supplierId: string) => void;

  // BOM & Receiving & Invoices
  saveBOMPurchaseDecision: (payload: {
    bomItemId: string;
    finalSupplierId: string | null;
    finalUnitPrice: number;
    procurementStatus: BOMProcurementStatus;
    procurementNote?: string;
  }) => { success: boolean; message?: string };
  updateBOMFinalUnitPrice: (payload: {
    bomItemId: string;
    finalUnitPrice: number;
  }) => { success: boolean; message?: string };
  markBOMReturnOrExchange: (payload: {
    bomItemId: string;
    note?: string;
  }) => { success: boolean; message?: string };
  updateBOMItemQuantity: (bomItemId: string, newQty: number) => void;
  saveBOMItem: (item: Partial<ProjectBOMItem>) => void;
  processGoodsReceiving: (payload: {
    bomItemId: string;
    materialId: string;
    receivedQty: number;
    projectAllocation: number;
    warehouseAllocation: number;
  }) => { success: boolean; message?: string };

  saveInvoice: (invoice: Partial<ProjectInvoice>) => { success: boolean; message?: string };
  deleteInvoice: (id: string) => void;

  // Inventory Transactions
  executeStockTransaction: (tx: Omit<StockTransaction, 'id' | 'createdAt'>) => { success: boolean; message?: string };

  // User & Roles
  saveUser: (user: Partial<User>) => { success: boolean; message?: string };
  deleteUser: (id: string) => { success: boolean; message?: string };
  resetUserPassword: (userId: string, newPassword: string) => { success: boolean; message?: string };
  saveRole: (role: Partial<Role>) => { success: boolean; message?: string };
  deleteRole: (id: string) => { success: boolean; message?: string };
  updateRolePermissions: (roleId: string, allowedMenus: MenuKey[]) => void;
  updateRoleActionPermissions: (roleId: string, actionPermissions: Role['actionPermissions']) => void;

  // Helper check
  canDo: (domain: keyof Role['actionPermissions'], action: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers() || []);
  const [projects, setProjects] = useState<Project[]>(() => StorageService.getProjects() || []);
  const [categories, setCategories] = useState<Category[]>(() => StorageService.getCategories() || []);
  const [uoms, setUOMs] = useState<UnitOfMeasure[]>(() => StorageService.getUOMs() || []);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(() => StorageService.getManufacturers() || []);
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers() || []);
  const [materials, setMaterials] = useState<Material[]>(() => StorageService.getMaterials() || []);
  const [prices, setPrices] = useState<MaterialSupplierPrice[]>(() => StorageService.getPrices() || []);
  const [boms, setBOMs] = useState<ProjectBOMItem[]>(() => StorageService.getBOMs() || []);
  const [invoices, setInvoices] = useState<ProjectInvoice[]>(() => StorageService.getInvoices() || []);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => StorageService.getWarehouses() || []);
  const [inventory, setInventory] = useState<InventoryStock[]>(() => StorageService.getInventory() || []);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() => StorageService.getStockTransactions() || []);
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers() || []);
  const [roles, setRoles] = useState<Role[]>(() => StorageService.getRoles() || []);
  const [actionItems, setActionItems] = useState<ActionRequiredItem[]>(INITIAL_ACTION_ITEMS || []);
  const [currentUserId, setCurrentUserIdState] = useState<string>(() => StorageService.getCurrentUserId() || 'USR-001');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => StorageService.isSidebarCollapsed());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Reload all from storage
  const reloadFromStorage = useCallback(() => {
    setCustomers(StorageService.getCustomers() || []);
    setProjects(StorageService.getProjects() || []);
    setCategories(StorageService.getCategories() || []);
    setUOMs(StorageService.getUOMs() || []);
    setManufacturers(StorageService.getManufacturers() || []);
    setSuppliers(StorageService.getSuppliers() || []);
    setMaterials(StorageService.getMaterials() || []);
    setPrices(StorageService.getPrices() || []);
    setBOMs(StorageService.getBOMs() || []);
    setInvoices(StorageService.getInvoices() || []);
    setWarehouses(StorageService.getWarehouses() || []);
    setInventory(StorageService.getInventory() || []);
    setStockTransactions(StorageService.getStockTransactions() || []);
    setUsers(StorageService.getUsers() || []);
    setRoles(StorageService.getRoles() || []);
    setCurrentUserIdState(StorageService.getCurrentUserId() || 'USR-001');
    setSidebarCollapsed(StorageService.isSidebarCollapsed());
  }, []);

  useEffect(() => {
    const handleStorageChange = () => reloadFromStorage();
    window.addEventListener('ttc_data_changed', handleStorageChange);
    return () => window.removeEventListener('ttc_data_changed', handleStorageChange);
  }, [reloadFromStorage]);

  // Active User & Permissions
  const currentUser = useMemo(() => {
    const found = users.find((u) => u.id === currentUserId);
    return found || users[0] || { id: 'USR-001', username: 'admin', fullName: 'Admin Demo', roleIds: ['ROLE-ADMIN'], status: 'ACTIVE' };
  }, [users, currentUserId]);

  const activeRole = useMemo(() => {
    return roles.find((r) => currentUser?.roleIds?.includes(r.id)) || null;
  }, [roles, currentUser]);

  const effectiveUIVisibility = useMemo(() => {
    return getEffectiveUIVisibility(currentUser, roles);
  }, [currentUser, roles]);

  const canDo = useCallback(
    (domain: keyof Role['actionPermissions'], action: string) => {
      return hasActionPermission(currentUser, roles, domain, action);
    },
    [currentUser, roles]
  );

  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleSidebar = () => {
    const next = !isSidebarCollapsed;
    setSidebarCollapsed(next);
    StorageService.setSidebarCollapsed(next);
  };

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    StorageService.setCurrentUserId(id);
    const user = users.find((u) => u.id === id);
    addToast('info', `Đã chuyển sang vai trò: ${user?.fullName || id}`, 'Chuyển Persona Demo');
  };

  const resetDemoData = () => {
    StorageService.resetAllToDefault();
    reloadFromStorage();
    addToast('success', 'Đã khôi phục toàn bộ dữ liệu mock ban đầu thành công.', 'Khôi phục dữ liệu');
  };

  // --- Customer Operations ---
  const saveCustomer = (data: Partial<Customer>) => {
    if (!data.code || !data.code.trim()) {
      return { success: false, message: 'Mã khách hàng là bắt buộc.' };
    }
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Tên khách hàng là bắt buộc.' };
    }

    const codeUpper = data.code.trim().toUpperCase();
    const existing = customers.find((c) => c.code.toUpperCase() === codeUpper && c.id !== data.id);
    if (existing) {
      return { success: false, message: `Mã khách hàng "${codeUpper}" đã tồn tại. Vui lòng chọn mã khác.` };
    }

    let next: Customer[];
    if (data.id) {
      next = customers.map((c) =>
        c.id === data.id
          ? {
              ...c,
              code: codeUpper,
              name: data.name!.trim(),
              address: data.address?.trim() || '',
            }
          : c
      );
      addToast('success', `Đã cập nhật khách hàng ${codeUpper}.`);
    } else {
      const newCust: Customer = {
        id: `CUST-${Date.now()}`,
        code: codeUpper,
        name: data.name!.trim(),
        address: data.address?.trim() || '',
        createdAt: new Date().toISOString(),
      };
      next = [newCust, ...customers];
      addToast('success', `Đã thêm khách hàng mới ${codeUpper}.`);
    }

    setCustomers(next);
    StorageService.saveCustomers(next);
    return { success: true };
  };

  const deleteCustomer = (id: string) => {
    // Dependency check: referenced by project?
    const hasRef = projects.some((p) => p.customerId === id);
    if (hasRef) {
      return {
        success: false,
        message: 'Khách hàng này đang được tham chiếu bởi Dự án trong hệ thống. Không thể xóa.',
      };
    }

    const next = customers.filter((c) => c.id !== id);
    setCustomers(next);
    StorageService.saveCustomers(next);
    addToast('success', 'Đã xóa khách hàng thành công.');
    return { success: true };
  };

  // --- Project Operations ---
  const saveProject = (data: Partial<Project>) => {
    if (!data.code || !data.code.trim()) {
      return { success: false, message: 'Mã dự án là bắt buộc.' };
    }
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Tên dự án là bắt buộc.' };
    }
    if (!data.customerId) {
      return { success: false, message: 'Vui lòng chọn khách hàng.' };
    }

    const codeUpper = data.code.trim().toUpperCase();
    const existing = projects.find((p) => p.code.toUpperCase() === codeUpper && p.id !== data.id);
    if (existing) {
      return { success: false, message: `Mã dự án "${codeUpper}" đã tồn tại. Vui lòng chọn mã khác.` };
    }

    let next: Project[];
    if (data.id) {
      next = projects.map((p) =>
        p.id === data.id
          ? {
              ...p,
              code: codeUpper,
              name: data.name!.trim(),
              customerId: data.customerId!,
              startDate: data.startDate || p.startDate,
              status: data.status || p.status,
              notes: data.notes || '',
            }
          : p
      );
      addToast('success', `Đã cập nhật dự án ${codeUpper}.`);
    } else {
      const newPrj: Project = {
        id: `PRJ-${Date.now()}`,
        code: codeUpper,
        name: data.name!.trim(),
        customerId: data.customerId!,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        status: data.status || 'IN_PROGRESS',
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
      };
      next = [newPrj, ...projects];
      addToast('success', `Đã thêm dự án mới ${codeUpper}.`);
    }

    setProjects(next);
    StorageService.saveProjects(next);
    return { success: true };
  };

  const deleteProject = (id: string) => {
    const next = projects.filter((p) => p.id !== id);
    setProjects(next);
    StorageService.saveProjects(next);
    addToast('success', 'Đã mô phỏng xóa dự án thành công.');
    return { success: true };
  };

  // --- Category Operations ---
  const saveCategory = (data: Partial<Category>) => {
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Tên nhóm vật tư là bắt buộc.' };
    }

    let next: Category[];
    if (data.id) {
      next = categories.map((c) =>
        c.id === data.id
          ? {
              ...c,
              name: data.name!.trim(),
              parentId: data.parentId || null,
              status: data.status || c.status,
            }
          : c
      );
      addToast('success', `Đã cập nhật nhóm vật tư ${data.name}.`);
    } else {
      const newCat: Category = {
        id: `CAT-${Date.now()}`,
        name: data.name!.trim(),
        parentId: data.parentId || null,
        status: data.status || 'ACTIVE',
      };
      next = [...categories, newCat];
      addToast('success', `Đã thêm nhóm vật tư mới ${data.name}.`);
    }

    setCategories(next);
    StorageService.saveCategories(next);
    return { success: true };
  };

  const deleteCategory = (id: string) => {
    // Check if subcategories exist
    const hasChildren = categories.some((c) => c.parentId === id);
    if (hasChildren) {
      return { success: false, message: 'Nhóm vật tư này có chứa các nhóm con. Không thể xóa.' };
    }

    // Check if materials reference this category
    const hasMaterials = materials.some((m) => m.categoryId === id);
    if (hasMaterials) {
      return { success: false, message: 'Nhóm vật tư này đang chứa vật tư trong hệ thống. Không thể xóa.' };
    }

    const next = categories.filter((c) => c.id !== id);
    setCategories(next);
    StorageService.saveCategories(next);
    addToast('success', 'Đã xóa nhóm vật tư thành công.');
    return { success: true };
  };

  // --- UOM Operations ---
  const saveUOM = (data: Partial<UnitOfMeasure>) => {
    if (!data.code || !data.code.trim()) {
      return { success: false, message: 'Mã ĐVT là bắt buộc.' };
    }
    const codeNormalized = data.code.trim().toLowerCase();
    const existing = uoms.find((u) => u.code.toLowerCase() === codeNormalized && u.id !== data.id);
    if (existing) {
      return { success: false, message: `Mã ĐVT "${codeNormalized}" đã tồn tại.` };
    }

    let next: UnitOfMeasure[];
    if (data.id) {
      next = uoms.map((u) =>
        u.id === data.id ? { ...u, code: codeNormalized, status: data.status || u.status } : u
      );
      addToast('success', `Đã cập nhật ĐVT ${codeNormalized}.`);
    } else {
      const newUom: UnitOfMeasure = {
        id: `UOM-${Date.now()}`,
        code: codeNormalized,
        status: data.status || 'ACTIVE',
      };
      next = [...uoms, newUom];
      addToast('success', `Đã thêm ĐVT mới ${codeNormalized}.`);
    }

    setUOMs(next);
    StorageService.saveUOMs(next);
    return { success: true };
  };

  const deleteUOM = (id: string) => {
    const hasRef = materials.some((m) => m.uomId === id);
    if (hasRef) {
      return { success: false, message: 'Đơn vị tính này đang được tham chiếu bởi Vật tư. Không thể xóa.' };
    }

    const next = uoms.filter((u) => u.id !== id);
    setUOMs(next);
    StorageService.saveUOMs(next);
    addToast('success', 'Đã xóa ĐVT thành công.');
    return { success: true };
  };

  // --- Manufacturer Operations ---
  const saveManufacturer = (data: Partial<Manufacturer>) => {
    if (!data.code || !data.code.trim()) {
      return { success: false, message: 'Mã hãng là bắt buộc.' };
    }
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Tên hãng là bắt buộc.' };
    }

    const codeUpper = data.code.trim().toUpperCase();
    const existing = manufacturers.find((m) => m.code.toUpperCase() === codeUpper && m.id !== data.id);
    if (existing) {
      return { success: false, message: `Mã hãng "${codeUpper}" đã tồn tại.` };
    }

    let next: Manufacturer[];
    if (data.id) {
      next = manufacturers.map((m) =>
        m.id === data.id
          ? {
              ...m,
              code: codeUpper,
              name: data.name!.trim(),
              status: data.status || m.status,
            }
          : m
      );
      addToast('success', `Đã cập nhật hãng ${codeUpper}.`);
    } else {
      const newMfg: Manufacturer = {
        id: `MFG-${Date.now()}`,
        code: codeUpper,
        name: data.name!.trim(),
        status: data.status || 'ACTIVE',
      };
      next = [...manufacturers, newMfg];
      addToast('success', `Đã thêm hãng sản xuất mới ${codeUpper}.`);
    }

    setManufacturers(next);
    StorageService.saveManufacturers(next);
    return { success: true };
  };

  const deleteManufacturer = (id: string) => {
    const hasRef = materials.some((m) => m.manufacturerId === id);
    if (hasRef) {
      return { success: false, message: 'Hãng sản xuất này đang được tham chiếu bởi Vật tư. Không thể xóa.' };
    }

    const next = manufacturers.filter((m) => m.id !== id);
    setManufacturers(next);
    StorageService.saveManufacturers(next);
    addToast('success', 'Đã xóa hãng sản xuất thành công.');
    return { success: true };
  };

  // --- Supplier Operations ---
  const saveSupplier = (data: Partial<Supplier>) => {
    if (!data.taxCode || !data.taxCode.trim()) {
      return { success: false, message: 'Mã số thuế là bắt buộc.' };
    }
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Tên nhà cung cấp là bắt buộc.' };
    }

    const mstTrimmed = data.taxCode.trim();
    const existing = suppliers.find((s) => s.taxCode === mstTrimmed && s.id !== data.id);
    if (existing) {
      return { success: false, message: `Mã số thuế "${mstTrimmed}" đã tồn tại.` };
    }

    let next: Supplier[];
    if (data.id) {
      next = suppliers.map((s) =>
        s.id === data.id
          ? {
              ...s,
              taxCode: mstTrimmed,
              name: data.name!.trim(),
              address: data.address?.trim() || '',
              status: data.status || s.status,
              contactPerson: data.contactPerson?.trim() || '',
              phone: data.phone?.trim() || '',
              email: data.email?.trim() || '',
            }
          : s
      );
      addToast('success', `Đã cập nhật nhà cung cấp ${data.name}.`);
    } else {
      const newSup: Supplier = {
        id: `SUP-${Date.now()}`,
        taxCode: mstTrimmed,
        name: data.name!.trim(),
        address: data.address?.trim() || '',
        status: data.status || 'ACTIVE',
        contactPerson: data.contactPerson?.trim() || '',
        phone: data.phone?.trim() || '',
        email: data.email?.trim() || '',
      };
      next = [...suppliers, newSup];
      addToast('success', `Đã thêm nhà cung cấp mới ${data.name}.`);
    }

    setSuppliers(next);
    StorageService.saveSuppliers(next);
    return { success: true };
  };

  const deleteSupplier = (id: string) => {
    // Check if supplier is referenced in prices or BOM or invoices
    const hasPrice = prices.some((p) => p.supplierId === id);
    const hasBOM = boms.some((b) => b.finalSupplierId === id || b.preferredSupplierId === id);
    const hasInvoice = invoices.some((i) => i.supplierId === id);

    if (hasPrice || hasBOM || hasInvoice) {
      return {
        success: false,
        message: 'Nhà cung cấp này đang được tham chiếu trong Bảng giá, BOM hoặc Hóa đơn. Không thể xóa.',
      };
    }

    const next = suppliers.filter((s) => s.id !== id);
    setSuppliers(next);
    StorageService.saveSuppliers(next);
    addToast('success', 'Đã xóa nhà cung cấp thành công.');
    return { success: true };
  };

  // --- Material Operations ---
  const saveMaterial = (data: Partial<Material>) => {
    if (!data.categoryId) return { success: false, message: 'Nhóm vật tư là bắt buộc.' };
    if (!data.manufacturerId) return { success: false, message: 'Hãng sản xuất là bắt buộc.' };
    if (!data.model || !data.model.trim()) return { success: false, message: 'Model vật tư là bắt buộc.' };
    if (!data.uomId) return { success: false, message: 'Đơn vị tính là bắt buộc.' };

    const modelTrimmed = data.model.trim();
    // Rule: Manufacturer + Model must be unique
    const existing = materials.find(
      (m) =>
        m.manufacturerId === data.manufacturerId &&
        m.model.toLowerCase() === modelTrimmed.toLowerCase() &&
        m.id !== data.id
    );

    if (existing) {
      return {
        success: false,
        message: `Model "${modelTrimmed}" đã tồn tại cho hãng này. Hãng sản xuất + Model phải là duy nhất.`,
      };
    }

    let next: Material[];
    let targetId = data.id;

    if (data.id) {
      next = materials.map((m) =>
        m.id === data.id
          ? {
              ...m,
              categoryId: data.categoryId!,
              manufacturerId: data.manufacturerId!,
              model: modelTrimmed,
              description: data.description?.trim() || '',
              // UOM can only change if not referenced
              uomId: m.isReferenced ? m.uomId : data.uomId!,
              status: data.status || m.status,
            }
          : m
      );
      addToast('success', `Đã cập nhật vật tư ${modelTrimmed}.`);
    } else {
      targetId = `MAT-${Date.now()}`;
      const newMat: Material = {
        id: targetId,
        categoryId: data.categoryId!,
        manufacturerId: data.manufacturerId!,
        model: modelTrimmed,
        description: data.description?.trim() || '',
        uomId: data.uomId!,
        status: data.status || 'ACTIVE',
        stockQty: 0,
        isReferenced: false,
        createdAt: new Date().toISOString(),
      };
      next = [newMat, ...materials];
      addToast('success', `Đã tạo mới vật tư ${modelTrimmed}.`);
    }

    setMaterials(next);
    StorageService.saveMaterials(next);
    return { success: true, id: targetId };
  };

  const deleteMaterial = (id: string) => {
    const mat = materials.find((m) => m.id === id);
    if (!mat) return { success: false, message: 'Không tìm thấy vật tư.' };

    // If referenced by BOM or price, block hard delete and propose archived
    const isReferenced = mat.isReferenced || boms.some((b) => b.materialId === id) || prices.some((p) => p.materialId === id);
    if (isReferenced) {
      return {
        success: false,
        isReferenced: true,
        message: 'Vật tư này đang được tham chiếu trong BOM hoặc Bảng giá NCC. Không thể xóa cứng. Bạn có muốn chuyển sang trạng thái Lưu trữ (Archived)?',
      };
    }

    const next = materials.filter((m) => m.id !== id);
    setMaterials(next);
    StorageService.saveMaterials(next);
    addToast('success', 'Đã xóa vật tư thành công.');
    return { success: true };
  };

  const toggleMaterialStatus = (id: string) => {
    const next = materials.map((m) =>
      m.id === id ? { ...m, status: (m.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE') as Material['status'] } : m
    );
    setMaterials(next);
    StorageService.saveMaterials(next);
    addToast('success', 'Đã cập nhật trạng thái lưu trữ của vật tư.');
  };

  // --- Pricing Operations ---
  const saveSupplierPrice = (data: Partial<MaterialSupplierPrice>) => {
    if (!data.materialId || !data.supplierId) return { success: false, message: 'Dữ liệu không hợp lệ.' };

    const todayStr = new Date().toISOString().split('T')[0];
    const existing = prices.find((p) => p.materialId === data.materialId && p.supplierId === data.supplierId);

    let next: MaterialSupplierPrice[];
    if (existing) {
      const prevPrice = existing.currentPrice;
      const newPrice = data.currentPrice !== undefined ? data.currentPrice : existing.currentPrice;

      next = prices.map((p) =>
        p.id === existing.id
          ? {
              ...p,
              supplierProductCode: data.supplierProductCode || p.supplierProductCode,
              previousPrice: newPrice !== prevPrice ? prevPrice : p.previousPrice,
              previousDate: newPrice !== prevPrice ? p.currentDate : p.previousDate,
              currentPrice: newPrice,
              currentDate: newPrice !== prevPrice ? todayStr : p.currentDate,
              isPreferred: data.isPreferred !== undefined ? data.isPreferred : p.isPreferred,
            }
          : p
      );
    } else {
      const newPriceItem: MaterialSupplierPrice = {
        id: `PRC-${Date.now()}`,
        materialId: data.materialId,
        supplierId: data.supplierId,
        supplierProductCode: data.supplierProductCode || '',
        previousPrice: 0,
        previousDate: null,
        currentPrice: data.currentPrice || 0,
        currentDate: todayStr,
        isPreferred: !!data.isPreferred,
      };
      next = [...prices, newPriceItem];
    }

    setPrices(next);
    StorageService.savePrices(next);
    addToast('success', 'Đã cập nhật giá nhà cung cấp.');
    return { success: true };
  };

  const saveBulkSupplierPrices = (
    supplierId: string,
    updates: { materialId: string; priceId?: string; currentPrice: number; isPreferred: boolean; supplierProductCode?: string }[]
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let nextPrices = [...prices];

    for (const item of updates) {
      const existing = nextPrices.find((p) => p.supplierId === supplierId && p.materialId === item.materialId);
      if (existing) {
        const isPriceChanged = item.currentPrice !== existing.currentPrice;
        nextPrices = nextPrices.map((p) => {
          if (p.id === existing.id) {
            return {
              ...p,
              previousPrice: isPriceChanged ? existing.currentPrice : p.previousPrice,
              previousDate: isPriceChanged ? existing.currentDate : p.previousDate,
              currentPrice: item.currentPrice,
              currentDate: isPriceChanged ? todayStr : p.currentDate,
              isPreferred: item.isPreferred,
              supplierProductCode: item.supplierProductCode || p.supplierProductCode,
            };
          }
          // If this is set to preferred, unset preferred on other suppliers for this material
          if (item.isPreferred && p.materialId === item.materialId && p.supplierId !== supplierId) {
            return { ...p, isPreferred: false };
          }
          return p;
        });
      } else {
        const newRecord: MaterialSupplierPrice = {
          id: `PRC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          materialId: item.materialId,
          supplierId,
          supplierProductCode: item.supplierProductCode || '',
          previousPrice: 0,
          previousDate: null,
          currentPrice: item.currentPrice,
          currentDate: todayStr,
          isPreferred: item.isPreferred,
        };
        nextPrices.push(newRecord);
      }
    }

    setPrices(nextPrices);
    StorageService.savePrices(nextPrices);
    addToast('success', 'Đã lưu hàng loạt thay đổi giá của Nhà cung cấp.');
    return { success: true };
  };

  const setPreferredSupplier = (materialId: string, supplierId: string) => {
    const nextPrices = prices.map((p) => {
      if (p.materialId === materialId) {
        return {
          ...p,
          isPreferred: p.supplierId === supplierId,
        };
      }
      return p;
    });

    setPrices(nextPrices);
    StorageService.savePrices(nextPrices);
    addToast('success', 'Đã thay đổi Nhà cung cấp ưu tiên cho vật tư.');
  };

  // --- BOM & Receiving Operations ---
  const saveBOMPurchaseDecision = ({
    bomItemId,
    finalSupplierId,
    finalUnitPrice,
    procurementStatus,
    procurementNote,
  }: {
    bomItemId: string;
    finalSupplierId: string | null;
    finalUnitPrice: number;
    procurementStatus: BOMProcurementStatus;
    procurementNote?: string;
  }): { success: boolean; message?: string } => {
    const targetBOM = boms.find((b) => b.id === bomItemId);
    if (!targetBOM) {
      return { success: false, message: 'Không tìm thấy mục BOM.' };
    }

    // Validation 0: Check if Supplier/Purchase decision is locked
    if (isBOMSupplierLocked(targetBOM)) {
      return {
        success: false,
        message: 'Quyết định mua hàng đã được khóa sau khi đặt hàng hoặc phát sinh nhận hàng. Chỉ được cập nhật giá mua thực tế.',
      };
    }

    // Validation 1: If ORDERED is chosen, finalSupplierId must be provided
    if (procurementStatus === 'ORDERED' && !finalSupplierId) {
      return {
        success: false,
        message: 'Không thể đặt trạng thái "Đã đặt hàng" khi chưa chọn Nhà cung cấp.',
      };
    }

    // Validation 2: If finalSupplierId is provided, validate supplier existence and status
    if (finalSupplierId) {
      const sup = suppliers.find((s) => s.id === finalSupplierId);
      if (!sup) {
        return { success: false, message: 'Nhà cung cấp đã chọn không tồn tại trong hệ thống.' };
      }

      // Check inactive supplier: cannot newly select an INACTIVE supplier
      if (targetBOM.finalSupplierId !== finalSupplierId && sup.status === 'INACTIVE') {
        return {
          success: false,
          message: `Nhà cung cấp "${sup.name}" đang ở trạng thái Ngưng hoạt động. Không thể chọn mới.`,
        };
      }

      // Check Material + Supplier price relationship
      const priceRel = prices.find((p) => p.materialId === targetBOM.materialId && p.supplierId === finalSupplierId);
      if (!priceRel) {
        return {
          success: false,
          message: 'Chưa có liên kết báo giá giữa Vật tư và Nhà cung cấp đã chọn.',
        };
      }

      // Check Final Unit Price
      if (typeof finalUnitPrice !== 'number' || isNaN(finalUnitPrice) || finalUnitPrice <= 0) {
        return {
          success: false,
          message: 'Đơn giá chốt phải là số lớn hơn 0.',
        };
      }
    }

    const resolvedUnitPrice = finalSupplierId ? finalUnitPrice : 0;
    const totalAmount = targetBOM.bomQty * resolvedUnitPrice;

    // Determine legacy status mirror for backward compatibility
    let legacyStatus = targetBOM.status;
    const effProcurementStatus = procurementStatus ?? targetBOM.procurementStatus;

    if (targetBOM.projectReceivedQty >= targetBOM.bomQty && targetBOM.bomQty > 0) {
      legacyStatus = 'FULFILLED';
    } else if (targetBOM.projectReceivedQty > 0) {
      legacyStatus = 'PARTIALLY_RECEIVED';
    } else if (effProcurementStatus === 'INTERNAL_REVIEW' || effProcurementStatus === 'AWAITING_QUOTATION') {
      legacyStatus = 'NOT_PURCHASED';
    } else if (
      effProcurementStatus === 'AWAITING_PAYMENT' ||
      effProcurementStatus === 'ORDERED' ||
      effProcurementStatus === 'RETURN_OR_EXCHANGE'
    ) {
      legacyStatus = 'PURCHASING';
    }

    const nextBOMs = boms.map((item) => {
      if (item.id === bomItemId) {
        return {
          ...item,
          finalSupplierId,
          finalUnitPrice: resolvedUnitPrice,
          totalAmount,
          procurementStatus: procurementStatus || item.procurementStatus,
          procurementNote: procurementNote !== undefined ? procurementNote : item.procurementNote,
          status: legacyStatus,
        };
      }
      return item;
    });

    setBOMs(nextBOMs);
    StorageService.saveBOMs(nextBOMs);
    addToast('success', 'Đã lưu quyết định Nhà cung cấp & Đơn giá chốt cho mục BOM.');
    return { success: true };
  };

  const updateBOMFinalUnitPrice = ({
    bomItemId,
    finalUnitPrice,
  }: {
    bomItemId: string;
    finalUnitPrice: number;
  }): { success: boolean; message?: string } => {
    const targetBOM = boms.find((b) => b.id === bomItemId);
    if (!targetBOM) {
      return { success: false, message: 'Không tìm thấy mục BOM.' };
    }

    if (typeof finalUnitPrice !== 'number' || isNaN(finalUnitPrice) || finalUnitPrice <= 0) {
      return {
        success: false,
        message: 'Đơn giá chốt phải là số lớn hơn 0.',
      };
    }

    const totalAmount = targetBOM.bomQty * finalUnitPrice;

    const nextBOMs = boms.map((item) => {
      if (item.id === bomItemId) {
        return {
          ...item,
          finalUnitPrice,
          totalAmount,
        };
      }
      return item;
    });

    setBOMs(nextBOMs);
    StorageService.saveBOMs(nextBOMs);
    addToast('success', 'Đã cập nhật Đơn giá chốt (giá mua thực tế) cho mục BOM.');
    return { success: true };
  };

  const markBOMReturnOrExchange = ({
    bomItemId,
    note,
  }: {
    bomItemId: string;
    note?: string;
  }): { success: boolean; message?: string } => {
    const targetBOM = boms.find((b) => b.id === bomItemId);
    if (!targetBOM) {
      return { success: false, message: 'Không tìm thấy mục BOM.' };
    }

    if (!targetBOM.projectReceivedQty || targetBOM.projectReceivedQty <= 0) {
      return {
        success: false,
        message: 'Chỉ có thể đánh dấu trả/đổi hàng khi đã có phát sinh nhận hàng thực tế (Số lượng đã nhận > 0).',
      };
    }

    const nextBOMs = boms.map((item) => {
      if (item.id === bomItemId) {
        return {
          ...item,
          procurementStatus: 'RETURN_OR_EXCHANGE' as BOMProcurementStatus,
          procurementNote: note || item.procurementNote || '',
        };
      }
      return item;
    });

    setBOMs(nextBOMs);
    StorageService.saveBOMs(nextBOMs);
    addToast('success', 'Đã đánh dấu trạng thái Đang trả hàng / đổi hàng cho mục BOM.');
    return { success: true };
  };

  const updateBOMItemQuantity = (bomItemId: string, newQty: number) => {
    const nextBOMs = boms.map((item) => {
      if (item.id === bomItemId) {
        const qty = Math.max(1, newQty);
        const totalAmount = qty * item.finalUnitPrice;
        const remainingQty = Math.max(0, qty - item.projectReceivedQty);
        let status = item.status;
        if (remainingQty === 0 && item.projectReceivedQty >= qty) {
          status = 'FULFILLED';
        } else if (item.projectReceivedQty > 0) {
          status = 'PARTIALLY_RECEIVED';
        }

        return {
          ...item,
          bomQty: qty,
          totalAmount,
          remainingQty,
          status,
        };
      }
      return item;
    });

    setBOMs(nextBOMs);
    StorageService.saveBOMs(nextBOMs);
    addToast('success', 'Đã cập nhật số lượng BOM.');
  };

  const saveBOMItem = (itemData: Partial<ProjectBOMItem>) => {
    if (!itemData.projectId || !itemData.materialId) return;

    let next: ProjectBOMItem[];
    if (itemData.id) {
      next = boms.map((b) => (b.id === itemData.id ? ({ ...b, ...itemData } as ProjectBOMItem) : b));
    } else {
      const newItem: ProjectBOMItem = {
        id: `BOM-${Date.now()}`,
        projectId: itemData.projectId!,
        materialId: itemData.materialId!,
        bomQty: itemData.bomQty || 1,
        cheapestSupplierId: null,
        cheapestPrice: 0,
        preferredSupplierId: null,
        preferredPrice: 0,
        finalSupplierId: null,
        finalUnitPrice: 0,
        totalAmount: 0,
        status: 'NOT_PURCHASED',
        projectReceivedQty: 0,
        remainingQty: itemData.bomQty || 1,
      };
      next = [...boms, newItem];
    }
    setBOMs(next);
    StorageService.saveBOMs(next);
  };

  const processGoodsReceiving = ({
    bomItemId,
    materialId,
    receivedQty,
    projectAllocation,
    warehouseAllocation,
  }: {
    bomItemId: string;
    materialId: string;
    receivedQty: number;
    projectAllocation: number;
    warehouseAllocation: number;
  }) => {
    // 1. Update BOM Item
    const targetBOM = boms.find((b) => b.id === bomItemId);
    if (!targetBOM) return { success: false, message: 'Không tìm thấy mục BOM.' };

    const newProjectReceived = targetBOM.projectReceivedQty + projectAllocation;
    const newRemaining = Math.max(0, targetBOM.bomQty - newProjectReceived);
    const newStatus: ProjectBOMItem['status'] =
      newRemaining === 0 ? 'FULFILLED' : newProjectReceived > 0 ? 'PARTIALLY_RECEIVED' : 'PURCHASING';

    const nextBOMs = boms.map((b) =>
      b.id === bomItemId
        ? {
            ...b,
            projectReceivedQty: newProjectReceived,
            remainingQty: newRemaining,
            status: newStatus,
          }
        : b
    );
    setBOMs(nextBOMs);
    StorageService.saveBOMs(nextBOMs);

    // 2. If warehouse allocation > 0, increase mock warehouse stock of the material
    if (warehouseAllocation > 0) {
      const nextMaterials = materials.map((m) =>
        m.id === materialId ? { ...m, stockQty: m.stockQty + warehouseAllocation } : m
      );
      setMaterials(nextMaterials);
      StorageService.saveMaterials(nextMaterials);
    }

    addToast(
      'success',
      `Đã nhận ${receivedQty} sản phẩm (Phân bổ: ${projectAllocation} cho Dự án, ${warehouseAllocation} Nhập kho).`,
      'Nhận hàng thành công'
    );
    return { success: true };
  };

  // --- Invoice Operations ---
  const saveInvoice = (data: Partial<ProjectInvoice>) => {
    if (!data.projectId || !data.supplierId) {
      return { success: false, message: 'Dự án và Nhà cung cấp là bắt buộc.' };
    }

    let next: ProjectInvoice[];
    if (data.id) {
      next = invoices.map((inv) =>
        inv.id === data.id
          ? {
              ...inv,
              goodsValue: data.goodsValue !== undefined ? data.goodsValue : inv.goodsValue,
              invoiceStatus: data.invoiceStatus || inv.invoiceStatus,
              invoiceNumber: data.invoiceNumber?.trim() || '',
              invoiceDate: data.invoiceDate || '',
              notes: data.notes?.trim() || '',
            }
          : inv
      );
      addToast('success', 'Đã cập nhật thông tin hóa đơn.');
    } else {
      const newInv: ProjectInvoice = {
        id: `INV-${Date.now()}`,
        projectId: data.projectId,
        supplierId: data.supplierId,
        goodsValue: data.goodsValue || 0,
        receivingStatus: data.receivingStatus || 'PARTIALLY_RECEIVED',
        invoiceStatus: data.invoiceStatus || 'AVAILABLE',
        invoiceNumber: data.invoiceNumber?.trim() || '',
        invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
        notes: data.notes?.trim() || '',
      };
      next = [newInv, ...invoices];
      addToast('success', 'Đã ghi nhận hóa đơn mới.');
    }

    setInvoices(next);
    StorageService.saveInvoices(next);
    return { success: true };
  };

  const deleteInvoice = (id: string) => {
    const next = invoices.filter((i) => i.id !== id);
    setInvoices(next);
    StorageService.saveInvoices(next);
    addToast('success', 'Đã xóa hóa đơn.');
  };

  // --- User & Role Operations ---
  const saveUser = (data: Partial<User>) => {
    if (!data.username || !data.username.trim()) return { success: false, message: 'Tên tài khoản là bắt buộc.' };
    if (!data.fullName || !data.fullName.trim()) return { success: false, message: 'Họ tên là bắt buộc.' };
    if (!data.roleIds || data.roleIds.length === 0) return { success: false, message: 'Vui lòng gán ít nhất một vai trò.' };

    const usernameLower = data.username.trim().toLowerCase();
    const existing = users.find((u) => u.username.toLowerCase() === usernameLower && u.id !== data.id);
    if (existing) {
      return { success: false, message: `Tên tài khoản "${usernameLower}" đã tồn tại.` };
    }

    let next: User[];
    if (data.id) {
      next = users.map((u) =>
        u.id === data.id
          ? {
              ...u,
              username: usernameLower,
              fullName: data.fullName!.trim(),
              roleIds: data.roleIds!,
              status: data.status || u.status,
              email: data.email || u.email,
              password: data.password || u.password,
            }
          : u
      );
    } else {
      const newUser: User = {
        id: `USR-${Date.now()}`,
        username: usernameLower,
        fullName: data.fullName!.trim(),
        roleIds: data.roleIds!,
        status: data.status || 'ACTIVE',
        email: data.email?.trim() || `${usernameLower}@ttc-material.vn`,
        password: data.password,
      };
      next = [...users, newUser];
    }

    const activeAdmins = next.filter((u) => u.status === 'ACTIVE' && u.roleIds?.includes('ROLE-ADMIN'));
    if (activeAdmins.length === 0) {
      return { success: false, message: 'Phải có ít nhất một tài khoản Admin đang hoạt động.' };
    }

    if (data.id) {
      addToast('success', `Đã cập nhật người dùng ${data.fullName}.`);
    } else {
      addToast('success', `Đã tạo mới người dùng ${data.fullName}.`);
    }

    setUsers(next);
    StorageService.saveUsers(next);
    return { success: true };
  };

  const deleteUser = (id: string) => {
    if (id === 'USR-001') {
      return { success: false, message: 'Không thể xóa tài khoản Admin mặc định.' };
    }
    const next = users.filter((u) => u.id !== id);
    
    const activeAdmins = next.filter((u) => u.status === 'ACTIVE' && u.roleIds?.includes('ROLE-ADMIN'));
    if (activeAdmins.length === 0) {
      return { success: false, message: 'Không thể xóa tài khoản Admin cuối cùng.' };
    }

    setUsers(next);
    StorageService.saveUsers(next);
    addToast('success', 'Đã xóa người dùng thành công.');
    return { success: true };
  };

  const resetUserPassword = (userId: string, newPassword: string) => {
    if (!newPassword || newPassword.trim() === '') {
      return { success: false, message: 'Mật khẩu mới không được để trống.' };
    }
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'Không tìm thấy người dùng.' };
    }
    const next = users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u));
    setUsers(next);
    StorageService.saveUsers(next);
    addToast('success', 'Đã đặt lại mật khẩu thành công.');
    return { success: true };
  };

  const saveRole = (data: Partial<Role>) => {
    if (!data.name || !data.name.trim()) return { success: false, message: 'Tên vai trò là bắt buộc.' };

    let next: Role[];
    if (data.id) {
      const current = roles.find((r) => r.id === data.id);
      if (current?.isSystemProtected) {
        return { success: false, message: 'Vai trò hệ thống Admin được bảo vệ, không thể sửa đổi quyền cơ bản.' };
      }

      next = roles.map((r) =>
        r.id === data.id
          ? {
              ...r,
              name: data.name!.trim(),
              description: data.description || r.description,
              status: data.status || r.status,
              uiVisibility: data.uiVisibility || r.uiVisibility,
              actionPermissions: data.actionPermissions || r.actionPermissions,
            }
          : r
      );
      addToast('success', `Đã cập nhật vai trò ${data.name}.`);
    } else {
      const newRole: Role = {
        id: `ROLE-${Date.now()}`,
        name: data.name!.trim(),
        description: data.description || '',
        isSystemProtected: false,
        status: data.status || 'ACTIVE',
        uiVisibility: data.uiVisibility || [],
        actionPermissions: data.actionPermissions || {
          material: { view: false, create: false, edit: false, delete: false, import: false },
          supplierPrice: { view: false, edit: false, set_preferred: false, import: false },
          project: { view: false, create: false, edit: false, delete: false },
          bom: { view: false, edit: false, import: false, select_supplier: false },
          warehouse: { stock_in: false, stock_out: false, receive_goods: false },
          systemMasters: { view: false, create: false, edit: false, delete: false },
          administration: { view: false, manage_users: false, manage_roles: false },
        },
      };
      next = [...roles, newRole];
      addToast('success', `Đã thêm vai trò mới ${data.name}.`);
    }

    setRoles(next);
    StorageService.saveRoles(next);
    return { success: true };
  };

  const deleteRole = (id: string) => {
    const role = roles.find((r) => r.id === id);
    if (role?.isSystemProtected) {
      return { success: false, message: 'Vai trò Admin được bảo vệ bởi hệ thống, không thể xóa.' };
    }
    const hasUsers = users.some((u) => u.roleIds?.includes(id));
    if (hasUsers) {
      return { success: false, message: 'Vai trò này đang được gán cho người dùng. Không thể xóa.' };
    }

    const next = roles.filter((r) => r.id !== id);
    setRoles(next);
    StorageService.saveRoles(next);
    addToast('success', 'Đã xóa vai trò thành công.');
    return { success: true };
  };

  const updateRoleActionPermissions = (roleId: string, actionPermissions: Role['actionPermissions']) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystemProtected) return;

    const next = roles.map((r) => {
      if (r.id === roleId) {
        return {
          ...r,
          actionPermissions,
        };
      }
      return r;
    });
    setRoles(next);
    StorageService.saveRoles(next);
  };

  const updateRolePermissions = (roleId: string, allowedMenus: MenuKey[]) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystemProtected) return;

    const next = roles.map((r) => {
      if (r.id === roleId) {
        return {
          ...r,
          uiVisibility: allowedMenus,
          allowedMenus: allowedMenus,
        };
      }
      return r;
    });
    setRoles(next);
    StorageService.saveRoles(next);
    addToast('success', 'Đã cập nhật phân quyền truy cập menu cho vai trò thành công.');
  };

  // --- Warehouse & Inventory Operations ---
  const saveWarehouse = (data: Partial<Warehouse>) => {
    if (!data.code || !data.code.trim()) {
      return { success: false, message: 'Mã kho là bắt buộc.' };
    }
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Tên kho là bắt buộc.' };
    }

    const codeUpper = data.code.trim().toUpperCase();
    const existing = warehouses.find((w) => w.code.toUpperCase() === codeUpper && w.id !== data.id);
    if (existing) {
      return { success: false, message: `Mã kho "${codeUpper}" đã tồn tại.` };
    }

    let next: Warehouse[];
    if (data.id) {
      next = warehouses.map((w) =>
        w.id === data.id
          ? {
              ...w,
              code: codeUpper,
              name: data.name!.trim(),
              location: data.location?.trim() || '',
              status: data.status || 'ACTIVE',
            }
          : w
      );
      addToast('success', `Đã cập nhật kho ${codeUpper}.`);
    } else {
      const newWh: Warehouse = {
        id: `WH-${Date.now()}`,
        code: codeUpper,
        name: data.name!.trim(),
        location: data.location?.trim() || '',
        status: data.status || 'ACTIVE',
      };
      next = [newWh, ...warehouses];
      addToast('success', `Đã tạo kho mới ${codeUpper}.`);
    }

    setWarehouses(next);
    StorageService.saveWarehouses(next);
    return { success: true };
  };

  const deleteWarehouse = (id: string) => {
    const hasInventory = inventory.some((inv) => inv.warehouseId === id && inv.quantity > 0);
    if (hasInventory) {
      return { success: false, message: 'Kho này còn hàng tồn kho. Không thể xóa.' };
    }

    const next = warehouses.filter((w) => w.id !== id);
    setWarehouses(next);
    StorageService.saveWarehouses(next);
    addToast('success', 'Đã xóa kho thành công.');
    return { success: true };
  };

  const executeStockTransaction = (txData: Omit<StockTransaction, 'id' | 'createdAt'>) => {
    if (!txData.materialId || !txData.warehouseId || txData.quantity <= 0) {
      return { success: false, message: 'Thông tin giao dịch kho không hợp lệ.' };
    }

    // Check stock if OUT
    const currentInvIndex = inventory.findIndex(
      (inv) => inv.warehouseId === txData.warehouseId && inv.materialId === txData.materialId
    );
    const currentQty = currentInvIndex >= 0 ? inventory[currentInvIndex].quantity : 0;

    if (txData.type === 'OUT' && currentQty < txData.quantity) {
      return {
        success: false,
        message: `Số lượng xuất (${txData.quantity}) vượt quá tồn kho thực tế (${currentQty}) tại kho đã chọn.`,
      };
    }

    const newTx: StockTransaction = {
      ...txData,
      id: `TX-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const nextTransactions = [newTx, ...stockTransactions];
    setStockTransactions(nextTransactions);
    StorageService.saveStockTransactions(nextTransactions);

    // Update inventory quantity
    let nextInventory = [...inventory];
    if (currentInvIndex >= 0) {
      const updatedQty =
        txData.type === 'IN'
          ? nextInventory[currentInvIndex].quantity + txData.quantity
          : nextInventory[currentInvIndex].quantity - txData.quantity;

      nextInventory[currentInvIndex] = {
        ...nextInventory[currentInvIndex],
        quantity: Math.max(0, updatedQty),
      };
    } else if (txData.type === 'IN') {
      nextInventory.push({
        id: `INV-${Date.now()}`,
        warehouseId: txData.warehouseId,
        materialId: txData.materialId,
        quantity: txData.quantity,
        binLocation: 'Kệ A-01',
      });
    }

    setInventory(nextInventory);
    StorageService.saveInventory(nextInventory);

    addToast(
      'success',
      `Đã thực hiện phiếu ${txData.type === 'IN' ? 'nhập' : 'xuất'} kho ${txData.referenceCode} thành công.`
    );
    return { success: true };
  };

  return (
    <AppContext.Provider
      value={{
        customers,
        projects,
        categories,
        uoms,
        manufacturers,
        suppliers,
        materials,
        prices,
        boms,
        invoices,
        warehouses,
        inventory,
        stockTransactions,
        users,
        roles,
        actionItems,
        currentUserId,
        currentUser,
        activeRole,
        effectiveUIVisibility,
        isSidebarCollapsed,
        toasts,
        setCurrentUserId,
        toggleSidebar,
        addToast,
        dismissToast,
        resetDemoData,
        saveCustomer,
        deleteCustomer,
        saveProject,
        deleteProject,
        saveCategory,
        deleteCategory,
        saveUOM,
        deleteUOM,
        saveManufacturer,
        deleteManufacturer,
        saveSupplier,
        deleteSupplier,
        saveWarehouse,
        deleteWarehouse,
        saveMaterial,
        deleteMaterial,
        toggleMaterialStatus,
        saveSupplierPrice,
        saveBulkSupplierPrices,
        setPreferredSupplier,
        saveBOMPurchaseDecision,
        updateBOMFinalUnitPrice,
        markBOMReturnOrExchange,
        updateBOMItemQuantity,
        saveBOMItem,
        processGoodsReceiving,
        saveInvoice,
        deleteInvoice,
        executeStockTransaction,
        saveUser,
        deleteUser,
        resetUserPassword,
        saveRole,
        deleteRole,
        updateRolePermissions,
        updateRoleActionPermissions,
        canDo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
