// LocalStorage Persistence Service & State Store
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
  ProjectInvoice,
  User,
  Role,
  Warehouse,
  InventoryStock,
  StockTransaction,
} from '../domain/types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PROJECTS,
  INITIAL_CATEGORIES,
  INITIAL_UOMS,
  INITIAL_MANUFACTURERS,
  INITIAL_SUPPLIERS,
  INITIAL_MATERIALS,
  INITIAL_PRICES,
  INITIAL_BOMS,
  INITIAL_INVOICES,
  INITIAL_USERS,
  INITIAL_WAREHOUSES,
  INITIAL_INVENTORY,
  INITIAL_STOCK_TRANSACTIONS,
} from '../data/mockData';
import { DEFAULT_ROLES } from '../domain/permissions';

const STORAGE_KEYS = {
  CUSTOMERS: 'ttc_prototype_customers',
  PROJECTS: 'ttc_prototype_projects',
  CATEGORIES: 'ttc_prototype_categories',
  UOMS: 'ttc_prototype_uoms',
  MANUFACTURERS: 'ttc_prototype_manufacturers',
  SUPPLIERS: 'ttc_prototype_suppliers',
  MATERIALS: 'ttc_prototype_materials',
  PRICES: 'ttc_prototype_prices',
  BOMS: 'ttc_prototype_boms',
  INVOICES: 'ttc_prototype_invoices',
  USERS: 'ttc_prototype_users',
  ROLES: 'ttc_prototype_roles',
  WAREHOUSES: 'ttc_prototype_warehouses',
  INVENTORY: 'ttc_prototype_inventory',
  STOCK_TRANSACTIONS: 'ttc_prototype_stock_transactions',
  CURRENT_USER_ID: 'ttc_prototype_current_user_id',
  SIDEBAR_COLLAPSED: 'ttc_prototype_sidebar_collapsed',
};

// Generic read/write helper
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage, using default:`, err);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('ttc_data_changed'));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export const StorageService = {
  // Reset all mock data to initial defaults
  resetAllToDefault: () => {
    saveToStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    saveToStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    saveToStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    saveToStorage(STORAGE_KEYS.UOMS, INITIAL_UOMS);
    saveToStorage(STORAGE_KEYS.MANUFACTURERS, INITIAL_MANUFACTURERS);
    saveToStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    saveToStorage(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    saveToStorage(STORAGE_KEYS.PRICES, INITIAL_PRICES);
    saveToStorage(STORAGE_KEYS.BOMS, INITIAL_BOMS);
    saveToStorage(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    saveToStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    saveToStorage(STORAGE_KEYS.ROLES, DEFAULT_ROLES);
    saveToStorage(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
    saveToStorage(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY);
    saveToStorage(STORAGE_KEYS.STOCK_TRANSACTIONS, INITIAL_STOCK_TRANSACTIONS);
    saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, 'USR-001');
  },

  // Customers
  getCustomers: (): Customer[] => loadFromStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
  saveCustomers: (data: Customer[]) => saveToStorage(STORAGE_KEYS.CUSTOMERS, data),

  // Projects
  getProjects: (): Project[] => loadFromStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS),
  saveProjects: (data: Project[]) => saveToStorage(STORAGE_KEYS.PROJECTS, data),

  // Categories
  getCategories: (): Category[] => loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
  saveCategories: (data: Category[]) => saveToStorage(STORAGE_KEYS.CATEGORIES, data),

  // UOMs
  getUOMs: (): UnitOfMeasure[] => loadFromStorage(STORAGE_KEYS.UOMS, INITIAL_UOMS),
  saveUOMs: (data: UnitOfMeasure[]) => saveToStorage(STORAGE_KEYS.UOMS, data),

  // Manufacturers
  getManufacturers: (): Manufacturer[] => loadFromStorage(STORAGE_KEYS.MANUFACTURERS, INITIAL_MANUFACTURERS),
  saveManufacturers: (data: Manufacturer[]) => saveToStorage(STORAGE_KEYS.MANUFACTURERS, data),

  // Suppliers
  getSuppliers: (): Supplier[] => loadFromStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS),
  saveSuppliers: (data: Supplier[]) => saveToStorage(STORAGE_KEYS.SUPPLIERS, data),

  // Materials
  getMaterials: (): Material[] => loadFromStorage(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS),
  saveMaterials: (data: Material[]) => saveToStorage(STORAGE_KEYS.MATERIALS, data),

  // Prices
  getPrices: (): MaterialSupplierPrice[] => loadFromStorage(STORAGE_KEYS.PRICES, INITIAL_PRICES),
  savePrices: (data: MaterialSupplierPrice[]) => saveToStorage(STORAGE_KEYS.PRICES, data),

  // BOMs
  getBOMs: (): ProjectBOMItem[] => loadFromStorage(STORAGE_KEYS.BOMS, INITIAL_BOMS),
  saveBOMs: (data: ProjectBOMItem[]) => saveToStorage(STORAGE_KEYS.BOMS, data),

  // Invoices
  getInvoices: (): ProjectInvoice[] => loadFromStorage(STORAGE_KEYS.INVOICES, INITIAL_INVOICES),
  saveInvoices: (data: ProjectInvoice[]) => saveToStorage(STORAGE_KEYS.INVOICES, data),

  // Warehouses
  getWarehouses: (): Warehouse[] => loadFromStorage(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES),
  saveWarehouses: (data: Warehouse[]) => saveToStorage(STORAGE_KEYS.WAREHOUSES, data),

  // Inventory
  getInventory: (): InventoryStock[] => loadFromStorage(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY),
  saveInventory: (data: InventoryStock[]) => saveToStorage(STORAGE_KEYS.INVENTORY, data),

  // Stock Transactions
  getStockTransactions: (): StockTransaction[] => loadFromStorage(STORAGE_KEYS.STOCK_TRANSACTIONS, INITIAL_STOCK_TRANSACTIONS),
  saveStockTransactions: (data: StockTransaction[]) => saveToStorage(STORAGE_KEYS.STOCK_TRANSACTIONS, data),

  // Users & Roles
  getUsers: (): User[] => loadFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS),
  saveUsers: (data: User[]) => saveToStorage(STORAGE_KEYS.USERS, data),

  getRoles: (): Role[] => loadFromStorage(STORAGE_KEYS.ROLES, DEFAULT_ROLES),
  saveRoles: (data: Role[]) => saveToStorage(STORAGE_KEYS.ROLES, data),

  // Current active demo persona
  getCurrentUserId: (): string => loadFromStorage(STORAGE_KEYS.CURRENT_USER_ID, 'USR-001'),
  setCurrentUserId: (id: string) => saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, id),

  // Sidebar state
  isSidebarCollapsed: (): boolean => loadFromStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, false),
  setSidebarCollapsed: (val: boolean) => saveToStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, val),
};
