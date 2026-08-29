import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Pencil,
  Save,
  X,
  Layers,
  LayoutDashboard,
  ArrowDownToLine,
  Receipt,
  PackageSearch,
  PackageCheck,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Search,
  Upload,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { FormField } from '../../components/forms/FormField';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { SpecBadge } from '../../components/common/SpecBadge';
import { PlaceholderDialog } from '../../components/dialogs/PlaceholderDialog';
import { SupplierPriceDrawer } from '../../components/bom/SupplierPriceDrawer';
import { formatDate, formatCurrency, formatQuantity } from '../../domain/mockRules';
import { Project, ProjectStatus, ProjectBOMItem } from '../../domain/types';

// Helper for transitional procurement status display in REQ-04C
export function getBOMProcurementStatus(b: ProjectBOMItem): {
  token: string;
  label: string;
  isReceivingDerived: boolean;
} {
  // Precedence 1: Derived from goods receiving
  if (b.projectReceivedQty !== undefined && b.projectReceivedQty >= b.bomQty && b.bomQty > 0) {
    return {
      token: 'FULLY_RECEIVED',
      label: 'Đã nhận đủ',
      isReceivingDerived: true,
    };
  }
  if (b.projectReceivedQty !== undefined && b.projectReceivedQty > 0 && b.projectReceivedQty < b.bomQty) {
    return {
      token: 'PARTIALLY_RECEIVED',
      label: `Đã nhận ${b.projectReceivedQty} / ${b.bomQty}`,
      isReceivingDerived: true,
    };
  }
  // Legacy mock data compatibility
  if (b.status === 'FULFILLED') {
    return {
      token: 'FULLY_RECEIVED',
      label: 'Đã nhận đủ',
      isReceivingDerived: true,
    };
  }
  if (b.status === 'PARTIALLY_RECEIVED') {
    return {
      token: 'PARTIALLY_RECEIVED',
      label: `Đã nhận ${b.projectReceivedQty || 1} / ${b.bomQty}`,
      isReceivingDerived: true,
    };
  }
  if (b.status === 'PURCHASING') {
    return {
      token: 'ORDERED',
      label: 'Đã đặt hàng',
      isReceivingDerived: false,
    };
  }
  // Default / NOT_PURCHASED
  return {
    token: 'AWAITING_QUOTATION',
    label: 'Đang chờ báo giá',
    isReceivingDerived: false,
  };
}

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    projects,
    customers,
    boms,
    invoices,
    suppliers,
    prices,
    categories,
    manufacturers,
    materials,
    uoms,
    actionItems,
    saveProject,
    updateBOMItemQuantity,
    addToast,
    canDo,
  } = useApp();

  // Active Project
  const project = useMemo(() => {
    return projects.find((p) => p.id === projectId) || projects[0];
  }, [projects, projectId]);

  const customer = customers.find((c) => c.id === project?.customerId);

  // Exactly 4 Tabs in exact order: 1. Tổng quan, 2. BOM & Nhà cung cấp, 3. Nhận hàng, 4. Hóa đơn
  // Default tab: 'overview' (Tổng quan)
  const [activeTab, setActiveTab] = useState<'overview' | 'bom' | 'receiving' | 'invoices'>('overview');

  // Edit Project Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Project>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Gated permissions
  const canEditProject = canDo('project', 'edit');
  const canImportBOM = canDo('bom', 'import');
  const canEditBOM = canDo('bom', 'edit');

  // BOM Tab Toolbar Filters State
  const [bomSearch, setBomSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedManufacturer, setSelectedManufacturer] = useState('ALL');
  const [procurementStatusFilter, setProcurementStatusFilter] = useState<string>('ALL');
  const [isBomEditMode, setIsBomEditMode] = useState(false);

  // Supplier & Price Right Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerBOMItem, setActiveDrawerBOMItem] = useState<ProjectBOMItem | null>(null);

  // Placeholder dialogs
  const [isImportPlaceholderOpen, setIsImportPlaceholderOpen] = useState(false);
  const [isPostPurchasePlaceholderOpen, setIsPostPurchasePlaceholderOpen] = useState(false);

  // Edit BOM Item Modal
  const [editingBOMItem, setEditingBOMItem] = useState<ProjectBOMItem | null>(null);
  const [editBOMQty, setEditBOMQty] = useState<number>(1);
  const [editBOMError, setEditBOMError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setEditFormData({ ...project });
    }
  }, [project]);

  // Project BOM Items
  const projectBOMs = useMemo(() => {
    return boms.filter((b) => b.projectId === project?.id);
  }, [boms, project?.id]);

  // Filtered BOM Items for Tab 2
  const filteredBOMs = useMemo(() => {
    return projectBOMs.filter((b) => {
      const mat = materials.find((m) => m.id === b.materialId);
      if (!mat) return false;

      // 1. Search against Material.model and Material.description (case-insensitive)
      if (bomSearch.trim()) {
        const query = bomSearch.toLowerCase().trim();
        const modelMatch = mat.model?.toLowerCase().includes(query);
        const descMatch = mat.description?.toLowerCase().includes(query);
        if (!modelMatch && !descMatch) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'ALL' && mat.categoryId !== selectedCategory) {
        return false;
      }

      // 3. Manufacturer filter
      if (selectedManufacturer !== 'ALL' && mat.manufacturerId !== selectedManufacturer) {
        return false;
      }

      // 4. Procurement status filter
      if (procurementStatusFilter !== 'ALL') {
        const statusInfo = getBOMProcurementStatus(b);
        if (statusInfo.token !== procurementStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [projectBOMs, materials, bomSearch, selectedCategory, selectedManufacturer, procurementStatusFilter]);

  // Project Invoices
  const projectInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.projectId === project?.id);
  }, [invoices, project?.id]);

  // Project Action Items
  const projectActionItems = useMemo(() => {
    if (!project) return [];
    return actionItems.filter(
      (item) =>
        item.linkTo.includes(project.id) ||
        item.targetName.includes(project.code) ||
        (item.category === 'BOM' && item.linkTo.includes(project.id))
    );
  }, [actionItems, project]);

  // 1. KPI Calculations (Prototype safe, no new production status)
  const totalMaterialCount = projectBOMs.length;
  const fulfilledCount = projectBOMs.filter((b) => b.status === 'FULFILLED').length;
  const purchasingCount = projectBOMs.filter((b) => b.status === 'PURCHASING').length;
  const missingCount = projectBOMs.filter((b) => b.status === 'NOT_PURCHASED' || b.status === 'PARTIALLY_RECEIVED').length;

  // 2. Material Status Chart Data (Prototype categories)
  const materialStatusChartData = useMemo(() => {
    const noSupplierCount = projectBOMs.filter(
      (b) => !b.finalSupplierId && b.status === 'NOT_PURCHASED'
    ).length;
    const hasSupplierCount = projectBOMs.filter(
      (b) => !!b.finalSupplierId && b.status === 'NOT_PURCHASED'
    ).length;
    const purchasing = projectBOMs.filter((b) => b.status === 'PURCHASING').length;
    const partialReceived = projectBOMs.filter((b) => b.status === 'PARTIALLY_RECEIVED').length;
    const fulfilled = projectBOMs.filter((b) => b.status === 'FULFILLED').length;

    return [
      { name: 'Chưa chọn NCC', count: noSupplierCount, color: '#94a3b8' },
      { name: 'Đã chọn NCC', count: hasSupplierCount, color: '#38bdf8' },
      { name: 'Đang mua', count: purchasing, color: '#3b82f6' },
      { name: 'Nhận một phần', count: partialReceived, color: '#f59e0b' },
      { name: 'Đã đủ', count: fulfilled, color: '#10b981' },
    ];
  }, [projectBOMs]);

  // 3. Receiving Summary Calculations (Line/status-based read-only summary, no cross-UOM aggregation)
  const receivingSummary = useMemo(() => {
    const totalLines = projectBOMs.length;
    const fulfilledLines = projectBOMs.filter((b) => b.status === 'FULFILLED').length;
    const partialLines = projectBOMs.filter((b) => b.status === 'PARTIALLY_RECEIVED').length;
    const notReceivedLines = projectBOMs.filter(
      (b) => b.status === 'NOT_PURCHASED' || b.status === 'PURCHASING'
    ).length;
    const lineCompletionPercent =
      totalLines > 0 ? Math.round((fulfilledLines / totalLines) * 100) : 0;

    return {
      totalLines,
      fulfilledLines,
      partialLines,
      notReceivedLines,
      lineCompletionPercent,
    };
  }, [projectBOMs]);

  // 4. Invoice Summary Calculations (Read-only document status, no VAT/payment)
  const invoiceSummary = useMemo(() => {
    const totalInvoices = projectInvoices.length;
    const availableCount = projectInvoices.filter((inv) => inv.invoiceStatus === 'AVAILABLE').length;
    const missingCount = projectInvoices.filter((inv) => inv.invoiceStatus === 'NOT_AVAILABLE').length;

    return {
      totalInvoices,
      availableCount,
      missingCount,
    };
  }, [projectInvoices]);

  const handleOpenEditProject = () => {
    if (!canEditProject) {
      addToast('error', 'Bạn không có quyền chỉnh sửa thông tin dự án.');
      return;
    }
    if (project) {
      setEditFormData({ ...project });
      setFormError(null);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editFormData.name?.trim()) {
      setFormError('Tên dự án không được để trống.');
      return;
    }

    if (!editFormData.customerId) {
      setFormError('Vui lòng chọn khách hàng.');
      return;
    }

    const res = saveProject(editFormData);
    if (res.success) {
      addToast('success', 'Cập nhật thông tin dự án thành công.');
      setIsEditModalOpen(false);
    } else {
      setFormError(res.message || 'Không thể lưu dự án.');
    }
  };

  // Handler for Import BOM button (Placeholder only)
  const handleImportBOMClick = () => {
    if (!canImportBOM) {
      addToast('error', 'Bạn không có quyền import BOM.');
      return;
    }
    setIsImportPlaceholderOpen(true);
  };

  // Handler for Edit BOM toolbar / row click
  const handleEditBOMRow = (item: ProjectBOMItem) => {
    if (!canEditBOM) {
      addToast('error', 'Bạn không có quyền chỉnh sửa BOM.');
      return;
    }

    // Post-purchase boundary check:
    // If purchasing or receiving has started (status !== 'NOT_PURCHASED' or projectReceivedQty > 0)
    const isStarted = item.status !== 'NOT_PURCHASED' || (item.projectReceivedQty && item.projectReceivedQty > 0);
    if (isStarted) {
      setIsPostPurchasePlaceholderOpen(true);
      return;
    }

    // Pre-purchase: open bounded SL BOM edit modal
    setEditingBOMItem(item);
    setEditBOMQty(item.bomQty);
    setEditBOMError(null);
  };

  const handleToggleBOMEditMode = () => {
    if (!canEditBOM) {
      addToast('error', 'Bạn không có quyền chỉnh sửa BOM.');
      return;
    }
    setIsBomEditMode((prev) => !prev);
  };

  const handleSaveBOMQty = (e: React.FormEvent) => {
    e.preventDefault();
    setEditBOMError(null);

    if (!editingBOMItem) return;
    if (isNaN(editBOMQty) || editBOMQty <= 0) {
      setEditBOMError('Số lượng BOM phải là số dương lớn hơn 0.');
      return;
    }

    updateBOMItemQuantity(editingBOMItem.id, editBOMQty);
    addToast('success', 'Đã cập nhật số lượng BOM thành công.');
    setEditingBOMItem(null);
  };

  if (!project) {
    return <EmptyState title="Không tìm thấy dự án" description="Vui lòng kiểm tra lại liên kết hoặc chọn dự án khác." />;
  }

  return (
    <div className="space-y-4">
      {/* Persistent Project Header */}
      <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-blue-50 text-blue-600">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={project.id}
                onChange={(e) => navigate(`/projects/${e.target.value}`)}
                className="text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none cursor-pointer pr-4"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
              <StatusBadge status={project.status} type="project" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Khách hàng: <span className="font-semibold text-slate-700">{customer?.name || '—'}</span> | Ngày bắt đầu:{' '}
              <span className="font-semibold text-slate-700">{formatDate(project.startDate)}</span>
            </p>
          </div>
        </div>

        {/* Global action on project */}
        <div className="flex items-center gap-2">
          {canEditProject && (
            <button
              type="button"
              onClick={handleOpenEditProject}
              className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Chỉnh sửa dự án</span>
            </button>
          )}
        </div>
      </div>

      {/* Exactly 4 Tabs in exact order: 1. Tổng quan, 2. BOM & Nhà cung cấp, 3. Nhận hàng, 4. Hóa đơn */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 rounded-t-lg">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Tổng quan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bom')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'bom'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>BOM & Nhà cung cấp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receiving')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'receiving'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Nhận hàng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Hóa đơn</span>
        </button>
      </div>

      {/* TAB 1: TỔNG QUAN (REQ-04B FROZEN LAYOUT) */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Row 1: 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Tổng Material */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng Material</h3>
                <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                  <PackageSearch className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{totalMaterialCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Dòng vật tư trong danh mục BOM</p>
            </div>

            {/* KPI 2: Đã đủ */}
            <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Đã đủ</h3>
                <div className="p-1.5 rounded bg-emerald-50 text-emerald-600">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{fulfilledCount}</p>
              <p className="text-[11px] text-emerald-600 mt-1">Vật tư đã giao nhận đầy đủ</p>
            </div>

            {/* KPI 3: Đang mua */}
            <div className="bg-white p-4 rounded-lg border border-amber-100 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-amber-600 uppercase tracking-wider">Đang mua</h3>
                <div className="p-1.5 rounded bg-amber-50 text-amber-600">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-700">{purchasingCount}</p>
              <p className="text-[11px] text-amber-600 mt-1">Vật tư đang trong tiến trình mua</p>
            </div>

            {/* KPI 4: Còn thiếu */}
            <div className="bg-white p-4 rounded-lg border border-rose-100 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-rose-600 uppercase tracking-wider">Còn thiếu</h3>
                <div className="p-1.5 rounded bg-rose-50 text-rose-600">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-700">{missingCount}</p>
              <p className="text-[11px] text-rose-600 mt-1">Chưa mua hoặc chưa nhận đủ</p>
            </div>
          </div>

          {/* Row 2: Tình trạng vật tư / chart */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Tình trạng vật tư
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân bố tiến độ mua và nhận hàng theo danh mục BOM của dự án
                </p>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Tổng: <strong className="text-slate-900">{totalMaterialCount}</strong> vật tư
              </span>
            </div>

            {totalMaterialCount === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Dự án chưa có dữ liệu BOM để hiển thị biểu đồ.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={materialStatusChartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        fontSize: '12px',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: any) => [`${value} vật tư`, 'Số lượng']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {materialStatusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Row 3: [ Tình trạng nhận hàng ][ Tình trạng hóa đơn ] */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tình trạng nhận hàng (Read-only summary card, line-based) */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                    <ArrowDownToLine className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Tình trạng nhận hàng</h3>
                    <p className="text-xs text-slate-500">Tiến độ nhận hàng theo dòng vật tư BOM</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-600">
                    {receivingSummary.lineCompletionPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">% dòng BOM đã đủ</span>
                </div>
              </div>

              {/* Progress Bar (Line-based) */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${receivingSummary.lineCompletionPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Dòng đã đủ: <strong className="text-slate-800">{receivingSummary.fulfilledLines} dòng</strong></span>
                  <span>Tổng dòng BOM: <strong className="text-slate-800">{receivingSummary.totalLines} dòng</strong></span>
                </div>
              </div>

              {/* Breakdown metrics (Line-based) */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Đã đủ</span>
                  <span className="text-sm font-bold text-emerald-600">{receivingSummary.fulfilledLines} dòng</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Nhận 1 phần</span>
                  <span className="text-sm font-bold text-amber-600">{receivingSummary.partialLines} dòng</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Chưa nhận</span>
                  <span className="text-sm font-bold text-slate-700">{receivingSummary.notReceivedLines} dòng</span>
                </div>
              </div>
            </div>

            {/* Tình trạng hóa đơn (Read-only summary card, no VAT/payment) */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Tình trạng hóa đơn</h3>
                    <p className="text-xs text-slate-500">Theo dõi chứng từ hóa đơn nhà cung cấp</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {invoiceSummary.totalInvoices} chứng từ
                </span>
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-700 font-medium block">Đã có hóa đơn</span>
                    <span className="text-xl font-bold text-emerald-800">{invoiceSummary.availableCount}</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="p-3 rounded-lg border border-rose-100 bg-rose-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-rose-700 font-medium block">Chưa có hóa đơn</span>
                    <span className="text-xl font-bold text-rose-800">{invoiceSummary.missingCount}</span>
                  </div>
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                </div>
              </div>

              {/* Invoices List preview (Read-only document status, strictly no VAT/payment) */}
              <div className="space-y-1.5 pt-1">
                {projectInvoices.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">Dự án chưa có hóa đơn nhà cung cấp nào.</p>
                ) : (
                  projectInvoices.slice(0, 3).map((inv) => {
                    const sup = suppliers.find((s) => s.id === inv.supplierId);
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="truncate max-w-[200px]">
                          <span className="font-semibold text-slate-800 block truncate">{sup?.name || 'Nhà cung cấp'}</span>
                          <span className="text-[11px] text-slate-500">Số HĐ: {inv.invoiceNumber || '—'}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            inv.invoiceStatus === 'AVAILABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.invoiceStatus === 'AVAILABLE' ? 'Đã có' : 'Chưa có'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Việc cần xử lý (Full-width section) */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Việc cần xử lý</h3>
                  <p className="text-xs text-slate-500">Các hạng mục cần lưu ý và hành động tiếp theo cho dự án</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {projectActionItems.length} hạng mục
              </span>
            </div>

            {projectActionItems.length === 0 ? (
              <div className="p-6 text-center rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Không có vấn đề cần xử lý</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tất cả hạng mục BOM, nhận hàng và hóa đơn của dự án đang ở trạng thái tốt.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {projectActionItems.map((item) => {
                  const severityBadgeClass =
                    item.severity === 'HIGH'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : item.severity === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200';

                  return (
                    <div
                      key={item.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition px-2 rounded"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityBadgeClass}`}
                          >
                            {item.severity}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            {item.issue}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{item.targetName}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.category === 'BOM' && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('bom')}
                            className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 flex items-center gap-1 transition"
                          >
                            <span>{item.actionLabel || 'Xem BOM'}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                        {item.category === 'RECEIVING' && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('receiving')}
                            className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 flex items-center gap-1 transition"
                          >
                            <span>{item.actionLabel || 'Xem Nhận hàng'}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                        {item.category === 'INVOICE' && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('invoices')}
                            className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 flex items-center gap-1 transition"
                          >
                            <span>{item.actionLabel || 'Xem Hóa đơn'}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                        {item.category === 'PRICE' && (
                          <button
                            type="button"
                            onClick={() => navigate(item.linkTo)}
                            className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 flex items-center gap-1 transition"
                          >
                            <span>{item.actionLabel || 'Xem chi tiết'}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BOM & NHÀ CUNG CẤP (REQ-04C CANONICAL BOM STRUCTURE & SUPPLIER DRAWER) */}
      {activeTab === 'bom' && (
        <div className="space-y-4">
          {/* Exact Toolbar */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[300px]">
              {/* Search Model / Description */}
              <div className="relative min-w-[200px] max-w-xs flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm Model / Mô tả..."
                  value={bomSearch}
                  onChange={(e) => setBomSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả nhóm</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Manufacturer Filter */}
              <select
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả hãng</option>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* Procurement Status Filter */}
              <select
                value={procurementStatusFilter}
                onChange={(e) => setProcurementStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="INTERNAL_REVIEW">Kiểm tra nội bộ</option>
                <option value="AWAITING_QUOTATION">Đang chờ báo giá</option>
                <option value="AWAITING_PAYMENT">Chờ thanh toán</option>
                <option value="ORDERED">Đã đặt hàng</option>
                <option value="PARTIALLY_RECEIVED">Đã nhận x / y</option>
                <option value="FULLY_RECEIVED">Đã nhận đủ</option>
                <option value="RETURN_OR_EXCHANGE">Đang trả hàng / đổi hàng</option>
              </select>
            </div>

            {/* Action Buttons in Toolbar */}
            <div className="flex items-center gap-2">
              {canImportBOM && (
                <button
                  type="button"
                  onClick={handleImportBOMClick}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium rounded flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Import BOM</span>
                </button>
              )}

              {canEditBOM && (
                <button
                  type="button"
                  onClick={handleToggleBOMEditMode}
                  className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 transition shadow-2xs ${
                    isBomEditMode
                      ? 'bg-slate-800 hover:bg-slate-900 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isBomEditMode ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                  <span>{isBomEditMode ? 'Kết thúc chỉnh sửa' : 'Chỉnh sửa BOM'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Canonical 8-Column BOM Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold whitespace-nowrap">
                    {/* 1. Hãng */}
                    <th className="p-3">Hãng</th>
                    {/* 2. Model */}
                    <th className="p-3">Model</th>
                    {/* 3. Mô tả */}
                    <th className="p-3">Mô tả</th>
                    {/* 4. Số lượng */}
                    <th className="p-3 text-right">Số lượng</th>
                    {/* 5. ĐVT */}
                    <th className="p-3">ĐVT</th>
                    {/* 6. Nhà cung cấp */}
                    <th className="p-3">Nhà cung cấp</th>
                    {/* 7. Trạng thái */}
                    <th className="p-3 text-center">Trạng thái</th>
                    {/* 8. Thao tác */}
                    <th className="p-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBOMs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Không tìm thấy vật tư BOM nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredBOMs.map((b) => {
                      const mat = materials.find((m) => m.id === b.materialId);
                      const mfg = manufacturers.find((m) => m.id === mat?.manufacturerId);
                      const uom = uoms.find((u) => u.id === mat?.uomId);
                      const finalSup = suppliers.find((s) => s.id === b.finalSupplierId);
                      const statusInfo = getBOMProcurementStatus(b);

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/70 transition">
                          {/* 1. Hãng */}
                          <td className="p-3 text-slate-700 whitespace-nowrap align-top">{mfg?.name || '—'}</td>

                          {/* 2. Model */}
                          <td className="p-3 font-semibold text-slate-900 whitespace-nowrap align-top">{mat?.model || '—'}</td>

                          {/* 3. Mô tả (Full content with auto-wrap, no truncation) */}
                          <td className="p-3 text-slate-600 whitespace-normal break-words min-w-[320px] max-w-[480px] leading-relaxed align-top">
                            {mat?.description || '—'}
                          </td>

                          {/* 4. Số lượng */}
                          <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap align-top">
                            {formatQuantity(b.bomQty)}
                          </td>

                          {/* 5. ĐVT */}
                          <td className="p-3 text-slate-600 whitespace-nowrap align-top">{uom?.code || '—'}</td>

                          {/* 6. Nhà cung cấp (Final Selected Supplier) */}
                          <td className="p-3 text-slate-800 whitespace-nowrap align-top">
                            {finalSup ? (
                              <span className="font-medium text-slate-900">{finalSup.name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa chọn NCC</span>
                            )}
                          </td>

                          {/* 7. Trạng thái (Procurement Status) */}
                          <td className="p-3 text-center whitespace-nowrap align-top">
                            <StatusBadge status={statusInfo.token} customLabel={statusInfo.label} type="bom" />
                          </td>

                          {/* 8. Thao tác */}
                          <td className="p-3 text-center whitespace-nowrap align-top">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDrawerBOMItem(b);
                                  setIsDrawerOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold rounded text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 transition flex items-center gap-1"
                                title="Xem / Chọn NCC & Giá"
                              >
                                <span>Xem / Chọn NCC & Giá</span>
                              </button>

                              {isBomEditMode && canEditBOM && (
                                <button
                                  type="button"
                                  onClick={() => handleEditBOMRow(b)}
                                  className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition border border-slate-200"
                                  title="Chỉnh sửa số lượng BOM"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer count */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Hiển thị {filteredBOMs.length} / {projectBOMs.length} dòng vật tư BOM</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NHẬN HÀNG */}
      {activeTab === 'receiving' && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xs text-center space-y-3">
          <ArrowDownToLine className="w-10 h-10 text-blue-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Luồng Nhận hàng sẽ được hoàn thiện ở bước Receiving tiếp theo.
          </p>
          <p className="text-xs text-slate-500">
            Quy trình nhận hàng và phân bổ số lượng cho dự án / kho.
          </p>
        </div>
      )}

      {/* TAB 4: HÓA ĐƠN */}
      {activeTab === 'invoices' && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xs text-center space-y-3">
          <Receipt className="w-10 h-10 text-blue-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Luồng Hóa đơn sẽ được hoàn thiện ở bước Invoice tiếp theo.
          </p>
          <p className="text-xs text-slate-500">
            Theo dõi trạng thái chứng từ và hóa đơn nhà cung cấp cho dự án.
          </p>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Chỉnh sửa dự án</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject}>
              <div className="p-5 space-y-3.5 text-xs">
                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                    {formError}
                  </div>
                )}

                <FormField label="Mã dự án" required>
                  <input
                    type="text"
                    disabled
                    value={editFormData.code || ''}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-slate-100 font-bold text-slate-700 cursor-not-allowed"
                  />
                </FormField>

                <FormField label="Tên dự án" required>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    placeholder="VD: Nâng cấp biến tần trạm bơm"
                  />
                </FormField>

                <FormField label="Khách hàng" required>
                  <select
                    value={editFormData.customerId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, customerId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Ngày bắt đầu">
                    <input
                      type="date"
                      value={editFormData.startDate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </FormField>

                  <FormField label="Trạng thái">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={editFormData.status || 'IN_PROGRESS'}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as ProjectStatus })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="IN_PROGRESS">Đang thực hiện</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="ON_HOLD">Tạm dừng</option>
                        <option value="ATTENTION_NEEDED">Cần chú ý</option>
                      </select>
                      <SpecBadge />
                    </div>
                  </FormField>
                </div>

                <FormField label="Mô tả / Ghi chú">
                  <textarea
                    rows={3}
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    placeholder="Thông tin tiến độ, kỹ sư phụ trách, đặc thù công trình..."
                  />
                </FormField>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit BOM Qty Modal (Bounded Pre-Purchase Edit) */}
      {editingBOMItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chỉnh sửa SL BOM</h3>
                <p className="text-xs text-slate-500">Cập nhật số lượng BOM cho dòng vật tư.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBOMItem(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBOMQty}>
              <div className="p-5 space-y-3.5 text-xs">
                {editBOMError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                    {editBOMError}
                  </div>
                )}

                {(() => {
                  const m = materials.find((mat) => mat.id === editingBOMItem.materialId);
                  const c = categories.find((cat) => cat.id === m?.categoryId);
                  const mfg = manufacturers.find((mf) => mf.id === m?.manufacturerId);
                  const u = uoms.find((uo) => uo.id === m?.uomId);

                  return (
                    <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1 text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {m?.model || '—'}
                      </p>
                      <p className="text-[11px] text-slate-500">{m?.description || '—'}</p>
                      <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-600">
                        <span>Nhóm: <strong>{c?.name || '—'}</strong></span>
                        <span>Hãng: <strong>{mfg?.name || '—'}</strong></span>
                        <span>ĐVT: <strong>{u?.code || '—'}</strong></span>
                      </div>
                    </div>
                  );
                })()}

                <FormField label="Số lượng BOM" required>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={editBOMQty}
                    onChange={(e) => setEditBOMQty(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="Nhập số lượng BOM..."
                  />
                </FormField>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBOMItem(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu số lượng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import BOM Placeholder Modal */}
      <PlaceholderDialog
        isOpen={isImportPlaceholderOpen}
        title="Import BOM"
        capabilityName="Quản lý BOM dự án"
        description="Template, mapping, preview, duplicate handling và workflow Import BOM chưa được chốt trong SPEC. Chờ chốt SPEC."
        onClose={() => setIsImportPlaceholderOpen(false)}
      />

      {/* Post-Purchase BOM Edit Placeholder Modal */}
      <PlaceholderDialog
        isOpen={isPostPurchasePlaceholderOpen}
        title="Chỉnh sửa BOM"
        capabilityName="Thay đổi BOM sau khi bắt đầu mua hàng"
        description="Behavior chỉnh BOM sau khi bắt đầu mua hàng chưa được chốt trong SPEC. Chờ chốt SPEC."
        onClose={() => setIsPostPurchasePlaceholderOpen(false)}
      />

      {/* Supplier & Price Right Drawer (REQ-04C) */}
      {(() => {
        if (!activeDrawerBOMItem) return null;
        const drawerMat = materials.find((m) => m.id === activeDrawerBOMItem.materialId);
        const drawerCat = categories.find((c) => c.id === drawerMat?.categoryId);
        const drawerMfg = manufacturers.find((m) => m.id === drawerMat?.manufacturerId);
        const drawerUom = uoms.find((u) => u.id === drawerMat?.uomId);
        const drawerStatusInfo = getBOMProcurementStatus(activeDrawerBOMItem);

        return (
          <SupplierPriceDrawer
            isOpen={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              setActiveDrawerBOMItem(null);
            }}
            bomItem={activeDrawerBOMItem}
            material={drawerMat}
            category={drawerCat}
            manufacturer={drawerMfg}
            uom={drawerUom}
            suppliers={suppliers}
            prices={prices}
            currentProcurementStatusDisplay={drawerStatusInfo.label}
            isReceivingDerived={drawerStatusInfo.isReceivingDerived}
            onShowNotice={(msg) => addToast('info', msg)}
          />
        );
      })()}
    </div>
  );
};
