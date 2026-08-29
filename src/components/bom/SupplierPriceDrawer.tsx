import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Info,
} from 'lucide-react';
import {
  ProjectBOMItem,
  Material,
  Category,
  Manufacturer,
  UnitOfMeasure,
  Supplier,
  MaterialSupplierPrice,
} from '../../domain/types';
import {
  formatCurrency,
  formatQuantity,
  calculatePriceDelta,
  evaluateSupplierPrices,
} from '../../domain/mockRules';
import { StatusBadge } from '../common/StatusBadge';

interface SupplierPriceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bomItem: ProjectBOMItem | null;
  material: Material | undefined;
  category: Category | undefined;
  manufacturer: Manufacturer | undefined;
  uom: UnitOfMeasure | undefined;
  suppliers: Supplier[];
  prices: MaterialSupplierPrice[];
  currentProcurementStatusDisplay: string;
  isReceivingDerived: boolean;
  onShowNotice?: (message: string) => void;
}

export const SupplierPriceDrawer: React.FC<SupplierPriceDrawerProps> = ({
  isOpen,
  onClose,
  bomItem,
  material,
  category,
  manufacturer,
  uom,
  suppliers,
  prices,
  currentProcurementStatusDisplay,
  isReceivingDerived,
  onShowNotice,
}) => {
  // Local draft states for UI preview in REQ-04C (discarded on close)
  const [draftSupplierId, setDraftSupplierId] = useState<string | null>(null);
  const [draftFinalUnitPrice, setDraftFinalUnitPrice] = useState<number | ''>('');
  const [draftStatus, setDraftStatus] = useState<string>('AWAITING_QUOTATION');

  // Supplier prices for this material
  const materialPrices = useMemo(() => {
    if (!material) return [];
    return prices.filter((p) => p.materialId === material.id);
  }, [prices, material]);

  // Evaluate Cheapest and Preferred
  const { cheapestPriceItem, preferredPriceItem } = useMemo(() => {
    return evaluateSupplierPrices(materialPrices);
  }, [materialPrices]);

  // Sync draft state when drawer opens or bomItem changes
  useEffect(() => {
    if (bomItem) {
      setDraftSupplierId(bomItem.finalSupplierId || null);
      if (bomItem.finalUnitPrice && bomItem.finalUnitPrice > 0) {
        setDraftFinalUnitPrice(bomItem.finalUnitPrice);
      } else if (bomItem.finalSupplierId) {
        const supPrice = materialPrices.find((p) => p.supplierId === bomItem.finalSupplierId);
        setDraftFinalUnitPrice(supPrice ? supPrice.currentPrice : '');
      } else {
        setDraftFinalUnitPrice('');
      }

      // Initial pre-receiving status draft
      if (bomItem.status === 'PURCHASING') {
        setDraftStatus('ORDERED');
      } else {
        setDraftStatus('AWAITING_QUOTATION');
      }
    }
  }, [bomItem, materialPrices]);

  if (!isOpen || !bomItem || !material) return null;

  // Selected supplier price record
  const selectedSupplierPrice = materialPrices.find((p) => p.supplierId === draftSupplierId);
  const selectedSupplier = suppliers.find((s) => s.id === draftSupplierId);

  const handleSelectSupplier = (supplierId: string) => {
    setDraftSupplierId(supplierId);
    const sp = materialPrices.find((p) => p.supplierId === supplierId);
    if (sp && sp.currentPrice > 0) {
      // Default Final Unit Price to chosen Supplier Current Price
      setDraftFinalUnitPrice(sp.currentPrice);
    }
  };

  const calculatedAmount =
    typeof draftFinalUnitPrice === 'number' && draftFinalUnitPrice > 0
      ? bomItem.bomQty * draftFinalUnitPrice
      : 0;

  const handleConfirmClick = () => {
    if (onShowNotice) {
      onShowNotice(
        'Lưu quyết định NCC & Giá sẽ được hoàn thiện trong REQ-04D theo đúng hợp đồng nghiệp vụ.'
      );
    }
  };

  const handleReturnExchangeClick = () => {
    if (onShowNotice) {
      onShowNotice(
        'Thao tác Đánh dấu trả / đổi hàng là trường hợp ngoại lệ (Exception state). Quy trình xử lý chi tiết sẽ được hoàn thiện ở bước tiếp theo.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container (Desktop 520 - 640px) */}
      <div className="w-full max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* 1. Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {category?.name || 'Nhóm vật tư'}
              </span>
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {manufacturer?.name || 'Hãng'} | {material.model}
              </h2>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed" title={material.description}>
              {material.description}
            </p>

            <div className="flex items-center gap-3 text-xs pt-1 flex-wrap">
              <span className="text-slate-600">
                SL BOM: <strong className="text-slate-900 font-bold">{formatQuantity(bomItem.bomQty)} {uom?.code}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Trạng thái:</span>
                <span className="font-semibold text-slate-800">{currentProcurementStatusDisplay}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition shrink-0"
            title="Đóng drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 text-xs">
          {/* 2. Supplier Comparison Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                So sánh báo giá Nhà cung cấp ({materialPrices.length})
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Đơn vị: VND (Chưa VAT)</span>
            </div>

            {materialPrices.length === 0 ? (
              <div className="p-6 text-center rounded-lg bg-slate-50 border border-slate-200 text-slate-500 space-y-1">
                <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="font-semibold text-slate-700">Chưa có báo giá NCC nào</p>
                <p className="text-[11px]">Vật tư này chưa có liên kết báo giá từ Nhà cung cấp trong hệ thống.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {materialPrices.map((p) => {
                  const sup = suppliers.find((s) => s.id === p.supplierId);
                  const isCheapest = cheapestPriceItem?.id === p.id && p.currentPrice > 0;
                  const isPreferred = p.isPreferred;
                  const isSelected = draftSupplierId === p.supplierId;
                  const isCurrentConfirmed = bomItem.finalSupplierId === p.supplierId;
                  const delta = calculatePriceDelta(p.currentPrice, p.previousPrice);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectSupplier(p.supplierId)}
                      className={`p-3.5 rounded-lg border transition cursor-pointer relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">
                              {sup?.name || 'Nhà cung cấp'}
                            </span>
                            {p.supplierProductCode && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({p.supplierProductCode})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {isPreferred && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                ★ NCC Ưu tiên
                              </span>
                            )}
                            {isCheapest && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✓ Giá thấp nhất
                              </span>
                            )}
                            {isCurrentConfirmed && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                                Đã chốt trước đó
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price Display */}
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-slate-900">
                            {p.currentPrice > 0 ? formatCurrency(p.currentPrice) : '—'}
                          </div>
                          {p.previousPrice > 0 && (
                            <div className="text-[11px] text-slate-400 line-through">
                              Trước: {formatCurrency(p.previousPrice)}
                            </div>
                          )}
                          <div className="mt-1">
                            <StatusBadge status={delta.trend} type="price" />
                          </div>
                        </div>
                      </div>

                      {/* Selection radio visual */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          {isSelected ? (
                            <strong className="text-blue-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              Đang chọn làm NCC cho BOM
                            </strong>
                          ) : (
                            'Nhấn để chọn NCC này'
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">MST: {sup?.taxCode || '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Purchase Decision Area */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Quyết định mua hàng & Đơn giá chốt
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* NCC cuối cùng */}
              <div className="p-3 bg-white rounded border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-0.5">NCC cuối cùng</span>
                <span className="font-bold text-slate-900 text-xs truncate block">
                  {selectedSupplier?.name || <em className="text-slate-400 font-normal">Chưa chọn NCC</em>}
                </span>
              </div>

              {/* Giá hiện tại của NCC */}
              <div className="p-3 bg-white rounded border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-0.5">Giá hiện tại của NCC</span>
                <span className="font-semibold text-slate-700 text-xs">
                  {selectedSupplierPrice && selectedSupplierPrice.currentPrice > 0
                    ? formatCurrency(selectedSupplierPrice.currentPrice)
                    : '—'}
                </span>
              </div>
            </div>

            {/* Đơn giá chốt (Negotiated Price) */}
            <div className="p-3.5 bg-white rounded-lg border border-blue-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-900">
                  Đơn giá chốt (VND / {uom?.code || 'ĐVT'}) *
                </label>
                <span className="text-[10px] text-blue-600 font-medium">Giá mua thực tế dự án</span>
              </div>
              <input
                type="number"
                min="0"
                step="1000"
                value={draftFinalUnitPrice}
                onChange={(e) => setDraftFinalUnitPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="Nhập đơn giá chốt..."
                className="w-full px-3 py-2 border border-blue-300 rounded text-xs font-bold text-slate-900 bg-blue-50/20 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500">
                Mặc định lấy Giá hiện tại của NCC tại thời điểm chọn. Bạn có thể đàm phán điều chỉnh cho dự án này mà không làm thay đổi báo giá gốc của NCC.
              </p>
            </div>

            {/* Số lượng BOM & Thành tiền */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-0.5">Số lượng BOM</span>
                <span className="font-bold text-slate-900 text-xs">
                  {formatQuantity(bomItem.bomQty)} {uom?.code}
                </span>
              </div>

              <div className="p-3 bg-blue-50/60 rounded border border-blue-200">
                <span className="text-[11px] text-blue-700 font-medium block mb-0.5">Thành tiền (Dự toán)</span>
                <span className="font-bold text-blue-800 text-sm">
                  {calculatedAmount > 0 ? formatCurrency(calculatedAmount) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Procurement Status in Drawer */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tiến độ mua & Giao hàng
              </h3>
              <span className="text-[10px] text-slate-400">Pre-receiving states</span>
            </div>

            {isReceivingDerived ? (
              <div className="p-3 rounded bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Trạng thái tự động theo Nhận hàng</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Dòng vật tư này đang ở trạng thái nhận hàng ({currentProcurementStatusDisplay}). Trạng thái nhận hàng được tính tự động từ thực nhận và không thể chọn thủ công.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[11px] text-slate-600 font-medium block">
                  Trạng thái mua hàng dự kiến (Pre-receiving):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'INTERNAL_REVIEW', label: 'Kiểm tra nội bộ' },
                    { id: 'AWAITING_QUOTATION', label: 'Đang chờ báo giá' },
                    { id: 'AWAITING_PAYMENT', label: 'Chờ thanh toán' },
                    { id: 'ORDERED', label: 'Đã đặt hàng' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setDraftStatus(st.id)}
                      className={`p-2 rounded text-left border transition text-xs flex items-center justify-between ${
                        draftStatus === st.id
                          ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{st.label}</span>
                      {draftStatus === st.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Chọn Nhà cung cấp và Tiến độ mua hàng là hai khái niệm độc lập.
                </p>
              </div>
            )}

            {/* 5. Return / Exchange Exception Action */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Trường hợp trả / đổi hàng:</span>
              <button
                type="button"
                onClick={handleReturnExchangeClick}
                className="px-2.5 py-1 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3 text-rose-600" />
                <span>Đánh dấu trả / đổi hàng</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6. Sticky Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded text-slate-700 bg-white hover:bg-slate-100 transition"
          >
            Hủy
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmClick}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận NCC & Giá</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
