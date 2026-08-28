import React, { useState } from 'react';
import { PackageCheck, AlertCircle, X, Check } from 'lucide-react';
import { ProjectBOMItem, Material, Supplier, Project, UnitOfMeasure } from '../../domain/types';

interface ReceivingModalProps {
  isOpen: boolean;
  bomItem: ProjectBOMItem | null;
  material: Material | null;
  supplier: Supplier | null;
  project: Project | null;
  uom: UnitOfMeasure | null;
  onClose: () => void;
  onConfirm: (data: {
    bomItemId: string;
    materialId: string;
    receivedQty: number;
    projectAllocation: number;
    warehouseAllocation: number;
  }) => void;
}

export const ReceivingModal: React.FC<ReceivingModalProps> = ({
  isOpen,
  bomItem,
  material,
  supplier,
  project,
  uom,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !bomItem || !material || !project) return null;

  const remaining = bomItem.remainingQty;
  const uomCode = uom?.code || 'pcs';

  const [receivedQty, setReceivedQty] = useState<number>(remaining > 0 ? remaining : 1);
  const [projectAlloc, setProjectAlloc] = useState<number>(remaining > 0 ? remaining : 0);
  const [warehouseAlloc, setWarehouseAlloc] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReceivedQtyChange = (val: number) => {
    const num = Math.max(0, val);
    setReceivedQty(num);
    // Auto suggest allocation to project up to remaining, rest to warehouse
    const toProject = Math.min(num, remaining);
    const toWarehouse = num - toProject;
    setProjectAlloc(toProject);
    setWarehouseAlloc(toWarehouse);
    setErrorMsg(null);
  };

  const handleProjectAllocChange = (val: number) => {
    const num = Math.max(0, val);
    setProjectAlloc(num);
    // adjust warehouse allocation
    if (num <= receivedQty) {
      setWarehouseAlloc(receivedQty - num);
    }
    setErrorMsg(null);
  };

  const handleWarehouseAllocChange = (val: number) => {
    const num = Math.max(0, val);
    setWarehouseAlloc(num);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations:
    if (receivedQty <= 0) {
      setErrorMsg('Số lượng thực nhận phải lớn hơn 0.');
      return;
    }

    if (projectAlloc + warehouseAlloc !== receivedQty) {
      setErrorMsg(
        `Tổng phân bổ (${projectAlloc + warehouseAlloc}) phải bằng đúng số lượng thực nhận (${receivedQty}).`
      );
      return;
    }

    if (projectAlloc > remaining) {
      setErrorMsg(
        `Phân bổ cho Dự án (${projectAlloc}) không được vượt quá số lượng còn thiếu (${remaining} ${uomCode}). Phần vượt cần phân bổ vào Nhập Kho.`
      );
      return;
    }

    onConfirm({
      bomItemId: bomItem.id,
      materialId: material.id,
      receivedQty,
      projectAllocation: projectAlloc,
      warehouseAllocation: warehouseAlloc,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-700">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Nhận hàng — {material.model}
              </h3>
              <p className="text-xs text-slate-500">{material.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 text-xs">
            {/* Meta info block */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block">Dự án:</span>
                <span className="font-semibold text-slate-800">{project.code} — {project.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Nhà cung cấp:</span>
                <span className="font-semibold text-slate-800">
                  {supplier ? supplier.name : 'Chưa chỉ định'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">SL BOM:</span>
                <span className="font-medium text-slate-800">{bomItem.bomQty} {uomCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Đã nhận cho Project:</span>
                <span className="font-medium text-slate-800">{bomItem.projectReceivedQty} {uomCode}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200 flex justify-between">
                <span className="text-amber-800 font-medium">Còn thiếu cho dự án:</span>
                <span className="font-bold text-amber-700 text-sm">
                  {remaining} {uomCode}
                </span>
              </div>
            </div>

            {/* Input Received Qty */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Số lượng thực nhận từ NCC *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={receivedQty ?? ''}
                  onChange={(e) => handleReceivedQtyChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                />
                <span className="text-slate-600 font-medium">{uomCode}</span>
              </div>
            </div>

            {/* Allocation Section */}
            <div className="border border-slate-200 rounded p-3 bg-blue-50/30 space-y-3">
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>Phân bổ số lượng nhận</span>
                <span className="text-slate-500 font-normal">
                  Tổng: {projectAlloc + warehouseAlloc} / {receivedQty} {uomCode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">
                    Cho Project ({project.code})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={remaining}
                    value={projectAlloc ?? ''}
                    onChange={(e) => handleProjectAllocChange(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Tối đa: {remaining} {uomCode}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">
                    Nhập Kho (Dư thừa)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={warehouseAlloc ?? ''}
                    onChange={(e) => handleWarehouseAllocChange(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Tăng tồn kho chung
                  </span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              Xác nhận nhận hàng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
