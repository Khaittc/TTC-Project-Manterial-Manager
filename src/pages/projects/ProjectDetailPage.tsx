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
  Clock,
  FileText,
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
import { formatDate, formatQuantity } from '../../domain/mockRules';
import { Project, ProjectStatus, ActionRequiredItem } from '../../domain/types';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    projects,
    customers,
    boms,
    invoices,
    suppliers,
    actionItems,
    saveProject,
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

  // Gated action: project.edit permission
  const canEditProject = canDo('project', 'edit');

  useEffect(() => {
    if (project) {
      setEditFormData({ ...project });
    }
  }, [project]);

  // Project BOM Items
  const projectBOMs = useMemo(() => {
    return boms.filter((b) => b.projectId === project?.id);
  }, [boms, project?.id]);

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

  // 3. Receiving Summary Calculations (Read-only, canonical BOM fields)
  const receivingSummary = useMemo(() => {
    const totalBomQty = projectBOMs.reduce((acc, b) => acc + (b.bomQty || 0), 0);
    const totalReceivedQty = projectBOMs.reduce((acc, b) => acc + (b.projectReceivedQty || 0), 0);
    const totalRemainingQty = projectBOMs.reduce((acc, b) => acc + (b.remainingQty || 0), 0);
    const fullyReceivedLines = projectBOMs.filter((b) => b.status === 'FULFILLED').length;
    const partialReceivedLines = projectBOMs.filter((b) => b.status === 'PARTIALLY_RECEIVED').length;
    const notReceivedLines = projectBOMs.filter((b) => b.status === 'NOT_PURCHASED' || b.status === 'PURCHASING').length;

    return {
      totalBomQty,
      totalReceivedQty,
      totalRemainingQty,
      fullyReceivedLines,
      partialReceivedLines,
      notReceivedLines,
      percentReceived: totalBomQty > 0 ? Math.round((totalReceivedQty / totalBomQty) * 100) : 0,
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
            {/* Tình trạng nhận hàng (Read-only summary card) */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                    <ArrowDownToLine className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Tình trạng nhận hàng</h3>
                    <p className="text-xs text-slate-500">Tổng hợp khối lượng hàng đã giao nhận</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-600">
                    {receivingSummary.percentReceived}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">hoàn tất</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${receivingSummary.percentReceived}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Đã nhận: <strong className="text-slate-800">{formatQuantity(receivingSummary.totalReceivedQty)}</strong></span>
                  <span>Tổng BOM: <strong className="text-slate-800">{formatQuantity(receivingSummary.totalBomQty)}</strong></span>
                </div>
              </div>

              {/* Breakdown metrics */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Đã đủ</span>
                  <span className="text-sm font-bold text-emerald-600">{receivingSummary.fullyReceivedLines} dòng</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Nhận 1 phần</span>
                  <span className="text-sm font-bold text-amber-600">{receivingSummary.partialReceivedLines} dòng</span>
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

      {/* TAB 2: BOM & NHÀ CUNG CẤP */}
      {activeTab === 'bom' && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xs text-center space-y-3">
          <Layers className="w-10 h-10 text-blue-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Nội dung BOM & Nhà cung cấp sẽ được hoàn thiện trong bước REQ-04C/04D.
          </p>
          <p className="text-xs text-slate-500">
            Khu vực quản lý danh mục BOM dự án, so sánh đơn giá và lựa chọn nhà cung cấp.
          </p>
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
    </div>
  );
};
