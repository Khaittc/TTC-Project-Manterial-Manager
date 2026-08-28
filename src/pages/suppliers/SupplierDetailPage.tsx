import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Truck,
  ArrowLeft,
  Pencil,
  Plus,
  FileText,
  Boxes,
  Receipt,
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionIconBtn } from '../../components/common/ActionIconBtn';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatDate, calculatePriceDelta } from '../../domain/mockRules';

export const SupplierDetailPage: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { suppliers, materials, prices, invoices, projects } = useApp();

  const supplier = suppliers.find((s) => s.id === supplierId);
  const [activeTab, setActiveTab] = useState<'info' | 'prices' | 'invoices'>('info');

  const supplierPrices = useMemo(() => {
    return prices.filter((p) => p.supplierId === supplier?.id);
  }, [prices, supplier?.id]);

  const supplierInvoices = useMemo(() => {
    return invoices.filter((i) => i.supplierId === supplier?.id);
  }, [invoices, supplier?.id]);

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
          <span>Bảng giá vật tư ({supplierPrices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'invoices'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Hóa đơn đã xuất ({supplierInvoices.length})</span>
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
            <div>
              <span className="text-slate-500 block mb-1">Người liên hệ:</span>
              <span className="font-medium text-slate-800">{supplier.contactPerson || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Số điện thoại:</span>
              <span className="font-medium text-slate-800">{supplier.phone || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Email:</span>
              <span className="font-medium text-slate-800">{supplier.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Trạng thái:</span>
              <StatusBadge status={supplier.status} type="master" />
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block mb-1">Địa chỉ trụ sở:</span>
              <span className="font-medium text-slate-800">{supplier.address}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BẢNG GIÁ THEO NCC */}
      {activeTab === 'prices' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Mã VT</th>
                  <th className="px-4 py-3">Tên vật tư</th>
                  <th className="px-4 py-3 text-right">Đơn giá hiện tại (VNĐ)</th>
                  <th className="px-4 py-3 text-right">Giá trước đó</th>
                  <th className="px-4 py-3 text-center">Biến động</th>
                  <th className="px-4 py-3">Ngày hiệu lực</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {supplierPrices.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        title="Chưa có bảng giá cho nhà cung cấp này"
                        description="Mở chi tiết vật tư để gán đơn giá của nhà cung cấp."
                      />
                    </td>
                  </tr>
                ) : (
                  supplierPrices.map((p) => {
                    const mat = materials.find((m) => m.id === p.materialId);
                    const delta = calculatePriceDelta(p.currentPrice, p.previousPrice);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-bold text-slate-900 font-mono">{mat?.code}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{mat?.name}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
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
                        <td className="px-4 py-3 text-slate-600">{formatDate(p.effectiveDate)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HÓA ĐƠN NCC */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Số hóa đơn</th>
                  <th className="px-4 py-3">Dự án liên quan</th>
                  <th className="px-4 py-3">Ngày phát hành</th>
                  <th className="px-4 py-3 text-right">Tổng tiền VAT</th>
                  <th className="px-4 py-3 text-center">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {supplierInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="Chưa có hóa đơn nào từ nhà cung cấp này"
                        description="Hóa đơn sẽ hiển thị khi được nhập vào hệ thống."
                      />
                    </td>
                  </tr>
                ) : (
                  supplierInvoices.map((inv) => {
                    const prj = projects.find((p) => p.id === inv.projectId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {prj ? `${prj.code} — ${prj.name}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={inv.invoiceStatus} type="invoice" />
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
    </div>
  );
};
