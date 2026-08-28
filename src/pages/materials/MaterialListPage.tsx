import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SearchInput } from '../../components/forms/SearchInput';
import { SelectDropdown } from '../../components/forms/SelectDropdown';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionIconBtn } from '../../components/common/ActionIconBtn';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { PlaceholderDialog } from '../../components/dialogs/PlaceholderDialog';
import { formatCurrency, calculatePriceDelta } from '../../domain/mockRules';
import { Material } from '../../domain/types';

export const MaterialListPage: React.FC = () => {
  const navigate = useNavigate();
  const { materials, categories, manufacturers, uoms, prices, deleteMaterial, canDo } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');

  // Modals & Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    materialId: string | null;
    isBlocked: boolean;
    message?: string;
  }>({ isOpen: false, materialId: null, isBlocked: false });

  const [placeholderState, setPlaceholderState] = useState<{
    isOpen: boolean;
    title: string;
    featureDescription: string;
  }>({ isOpen: false, title: '', featureDescription: '' });

  // Filtering materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        m.code?.toLowerCase().includes(q) ||
        m.name?.toLowerCase().includes(q) ||
        m.specs?.toLowerCase().includes(q);

      const matchesCategory = !categoryFilter || m.categoryId === categoryFilter;
      const matchesMfg = !manufacturerFilter || m.manufacturerId === manufacturerFilter;

      const matPrices = prices.filter((p) => p.materialId === m.id);
      let matchesPrice = true;
      if (priceFilter === 'HAS_PRICE') matchesPrice = matPrices.length > 0;
      else if (priceFilter === 'NO_PRICE') matchesPrice = matPrices.length === 0;

      return matchesSearch && matchesCategory && matchesMfg && matchesPrice;
    });
  }, [materials, prices, searchQuery, categoryFilter, manufacturerFilter, priceFilter]);

  const handleDeleteRequest = (mat: Material) => {
    const res = deleteMaterial(mat.id);
    if (!res.success) {
      setDeleteConfirm({
        isOpen: true,
        materialId: mat.id,
        isBlocked: true,
        message: res.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Danh mục vật tư</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý mã hiệu, thông số kỹ thuật, giá nhà cung cấp và định mức tồn kho vật tư
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setPlaceholderState({
                isOpen: true,
                title: 'Tải file mẫu Excel danh mục vật tư',
                featureDescription: 'Tải template file Excel chuẩn mẫu TTC để nhập liệu hàng loạt danh mục vật tư.',
              })
            }
            className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Mẫu Excel</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setPlaceholderState({
                isOpen: true,
                title: 'Import Danh mục vật tư từ Excel',
                featureDescription: 'Tính năng tải lên danh sách vật tư kèm bảng giá từ tệp Excel với khả năng kiểm tra trùng mã tự động.',
              })
            }
            className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/materials/new')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm vật tư</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm theo mã, tên vật tư, thông số kỹ thuật..."
            className="w-72"
          />

          <SelectDropdown
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Tất cả nhóm vật tư"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />

          <SelectDropdown
            value={manufacturerFilter}
            onChange={setManufacturerFilter}
            placeholder="Tất cả hãng sản xuất"
            options={manufacturers.map((m) => ({ value: m.id, label: m.name }))}
          />

          <SelectDropdown
            value={priceFilter}
            onChange={setPriceFilter}
            placeholder="Tình trạng giá"
            options={[
              { value: 'HAS_PRICE', label: 'Đã có bảng giá' },
              { value: 'NO_PRICE', label: 'Chưa có bảng giá' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3">Mã vật tư</th>
                <th className="px-4 py-3 min-w-[160px]">Tên vật tư</th>
                <th className="px-4 py-3 min-w-[180px]">Thông số kỹ thuật</th>
                <th className="px-4 py-3">Nhóm</th>
                <th className="px-4 py-3">Hãng SX</th>
                <th className="px-2 py-3 text-center">ĐVT</th>
                <th className="px-4 py-3 text-right">Giá hiện tại (NCC Ưu tiên)</th>
                <th className="px-3 py-3 text-center">Xu hướng</th>
                <th className="px-3 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      title="Không tìm thấy vật tư phù hợp"
                      description="Hãy thử tìm kiếm với từ khóa khác hoặc thêm vật tư mới vào hệ thống."
                      actionText="Thêm vật tư mới"
                      onAction={() => navigate('/materials/new')}
                    />
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((m) => {
                  const cat = categories.find((c) => c.id === m.categoryId);
                  const mfg = manufacturers.find((man) => man.id === m.manufacturerId);
                  const uom = uoms.find((u) => u.id === m.uomId);

                  const matPrices = prices.filter((p) => p.materialId === m.id);
                  const preferredPrice = matPrices.find((p) => p.isPreferred) || matPrices[0];
                  const delta = preferredPrice
                    ? calculatePriceDelta(preferredPrice.currentPrice, preferredPrice.previousPrice)
                    : null;

                  return (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/materials/${m.id}`)}
                      className="hover:bg-blue-50/30 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900">{m.code}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{m.name}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 truncate max-w-[220px]">
                        {m.specs}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{cat?.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{mfg?.name || '—'}</td>
                      <td className="px-2 py-3 text-center font-medium">{uom?.code || 'pcs'}</td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {preferredPrice ? formatCurrency(preferredPrice.currentPrice) : '—'}
                      </td>

                      <td className="px-3 py-3 text-center">
                        {delta?.trend === 'INCREASED' ? (
                          <span
                            title={`Tăng +${delta.percent}%`}
                            className="inline-flex items-center gap-0.5 text-rose-600 font-bold text-[11px]"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>+{delta.percent}%</span>
                          </span>
                        ) : delta?.trend === 'DECREASED' ? (
                          <span
                            title={`Giảm -${delta.percent}%`}
                            className="inline-flex items-center gap-0.5 text-emerald-600 font-bold text-[11px]"
                          >
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>-{delta.percent}%</span>
                          </span>
                        ) : delta?.trend === 'UNCHANGED' ? (
                          <span title="Không đổi" className="text-slate-400">
                            <Minus className="w-3.5 h-3.5 inline" />
                          </span>
                        ) : (
                          <span title="Chưa có giá" className="text-amber-500">
                            <HelpCircle className="w-3.5 h-3.5 inline" />
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <StatusBadge status={m.status} type="master" />
                      </td>

                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <ActionIconBtn
                            icon={Eye}
                            label="Xem chi tiết vật tư & bảng giá"
                            variant="primary"
                            onClick={() => navigate(`/materials/${m.id}`)}
                          />
                          <ActionIconBtn
                            icon={Pencil}
                            label="Sửa thông tin vật tư"
                            onClick={() => navigate(`/materials/${m.id}/edit`)}
                          />
                          <ActionIconBtn
                            icon={Trash2}
                            label="Xóa vật tư"
                            variant="danger"
                            onClick={() => handleDeleteRequest(m)}
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
      </div>

      {/* Delete / Blocked Modal */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Không thể xóa vật tư"
        message={deleteConfirm.message || 'Vật tư đang được liên kết với các dữ liệu khác trong hệ thống.'}
        isBlocked={deleteConfirm.isBlocked}
        onCancel={() => setDeleteConfirm({ isOpen: false, materialId: null, isBlocked: false })}
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
