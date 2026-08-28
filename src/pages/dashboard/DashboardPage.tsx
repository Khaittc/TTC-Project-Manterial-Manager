import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { SpecBadge } from '../../components/common/SpecBadge';
import { calculatePriceDelta } from '../../domain/mockRules';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, boms, materials, prices, actionItems } = useApp();

  // 1. KPI Calculations
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;
  const attentionProjects = projects.filter((p) => p.status === 'ATTENTION_NEEDED').length;

  // 2. Chart 1 Data: Project Status
  const projectStatusData = [
    { name: 'Đang thực hiện', value: inProgressProjects, color: '#2563eb' },
    { name: 'Hoàn thành', value: completedProjects, color: '#10b981' },
    { name: 'Tạm dừng', value: projects.filter((p) => p.status === 'ON_HOLD').length, color: '#f59e0b' },
    { name: 'Cần chú ý', value: attentionProjects, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // 3. Chart 2 Data: Material Status across all BOMs
  const notPurchasedCount = boms.filter((b) => b.status === 'NOT_PURCHASED').length;
  const purchasingCount = boms.filter((b) => b.status === 'PURCHASING').length;
  const partialReceivedCount = boms.filter((b) => b.status === 'PARTIALLY_RECEIVED').length;
  const fulfilledCount = boms.filter((b) => b.status === 'FULFILLED').length;

  const bomStatusData = [
    { name: 'Chưa mua', count: notPurchasedCount, color: '#64748b' },
    { name: 'Đang mua', count: purchasingCount, color: '#3b82f6' },
    { name: 'Nhận 1 phần', count: partialReceivedCount, color: '#f59e0b' },
    { name: 'Đã đủ', count: fulfilledCount, color: '#10b981' },
  ];

  // 4. Chart 3 Data: Mock Warehouse Fluctuations (weekly)
  const warehouseFlowData = [
    { week: 'Tuần 1', stockIn: 120, stockOut: 45 },
    { week: 'Tuần 2', stockIn: 85, stockOut: 90 },
    { week: 'Tuần 3', stockIn: 210, stockOut: 130 },
    { week: 'Tuần 4', stockIn: 160, stockOut: 110 },
  ];

  // 5. Chart 4 Data: Supplier Price Trends
  let increasedCount = 0;
  let decreasedCount = 0;
  let unchangedCount = 0;
  let noPriceCount = 0;

  materials.forEach((mat) => {
    const matPrices = prices.filter((p) => p.materialId === mat.id);
    if (matPrices.length === 0) {
      noPriceCount++;
    } else {
      const preferred = matPrices.find((p) => p.isPreferred) || matPrices[0];
      const delta = calculatePriceDelta(preferred.currentPrice, preferred.previousPrice);
      if (delta.trend === 'INCREASED') increasedCount++;
      else if (delta.trend === 'DECREASED') decreasedCount++;
      else if (delta.trend === 'UNCHANGED') unchangedCount++;
      else noPriceCount++;
    }
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tổng quan điều hành</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Báo cáo giám sát tình trạng dự án, tiến độ cung ứng vật tư và biến động kho
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SpecBadge label="Operational Overview" tooltip="Bảng điều khiển vận hành tổng thể" />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tổng số dự án</span>
            <div className="p-2 rounded bg-slate-100 text-slate-700">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalProjects}</span>
            <span className="text-xs text-slate-500">dự án đang quản lý</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Đang thực hiện</span>
            <div className="p-2 rounded bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{inProgressProjects}</span>
            <span className="text-xs text-slate-500">tiến độ bình thường</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Đã hoàn thành</span>
            <div className="p-2 rounded bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{completedProjects}</span>
            <span className="text-xs text-slate-500">đã nghiệm thu xong</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Cần chú ý / Cảnh báo</span>
            <div className="p-2 rounded bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{attentionProjects + actionItems.length}</span>
            <span className="text-xs text-slate-500">vấn đề cần xử lý</span>
          </div>
        </div>
      </div>

      {/* 4 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tình trạng dự án */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tình trạng dự án</h2>
              <p className="text-[11px] text-slate-500">Phân bổ tiến độ các dự án trong hệ thống</p>
            </div>
            <SpecBadge tooltip="Trạng thái Project production chưa được chốt." />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '6px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tình trạng vật tư dự án */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tình trạng vật tư BOM</h2>
              <p className="text-[11px] text-slate-500">Số lượng vị trí vật tư theo chu kỳ mua & nhận</p>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Tổng: {boms.length} mục</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bomStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '6px' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {bomStatusData.map((entry, index) => (
                    <Cell key={`cell-bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Biến động kho */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Biến động nhập / xuất kho</h2>
              <p className="text-[11px] text-slate-500">Tổng sản lượng luân chuyển hàng tháng qua</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              Mock KPI
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={warehouseFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '6px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="stockIn" name="Nhập kho" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="stockOut" name="Xuất kho" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Biến động giá Supplier */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Biến động giá Nhà cung cấp</h2>
              <p className="text-[11px] text-slate-500">Xu hướng thay đổi đơn giá vật tư so với lần cập nhật trước</p>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Tổng: {materials.length} vật tư</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-center">
              <div className="flex items-center justify-center gap-1 text-rose-700 font-bold text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tăng giá</span>
              </div>
              <span className="text-2xl font-bold text-rose-700">{increasedCount}</span>
              <p className="text-[10px] text-rose-600 mt-0.5">Vật tư tăng giá</p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold text-xs mb-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Giảm giá</span>
              </div>
              <span className="text-2xl font-bold text-emerald-700">{decreasedCount}</span>
              <p className="text-[10px] text-emerald-600 mt-0.5">Tiết kiệm chi phí</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-center">
              <div className="flex items-center justify-center gap-1 text-slate-700 font-bold text-xs mb-1">
                <Minus className="w-3.5 h-3.5" />
                <span>Không đổi</span>
              </div>
              <span className="text-2xl font-bold text-slate-700">{unchangedCount}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Ổn định giá</p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-center">
              <div className="flex items-center justify-center gap-1 text-amber-800 font-bold text-xs mb-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Chưa có giá</span>
              </div>
              <span className="text-2xl font-bold text-amber-800">{noPriceCount}</span>
              <p className="text-[10px] text-amber-700 mt-0.5">Cần cập nhật</p>
            </div>
          </div>

          <div className="mt-4 p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Quản lý bảng giá tại Danh mục vật tư & Nhà cung cấp</span>
            <button
              type="button"
              onClick={() => navigate('/materials')}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-xs"
            >
              <span>Xem chi tiết giá</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Việc cần xử lý / Cảnh báo - Full Width */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">Việc cần xử lý / Cảnh báo vận hành</h2>
          </div>
          <span className="text-xs text-slate-500">{actionItems.length} cảnh báo đang chờ xử lý</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-2.5 w-24">Mức độ</th>
                <th className="px-4 py-2.5">Vấn đề cần xử lý</th>
                <th className="px-4 py-2.5">Dự án / Vật tư / Nhà cung cấp liên quan</th>
                <th className="px-4 py-2.5 text-right w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {actionItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.severity === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.severity === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {item.severity === 'HIGH' ? 'Cao' : item.severity === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{item.issue}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{item.targetName}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(item.linkTo)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
