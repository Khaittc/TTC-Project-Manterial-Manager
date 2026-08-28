import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, RotateCcw, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SearchInput } from '../../components/forms/SearchInput';
import { SelectDropdown } from '../../components/forms/SelectDropdown';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionIconBtn } from '../../components/common/ActionIconBtn';
import { EmptyState } from '../../components/common/EmptyState';

export const MonitoringPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, customers, boms, invoices } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');

  // Calculate project aggregate metrics
  const projectMetrics = useMemo(() => {
    return projects.map((p) => {
      const customer = customers.find((c) => c.id === p.customerId);
      const projectBOMs = boms.filter((b) => b.projectId === p.id);
      const projectInvoices = invoices.filter((i) => i.projectId === p.id);

      const totalMaterials = projectBOMs.length;
      const notPurchased = projectBOMs.filter((b) => b.status === 'NOT_PURCHASED').length;
      const purchasing = projectBOMs.filter((b) => b.status === 'PURCHASING').length;
      const partiallyReceived = projectBOMs.filter((b) => b.status === 'PARTIALLY_RECEIVED').length;
      const fulfilled = projectBOMs.filter((b) => b.status === 'FULFILLED').length;
      const missingInvoices = projectInvoices.filter((i) => i.invoiceStatus === 'NOT_AVAILABLE').length;

      return {
        ...p,
        customerName: customer?.name || '—',
        totalMaterials,
        notPurchased,
        purchasing,
        partiallyReceived,
        fulfilled,
        missingInvoices,
      };
    });
  }, [projects, customers, boms, invoices]);

  // Filtered list
  const filteredProjects = useMemo(() => {
    return projectMetrics.filter((p) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.code?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.customerName?.toLowerCase().includes(q);

      // Status
      const matchesStatus = !statusFilter || p.status === statusFilter;

      // Material condition filter
      let matchesMaterial = true;
      if (materialFilter === 'NOT_PURCHASED') matchesMaterial = p.notPurchased > 0;
      else if (materialFilter === 'PURCHASING') matchesMaterial = p.purchasing > 0;
      else if (materialFilter === 'PARTIALLY_RECEIVED') matchesMaterial = p.partiallyReceived > 0;
      else if (materialFilter === 'FULFILLED') matchesMaterial = p.fulfilled === p.totalMaterials;
      else if (materialFilter === 'MISSING_INVOICE') matchesMaterial = p.missingInvoices > 0;

      return matchesSearch && matchesStatus && matchesMaterial;
    });
  }, [projectMetrics, searchQuery, statusFilter, materialFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setMaterialFilter('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Giám sát vật tư dự án</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Cross-Project Overview
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng điều phối đa dự án theo dõi trạng thái mua hàng, nhận hàng và hóa đơn nhà cung cấp
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm theo mã dự án, tên dự án, khách hàng..."
            className="w-72"
          />

          <SelectDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Tất cả trạng thái DA"
            options={[
              { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
              { value: 'COMPLETED', label: 'Hoàn thành' },
              { value: 'ON_HOLD', label: 'Tạm dừng' },
              { value: 'ATTENTION_NEEDED', label: 'Cần chú ý' },
            ]}
          />

          <SelectDropdown
            value={materialFilter}
            onChange={setMaterialFilter}
            placeholder="Tình trạng vật tư..."
            options={[
              { value: 'NOT_PURCHASED', label: 'Có vật tư chưa mua' },
              { value: 'PURCHASING', label: 'Có vật tư đang mua' },
              { value: 'PARTIALLY_RECEIVED', label: 'Có vật tư nhận 1 phần' },
              { value: 'FULFILLED', label: 'Tất cả đã đủ' },
              { value: 'MISSING_INVOICE', label: 'Còn thiếu hóa đơn' },
            ]}
          />
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Cross-Project Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3 min-w-[220px]">Dự án</th>
                <th className="px-3 py-3 text-right">Tổng Material</th>
                <th className="px-3 py-3 text-right">Chưa mua</th>
                <th className="px-3 py-3 text-right">Đang mua</th>
                <th className="px-3 py-3 text-right">Nhận 1 phần</th>
                <th className="px-3 py-3 text-right">Đã đủ</th>
                <th className="px-3 py-3 text-right">Hóa đơn còn thiếu</th>
                <th className="px-4 py-3 text-center">Trạng thái DA</th>
                <th className="px-4 py-3 text-right w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      title="Không tìm thấy dự án phù hợp"
                      description="Vui lòng thử điều chỉnh lại bộ lọc tìm kiếm hoặc từ khóa."
                      actionText="Đặt lại bộ lọc"
                      onAction={handleResetFilters}
                    />
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-sm hover:text-blue-600">
                        {p.code} — {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Khách hàng: {p.customerName}</div>
                    </td>

                    <td className="px-3 py-3.5 text-right font-bold text-slate-900">{p.totalMaterials}</td>

                    <td className="px-3 py-3.5 text-right">
                      {p.notPurchased > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {p.notPurchased}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-right">
                      {p.purchasing > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                          {p.purchasing}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-right">
                      {p.partiallyReceived > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800">
                          {p.partiallyReceived}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-right">
                      {p.fulfilled > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
                          {p.fulfilled}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-right">
                      {p.missingInvoices > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {p.missingInvoices} NCC
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Đủ</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={p.status} type="project" />
                    </td>

                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <ActionIconBtn
                          icon={Eye}
                          label="Xem chi tiết dự án"
                          variant="primary"
                          onClick={() => navigate(`/projects/${p.id}`)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
