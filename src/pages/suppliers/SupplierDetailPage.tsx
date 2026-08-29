import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Upload,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatDate, calculatePriceDelta } from '../../domain/mockRules';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';

export const SupplierDetailPage: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { suppliers, materials, prices, categories, manufacturers, canDo, saveBulkSupplierPrices } = useApp();

  const supplier = suppliers.find((s) => s.id === supplierId);
  const [activeTab, setActiveTab] = useState<'info' | 'prices'>('info');
  const [searchTerm, setSearchTerm] = useState('');

  const supplierPrices = useMemo(() => {
    return prices.filter((p) => p.supplierId === supplier?.id);
  }, [prices, supplier?.id]);

  const filteredMaterials = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return supplierPrices
      .map((p) => ({
        price: p,
        mat: materials.find((m) => m.id === p.materialId),
      }))
      .filter((item) => {
        if (!item.mat) return false;
        if (!term) return true;
        return (
          item.mat.model.toLowerCase().includes(term) ||
          item.mat.description.toLowerCase().includes(term)
        );
      });
  }, [supplierPrices, materials, searchTerm]);

  // Bulk Edit State
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [editDraft, setEditDraft] = useState<Record<string, { currentPrice: string; isPreferred: boolean }>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const canEditPrice = canDo('supplierPrice', 'edit');
  const canSetPreferred = canDo('supplierPrice', 'set_preferred');
  const canImport = canDo('supplierPrice', 'import');

  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  
  // Preferred Conflict state
  const [preferredConfirm, setPreferredConfirm] = useState<{
    isOpen: boolean;
    conflicts: { materialModel: string; manufacturerName: string; oldSupplierName: string }[];
    draftStateToApply: Record<string, { currentPrice: string; isPreferred: boolean }>;
  } | null>(null);

  if (!supplier) {
    return (
      <EmptyState
        title="Không tìm thấy nhà cung cấp"
        description="Mã nhà cung cấp không tồn tại trong danh mục."
        actionText="Quay lại danh mục hệ thống"
        onAction={() => navigate('/system-masters')}
      />
    );
  }

  const handleStartEdit = () => {
    const draft: Record<string, { currentPrice: string; isPreferred: boolean }> = {};
    supplierPrices.forEach((p) => {
      draft[p.id] = {
        currentPrice: p.currentPrice.toString(),
        isPreferred: p.isPreferred,
      };
    });
    setEditDraft(draft);
    setValidationErrors({});
    setIsBulkEdit(true);
  };

  const handleCancelEdit = () => {
    setIsBulkEdit(false);
    setEditDraft({});
    setValidationErrors({});
  };

  const handlePriceChange = (priceId: string, value: string) => {
    setEditDraft((prev) => ({
      ...prev,
      [priceId]: { ...prev[priceId], currentPrice: value },
    }));
    if (validationErrors[priceId]) {
      const newErrors = { ...validationErrors };
      delete newErrors[priceId];
      setValidationErrors(newErrors);
    }
  };

  const handlePreferredChange = (priceId: string, checked: boolean) => {
    setEditDraft((prev) => ({
      ...prev,
      [priceId]: { ...prev[priceId], isPreferred: checked },
    }));
  };

  const processSave = (draft: Record<string, { currentPrice: string; isPreferred: boolean }>) => {
    const updates: { materialId: string; priceId: string; currentPrice: number; isPreferred: boolean }[] = [];
    
    for (const p of supplierPrices) {
      const d = draft[p.id];
      if (!d) continue;
      const numPrice = Number(d.currentPrice);
      // Only push if changed
      if (numPrice !== p.currentPrice || d.isPreferred !== p.isPreferred) {
        updates.push({
          materialId: p.materialId,
          priceId: p.id,
          currentPrice: numPrice,
          isPreferred: d.isPreferred,
        });
      }
    }

    if (updates.length > 0) {
      saveBulkSupplierPrices(supplier.id, updates);
    }
    
    setIsBulkEdit(false);
    setEditDraft({});
    setValidationErrors({});
    setPreferredConfirm(null);
  };

  const handleSaveEdit = () => {
    const errors: Record<string, string> = {};
    let hasError = false;

    // Validate
    Object.keys(editDraft).forEach((priceId) => {
      const draft = editDraft[priceId];
      const num = Number(draft.currentPrice);
      if (isNaN(num) || num < 0 || draft.currentPrice.trim() === '') {
        errors[priceId] = 'Giá không hợp lệ (phải >= 0)';
        hasError = true;
      }
    });

    if (hasError) {
      setValidationErrors(errors);
      return;
    }

    // Check for Preferred conflict
    const conflicts: { materialModel: string; manufacturerName: string; oldSupplierName: string }[] = [];
    
    for (const p of supplierPrices) {
      const d = editDraft[p.id];
      if (d && d.isPreferred && !p.isPreferred) {
        // We are setting this as preferred. Let's see if another supplier is currently preferred.
        const existingPreferred = prices.find(
          (otherP) => otherP.materialId === p.materialId && otherP.isPreferred && otherP.supplierId !== supplier.id
        );
        if (existingPreferred) {
          const oldSupplier = suppliers.find((s) => s.id === existingPreferred.supplierId);
          const mat = materials.find((m) => m.id === p.materialId);
          const mfg = manufacturers.find((m) => m.id === mat?.manufacturerId);
          
          conflicts.push({
            materialModel: mat?.model || '—',
            manufacturerName: mfg?.name || '—',
            oldSupplierName: oldSupplier?.name || 'Nhà cung cấp khác',
          });
        }
      }
    }

    if (conflicts.length > 0) {
      setPreferredConfirm({
        isOpen: true,
        conflicts,
        draftStateToApply: editDraft,
      });
    } else {
      processSave(editDraft);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/system-masters')}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{supplier.name}</h1>
              <StatusBadge status={supplier.status} type="master" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Mã số thuế: {supplier.taxCode}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 rounded-t-lg">
        <button
          type="button"
          onClick={() => {
            if (!isBulkEdit) setActiveTab('info');
          }}
          disabled={isBulkEdit}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          } ${isBulkEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FileText className="w-4 h-4" />
          <span>Thông tin chung</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isBulkEdit) setActiveTab('prices');
          }}
          disabled={isBulkEdit}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'prices'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          } ${isBulkEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Vật tư & Giá</span>
        </button>
      </div>

      {/* TAB 1: THÔNG TIN CHUNG */}
      {activeTab === 'info' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs max-w-3xl space-y-4">
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Mã số thuế:</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{supplier.taxCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Tên nhà cung cấp:</span>
              <span className="font-semibold text-slate-900 text-sm">{supplier.name}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block mb-1">Địa chỉ trụ sở:</span>
              <span className="font-medium text-slate-800">{supplier.address}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Trạng thái:</span>
              <StatusBadge status={supplier.status} type="master" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VẬT TƯ & GIÁ */}
      {activeTab === 'prices' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Tìm kiếm Model, Mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isBulkEdit}
                className={`w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  isBulkEdit ? 'bg-slate-100 text-slate-400' : 'bg-white'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              {!isBulkEdit ? (
                <>
                  {canImport && (
                    <button
                      type="button"
                      onClick={() => setImportConfirmOpen(true)}
                      className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Import</span>
                    </button>
                  )}
                  {canEditPrice && supplierPrices.length > 0 && (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold rounded flex items-center gap-1.5 transition"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Chỉnh sửa giá</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded flex items-center gap-1.5 transition"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs text-xs font-semibold rounded flex items-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1000px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] whitespace-nowrap">
                  <tr>
                    <th className="px-3 py-3">Nhóm vật tư</th>
                    <th className="px-3 py-3">Hãng</th>
                    <th className="px-3 py-3">Model</th>
                    <th className="px-3 py-3 max-w-[200px]">Mô tả</th>
                    <th className="px-3 py-3 text-right">Giá trước</th>
                    <th className="px-3 py-3 text-right w-40">Giá hiện tại</th>
                    <th className="px-3 py-3 text-center">Thay đổi</th>
                    <th className="px-3 py-3">Ngày cập nhật</th>
                    <th className="px-3 py-3 text-center">Ưu tiên</th>
                    <th className="px-3 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {supplierPrices.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <EmptyState
                          title="Chưa có vật tư và bảng giá cho nhà cung cấp này."
                          description="Nhà cung cấp chưa được liên kết với vật tư nào."
                        />
                      </td>
                    </tr>
                  ) : filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                        Không tìm thấy vật tư phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map(({ price: p, mat }) => {
                      if (!mat) return null;
                      const category = categories.find((c) => c.id === mat.categoryId);
                      const manufacturer = manufacturers.find((m) => m.id === mat.manufacturerId);
                      const delta = calculatePriceDelta(p.currentPrice, p.previousPrice);
                      const draft = editDraft[p.id];
                      const error = validationErrors[p.id];

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="px-3 py-3">{category?.name || '—'}</td>
                          <td className="px-3 py-3 font-semibold">{manufacturer?.name || '—'}</td>
                          <td className="px-3 py-3 font-bold text-slate-900 font-mono">{mat.model}</td>
                          <td className="px-3 py-3 text-slate-700 truncate max-w-[200px]" title={mat.description}>
                            {mat.description || '—'}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="font-mono text-slate-500">
                              {p.previousPrice ? formatCurrency(p.previousPrice) : '—'}
                            </div>
                            {p.previousDate && (
                              <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(p.previousDate)}</div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {isBulkEdit && draft ? (
                              <div>
                                <input
                                  type="number"
                                  min="0"
                                  value={draft.currentPrice}
                                  onChange={(e) => handlePriceChange(p.id, e.target.value)}
                                  className={`w-full px-2 py-1 text-right font-mono border rounded focus:outline-none focus:ring-1 ${
                                    error
                                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500 bg-rose-50'
                                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
                                  }`}
                                />
                                {error && <div className="text-[10px] text-rose-500 mt-0.5 text-left">{error}</div>}
                              </div>
                            ) : (
                              <div className="font-mono font-bold text-slate-900">
                                {formatCurrency(p.currentPrice)}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {delta.trend === 'INCREASED' ? (
                              <span className="inline-flex items-center gap-0.5 text-rose-600 font-bold">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>+{delta.percent}%</span>
                              </span>
                            ) : delta.trend === 'DECREASED' ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                                <TrendingDown className="w-3.5 h-3.5" />
                                <span>-{delta.percent}%</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{formatDate(p.currentDate)}</td>
                          <td className="px-3 py-3 text-center">
                            {isBulkEdit && draft ? (
                              <input
                                type="checkbox"
                                checked={draft.isPreferred}
                                disabled={!canSetPreferred}
                                onChange={(e) => handlePreferredChange(p.id, e.target.checked)}
                                className={`w-4 h-4 text-blue-600 rounded focus:ring-blue-500 ${
                                  !canSetPreferred ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                              />
                            ) : (
                              p.isPreferred && (
                                <span className="inline-flex px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded uppercase tracking-wider">
                                  Ưu tiên
                                </span>
                              )
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {/* Material actions if any, maybe view material detail */}
                            {!isBulkEdit && (
                              <button
                                type="button"
                                onClick={() => navigate(`/materials/${mat.id}`)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Xem vật tư
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog for Preferred Conflict */}
      {preferredConfirm && (
        <ConfirmDialog
          isOpen={preferredConfirm.isOpen}
          title="Xác nhận thay đổi nhà cung cấp ưu tiên"
          message={
            <div className="space-y-3">
              <p>Các vật tư sau đang có Nhà cung cấp ưu tiên khác:</p>
              <ul className="list-disc pl-5 space-y-2">
                {preferredConfirm.conflicts.map((c, i) => (
                  <li key={i}>
                    <span className="font-semibold">{c.manufacturerName} | {c.materialModel}</span>
                    <br />
                    <span className="text-slate-500">{c.oldSupplierName} &rarr; {supplier.name}</span>
                  </li>
                ))}
              </ul>
              <p className="pt-2 font-medium">Xác nhận thay thế Nhà cung cấp ưu tiên cho các vật tư trên?</p>
            </div>
          }
          onConfirm={() => {
            processSave(preferredConfirm.draftStateToApply);
          }}
          onCancel={() => setPreferredConfirm(null)}
        />
      )}

      {/* Placeholder for Import */}
      <ConfirmDialog
        isOpen={importConfirmOpen}
        title="Import Supplier Price"
        message="Workflow, template, mapping, preview và validation của Import Supplier Price chưa được chốt trong SPEC. Chờ chốt SPEC."
        confirmLabel="Đóng"
        cancelLabel="Hủy"
        type="info"
        isBlocked={true}
        onConfirm={() => setImportConfirmOpen(false)}
        onCancel={() => setImportConfirmOpen(false)}
      />
    </div>
  );
};
