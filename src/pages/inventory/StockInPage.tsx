import React, { useState, useMemo } from 'react';
import {
  ArrowDownToLine,
  Plus,
  Search,
  Warehouse,
  FolderKanban,
  FileText,
  Save,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SearchInput } from '../../components/forms/SearchInput';
import { SelectDropdown } from '../../components/forms/SelectDropdown';
import { FormField } from '../../components/forms/FormField';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatQuantity, formatDate } from '../../domain/mockRules';

export const StockInPage: React.FC = () => {
  const {
    warehouses,
    projects,
    suppliers,
    materials,
    stockTransactions,
    boms,
    executeStockTransaction,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    warehouseId: warehouses[0]?.id || '',
    projectId: '',
    supplierId: suppliers[0]?.id || '',
    referenceCode: `PNK-${Date.now().toString().slice(-4)}`,
    materialId: materials[0]?.id || '',
    quantity: 1,
    binLocation: 'Kệ A-01',
    notes: '',
  });

  // Filtered Stock In transactions
  const stockInList = useMemo(() => {
    return stockTransactions
      .filter((tx) => tx.type === 'IN')
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
    setFormData({
      warehouseId: warehouses[0]?.id || '',
      projectId: '',
      supplierId: suppliers[0]?.id || '',
      referenceCode: `PNK-${Date.now().toString().slice(-4)}`,
      materialId: materials[0]?.id || '',
      quantity: 1,
      binLocation: 'Kệ A-01',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.materialId || !formData.warehouseId || formData.quantity <= 0) return;

    executeStockTransaction({
      type: 'IN',
      materialId: formData.materialId,
      warehouseId: formData.warehouseId,
      projectId: formData.projectId || undefined,
      quantity: Number(formData.quantity),
      referenceCode: formData.referenceCode,
      notes: formData.notes,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Nhập kho</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu nhập kho từ nhà cung cấp và ghi nhận phân bổ theo dự án
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo phiếu nhập kho</span>
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

      {/* Table of Stock In */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
            <tr>
              <th className="px-4 py-3">Mã phiếu</th>
              <th className="px-4 py-3">Vật tư</th>
              <th className="px-4 py-3">Kho nhận</th>
              <th className="px-4 py-3">Dự án gán</th>
              <th className="px-4 py-3 text-right">Số lượng</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {stockInList.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="Chưa có phiếu nhập kho nào"
                    description="Nhấn 'Tạo phiếu nhập kho' để ghi nhận lô hàng mới về."
                    actionText="Tạo phiếu nhập ngay"
                    onAction={handleOpenCreate}
                  />
                </td>
              </tr>
            ) : (
              stockInList.map((tx) => {
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
                        <span className="text-slate-400">Nhập kho tự do</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 text-sm font-mono">
                      +{formatQuantity(tx.quantity)}
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

      {/* Stock In Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Lập phiếu nhập kho</h3>
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
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Mã phiếu nhập" required>
                    <input
                      type="text"
                      required
                      value={formData.referenceCode ?? ''}
                      onChange={(e) => setFormData({ ...formData, referenceCode: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-semibold"
                    />
                  </FormField>

                  <FormField label="Kho nhận hàng" required>
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

                <FormField label="Vật tư nhập kho" required>
                  <select
                    value={formData.materialId ?? ''}
                    onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded bg-white"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.code} — {m.name} ({m.specs})
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Số lượng nhập" required>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.quantity ?? ''}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold text-slate-900"
                    />
                  </FormField>

                  <FormField label="Vị trí kệ (Bin Location)">
                    <input
                      type="text"
                      value={formData.binLocation ?? ''}
                      onChange={(e) => setFormData({ ...formData, binLocation: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                      placeholder="Kệ A-01"
                    />
                  </FormField>
                </div>

                <FormField label="Dự án thụ hưởng (Nếu có)" helperText="Nhập cho dự án cụ thể sẽ cập nhật số lượng BOM">
                  <select
                    value={formData.projectId ?? ''}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="">— Nhập tồn kho chung (Không gán DA) —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Ghi chú / Số hóa đơn kèm theo">
                  <textarea
                    rows={2}
                    value={formData.notes ?? ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                    placeholder="VD: Hóa đơn số 001234, giao hàng đợt 1..."
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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Xác nhận nhập kho</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
