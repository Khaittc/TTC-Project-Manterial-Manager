import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  ArrowDownToLine,
  Pencil,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  Receipt,
  History,
  FileText,
  AlertCircle,
  Building,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SearchInput } from '../../components/forms/SearchInput';
import { SelectDropdown } from '../../components/forms/SelectDropdown';
import { FormField } from '../../components/forms/FormField';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionIconBtn } from '../../components/common/ActionIconBtn';
import { EmptyState } from '../../components/common/EmptyState';
import { ReceivingModal } from '../../components/dialogs/ReceivingModal';
import { PlaceholderDialog } from '../../components/dialogs/PlaceholderDialog';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { SpecBadge } from '../../components/common/SpecBadge';
import { formatCurrency, formatQuantity, formatDate } from '../../domain/mockRules';
import { BOMItem, BOMStatus, Project } from '../../domain/types';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    projects,
    customers,
    boms,
    materials,
    manufacturers,
    uoms,
    categories,
    suppliers,
    invoices,
    stockTransactions,
    warehouses,
    saveBOMItem,
    deleteBOMItem,
    receiveBOMItem,
    saveProject,
    saveInvoice,
    addToast,
    canDo,
  } = useApp();

  // Active Project
  const project = useMemo(() => {
    return projects.find((p) => p.id === projectId) || projects[0];
  }, [projects, projectId]);

  const customer = customers.find((c) => c.id === project?.customerId);

  // Tabs
  const [activeTab, setActiveTab] = useState<'bom' | 'info' | 'invoices' | 'history'>('bom');

  // BOM Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Multi-selection in BOM
  const [selectedBOMIds, setSelectedBOMIds] = useState<string[]>([]);

  // Modals & Dialogs
  const [receivingModalData, setReceivingModalData] = useState<{
    isOpen: boolean;
    bomItem: BOMItem | null;
  }>({ isOpen: false, bomItem: null });

  const [bomFormModal, setBomFormModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    item: Partial<BOMItem>;
  }>({ isOpen: false, mode: 'create', item: {} });

  const [placeholderState, setPlaceholderState] = useState<{
    isOpen: boolean;
    title: string;
    featureDescription: string;
  }>({ isOpen: false, title: '', featureDescription: '' });

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    bomId: string | null;
  }>({ isOpen: false, bomId: null });

  // Project Info Edit State
  const [editingProject, setEditingProject] = useState<Partial<Project>>(() => project ? { ...project } : {});

  useEffect(() => {
    if (project) {
      setEditingProject({ ...project });
    }
  }, [project]);

  // Filtered BOMs
  const projectBOMs = useMemo(() => {
    return boms.filter((b) => b.projectId === project?.id);
  }, [boms, project?.id]);

  const filteredBOMs = useMemo(() => {
    return projectBOMs.filter((b) => {
      const mat = materials.find((m) => m.id === b.materialId);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        mat?.code?.toLowerCase().includes(q) ||
        mat?.name?.toLowerCase().includes(q) ||
        mat?.specs?.toLowerCase().includes(q) ||
        b.notes?.toLowerCase().includes(q);

      const matchesCategory = !categoryFilter || mat?.categoryId === categoryFilter;
      const matchesStatus = !statusFilter || b.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [projectBOMs, materials, searchQuery, categoryFilter, statusFilter]);

  // Aggregate metrics for summary footer
  const totalEstimatedAmount = useMemo(() => {
    return projectBOMs.reduce((sum, b) => sum + (b.estimatedPrice || 0) * b.quantityEstimated, 0);
  }, [projectBOMs]);

  const totalEstimatedQty = useMemo(() => {
    return projectBOMs.reduce((sum, b) => sum + b.quantityEstimated, 0);
  }, [projectBOMs]);

  const totalReceivedQty = useMemo(() => {
    return projectBOMs.reduce((sum, b) => sum + b.quantityReceived, 0);
  }, [projectBOMs]);

  const fulfillmentPercentage = totalEstimatedQty > 0 ? Math.round((totalReceivedQty / totalEstimatedQty) * 100) : 0;

  // Project Invoices
  const projectInvoices = useMemo(() => {
    return invoices.filter((i) => i.projectId === project?.id);
  }, [invoices, project?.id]);

  // Project Stock History
  const projectStockHistory = useMemo(() => {
    return stockTransactions.filter((tx) => tx.projectId === project?.id);
  }, [stockTransactions, project?.id]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedBOMIds.length === filteredBOMs.length) {
      setSelectedBOMIds([]);
    } else {
      setSelectedBOMIds(filteredBOMs.map((b) => b.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedBOMIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Add / Edit BOM Modal
  const handleOpenAddBOM = () => {
    setBomFormModal({
      isOpen: true,
      mode: 'create',
      item: {
        projectId: project?.id,
        materialId: materials[0]?.id || '',
        quantityEstimated: 1,
        estimatedPrice: 0,
        status: 'NOT_PURCHASED',
        notes: '',
      },
    });
  };

  const handleOpenEditBOM = (bom: BOMItem) => {
    setBomFormModal({
      isOpen: true,
      mode: 'edit',
      item: { ...bom },
    });
  };

  const handleSaveBOM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomFormModal.item.materialId) return;

    saveBOMItem({
      ...bomFormModal.item,
      projectId: project.id,
      quantityEstimated: Number(bomFormModal.item.quantityEstimated) || 1,
      estimatedPrice: Number(bomFormModal.item.estimatedPrice) || 0,
    });

    setBomFormModal({ isOpen: false, mode: 'create', item: {} });
  };

  const handleDeleteBOM = (id: string) => {
    deleteBOMItem(id);
    setSelectedBOMIds((prev) => prev.filter((i) => i !== id));
    setConfirmDelete({ isOpen: false, bomId: null });
  };

  // Handle fast receiving
  const handleExecuteReceiving = (qty: number, warehouseId: string, notes: string) => {
    if (!receivingModalData.bomItem) return;
    receiveBOMItem(receivingModalData.bomItem.id, qty, warehouseId, notes);
    setReceivingModalData({ isOpen: false, bomItem: null });
  };

  if (!project) {
    return <EmptyState title="Không tìm thấy dự án" description="Vui lòng kiểm tra lại liên kết hoặc chọn dự án khác." />;
  }

  return (
    <div className="space-y-4">
      {/* Project Switcher Bar */}
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
              Khách hàng: <span className="font-semibold text-slate-700">{customer?.name}</span>
            </p>
          </div>
        </div>

        {/* Global actions on project */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setPlaceholderState({
                isOpen: true,
                title: 'Xuất danh mục BOM ra Excel',
                featureDescription: 'Tính năng kết xuất toàn bộ danh mục BOM dự án kèm đơn giá dự toán theo mẫu tiêu chuẩn công ty.',
              })
            }
            className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất Excel</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setPlaceholderState({
                isOpen: true,
                title: 'Import BOM từ Excel',
                featureDescription: 'Mô-đun bóc tách file Excel dự toán tự động nhận diện mã vật tư, số lượng và quy cách kỹ thuật.',
              })
            }
            className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import BOM</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 rounded-t-lg">
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
          <span>Vật tư BOM ({projectBOMs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Thông tin dự án</span>
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
          <span>Hóa đơn NCC ({projectInvoices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Lịch sử kho ({projectStockHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: BOM VẬT TƯ */}
      {activeTab === 'bom' && (
        <div className="space-y-4">
          {/* BOM Toolbar */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Tìm mã VT, tên VT, quy cách..."
                className="w-64"
              />

              <SelectDropdown
                value={categoryFilter}
                onChange={setCategoryFilter}
                placeholder="Tất cả nhóm vật tư"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />

              <SelectDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Tình trạng mua"
                options={[
                  { value: 'NOT_PURCHASED', label: 'Chưa mua' },
                  { value: 'PURCHASING', label: 'Đang mua' },
                  { value: 'PARTIALLY_RECEIVED', label: 'Nhận một phần' },
                  { value: 'FULFILLED', label: 'Đã đủ' },
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              {selectedBOMIds.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setPlaceholderState({
                      isOpen: true,
                      title: 'Tạo Yêu cầu Mua hàng (PO)',
                      featureDescription: `Tập hợp ${selectedBOMIds.length} vật tư đã chọn để xuất phiếu yêu cầu mua hàng gửi phòng Mua Hàng & Kế Toán.`,
                    })
                  }
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tạo Y/C Mua ({selectedBOMIds.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenAddBOM}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm vật tư vào BOM</span>
              </button>
            </div>
          </div>

          {/* BOM Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredBOMs.length > 0 && selectedBOMIds.length === filteredBOMs.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-3">Hãng SX</th>
                    <th className="px-3 py-3 font-bold">Model</th>
                    <th className="px-3 py-3 min-w-[200px]">Mô tả vật tư</th>
                    <th className="px-2 py-3 text-center">ĐVT</th>
                    <th className="px-3 py-3 text-right">SL Dự toán</th>
                    <th className="px-3 py-3 text-right">Đơn giá dự toán</th>
                    <th className="px-3 py-3 text-right">Thành tiền</th>
                    <th className="px-3 py-3 text-right">SL Đã nhận</th>
                    <th className="px-3 py-3 text-center">Tình trạng</th>
                    <th className="px-4 py-3 text-right w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredBOMs.length === 0 ? (
                    <tr>
                      <td colSpan={11}>
                        <EmptyState
                          title="Chưa có vật tư nào trong BOM"
                          description="Thêm vật tư mới vào BOM hoặc import từ file Excel dự toán."
                          actionText="Thêm vật tư ngay"
                          onAction={handleOpenAddBOM}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredBOMs.map((bom) => {
                      const mat = materials.find((m) => m.id === bom.materialId);
                      const mfg = manufacturers.find((m) => m.id === mat?.manufacturerId);
                      const uom = uoms.find((u) => u.id === mat?.uomId);
                      const lineTotal = (bom.estimatedPrice || 0) * bom.quantityEstimated;
                      const isSelected = selectedBOMIds.includes(bom.id);

                      return (
                        <tr
                          key={bom.id}
                          className={`hover:bg-slate-50 transition ${isSelected ? 'bg-blue-50/40' : ''}`}
                        >
                          <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(bom.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          <td className="px-3 py-3 text-slate-700 font-medium">{mfg?.name || '—'}</td>

                          <td className="px-3 py-3 font-bold text-slate-900 font-mono">
                            <span
                              onClick={() => navigate(`/materials/${mat?.id}`)}
                              className="hover:text-blue-600 cursor-pointer underline decoration-dotted"
                            >
                              {mat?.model || '—'}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-slate-700 text-xs truncate max-w-[240px]">{mat?.description || '—'}</td>

                          <td className="px-2 py-3 text-center font-medium">{uom?.code || 'pcs'}</td>

                          <td className="px-3 py-3 text-right font-bold text-slate-900">
                            {formatQuantity(bom.quantityEstimated)}
                          </td>

                          <td className="px-3 py-3 text-right font-mono text-slate-700">
                            {formatCurrency(bom.estimatedPrice || 0)}
                          </td>

                          <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(lineTotal)}
                          </td>

                          <td className="px-3 py-3 text-right">
                            <span
                              className={`font-bold ${
                                bom.quantityReceived >= bom.quantityEstimated
                                  ? 'text-emerald-600'
                                  : bom.quantityReceived > 0
                                  ? 'text-amber-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {formatQuantity(bom.quantityReceived)}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <StatusBadge status={bom.status} type="bom" />
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ActionIconBtn
                                icon={ArrowDownToLine}
                                label="Nhận kho nhanh cho BOM"
                                variant="primary"
                                onClick={() => setReceivingModalData({ isOpen: true, bomItem: bom })}
                              />
                              <ActionIconBtn
                                icon={Pencil}
                                label="Sửa dòng BOM"
                                onClick={() => handleOpenEditBOM(bom)}
                              />
                              <ActionIconBtn
                                icon={Trash2}
                                label="Xóa khỏi BOM"
                                variant="danger"
                                onClick={() => setConfirmDelete({ isOpen: true, bomId: bom.id })}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-500">Tổng chủng loại: </span>
                  <span className="font-bold text-slate-900">{projectBOMs.length} mục</span>
                </div>
                <div>
                  <span className="text-slate-500">Tổng SL dự toán: </span>
                  <span className="font-bold text-slate-900">{formatQuantity(totalEstimatedQty)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Tiến độ nhận: </span>
                  <span className="font-bold text-blue-600">{fulfillmentPercentage}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Tổng giá trị dự toán:</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {formatCurrency(totalEstimatedAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THÔNG TIN DỰ ÁN */}
      {activeTab === 'info' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs max-w-3xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Chi tiết thông tin dự án</h2>
            <SpecBadge tooltip="Các trường thông tin dự án phục vụ phân bổ vật tư" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <FormField label="Mã dự án">
              <input
                type="text"
                disabled
                value={editingProject?.code ?? ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded font-bold text-slate-700 cursor-not-allowed"
              />
            </FormField>

            <FormField label="Tên dự án" required>
              <input
                type="text"
                value={editingProject?.name ?? ''}
                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-medium text-slate-900"
              />
            </FormField>

            <FormField label="Khách hàng">
              <select
                value={editingProject?.customerId ?? ''}
                onChange={(e) => setEditingProject({ ...editingProject, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Trạng thái dự án">
              <div className="flex items-center gap-2">
                <select
                  value={editingProject?.status ?? 'IN_PROGRESS'}
                  onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                >
                  <option value="IN_PROGRESS">Đang thực hiện</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="ON_HOLD">Tạm dừng</option>
                  <option value="ATTENTION_NEEDED">Cần chú ý</option>
                </select>
                <SpecBadge />
              </div>
            </FormField>

            <FormField label="Ngày bắt đầu">
              <input
                type="date"
                value={editingProject?.startDate ?? ''}
                onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </FormField>

            <FormField label="Ngày kết thúc dự kiến">
              <input
                type="date"
                value={editingProject?.endDate ?? ''}
                onChange={(e) => setEditingProject({ ...editingProject, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Ghi chú dự án">
                <textarea
                  rows={3}
                  value={editingProject?.notes ?? ''}
                  onChange={(e) => setEditingProject({ ...editingProject, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                  placeholder="Thông tin tiến độ, kỹ sư phụ trách, đặc thù công trình..."
                />
              </FormField>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => {
                saveProject(editingProject);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>Cập nhật dự án</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: HÓA ĐƠN NCC */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Danh sách Hóa đơn & Chứng từ Nhà cung cấp</h3>
              <p className="text-[11px] text-slate-500">
                Theo dõi tình trạng hóa đơn VAT, phiếu giao hàng của các nhà cung cấp cấp hàng cho dự án này
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setPlaceholderState({
                  isOpen: true,
                  title: 'Upload hóa đơn điện tử / PDF',
                  featureDescription: 'Tính năng tải lên tệp tin hóa đơn PDF/XML kèm trích xuất tự động mã số thuế và tổng tiền VAT.',
                })
              }
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải lên Hóa đơn PDF</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Số hóa đơn</th>
                  <th className="px-4 py-3">Nhà cung cấp</th>
                  <th className="px-4 py-3">Ngày phát hành</th>
                  <th className="px-4 py-3 text-right">Tổng tiền VAT</th>
                  <th className="px-4 py-3 text-center">Tình trạng hóa đơn</th>
                  <th className="px-4 py-3 text-right">Thao tác nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {projectInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        title="Chưa có hóa đơn NCC nào cho dự án này"
                        description="Hóa đơn sẽ hiển thị khi được phòng kế toán cập nhật hoặc nhập kho."
                      />
                    </td>
                  </tr>
                ) : (
                  projectInvoices.map((inv) => {
                    const sup = suppliers.find((s) => s.id === inv.supplierId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{sup?.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={inv.invoiceStatus} type="invoice" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus =
                                inv.invoiceStatus === 'AVAILABLE' ? 'NOT_AVAILABLE' : 'AVAILABLE';
                              saveInvoice({ ...inv, invoiceStatus: newStatus });
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                          >
                            Đổi trạng thái
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LỊCH SỬ KHO DỰ ÁN */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Mã phiếu</th>
                  <th className="px-4 py-3">Loại giao dịch</th>
                  <th className="px-4 py-3">Vật tư</th>
                  <th className="px-4 py-3">Kho</th>
                  <th className="px-4 py-3 text-right">Số lượng</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {projectStockHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title="Chưa có giao dịch kho nào cho dự án này"
                        description="Thực hiện nhập kho hoặc xuất kho gán mã dự án này để theo dõi lịch sử."
                      />
                    </td>
                  </tr>
                ) : (
                  projectStockHistory.map((tx) => {
                    const mat = materials.find((m) => m.id === tx.materialId);
                    const wh = warehouses.find((w) => w.id === tx.warehouseId);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{tx.referenceCode}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'IN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-orange-50 text-orange-700 border border-orange-200'
                            }`}
                          >
                            {tx.type === 'IN' ? 'Nhập kho' : 'Xuất kho'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 font-mono">{mat?.model}</td>
                        <td className="px-4 py-3 text-slate-600">{wh?.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatQuantity(tx.quantity)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(tx.createdAt)}</td>
                        <td className="px-4 py-3 text-slate-600">{tx.notes || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fast Receiving Modal */}
      {receivingModalData.isOpen && receivingModalData.bomItem && (
        <ReceivingModal
          isOpen={receivingModalData.isOpen}
          bomItem={receivingModalData.bomItem}
          onConfirm={handleExecuteReceiving}
          onCancel={() => setReceivingModalData({ isOpen: false, bomItem: null })}
        />
      )}

      {/* Add / Edit BOM Modal */}
      {bomFormModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {bomFormModal.mode === 'create' ? 'Thêm vật tư vào BOM dự án' : 'Chỉnh sửa vật tư BOM'}
              </h3>
              <button
                type="button"
                onClick={() => setBomFormModal({ isOpen: false, mode: 'create', item: {} })}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBOM}>
              <div className="p-5 space-y-3.5 text-xs">
                <FormField label="Chọn vật tư" required>
                  <select
                    value={bomFormModal.item.materialId || ''}
                    onChange={(e) => setBomFormModal({ ...bomFormModal, item: { ...bomFormModal.item, materialId: e.target.value } })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded text-xs bg-white"
                  >
                    {materials.map((m) => {
                      const mfg = manufacturers.find((man) => man.id === m.manufacturerId);
                      return (
                        <option key={m.id} value={m.id}>
                          {mfg?.name ? `${mfg.name} | ` : ''}{m.model} — {m.description}
                        </option>
                      );
                    })}
                  </select>
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Số lượng dự toán" required>
                    <input
                      type="number"
                      min="1"
                      required
                      value={bomFormModal.item.quantityEstimated || ''}
                      onChange={(e) =>
                        setBomFormModal({
                          ...bomFormModal,
                          item: { ...bomFormModal.item, quantityEstimated: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </FormField>

                  <FormField label="Đơn giá dự toán (VNĐ)">
                    <input
                      type="number"
                      min="0"
                      value={bomFormModal.item.estimatedPrice || ''}
                      onChange={(e) =>
                        setBomFormModal({
                          ...bomFormModal,
                          item: { ...bomFormModal.item, estimatedPrice: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                      placeholder="0"
                    />
                  </FormField>
                </div>

                <FormField label="Tình trạng mua hàng">
                  <select
                    value={bomFormModal.item.status || 'NOT_PURCHASED'}
                    onChange={(e) =>
                      setBomFormModal({
                        ...bomFormModal,
                        item: { ...bomFormModal.item, status: e.target.value as BOMStatus },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="NOT_PURCHASED">Chưa mua</option>
                    <option value="PURCHASING">Đang mua</option>
                    <option value="PARTIALLY_RECEIVED">Nhận một phần</option>
                    <option value="FULFILLED">Đã đủ</option>
                  </select>
                </FormField>

                <FormField label="Ghi chú kỹ thuật / Vị trí lắp đặt">
                  <textarea
                    rows={2}
                    value={bomFormModal.item.notes || ''}
                    onChange={(e) =>
                      setBomFormModal({
                        ...bomFormModal,
                        item: { ...bomFormModal.item, notes: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    placeholder="VD: Tủ điện điều khiển tầng 2..."
                  />
                </FormField>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBomFormModal({ isOpen: false, mode: 'create', item: {} })}
                  className="px-3.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu BOM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Xóa vật tư khỏi BOM?"
        message="Vật tư này sẽ bị loại khỏi danh mục dự toán của dự án."
        confirmLabel="Xóa khỏi BOM"
        onConfirm={() => confirmDelete.bomId && handleDeleteBOM(confirmDelete.bomId)}
        onCancel={() => setConfirmDelete({ isOpen: false, bomId: null })}
      />

      {/* Placeholder Modal */}
      <PlaceholderDialog
        isOpen={placeholderState.isOpen}
        title={placeholderState.title}
        featureDescription={placeholderState.featureDescription}
        onClose={() => setPlaceholderState({ isOpen: false, title: '', featureDescription: '' })}
      />
    </div>
  );
};
