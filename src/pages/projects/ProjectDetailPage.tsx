import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Pencil,
  Save,
  X,
  Layers,
  LayoutDashboard,
  ArrowDownToLine,
  Receipt,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FormField } from '../../components/forms/FormField';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { SpecBadge } from '../../components/common/SpecBadge';
import { formatDate } from '../../domain/mockRules';
import { Project, ProjectStatus } from '../../domain/types';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    projects,
    customers,
    saveProject,
    addToast,
    canDo,
  } = useApp();

  // Active Project
  const project = useMemo(() => {
    return projects.find((p) => p.id === projectId) || projects[0];
  }, [projects, projectId]);

  const customer = customers.find((c) => c.id === project?.customerId);

  // Exactly 4 Tabs in exact order: 1. Tổng quan, 2. BOM & Nhà cung cấp, 3. Nhận hàng, 4. Hóa đơn
  // Default tab: 'overview' (Tổng quan)
  const [activeTab, setActiveTab] = useState<'overview' | 'bom' | 'receiving' | 'invoices'>('overview');

  // Edit Project Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Project>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Gated action: project.edit permission
  const canEditProject = canDo('project', 'edit');

  useEffect(() => {
    if (project) {
      setEditFormData({ ...project });
    }
  }, [project]);

  const handleOpenEditProject = () => {
    if (!canEditProject) {
      addToast('error', 'Bạn không có quyền chỉnh sửa thông tin dự án.');
      return;
    }
    if (project) {
      setEditFormData({ ...project });
      setFormError(null);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editFormData.name?.trim()) {
      setFormError('Tên dự án không được để trống.');
      return;
    }

    if (!editFormData.customerId) {
      setFormError('Vui lòng chọn khách hàng.');
      return;
    }

    const res = saveProject(editFormData);
    if (res.success) {
      addToast('success', 'Cập nhật thông tin dự án thành công.');
      setIsEditModalOpen(false);
    } else {
      setFormError(res.message || 'Không thể lưu dự án.');
    }
  };

  if (!project) {
    return <EmptyState title="Không tìm thấy dự án" description="Vui lòng kiểm tra lại liên kết hoặc chọn dự án khác." />;
  }

  return (
    <div className="space-y-4">
      {/* Persistent Project Header */}
      <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-blue-50 text-blue-600">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={project.id}
                onChange={(e) => navigate(`/projects/${e.target.value}`)}
                className="text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none cursor-pointer pr-4"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
              <StatusBadge status={project.status} type="project" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Khách hàng: <span className="font-semibold text-slate-700">{customer?.name || '—'}</span> | Ngày bắt đầu:{' '}
              <span className="font-semibold text-slate-700">{formatDate(project.startDate)}</span>
            </p>
          </div>
        </div>

        {/* Global action on project */}
        <div className="flex items-center gap-2">
          {canEditProject && (
            <button
              type="button"
              onClick={handleOpenEditProject}
              className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Chỉnh sửa dự án</span>
            </button>
          )}
        </div>
      </div>

      {/* Exactly 4 Tabs in exact order: 1. Tổng quan, 2. BOM & Nhà cung cấp, 3. Nhận hàng, 4. Hóa đơn */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 rounded-t-lg">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Tổng quan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bom')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'bom'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>BOM & Nhà cung cấp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receiving')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'receiving'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Nhận hàng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Hóa đơn</span>
        </button>
      </div>

      {/* TAB 1: TỔNG QUAN */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xs text-center space-y-3">
          <LayoutDashboard className="w-10 h-10 text-blue-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Nội dung Tổng quan dự án sẽ được hoàn thiện trong bước REQ-04B.
          </p>
          <p className="text-xs text-slate-500">
            Khu vực hiển thị tổng quan KPI, tiến độ vật tư và danh sách việc cần xử lý của dự án.
          </p>
        </div>
      )}

      {/* TAB 2: BOM & NHÀ CUNG CẤP */}
      {activeTab === 'bom' && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xs text-center space-y-3">
          <Layers className="w-10 h-10 text-blue-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Nội dung BOM & Nhà cung cấp sẽ được hoàn thiện trong bước REQ-04C/04D.
          </p>
          <p className="text-xs text-slate-500">
            Khu vực quản lý danh mục BOM dự án, so sánh đơn giá và lựa chọn nhà cung cấp.
          </p>
        </div>
      )}

      {/* TAB 3: NHẬN HÀNG */}
      {activeTab === 'receiving' && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xs text-center space-y-3">
          <ArrowDownToLine className="w-10 h-10 text-blue-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Luồng Nhận hàng sẽ được hoàn thiện ở bước Receiving tiếp theo.
          </p>
          <p className="text-xs text-slate-500">
            Quy trình nhận hàng và phân bổ số lượng cho dự án / kho.
          </p>
        </div>
      )}

      {/* TAB 4: HÓA ĐƠN */}
      {activeTab === 'invoices' && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xs text-center space-y-3">
          <Receipt className="w-10 h-10 text-blue-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Luồng Hóa đơn sẽ được hoàn thiện ở bước Invoice tiếp theo.
          </p>
          <p className="text-xs text-slate-500">
            Theo dõi trạng thái chứng từ và hóa đơn nhà cung cấp cho dự án.
          </p>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Chỉnh sửa dự án</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject}>
              <div className="p-5 space-y-3.5 text-xs">
                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                    {formError}
                  </div>
                )}

                <FormField label="Mã dự án" required>
                  <input
                    type="text"
                    disabled
                    value={editFormData.code || ''}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-slate-100 font-bold text-slate-700 cursor-not-allowed"
                  />
                </FormField>

                <FormField label="Tên dự án" required>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    placeholder="VD: Nâng cấp biến tần trạm bơm"
                  />
                </FormField>

                <FormField label="Khách hàng" required>
                  <select
                    value={editFormData.customerId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, customerId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Ngày bắt đầu">
                    <input
                      type="date"
                      value={editFormData.startDate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </FormField>

                  <FormField label="Trạng thái">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={editFormData.status || 'IN_PROGRESS'}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as ProjectStatus })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="IN_PROGRESS">Đang thực hiện</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="ON_HOLD">Tạm dừng</option>
                        <option value="ATTENTION_NEEDED">Cần chú ý</option>
                      </select>
                      <SpecBadge />
                    </div>
                  </FormField>
                </div>

                <FormField label="Mô tả / Ghi chú">
                  <textarea
                    rows={3}
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    placeholder="Thông tin tiến độ, kỹ sư phụ trách, đặc thù công trình..."
                  />
                </FormField>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
