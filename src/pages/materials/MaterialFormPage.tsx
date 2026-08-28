import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Boxes, Save, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FormField } from '../../components/forms/FormField';
import { MasterStatus } from '../../domain/types';

export const MaterialFormPage: React.FC = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const { materials, categories, manufacturers, uoms, saveMaterial } = useApp();

  const isEdit = Boolean(materialId);
  const existingMaterial = materials.find((m) => m.id === materialId);

  const [form, setForm] = useState({
    code: '',
    name: '',
    specs: '',
    categoryId: '',
    manufacturerId: '',
    uomId: '',
    status: 'ACTIVE' as MasterStatus,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && existingMaterial) {
      setForm({
        code: existingMaterial.code,
        name: existingMaterial.name,
        specs: existingMaterial.specs,
        categoryId: existingMaterial.categoryId,
        manufacturerId: existingMaterial.manufacturerId,
        uomId: existingMaterial.uomId,
        status: existingMaterial.status,
      });
    } else if (!isEdit) {
      setForm({
        code: '',
        name: '',
        specs: '',
        categoryId: categories[0]?.id || '',
        manufacturerId: manufacturers[0]?.id || '',
        uomId: uoms[0]?.id || '',
        status: 'ACTIVE',
      });
    }
  }, [isEdit, existingMaterial, categories, manufacturers, uoms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = saveMaterial({
      id: isEdit && existingMaterial ? existingMaterial.id : undefined,
      ...form,
    });

    if (res.success) {
      navigate('/materials');
    } else {
      setError(res.message || 'Lỗi khi lưu vật tư.');
    }
  };

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
              Khai báo mã hiệu, quy cách kỹ thuật và phân loại cho vật tư
            </p>
          </div>
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
            <FormField label="Mã vật tư" required helperText="Mã duy nhất trong toàn hệ thống">
              <input
                type="text"
                required
                value={form.code ?? ''}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-semibold text-slate-900"
                placeholder="VD: FX5U-32MR/ES"
              />
            </FormField>

            <FormField label="Tên vật tư" required>
              <input
                type="text"
                required
                value={form.name ?? ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-medium text-slate-900"
                placeholder="VD: Bộ lập trình PLC Mitsubishi"
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

            <FormField label="Hãng sản xuất" required>
              <select
                value={form.manufacturerId ?? ''}
                onChange={(e) => setForm({ ...form, manufacturerId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
              >
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Đơn vị tính (ĐVT)" required>
              <select
                value={form.uomId ?? ''}
                onChange={(e) => setForm({ ...form, uomId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
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
                onChange={(e) => setForm({ ...form, status: e.target.value as MasterStatus })}
                className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Ngưng hoạt động</option>
              </select>
            </FormField>
          </div>

          <FormField label="Thông số kỹ thuật / Quy cách" required helperText="Điện áp, công suất, số I/O, chuẩn truyền thông...">
            <textarea
              rows={3}
              required
              value={form.specs ?? ''}
              onChange={(e) => setForm({ ...form, specs: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs"
              placeholder="VD: 16 In / 16 Out Relay, AC 100-240V, RS-485 / Ethernet built-in"
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Lưu cập nhật' : 'Tạo vật tư'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
