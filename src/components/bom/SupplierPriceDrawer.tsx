import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Info,
  Lock,
  ArrowRight,
} from 'lucide-react';
import {
  ProjectBOMItem,
  Material,
  Category,
  Manufacturer,
  UnitOfMeasure,
  Supplier,
  MaterialSupplierPrice,
  BOMProcurementStatus,
} from '../../domain/types';
import {
  formatCurrency,
  formatQuantity,
  calculatePriceDelta,
  evaluateSupplierPrices,
  isBOMSupplierLocked,
} from '../../domain/mockRules';
import { StatusBadge } from '../common/StatusBadge';
import { useApp } from '../../context/AppContext';

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
}) => {
  const {
    saveBOMPurchaseDecision,
    updateBOMFinalUnitPrice,
    markBOMReturnOrExchange,
    canDo,
    addToast,
  } = useApp();
  const canSelectSupplier = canDo('bom', 'select_supplier');

  // Local draft states
  const [draftSupplierId, setDraftSupplierId] = useState<string | null>(null);
  const [draftFinalUnitPrice, setDraftFinalUnitPrice] = useState<number | ''>('');
  const [draftStatus, setDraftStatus] = useState<BOMProcurementStatus>('AWAITING_QUOTATION');

  // Modals inside drawer
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnNote, setReturnNote] = useState('');

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

      // Preserve saved Project Final Unit Price if already persisted
      if (bomItem.finalUnitPrice && bomItem.finalUnitPrice > 0) {
        setDraftFinalUnitPrice(bomItem.finalUnitPrice);
      } else if (bomItem.finalSupplierId) {
        const supPrice = materialPrices.find((p) => p.supplierId === bomItem.finalSupplierId);
        setDraftFinalUnitPrice(supPrice ? supPrice.currentPrice : '');
      } else {
        setDraftFinalUnitPrice('');
      }

      // Initial pre-receiving status draft or exception preservation
      if (bomItem.procurementStatus === 'RETURN_OR_EXCHANGE') {
        setDraftStatus('RETURN_OR_EXCHANGE');
      } else if (bomItem.procurementStatus) {
        setDraftStatus(bomItem.procurementStatus);
      } else if (bomItem.status === 'PURCHASING') {
        setDraftStatus('ORDERED');
      } else {
        setDraftStatus('AWAITING_QUOTATION');
      }

      // Reset modals
      setIsReplacementModalOpen(false);
      setIsReturnModalOpen(false);
      setReturnNote('');
    }
  }, [bomItem, materialPrices, isOpen]);

  if (!isOpen || !bomItem || !material) return null;

  const isSupplierLocked = isBOMSupplierLocked(bomItem);

  // Selected supplier and price record
  const selectedSupplierPrice = materialPrices.find((p) => p.supplierId === draftSupplierId);
  const selectedSupplier = suppliers.find((s) => s.id === draftSupplierId);
  const currentPersistedSupplier = suppliers.find((s) => s.id === bomItem.finalSupplierId);

  const handleSelectSupplier = (supplierId: string) => {
    if (!canSelectSupplier) return;
    if (isSupplierLocked) {
      addToast('warning', 'Nhà cung cấp không thể thay đổi sau khi đã đặt hàng hoặc phát sinh nhận hàng.');
      return;
    }

    setDraftSupplierId(supplierId);

    // If re-selecting existing persisted supplier, preserve persisted price
    if (supplierId === bomItem.finalSupplierId && bomItem.finalUnitPrice && bomItem.finalUnitPrice > 0) {
      setDraftFinalUnitPrice(bomItem.finalUnitPrice);
    } else {
      // Default Final Unit Price to chosen Supplier's Current Price
      const sp = materialPrices.find((p) => p.supplierId === supplierId);
      if (sp && sp.currentPrice > 0) {
        setDraftFinalUnitPrice(sp.currentPrice);
      }
    }
  };

  const calculatedAmount =
    typeof draftFinalUnitPrice === 'number' && draftFinalUnitPrice > 0
      ? bomItem.bomQty * draftFinalUnitPrice
      : 0;

  const isExceptionActive = bomItem.procurementStatus === 'RETURN_OR_EXCHANGE';

  const handleSavePriceOnly = () => {
    if (!canSelectSupplier) {
      addToast('error', 'Bạn không có quyền chỉnh sửa đơn giá chốt (bom.select_supplier).');
      return;
    }

    const finalPriceNum = Number(draftFinalUnitPrice);
    if (typeof draftFinalUnitPrice !== 'number' || isNaN(finalPriceNum) || finalPriceNum <= 0) {
      addToast('warning', 'Vui lòng nhập Đơn giá chốt hợp lệ (> 0 VND).');
      return;
    }

    const result = updateBOMFinalUnitPrice({
      bomItemId: bomItem.id,
      finalUnitPrice: finalPriceNum,
    });

    if (result.success) {
      onClose();
    } else if (result.message) {
      addToast('error', result.message);
    }
  };

  const executeSaveDecision = () => {
    if (isExceptionActive) {
      addToast('warning', 'Mục BOM đang ở trạng thái Đang trả hàng / đổi hàng. Quy trình kết thúc trả / đổi hàng chưa được chốt trong SPEC.');
      return;
    }
    const finalPriceNum = Number(draftFinalUnitPrice);
    const result = saveBOMPurchaseDecision({
      bomItemId: bomItem.id,
      finalSupplierId: draftSupplierId,
      finalUnitPrice: finalPriceNum,
      procurementStatus: draftStatus,
    });

    if (result.success) {
      setIsReplacementModalOpen(false);
      onClose();
    } else if (result.message) {
      addToast('error', result.message);
    }
  };

  const handleConfirmClick = () => {
    if (!canSelectSupplier) {
      addToast('error', 'Bạn không có quyền chọn Nhà cung cấp (bom.select_supplier).');
      return;
    }

    if (isExceptionActive) {
      addToast('warning', 'Không thể cập nhật tiến độ mua hàng thông thường khi đang ở trạng thái ngoại lệ Đang trả hàng / đổi hàng.');
      return;
    }

    // Validation
    if (draftStatus === 'ORDERED' && !draftSupplierId) {
      addToast('warning', 'Không thể đặt trạng thái "Đã đặt hàng" khi chưa chọn Nhà cung cấp.');
      return;
    }

    if (draftSupplierId) {
      if (typeof draftFinalUnitPrice !== 'number' || isNaN(draftFinalUnitPrice) || draftFinalUnitPrice <= 0) {
        addToast('warning', 'Vui lòng nhập Đơn giá chốt hợp lệ (> 0 VND).');
        return;
      }
    }

    // Check if replacing an existing persisted supplier with another supplier
    if (bomItem.finalSupplierId && draftSupplierId && bomItem.finalSupplierId !== draftSupplierId) {
      setIsReplacementModalOpen(true);
      return;
    }

    // Normal confirmation save
    executeSaveDecision();
  };

  const handleConfirmReturnExchange = () => {
    if (!canSelectSupplier) {
      addToast('error', 'Bạn không có quyền thực hiện thao tác này (bom.select_supplier).');
      return;
    }

    const result = markBOMReturnOrExchange({
      bomItemId: bomItem.id,
      note: returnNote,
    });

    if (result.success) {
      setIsReturnModalOpen(false);
      onClose();
    } else if (result.message) {
      addToast('error', result.message);
    }
  };

  const getStatusLabel = (statusToken: BOMProcurementStatus) => {
    switch (statusToken) {
      case 'INTERNAL_REVIEW':
        return 'Kiểm tra nội bộ';
      case 'AWAITING_QUOTATION':
        return 'Đang chờ báo giá';
      case 'AWAITING_PAYMENT':
        return 'Chờ thanh toán';
      case 'ORDERED':
        return 'Đã đặt hàng';
      case 'RETURN_OR_EXCHANGE':
        return 'Đang trả hàng / đổi hàng';
      default:
        return statusToken;
    }
  };

  const hasReceivedGoods = bomItem.projectReceivedQty && bomItem.projectReceivedQty > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-in slide-in-from-right duration-200 relative">
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

            <p className="text-xs text-slate-600 leading-relaxed break-words" title={material.description}>
              {material.description}
            </p>

            <div className="flex items-center gap-3 text-xs pt-1 flex-wrap">
              <span className="text-slate-600">
                SL BOM: <strong className="text-slate-900 font-bold">{formatQuantity(bomItem.bomQty)} {uom?.code}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Trạng thái hiện tại:</span>
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

        {/* Permission Notice Banner */}
        {!canSelectSupplier && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Chế độ xem:</strong> Bạn không có quyền chọn Nhà cung cấp (<code>bom.select_supplier</code>). Bạn có thể xem bảng giá nhưng không thể lưu quyết định.
            </span>
          </div>
        )}

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
                  const isInactive = sup?.status === 'INACTIVE';

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (isSupplierLocked) {
                          addToast('warning', 'Nhà cung cấp không thể thay đổi sau khi đã đặt hàng hoặc phát sinh nhận hàng.');
                        } else if (!isInactive && canSelectSupplier) {
                          handleSelectSupplier(p.supplierId);
                        } else if (isInactive) {
                          addToast('warning', 'Nhà cung cấp này đang ngưng hoạt động, không thể chọn mới.');
                        }
                      }}
                      className={`p-3.5 rounded-lg border transition relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      } ${
                        isSupplierLocked
                          ? isSelected
                            ? 'cursor-default'
                            : 'cursor-not-allowed opacity-75'
                          : !canSelectSupplier || isInactive
                          ? 'cursor-not-allowed opacity-90'
                          : 'cursor-pointer'
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
                            {isInactive && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                Ngưng HĐ
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {isSupplierLocked && isCurrentConfirmed && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-slate-600" /> NCC đã khóa
                              </span>
                            )}
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
                            {!isSupplierLocked && isCurrentConfirmed && (
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
                          {isSupplierLocked ? (
                            isSelected ? (
                              <strong className="text-slate-700 flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                                Nhà cung cấp đã khóa cho mục BOM này
                              </strong>
                            ) : (
                              <span className="text-slate-400">Không thể chọn (NCC đã khóa)</span>
                            )
                          ) : isSelected ? (
                            <strong className="text-blue-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              Đang chọn làm NCC cho BOM
                            </strong>
                          ) : canSelectSupplier && !isInactive ? (
                            'Nhấn để chọn NCC này'
                          ) : (
                            'Không khả dụng'
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

            {isSupplierLocked && !bomItem.finalSupplierId && (
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Dòng BOM đã ở trạng thái khóa nhưng chưa có Nhà cung cấp cuối cùng. Cần rà soát dữ liệu.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* NCC cuối cùng */}
              <div className="p-3 bg-white rounded border border-slate-200">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-slate-500">NCC cuối cùng</span>
                  {isSupplierLocked && selectedSupplier && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-slate-500" /> Đã khóa
                    </span>
                  )}
                </div>
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
                disabled={!canSelectSupplier}
                value={draftFinalUnitPrice}
                onChange={(e) => setDraftFinalUnitPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="Nhập đơn giá chốt..."
                className={`w-full px-3 py-2 border border-blue-300 rounded text-xs font-bold text-slate-900 bg-blue-50/20 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                  !canSelectSupplier ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
                }`}
              />
              <p className="text-[10px] text-slate-500">
                {isSupplierLocked
                  ? 'Nhà cung cấp đã khóa. Bạn có thể điều chỉnh Đơn giá chốt (giá mua thực tế) cho dự án này bất cứ lúc nào mà không làm thay đổi NCC hay bảng giá gốc.'
                  : 'Mặc định lấy Giá hiện tại của NCC tại thời điểm chọn. Bạn có thể đàm phán điều chỉnh cho dự án này mà không làm thay đổi bảng giá gốc của Nhà cung cấp.'}
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
                <span className="text-[11px] text-blue-700 font-medium block mb-0.5">Thành tiền</span>
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
              <span className="text-[10px] text-slate-400">
                {isSupplierLocked ? 'Trạng thái hiện tại' : 'Pre-receiving states'}
              </span>
            </div>

            {isExceptionActive ? (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 space-y-2 text-xs text-rose-900">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-800">
                      Trạng thái hiện tại: Đang trả hàng / đổi hàng
                    </p>
                    <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                      Quy trình kết thúc xử lý trả / đổi hàng chưa được chốt trong SPEC. Chờ chốt SPEC.
                    </p>
                    {bomItem.procurementNote && (
                      <div className="mt-2 p-2 bg-white/80 rounded border border-rose-200 text-[11px] text-slate-700">
                        <span className="font-semibold text-rose-800">Ghi chú trả/đổi:</span> {bomItem.procurementNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : isReceivingDerived ? (
              <div className="p-3 rounded bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Trạng thái tự động theo Nhận hàng ({currentProcurementStatusDisplay})</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Trạng thái nhận hàng được tính tự động từ thực nhận và không thể chọn thủ công. Nhà cung cấp đã được khóa.
                  </p>
                </div>
              </div>
            ) : isSupplierLocked ? (
              <div className="p-3 rounded bg-blue-50/70 border border-blue-200 flex items-start gap-2 text-xs text-blue-900">
                <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Trạng thái hiện tại: {getStatusLabel(bomItem.procurementStatus || 'ORDERED')}</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Sau khi đã đặt hàng, Nhà cung cấp được khóa cố định. Bạn chỉ có thể cập nhật Đơn giá chốt (giá mua thực tế) cho dự án.
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
                    { id: 'INTERNAL_REVIEW' as BOMProcurementStatus, label: 'Kiểm tra nội bộ' },
                    { id: 'AWAITING_QUOTATION' as BOMProcurementStatus, label: 'Đang chờ báo giá' },
                    { id: 'AWAITING_PAYMENT' as BOMProcurementStatus, label: 'Chờ thanh toán' },
                    { id: 'ORDERED' as BOMProcurementStatus, label: 'Đã đặt hàng' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      disabled={!canSelectSupplier}
                      onClick={() => setDraftStatus(st.id)}
                      className={`p-2 rounded text-left border transition text-xs flex items-center justify-between ${
                        draftStatus === st.id
                          ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      } ${!canSelectSupplier ? 'cursor-not-allowed opacity-75' : ''}`}
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
                disabled={!canSelectSupplier || !hasReceivedGoods}
                onClick={() => {
                  if (!hasReceivedGoods) {
                    addToast('warning', 'Chỉ có thể đánh dấu trả/đổi hàng khi đã có phát sinh nhận hàng thực tế (Số lượng đã nhận > 0).');
                    return;
                  }
                  setIsReturnModalOpen(true);
                }}
                className={`px-2.5 py-1 border rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                  hasReceivedGoods && canSelectSupplier
                    ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100/80 cursor-pointer'
                    : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                }`}
                title={
                  !hasReceivedGoods
                    ? 'Chỉ khả dụng khi đã có nhận hàng thực tế'
                    : 'Đánh dấu ngoại lệ trả/đổi hàng'
                }
              >
                <RotateCcw className="w-3 h-3" />
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
            className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded text-slate-700 bg-white hover:bg-slate-100 transition cursor-pointer"
          >
            Hủy
          </button>

          <div className="flex items-center gap-2">
            {isExceptionActive && (
              <span className="text-[11px] text-rose-600 italic mr-1">
                Quy trình kết thúc trả / đổi hàng chưa được chốt trong SPEC.
              </span>
            )}
            {isSupplierLocked ? (
              <button
                type="button"
                disabled={!canSelectSupplier}
                onClick={handleSavePriceOnly}
                className={`px-5 py-2 text-xs font-bold rounded shadow-2xs transition flex items-center gap-1.5 ${
                  canSelectSupplier
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
                title={
                  !canSelectSupplier
                    ? 'Bạn không có quyền chỉnh sửa đơn giá chốt'
                    : 'Lưu giá mua thực tế (Đơn giá chốt)'
                }
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu giá mua thực tế</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={!canSelectSupplier || isExceptionActive}
                onClick={handleConfirmClick}
                className={`px-5 py-2 text-xs font-bold rounded shadow-2xs transition flex items-center gap-1.5 ${
                  canSelectSupplier && !isExceptionActive
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
                title={
                  isExceptionActive
                    ? 'Quy trình kết thúc trả / đổi hàng chưa được chốt trong SPEC.'
                    : !canSelectSupplier
                    ? 'Bạn không có quyền chọn Nhà cung cấp'
                    : 'Xác nhận Nhà cung cấp & Giá chốt'
                }
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận NCC & Giá</span>
              </button>
            )}
          </div>
        </div>

        {/* --- MODAL 1: REPLACEMENT CONFIRMATION --- */}
        {isReplacementModalOpen && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Xác nhận thay đổi Nhà cung cấp</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mục BOM này đã có Nhà cung cấp và Đơn giá chốt trước đó. Bạn có chắc chắn muốn thay đổi?
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Nhà cung cấp:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="text-slate-500 line-through">{currentPersistedSupplier?.name || '—'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-blue-700">{selectedSupplier?.name || '—'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Đơn giá chốt:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="text-slate-500 line-through">{formatCurrency(bomItem.finalUnitPrice)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-blue-700">{formatCurrency(Number(draftFinalUnitPrice))}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Trạng thái:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="text-slate-500">{currentProcurementStatusDisplay}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-blue-700">{getStatusLabel(draftStatus)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReplacementModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded text-slate-700 bg-white hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={executeSaveDecision}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs transition cursor-pointer"
                >
                  Xác nhận thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL 2: RETURN / EXCHANGE CONFIRMATION --- */}
        {isReturnModalOpen && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Xác nhận đánh dấu Trả / Đổi hàng</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ghi nhận trạng thái ngoại lệ trả / đổi hàng cho mục BOM này.
                  </p>
                </div>
              </div>

              <div className="bg-rose-50/50 rounded-lg p-3 border border-rose-200 text-xs space-y-1.5 text-slate-700">
                <p>
                  <strong>Vật tư:</strong> {manufacturer?.name} | {material.model}
                </p>
                <p>
                  <strong>Số lượng thực tế đã nhận:</strong>{' '}
                  <span className="font-bold text-rose-700">
                    {formatQuantity(bomItem.projectReceivedQty)} {uom?.code}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  * Thao tác này chỉ chuyển trạng thái BOM sang "Đang trả hàng / đổi hàng" như một chỉ dấu ngoại lệ. Thao tác không làm thay đổi số lượng kho hay phát sinh phiếu xuất/nhập mới.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Ghi chú lý do trả / đổi hàng (Tùy chọn):
                </label>
                <textarea
                  rows={3}
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  placeholder="Nhập lý do trả hàng, đổi model hoặc thỏa thuận với NCC..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs text-slate-900 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded text-slate-700 bg-white hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturnExchange}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-2xs transition cursor-pointer"
                >
                  Xác nhận đánh dấu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
