import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Boxes,
  ArrowLeft,
  Pencil,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Building,
  Layers,
  FolderKanban,
  FileText,
  Warehouse,
  History,
  Save,
  Star,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionIconBtn } from '../../components/common/ActionIconBtn';
import { EmptyState } from '../../components/common/EmptyState';
import { FormField } from '../../components/forms/FormField';
import { formatCurrency, formatQuantity, formatDate, calculatePriceDelta } from '../../domain/mockRules';
import { MaterialPrice } from '../../domain/types';

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
    inventory,
    warehouses,
    boms,
    projects,
    saveMaterialPrice,
  } = useApp();

  const material = materials.find((m) => m.id === materialId);
  const category = categories.find((c) => c.id === material?.categoryId);
  const manufacturer = manufacturers.find((m) => m.id === material?.manufacturerId);
  const uom = uoms.find((u) => u.id === material?.uomId);

  const [activeTab, setActiveTab] = useState<'info' | 'prices' | 'inventory' | 'projects'>('info');

  // Supplier Price Modal State
  const [priceModal, setPriceModal] = useState<{
    isOpen: boolean;
    priceItem: Partial<MaterialPrice> | null;
  }>({ isOpen: false, priceItem: null });

  // Prices for this material
  const materialPrices = useMemo(() => {
    return prices.filter((p) => p.materialId === material?.id);
  }, [prices, material?.id]);

  // Inventory for this material
  const materialInventories = useMemo(() => {
    return inventory.filter((inv) => inv.materialId === material?.id);
  }, [inventory, material?.id]);

  const totalStockQty = useMemo(() => {
    return materialInventories.reduce((sum, inv) => sum + inv.quantity, 0);
  }, [materialInventories]);

  // Projects using this material
  const materialBOMs = useMemo(() => {
    return boms.filter((b) => b.materialId === material?.id);
  }, [boms, material?.id]);

  if (!material) {
    return (
      <EmptyState
        title="Không tìm thấy vật tư"
        description="Mã định danh vật tư không tồn tại trong hệ thống."
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
        currentPrice: 0,
        previousPrice: 0,
        isPreferred: materialPrices.length === 0,
        effectiveDate: new Date().toISOString().split('T')[0],
      },
    });
  };

  const handleOpenEditPrice = (p: MaterialPrice) => {
    setPriceModal({
      isOpen: true,
      priceItem: { ...p },
    });
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModal.priceItem || !priceModal.priceItem.supplierId) return;

    saveMaterialPrice({
      ...priceModal.priceItem,
      materialId: material.id,
      supplierId: priceModal.priceItem.supplierId,
      currentPrice: Number(priceModal.priceItem.currentPrice) || 0,
      previousPrice: Number(priceModal.priceItem.previousPrice) || 0,
      effectiveDate: priceModal.priceItem.effectiveDate || new Date().toISOString().split('T')[0],
      isPreferred: Boolean(priceModal.priceItem.isPreferred),
    });

    setPriceModal({ isOpen: false, priceItem: null });
  };

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb Header */}
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{material.code}</h1>
              <span className="text-base text-slate-500 font-normal">— {material.name}</span>
              <StatusBadge status={material.status} type="master" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hãng: <span className="font-semibold text-slate-700">{manufacturer?.name}</span> | Nhóm: {category?.name} | ĐVT: {uom?.code}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/materials/${material.id}/edit`)}
          className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Sửa thông tin</span>
        </button>
      </div>

      {/* Tabs */}
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
          <span>Bảng giá Nhà cung cấp ({materialPrices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'inventory'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Tồn kho thực tế ({formatQuantity(totalStockQty)} {uom?.code})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'projects'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Dự án đang sử dụng ({materialBOMs.length})</span>
        </button>
      </div>

      {/* TAB 1: THÔNG TIN CHUNG */}
      {activeTab === 'info' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs max-w-3xl space-y-6">
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Mã vật tư:</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{material.code}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Tên vật tư:</span>
              <span className="font-semibold text-slate-900 text-sm">{material.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Nhóm phân loại:</span>
              <span className="font-medium text-slate-800">{category?.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Hãng sản xuất:</span>
              <span className="font-medium text-slate-800">{manufacturer?.name} ({manufacturer?.code})</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Đơn vị tính:</span>
              <span className="font-medium text-slate-800">{uom?.code}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Trạng thái:</span>
              <StatusBadge status={material.status} type="master" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <span className="text-slate-500 text-xs block mb-1.5 font-semibold">Thông số kỹ thuật / Đặc tính:</span>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap">
              {material.specs}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BẢNG GIÁ THEO NCC */}
      {activeTab === 'prices' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Bảng giá tham khảo từ Nhà cung cấp</h3>
              <p className="text-[11px] text-slate-500">
                Ghi nhận lịch sử biến động giá và chọn nhà cung cấp ưu tiên để tính toán dự toán tự động
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddPrice}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cập nhật / Thêm giá NCC</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Nhà cung cấp</th>
                  <th className="px-4 py-3 text-right">Giá hiện tại (VNĐ)</th>
                  <th className="px-4 py-3 text-right">Giá trước đó (VNĐ)</th>
                  <th className="px-4 py-3 text-center">Biến động</th>
                  <th className="px-4 py-3 text-center">NCC Ưu tiên</th>
                  <th className="px-4 py-3">Ngày hiệu lực</th>
                  <th className="px-4 py-3 text-right w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {materialPrices.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
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
                          <div className="font-bold text-slate-900">{sup?.name}</div>
                          <div className="text-[11px] text-slate-500">MST: {sup?.taxCode}</div>
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(p.currentPrice)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-slate-500">
                          {p.previousPrice ? formatCurrency(p.previousPrice) : '—'}
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
                            <span className="text-slate-400 font-medium">Không đổi</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {p.isPreferred ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Ưu tiên</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => saveMaterialPrice({ ...p, isPreferred: true })}
                              className="text-[11px] text-slate-400 hover:text-blue-600 font-medium"
                            >
                              Đặt ưu tiên
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-600">{formatDate(p.effectiveDate)}</td>

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
      )}

      {/* TAB 3: TỒN KHO THỰC TẾ */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Kho hàng</th>
                  <th className="px-4 py-3">Mã kho</th>
                  <th className="px-4 py-3">Vị trí lưu kho</th>
                  <th className="px-4 py-3 text-right">Số lượng tồn</th>
                  <th className="px-4 py-3">Cập nhật lần cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {materialInventories.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="Vật tư chưa có số dư tồn kho"
                        description="Thực hiện nhập kho để ghi nhận số lượng tồn thực tế."
                      />
                    </td>
                  </tr>
                ) : (
                  materialInventories.map((inv) => {
                    const wh = warehouses.find((w) => w.id === inv.warehouseId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">{wh?.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{wh?.code}</td>
                        <td className="px-4 py-3 text-slate-600">{inv.binLocation || 'Kệ chung'}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600 text-sm">
                          {formatQuantity(inv.quantity)} {uom?.code}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(inv.lastUpdated)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DỰ ÁN ĐANG SỬ DỤNG */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Mã dự án</th>
                  <th className="px-4 py-3">Tên dự án</th>
                  <th className="px-4 py-3 text-right">SL Dự toán</th>
                  <th className="px-4 py-3 text-right">SL Đã nhận</th>
                  <th className="px-4 py-3 text-center">Tình trạng BOM</th>
                  <th className="px-4 py-3 text-right">Xem dự án</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {materialBOMs.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        title="Vật tư chưa được đưa vào BOM dự án nào"
                        description="Mở Quản lý dự án để thêm vật tư này vào danh mục dự toán."
                      />
                    </td>
                  </tr>
                ) : (
                  materialBOMs.map((bom) => {
                    const prj = projects.find((p) => p.id === bom.projectId);
                    return (
                      <tr key={bom.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">{prj?.code}</td>
                        <td className="px-4 py-3 font-medium">{prj?.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatQuantity(bom.quantityEstimated)} {uom?.code}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          {formatQuantity(bom.quantityReceived)} {uom?.code}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={bom.status} type="bom" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${prj?.id}`)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                          >
                            Xem BOM
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

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Giá hiện tại (VNĐ)" required>
                    <input
                      type="number"
                      min="0"
                      required
                      value={priceModal.priceItem.currentPrice || ''}
                      onChange={(e) =>
                        setPriceModal({
                          ...priceModal,
                          priceItem: { ...priceModal.priceItem, currentPrice: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                    />
                  </FormField>

                  <FormField label="Giá trước đó (VNĐ)">
                    <input
                      type="number"
                      min="0"
                      value={priceModal.priceItem.previousPrice || ''}
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

                <FormField label="Ngày hiệu lực">
                  <input
                    type="date"
                    value={priceModal.priceItem.effectiveDate || ''}
                    onChange={(e) =>
                      setPriceModal({
                        ...priceModal,
                        priceItem: { ...priceModal.priceItem, effectiveDate: e.target.value },
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
    </div>
  );
};
