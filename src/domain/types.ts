// TTC Project Material Manager — Domain Types
// Prototype V0 (TypeScript Definitions)

export type ProjectStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'ATTENTION_NEEDED';

export type MasterStatus = 'ACTIVE' | 'INACTIVE';
export type MaterialStatus = 'ACTIVE' | 'ARCHIVED';
export type BOMMaterialStatus = 'NOT_PURCHASED' | 'PURCHASING' | 'PARTIALLY_RECEIVED' | 'FULFILLED';
export type ReceivingStatus = 'NOT_RECEIVED' | 'PARTIALLY_RECEIVED' | 'FULFILLED';
export type InvoiceStatus = 'NOT_AVAILABLE' | 'AVAILABLE';
export type PriceTrend = 'INCREASED' | 'DECREASED' | 'UNCHANGED' | 'NO_PRICE';

export interface Customer {
  id: string;
  code: string; // Unique
  name: string;
  address: string;
  createdAt: string;
}

export interface Project {
  id: string;
  code: string; // Unique
  name: string;
  customerId: string;
  startDate: string;
  status: ProjectStatus;
  notes?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  status: MasterStatus;
}

export interface UnitOfMeasure {
  id: string;
  code: string; // Unique (pcs, m, set, etc.)
  status: MasterStatus;
}

export interface Manufacturer {
  id: string;
  code: string; // Unique
  name: string;
  status: MasterStatus;
}

export interface Supplier {
  id: string;
  taxCode: string; // MST Unique
  name: string;
  address: string;
  status: MasterStatus;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface Material {
  id: string;
  categoryId: string;
  manufacturerId: string;
  model: string;
  description: string;
  uomId: string;
  status: MaterialStatus;
  stockQty: number; // Mock stock value
  isReferenced: boolean; // Has dependency in BOM / PO
  createdAt: string;
}

export interface MaterialSupplierPrice {
  id: string;
  materialId: string;
  supplierId: string;
  supplierProductCode: string;
  previousPrice: number;
  previousDate: string | null;
  currentPrice: number;
  currentDate: string;
  isPreferred: boolean;
}

export interface ProjectBOMItem {
  id: string;
  projectId: string;
  materialId: string;
  bomQty: number;
  cheapestSupplierId: string | null;
  cheapestPrice: number;
  preferredSupplierId: string | null;
  preferredPrice: number;
  finalSupplierId: string | null;
  finalUnitPrice: number;
  totalAmount: number;
  status: BOMMaterialStatus;
  projectReceivedQty: number;
  remainingQty: number;
  notes?: string;
}

export interface ProjectInvoice {
  id: string;
  projectId: string;
  supplierId: string;
  goodsValue: number;
  receivingStatus: ReceivingStatus;
  invoiceStatus: InvoiceStatus;
  invoiceNumber?: string;
  invoiceDate?: string;
  notes?: string;
}

export type MenuKey =
  | 'dashboard'
  | 'monitoring'
  | 'projects'
  | 'materials'
  | 'stock-in'
  | 'stock-out'
  | 'history'
  | 'system-masters'
  | 'administration';

export type ActionType =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'import'
  | 'set_preferred'
  | 'stock_in'
  | 'stock_out'
  | 'receive_goods';

export interface ActionPermission {
  domain: string;
  domainName: string;
  actions: { [key in ActionType]?: boolean };
}

export interface Role {
  id: string;
  code?: string;
  name: string;
  description?: string;
  isSystemProtected?: boolean; // Admin cannot be deleted or deactivated
  status: MasterStatus;
  uiVisibility: MenuKey[];
  allowedMenus?: MenuKey[];
  actionPermissions: {
    material: { view: boolean; create: boolean; edit: boolean; delete: boolean; import: boolean };
    supplierPrice: { view: boolean; edit: boolean; set_preferred: boolean; import: boolean };
    project: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    bom: { view: boolean; edit: boolean; import: boolean; select_supplier: boolean };
    warehouse: { stock_in: boolean; stock_out: boolean; receive_goods: boolean };
    systemMasters: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    administration: { view: boolean; manage_users: boolean; manage_roles: boolean };
  };
}

export interface User {
  id: string;
  username: string; // Unique
  fullName: string;
  roleIds: string[];
  status: MasterStatus;
  email?: string;
  avatar?: string;
}

export interface ActionRequiredItem {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  issue: string;
  targetName: string;
  category: 'BOM' | 'PRICE' | 'RECEIVING' | 'INVOICE' | 'INVENTORY';
  linkTo: string;
  actionLabel: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location?: string;
  status: MasterStatus;
}

export interface StockTransaction {
  id: string;
  type: 'IN' | 'OUT';
  materialId: string;
  warehouseId: string;
  projectId?: string;
  quantity: number;
  referenceCode: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryStock {
  id: string;
  warehouseId: string;
  materialId: string;
  quantity: number;
  binLocation?: string;
}

// Aliases for convenient domain access
export type MaterialPrice = MaterialSupplierPrice;
export type BOMItem = ProjectBOMItem;
export type BOMStatus = BOMMaterialStatus;

