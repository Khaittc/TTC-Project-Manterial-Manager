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
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SearchInput } from '../../components/forms/SearchInput';
import { SelectDropdown } from '../../components/forms/SelectDropdown';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionIconBtn } from '../../components/common/ActionIconBtn';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { PlaceholderDialog } from '../../components/dialogs/PlaceholderDialog';
import { formatQuantity } from '../../domain/mockRules';
import { Material } from '../../domain/types';

export const MaterialListPage: React.FC = () => {
  const navigate = useNavigate();
  const { materials, categories, manufacturers, uoms, deleteMaterial, canDo } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      const q = searchQuery.toLowerCase().trim();
      const cat = categories.find((c) => c.id === m.categoryId);
      const mfg = manufacturers.find((man) => man.id === m.manufacturerId);

      const matchesSearch =
        q === '' ||
        m.model.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (mfg?.name.toLowerCase().includes(q) ?? false) ||
        (cat?.name.toLowerCase().includes(q) ?? false);

      const matchesCategory = !categoryFilter || m.categoryId === categoryFilter;
      const matchesMfg = !manufacturerFilter || m.manufacturerId === manufacturerFilter;
      const matchesStatus = !statusFilter || m.status === statusFilter;

      return matchesSearch && matchesCategory && matchesMfg && matchesStatus;
    });
  }, [materials, categories, manufacturers, searchQuery, categoryFilter, manufacturerFilter, statusFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setManufacturerFilter('');
    setStatusFilter('');
  };

  const handleDeleteRequest = (mat: Material) => {
    if (mat.isReferenced) {
      setDeleteConfirm({
        isOpen: true,
        materialId: mat.id,
        isBlocked: true,
        message: 'Vật tư này đang được tham chiếu trong hệ thống (BOM hoặc Bảng giá NCC). Không thể xóa cứng. Khuyến nghị chuyển sang trạng thái Lưu trữ (Archived).',
      });
    } else {
      setDeleteConfirm({
        isOpen: true,
        materialId: mat.id,
        isBlocked: false,
        message: `Bạn có chắc chắn muốn xóa vật tư "${mat.model}"? Hành động này không thể hoàn tác trong phiên làm việc.`,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.materialId && !deleteConfirm.isBlocked) {
      deleteMaterial(deleteConfirm.materialId);
    }
    setDeleteConfirm({ isOpen: false, materialId: null, isBlocked: false });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Danh mục vật tư</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Tổng số: {filteredMaterials.length} vật tư
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý chuẩn hóa định danh Hãng sản xuất + Model, thông số kỹ thuật và tồn kho vật tư
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
                featureDescription: 'Workflow Import Material sẽ được chốt sau khi review Prototype V0.',
              })
            }
            className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import</span>
          </button>

          {canDo('material', 'create') && (
            <button
              type="button"
              onClick={() => navigate('/materials/new')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm vật tư</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm theo Model, mô tả, hãng, nhóm..."
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
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Tất cả trạng thái"
            options={[
              { value: 'ACTIVE', label: 'Đang hoạt động' },
              { value: 'ARCHIVED', label: 'Lưu trữ (Archived)' },
            ]}
          />
        </div>

        {(searchQuery || categoryFilter || manufacturerFilter || statusFilter) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      {/* 8-Column Table aligned with CVF_UI.md: 1. Nhóm, 2. Hãng, 3. Model, 4. Mô tả, 5. Tồn kho, 6. ĐVT, 7. Trạng thái, 8. Thao tác */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3">Nhóm vật tư</th>
                <th className="px-4 py-3">Hãng</th>
                <th className="px-4 py-3 font-bold">Model</th>
                <th className="px-4 py-3 min-w-[220px]">Mô tả</th>
                <th className="px-4 py-3 text-right">Tồn kho</th>
                <th className="px-3 py-3 text-center">ĐVT</th>
                <th className="px-3 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8}>
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

                  return (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/materials/${m.id}`)}
                      className="hover:bg-blue-50/30 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 text-slate-600">{cat?.name || '—'}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{mfg?.name || '—'}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 font-mono">{m.model}</td>
                      <td className="px-4 py-3 text-slate-700 line-clamp-2 max-w-[280px]">{m.description || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                        {formatQuantity(m.stockQty)}
                      </td>
                      <td className="px-3 py-3 text-center font-medium text-slate-600">{uom?.code || 'pcs'}</td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge status={m.status} type="master" />
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <ActionIconBtn
                            icon={Eye}
                            label="Xem chi tiết vật tư"
                            variant="primary"
                            onClick={() => navigate(`/materials/${m.id}`)}
                          />
                          {canDo('material', 'edit') && (
                            <ActionIconBtn
                              icon={Pencil}
                              label="Sửa thông tin vật tư"
                              onClick={() => navigate(`/materials/${m.id}/edit`)}
                            />
                          )}
                          {canDo('material', 'delete') && (
                            <ActionIconBtn
                              icon={Trash2}
                              label="Xóa vật tư"
                              variant="danger"
                              onClick={() => handleDeleteRequest(m)}
                            />
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
      </div>

      {/* Delete / Blocked Modal */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.isBlocked ? 'Không thể xóa vật tư' : 'Xác nhận xóa vật tư'}
        message={deleteConfirm.message || 'Vật tư đang được liên kết với các dữ liệu khác trong hệ thống.'}
        isBlocked={deleteConfirm.isBlocked}
        onConfirm={handleConfirmDelete}
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
