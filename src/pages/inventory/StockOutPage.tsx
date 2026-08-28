import React, { useState, useMemo } from 'react';
import {
  ArrowUpFromLine,
  Plus,
  Search,
  Warehouse,
  FolderKanban,
  FileText,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SearchInput } from '../../components/forms/SearchInput';
import { SelectDropdown } from '../../components/forms/SelectDropdown';
import { FormField } from '../../components/forms/FormField';
import { EmptyState } from '../../components/common/EmptyState';
import { formatQuantity, formatDate } from '../../domain/mockRules';

export const StockOutPage: React.FC = () => {
  const {
    warehouses,
    projects,
    materials,
    stockTransactions,
    inventory,
    executeStockTransaction,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    warehouseId: warehouses[0]?.id || '',
    projectId: projects[0]?.id || '',
    referenceCode: `PXK-${Date.now().toString().slice(-4)}`,
    materialId: materials[0]?.id || '',
    quantity: 1,
    receiverName: 'Nguyễn Văn Kỹ Sư',
    notes: '',
  });

  // Check current stock for selected material in selected warehouse
  const availableStock = useMemo(() => {
    const inv = inventory.find(
      (i) => i.warehouseId === formData.warehouseId && i.materialId === formData.materialId
    );
    return inv?.quantity || 0;
  }, [inventory, formData.warehouseId, formData.materialId]);

  // Filtered Stock Out transactions
  const stockOutList = useMemo(() => {
    return stockTransactions
      .filter((tx) => tx.type === 'OUT')
      .filter((tx) => {
        const mat = materials.find((m) => m.id === tx.materialId);
        const wh = warehouses.find((w) => w.id === tx.warehouseId);
        const prj = projects.find((p) => p.id === tx.projectId);

        const q = searchQuery.toLowerCase();
        const matchesSearch =
          searchQuery === '' ||
          tx.referenceCode?.toLowerCase().includes(q) ||
          mat?.name?.toLowerCase().includes(q) ||
          mat?.code?.toLowerCase().includes(q);

        const matchesWh = !warehouseFilter || tx.warehouseId === warehouseFilter;
        const matchesPrj = !projectFilter || tx.projectId === projectFilter;

        return matchesSearch && matchesWh && matchesPrj;
      });
  }, [stockTransactions, materials, warehouses, projects, searchQuery, warehouseFilter, projectFilter]);

  const handleOpenCreate = () => {
    setFormError(null);
    setFormData({
      warehouseId: warehouses[0]?.id || '',
      projectId: projects[0]?.id || '',
      referenceCode: `PXK-${Date.now().toString().slice(-4)}`,
      materialId: materials[0]?.id || '',
      quantity: 1,
      receiverName: 'Nguyễn Văn Kỹ Sư',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.materialId || !formData.warehouseId || formData.quantity <= 0) {
      setFormError('Vui lòng nhập đầy đủ thông tin hợp lệ.');
      return;
    }

    if (formData.quantity > availableStock) {
      setFormError(
        `Số lượng xuất (${formData.quantity}) vượt quá tồn kho thực tế hiện có (${availableStock}) tại kho đã chọn.`
      );
      return;
    }

    const res = executeStockTransaction({
      type: 'OUT',
      materialId: formData.materialId,
      warehouseId: formData.warehouseId,
      projectId: formData.projectId || undefined,
      quantity: Number(formData.quantity),
      referenceCode: formData.referenceCode,
      notes: `${formData.notes ? formData.notes + ' - ' : ''}Người nhận: ${formData.receiverName}`,
    });

    if (res.success) {
      setIsModalOpen(false);
    } else {
      setFormError(res.message || 'Lỗi khi thực hiện xuất kho.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Xuất kho</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu xuất vật tư phục vụ thi công, lắp đặt dự án hoặc điều chuyển kho
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo phiếu xuất kho</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm theo mã phiếu, tên vật tư..."
            className="w-72"
          />

          <SelectDropdown
            value={warehouseFilter}
            onChange={setWarehouseFilter}
            placeholder="Tất cả kho"
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          />

          <SelectDropdown
            value={projectFilter}
            onChange={setProjectFilter}
            placeholder="Tất cả dự án"
            options={projects.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
          />
        </div>
      </div>

      {/* Table of Stock Out */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
            <tr>
              <th className="px-4 py-3">Mã phiếu</th>
              <th className="px-4 py-3">Vật tư</th>
              <th className="px-4 py-3">Kho xuất</th>
              <th className="px-4 py-3">Dự án sử dụng</th>
              <th className="px-4 py-3 text-right">Số lượng</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Ghi chú & Người nhận</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {stockOutList.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="Chưa có phiếu xuất kho nào"
                    description="Nhấn 'Tạo phiếu xuất kho' để thực hiện xuất vật tư công trình."
                    actionText="Tạo phiếu xuất ngay"
                    onAction={handleOpenCreate}
                  />
                </td>
              </tr>
            ) : (
              stockOutList.map((tx) => {
                const mat = materials.find((m) => m.id === tx.materialId);
                const wh = warehouses.find((w) => w.id === tx.warehouseId);
                const prj = projects.find((p) => p.id === tx.projectId);

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">{tx.referenceCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{mat?.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{mat?.code}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{wh?.name}</td>
                    <td className="px-4 py-3">
                      {prj ? (
                        <span className="text-blue-700 font-semibold">{prj.code} — {prj.name}</span>
                      ) : (
                        <span className="text-slate-400">Xuất khác</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600 text-sm font-mono">
                      -{formatQuantity(tx.quantity)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(tx.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{tx.notes || '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Out Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900">Lập phiếu xuất kho</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-5 space-y-3.5 text-xs">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Mã phiếu xuất" required>
                    <input
                      type="text"
                      required
                      value={formData.referenceCode ?? ''}
                      onChange={(e) => setFormData({ ...formData, referenceCode: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-semibold"
                    />
                  </FormField>

                  <FormField label="Kho xuất hàng" required>
                    <select
                      value={formData.warehouseId ?? ''}
                      onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField label="Vật tư xuất kho" required>
                  <select
                    value={formData.materialId ?? ''}
                    onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.code} — {m.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs">
                  <span className="text-slate-600">Tồn kho khả dụng tại kho này:</span>
                  <span className={`font-bold font-mono text-sm ${availableStock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatQuantity(availableStock)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Số lượng xuất" required>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.quantity ?? ''}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold text-slate-900"
                    />
                  </FormField>

                  <FormField label="Người nhận vật tư" required>
                    <input
                      type="text"
                      required
                      value={formData.receiverName ?? ''}
                      onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                      placeholder="Họ tên kỹ sư / Đội trưởng"
                    />
                  </FormField>
                </div>

                <FormField label="Dự án xuất dùng" required>
                  <select
                    value={formData.projectId ?? ''}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Lý do xuất / Ghi chú">
                  <textarea
                    rows={2}
                    value={formData.notes ?? ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                    placeholder="VD: Lắp đặt hoàn thiện tủ điện điều khiển tầng 2..."
                  />
                </FormField>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={availableStock <= 0}
                  className={`px-4 py-1.5 text-white text-xs font-medium rounded flex items-center gap-1.5 transition ${
                    availableStock <= 0
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Xác nhận xuất kho</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
