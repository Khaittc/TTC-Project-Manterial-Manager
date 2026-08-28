import React, { useState, useMemo } from 'react';
import {
  History,
  Download,
  Search,
  Filter,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SearchInput } from '../../components/forms/SearchInput';
import { SelectDropdown } from '../../components/forms/SelectDropdown';
import { EmptyState } from '../../components/common/EmptyState';
import { PlaceholderDialog } from '../../components/dialogs/PlaceholderDialog';
import { formatQuantity, formatDate } from '../../domain/mockRules';

export const HistoryPage: React.FC = () => {
  const { stockTransactions, materials, warehouses, projects } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  const [placeholderState, setPlaceholderState] = useState<{
    isOpen: boolean;
    title: string;
    featureDescription: string;
  }>({ isOpen: false, title: '', featureDescription: '' });

  const filteredHistory = useMemo(() => {
    return stockTransactions.filter((tx) => {
      const mat = materials.find((m) => m.id === tx.materialId);
      const wh = warehouses.find((w) => w.id === tx.warehouseId);
      const prj = projects.find((p) => p.id === tx.projectId);

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        tx.referenceCode?.toLowerCase().includes(q) ||
        mat?.name?.toLowerCase().includes(q) ||
        mat?.code?.toLowerCase().includes(q) ||
        tx.notes?.toLowerCase().includes(q);

      const matchesType = !typeFilter || tx.type === typeFilter;
      const matchesWh = !warehouseFilter || tx.warehouseId === warehouseFilter;
      const matchesPrj = !projectFilter || tx.projectId === projectFilter;

      return matchesSearch && matchesType && matchesWh && matchesPrj;
    });
  }, [stockTransactions, materials, warehouses, projects, searchQuery, typeFilter, warehouseFilter, projectFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setWarehouseFilter('');
    setProjectFilter('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lịch sử giao dịch kho</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhật ký kiểm toán toàn diện tất cả các lượt nhập kho, xuất kho và điều chuyển vật tư
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setPlaceholderState({
              isOpen: true,
              title: 'Xuất nhật ký giao dịch kho (Excel)',
              featureDescription: 'Xuất toàn bộ lịch sử xuất/nhập theo khoảng thời gian và tiêu chí lọc ra định dạng bảng tính Excel.',
            })
          }
          className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1.5 transition"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Xuất báo cáo Excel</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm theo mã phiếu, mã VT, tên VT, ghi chú..."
            className="w-72"
          />

          <SelectDropdown
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="Tất cả loại giao dịch"
            options={[
              { value: 'IN', label: 'Nhập kho' },
              { value: 'OUT', label: 'Xuất kho' },
            ]}
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

        <button
          type="button"
          onClick={handleResetFilters}
          className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3">Mã phiếu</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Mã & Tên vật tư</th>
                <th className="px-4 py-3">Kho lưu trữ</th>
                <th className="px-4 py-3">Dự án liên quan</th>
                <th className="px-4 py-3 text-right">Số lượng</th>
                <th className="px-4 py-3">Thời gian ghi nhận</th>
                <th className="px-4 py-3">Ghi chú chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="Không tìm thấy giao dịch kho nào"
                      description="Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa."
                      actionText="Đặt lại bộ lọc"
                      onAction={handleResetFilters}
                    />
                  </td>
                </tr>
              ) : (
                filteredHistory.map((tx) => {
                  const mat = materials.find((m) => m.id === tx.materialId);
                  const wh = warehouses.find((w) => w.id === tx.warehouseId);
                  const prj = projects.find((p) => p.id === tx.projectId);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{tx.referenceCode}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'IN'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          {tx.type === 'IN' ? (
                            <>
                              <ArrowDownToLine className="w-3 h-3" />
                              <span>Nhập kho</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpFromLine className="w-3 h-3" />
                              <span>Xuất kho</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{mat?.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{mat?.code}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{wh?.name}</td>
                      <td className="px-4 py-3">
                        {prj ? (
                          <span className="text-blue-700 font-semibold">{prj.code} — {prj.name}</span>
                        ) : (
                          <span className="text-slate-400">Tồn kho chung</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                        <span className={tx.type === 'IN' ? 'text-emerald-600' : 'text-orange-600'}>
                          {tx.type === 'IN' ? '+' : '-'}
                          {formatQuantity(tx.quantity)}
                        </span>
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
      </div>

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
