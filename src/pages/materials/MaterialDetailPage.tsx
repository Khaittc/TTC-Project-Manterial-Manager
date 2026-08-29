import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  Star,
  FileText,
  DollarSign,
  Package,
  Layers,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionIconBtn } from '../../components/common/ActionIconBtn';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { FormField } from '../../components/forms/FormField';
import { formatCurrency, formatQuantity, formatDate, calculatePriceDelta } from '../../domain/mockRules';
import { MaterialSupplierPrice } from '../../domain/types';

export const MaterialDetailPage: React.FC = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const {
    materials,
    categories,
    manufacturers,
    uoms,
    suppliers,
    prices,
    saveSupplierPrice,
    setPreferredSupplier,
    deleteMaterial,
    canDo,
  } = useApp();

  const material = materials.find((m) => m.id === materialId);
  const category = categories.find((c) => c.id === material?.categoryId);
  const manufacturer = manufacturers.find((m) => m.id === material?.manufacturerId);
  const uom = uoms.find((u) => u.id === material?.uomId);

  // Exactly 2 tabs per CVF_UI.md
  const [activeTab, setActiveTab] = useState<'info' | 'prices'>('info');

  // Supplier Price Modal State
  const [priceModal, setPriceModal] = useState<{
    isOpen: boolean;
    priceItem: Partial<MaterialSupplierPrice> | null;
  }>({ isOpen: false, priceItem: null });

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    isBlocked: boolean;
    message?: string;
  }>({ isOpen: false, isBlocked: false });

  // Prices for this material
  const materialPrices = useMemo(() => {
    return prices.filter((p) => p.materialId === material?.id);
  }, [prices, material?.id]);

  if (!material) {
    return (
      <EmptyState
        title="Không tìm thấy vật tư"
        description="Định danh vật tư không tồn tại trong hệ thống."
        actionText="Quay lại danh mục"
        onAction={() => navigate('/materials')}
      />
    );
  }

  const handleOpenAddPrice = () => {
    setPriceModal({
      isOpen: true,
      priceItem: {
        materialId: material.id,
        supplierId: suppliers[0]?.id || '',
        supplierProductCode: '',
        currentPrice: 0,
        previousPrice: 0,
        isPreferred: materialPrices.length === 0,
        currentDate: new Date().toISOString().split('T')[0],
      },
    });
  };

  const handleOpenEditPrice = (p: MaterialSupplierPrice) => {
    setPriceModal({
      isOpen: true,
      priceItem: { ...p },
    });
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModal.priceItem || !priceModal.priceItem.supplierId) return;

    saveSupplierPrice({
      ...priceModal.priceItem,
      materialId: material.id,
      supplierId: priceModal.priceItem.supplierId,
      supplierProductCode: priceModal.priceItem.supplierProductCode?.trim() || '',
      currentPrice: Number(priceModal.priceItem.currentPrice) || 0,
      previousPrice: Number(priceModal.priceItem.previousPrice) || 0,
      currentDate: priceModal.priceItem.currentDate || new Date().toISOString().split('T')[0],
      isPreferred: Boolean(priceModal.priceItem.isPreferred),
    });

    setPriceModal({ isOpen: false, priceItem: null });
  };

  const handleDelete = () => {
    if (material.isReferenced) {
      setDeleteConfirm({
        isOpen: true,
        isBlocked: true,
        message: 'Vật tư này đang được tham chiếu trong hệ thống (BOM hoặc Bảng giá NCC). Không thể xóa cứng. Khuyến nghị chuyển sang trạng thái Lưu trữ (Archived).',
      });
    } else {
      setDeleteConfirm({
        isOpen: true,
        isBlocked: false,
        message: `Bạn có chắc chắn muốn xóa vật tư "${material.model}"? Hành động này không thể hoàn tác trong phiên làm việc.`,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm.isBlocked) {
      const res = deleteMaterial(material.id);
      if (res.success) {
        navigate('/materials');
      }
    }
    setDeleteConfirm({ isOpen: false, isBlocked: false });
  };

  return (
    <div className="space-y-4">
      {/* Top Header: Manufacturer | Model */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/materials')}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {manufacturer?.name || 'Hãng SX'} | {material.model}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {category?.name || 'Chưa phân nhóm'}
              </span>
              <StatusBadge status={material.status} type="master" />
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              {material.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {canDo('material', 'edit') && (
            <button
              type="button"
              onClick={() => navigate(`/materials/${material.id}/edit`)}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Chỉnh sửa</span>
            </button>
          )}

          {canDo('material', 'delete') && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation (Strictly 2 tabs) */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 rounded-t-lg">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Thông tin chung</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prices')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'prices'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Nhà cung cấp & Giá ({materialPrices.length})</span>
        </button>
      </div>

      {/* TAB 1: THÔNG TIN CHUNG */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Thông tin định danh & Phân loại</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Hãng sản xuất:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {manufacturer?.name} ({manufacturer?.code})
                </span>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Model (Part Number):</span>
                <span className="font-bold text-slate-900 text-sm font-mono">{material.model}</span>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Nhóm vật tư:</span>
                <span className="font-medium text-slate-900">{category?.name || '—'}</span>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Đơn vị tính (ĐVT):</span>
                <span className="font-semibold text-slate-900">{uom?.code || 'pcs'}</span>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Trạng thái:</span>
                <StatusBadge status={material.status} type="master" />
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Ngày tạo trên hệ thống:</span>
                <span className="font-medium text-slate-700">{formatDate(material.createdAt)}</span>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-500 block mb-1">Mô tả chi tiết kỹ thuật:</span>
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800 leading-relaxed font-sans">
                  {material.description || 'Chưa có mô tả chi tiết.'}
                </div>
              </div>
            </div>
          </div>

          {/* Side card: Inventory (mock) & Reference info */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Tồn kho thực tế (mock)</span>
              </h3>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <div className="text-[11px] text-emerald-800 font-medium">Tổng tồn kho khả dụng</div>
                <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">
                  {formatQuantity(material.stockQty)} <span className="text-sm font-sans font-medium text-emerald-700">{uom?.code}</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-600 space-y-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tham chiếu BOM/PO:</span>
                  <span className={`font-semibold ${material.isReferenced ? 'text-blue-700' : 'text-slate-500'}`}>
                    {material.isReferenced ? 'Đang được sử dụng' : 'Chưa phát sinh'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NHÀ CUNG CẤP & BẢNG GIÁ */}
      {activeTab === 'prices' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Bảng giá tham khảo từ Nhà cung cấp</h3>
              <p className="text-[11px] text-slate-500">
                Ghi nhận lịch sử biến động giá (VNĐ, chưa VAT) và thiết lập nhà cung cấp ưu tiên để tự động đưa vào BOM dự án
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddPrice}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cập nhật / Thêm giá NCC</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Nhà cung cấp</th>
                    <th className="px-4 py-3">Mã/Tên riêng NCC</th>
                    <th className="px-4 py-3 text-right">Giá trước đó (VNĐ)</th>
                    <th className="px-4 py-3 text-right">Giá hiện tại (VNĐ)</th>
                    <th className="px-4 py-3 text-center">Biến động</th>
                    <th className="px-4 py-3">Ngày cập nhật</th>
                    <th className="px-4 py-3 text-center">NCC Ưu tiên</th>
                    <th className="px-4 py-3 text-right w-20">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {materialPrices.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState
                          title="Chưa có bảng giá nhà cung cấp nào"
                          description="Nhấn 'Cập nhật / Thêm giá NCC' để nhập báo giá mới nhất."
                          actionText="Thêm giá ngay"
                          onAction={handleOpenAddPrice}
                        />
                      </td>
                    </tr>
                  ) : (
                    materialPrices.map((p) => {
                      const sup = suppliers.find((s) => s.id === p.supplierId);
                      const delta = calculatePriceDelta(p.currentPrice, p.previousPrice);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{sup?.name || 'Nhà cung cấp'}</div>
                            <div className="text-[11px] text-slate-500 font-mono">MST: {sup?.taxCode}</div>
                          </td>

                          <td className="px-4 py-3 text-slate-700 font-mono text-[11px]">
                            {p.supplierProductCode || '—'}
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-slate-500">
                            {p.previousPrice ? formatCurrency(p.previousPrice) : '—'}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                            {formatCurrency(p.currentPrice)}
                          </td>

                          <td className="px-4 py-3 text-center">
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
                              <span className="text-slate-400 font-medium inline-flex items-center gap-0.5">
                                <Minus className="w-3 h-3" />
                                <span>Không đổi</span>
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-600">{formatDate(p.currentDate)}</td>

                          <td className="px-4 py-3 text-center">
                            {p.isPreferred ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span>Ưu tiên</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPreferredSupplier(material.id, p.supplierId)}
                                className="text-[11px] text-slate-400 hover:text-blue-600 font-medium hover:underline"
                              >
                                Đặt ưu tiên
                              </button>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <ActionIconBtn
                              icon={Pencil}
                              label="Sửa giá"
                              onClick={() => handleOpenEditPrice(p)}
                            />
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

      {/* Supplier Price Modal */}
      {priceModal.isOpen && priceModal.priceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Cập nhật giá Nhà cung cấp</h3>
              <button
                type="button"
                onClick={() => setPriceModal({ isOpen: false, priceItem: null })}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePrice}>
              <div className="p-5 space-y-3.5 text-xs">
                <FormField label="Nhà cung cấp" required>
                  <select
                    value={priceModal.priceItem.supplierId || ''}
                    onChange={(e) =>
                      setPriceModal({
                        ...priceModal,
                        priceItem: { ...priceModal.priceItem, supplierId: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (MST: {s.taxCode})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Mã / Tên sản phẩm theo NCC" helperText="Tên hoặc mã hiệu quy định riêng của nhà cung cấp này">
                  <input
                    type="text"
                    value={priceModal.priceItem.supplierProductCode || ''}
                    onChange={(e) =>
                      setPriceModal({
                        ...priceModal,
                        priceItem: { ...priceModal.priceItem, supplierProductCode: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                    placeholder="VD: SIE-1214C-COMPACT"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Giá hiện tại (VNĐ, chưa VAT)" required>
                    <input
                      type="number"
                      min="0"
                      required
                      value={priceModal.priceItem.currentPrice ?? ''}
                      onChange={(e) =>
                        setPriceModal({
                          ...priceModal,
                          priceItem: { ...priceModal.priceItem, currentPrice: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900"
                    />
                  </FormField>

                  <FormField label="Giá trước đó (VNĐ)">
                    <input
                      type="number"
                      min="0"
                      value={priceModal.priceItem.previousPrice ?? ''}
                      onChange={(e) =>
                        setPriceModal({
                          ...priceModal,
                          priceItem: { ...priceModal.priceItem, previousPrice: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                    />
                  </FormField>
                </div>

                <FormField label="Ngày cập nhật">
                  <input
                    type="date"
                    value={priceModal.priceItem.currentDate || ''}
                    onChange={(e) =>
                      setPriceModal({
                        ...priceModal,
                        priceItem: { ...priceModal.priceItem, currentDate: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </FormField>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPref"
                    checked={Boolean(priceModal.priceItem.isPreferred)}
                    onChange={(e) =>
                      setPriceModal({
                        ...priceModal,
                        priceItem: { ...priceModal.priceItem, isPreferred: e.target.checked },
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isPref" className="font-semibold text-slate-800 cursor-pointer">
                    Đặt làm Nhà cung cấp ưu tiên mặc định
                  </label>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPriceModal({ isOpen: false, priceItem: null })}
                  className="px-3.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu bảng giá</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Blocked Modal */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.isBlocked ? 'Không thể xóa vật tư' : 'Xác nhận xóa vật tư'}
        message={deleteConfirm.message || 'Vật tư đang được liên kết với dữ liệu BOM hoặc giá NCC trong hệ thống.'}
        isBlocked={deleteConfirm.isBlocked}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, isBlocked: false })}
      />
    </div>
  );
};
