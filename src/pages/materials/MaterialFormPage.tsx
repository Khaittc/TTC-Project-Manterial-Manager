import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Info, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FormField } from '../../components/forms/FormField';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { MaterialStatus } from '../../domain/types';

export const MaterialFormPage: React.FC = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const { materials, categories, manufacturers, uoms, saveMaterial } = useApp();

  const isEdit = Boolean(materialId);
  const existingMaterial = materials.find((m) => m.id === materialId);

  const [form, setForm] = useState({
    categoryId: '',
    manufacturerId: '',
    model: '',
    description: '',
    uomId: '',
    status: 'ACTIVE' as MaterialStatus,
  });

  const [error, setError] = useState<string | null>(null);
  const [identityConfirmOpen, setIdentityConfirmOpen] = useState(false);

  useEffect(() => {
    if (isEdit && existingMaterial) {
      setForm({
        categoryId: existingMaterial.categoryId,
        manufacturerId: existingMaterial.manufacturerId,
        model: existingMaterial.model,
        description: existingMaterial.description,
        uomId: existingMaterial.uomId,
        status: existingMaterial.status,
      });
    } else if (!isEdit) {
      setForm({
        categoryId: categories[0]?.id || '',
        manufacturerId: manufacturers[0]?.id || '',
        model: '',
        description: '',
        uomId: uoms[0]?.id || '',
        status: 'ACTIVE',
      });
    }
  }, [isEdit, existingMaterial, categories, manufacturers, uoms]);

  const executeSave = () => {
    const res = saveMaterial({
      id: isEdit && existingMaterial ? existingMaterial.id : undefined,
      categoryId: form.categoryId,
      manufacturerId: form.manufacturerId,
      model: form.model.trim(),
      description: form.description.trim(),
      uomId: form.uomId,
      status: form.status,
    });

    if (res.success) {
      navigate('/materials');
    } else {
      setError(res.message || 'Lỗi khi lưu vật tư.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.model.trim()) {
      setError('Vui lòng nhập Model vật tư.');
      return;
    }

    // Check if identity (Manufacturer or Model) changed during edit
    if (
      isEdit &&
      existingMaterial &&
      (form.manufacturerId !== existingMaterial.manufacturerId ||
        form.model.trim() !== existingMaterial.model)
    ) {
      setIdentityConfirmOpen(true);
      return;
    }

    executeSave();
  };

  const handleConfirmIdentityChange = () => {
    setIdentityConfirmOpen(false);
    executeSave();
  };

  const isUomLocked = Boolean(isEdit && existingMaterial?.isReferenced);

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/materials')}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? 'Chỉnh sửa vật tư' : 'Thêm mới vật tư'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Khai báo thông tin vật tư theo chuẩn định danh Hãng sản xuất + Model
            </p>
          </div>
        </div>
      </div>

      {/* Canonical Identity Notice */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Định danh vật tư chuẩn (Canonical Identity): Hãng sản xuất + Model</p>
          <p className="text-blue-700 mt-0.5">
            Hệ thống không sinh mã SKU hoặc mã vật tư nội bộ tự đặt. Sự kết hợp giữa Hãng sản xuất và Model phải là duy nhất.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Hãng sản xuất" required helperText="Nhà chế tạo thiết bị">
              <select
                value={form.manufacturerId ?? ''}
                onChange={(e) => setForm({ ...form, manufacturerId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium"
              >
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Model vật tư" required helperText="Part Number / Mã hiệu từ hãng chế tạo">
              <input
                type="text"
                required
                value={form.model ?? ''}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-semibold font-mono text-slate-900"
                placeholder="VD: 6ES7214-1AG40-0XB0"
              />
            </FormField>

            <FormField label="Nhóm vật tư" required>
              <select
                value={form.categoryId ?? ''}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Đơn vị tính (ĐVT)"
              required
              helperText={
                isUomLocked
                  ? 'Đơn vị tính bị khóa vì vật tư đã phát sinh giao dịch/BOM trong hệ thống.'
                  : 'Đơn vị đo lường chuẩn'
              }
            >
              <select
                value={form.uomId ?? ''}
                disabled={isUomLocked}
                onChange={(e) => setForm({ ...form, uomId: e.target.value })}
                className={`w-full px-3 py-2 border border-slate-300 rounded bg-white ${
                  isUomLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                }`}
              >
                {uoms.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Trạng thái">
              <select
                value={form.status ?? 'ACTIVE'}
                onChange={(e) => setForm({ ...form, status: e.target.value as MaterialStatus })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
              >
                <option value="ACTIVE">Đang hoạt động (Active)</option>
                <option value="ARCHIVED">Lưu trữ (Archived)</option>
              </select>
            </FormField>
          </div>

          <FormField label="Mô tả chi tiết vật tư" helperText="Thông số kỹ thuật, cấu hình, điện áp, tính năng chính...">
            <textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
              placeholder="VD: SIMATIC S7-1200, CPU 1214C, compact CPU, DC/DC/DC, 14 DI / 10 DO / 2 AI..."
            />
          </FormField>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/materials')}
              className="px-4 py-2 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Lưu cập nhật' : 'Tạo vật tư'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Identity Change Confirmation Modal */}
      <ConfirmDialog
        isOpen={identityConfirmOpen}
        title="Xác nhận thay đổi định danh vật tư"
        message="Bạn đang thay đổi Hãng sản xuất hoặc Model của vật tư. Thay đổi định danh này sẽ cập nhật trên toàn hệ thống và các liên kết liên quan. Bạn có chắc chắn muốn lưu thay đổi này?"
        onConfirm={handleConfirmIdentityChange}
        onCancel={() => setIdentityConfirmOpen(false)}
      />
    </div>
  );
};
