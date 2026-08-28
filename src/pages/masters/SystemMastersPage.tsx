import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Building2,
  Tags,
  Ruler,
  Factory,
  Truck,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Save,
  X,
  AlertTriangle,
  ChevronRight,
  FolderTree,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SearchInput } from '../../components/forms/SearchInput';
import { SelectDropdown } from '../../components/forms/SelectDropdown';
import { FormField } from '../../components/forms/FormField';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ActionIconBtn } from '../../components/common/ActionIconBtn';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { SpecBadge } from '../../components/common/SpecBadge';
import { formatDate } from '../../domain/mockRules';
import { Customer, Project, Category, UnitOfMeasure, Manufacturer, Supplier, ProjectStatus } from '../../domain/types';

export const SystemMastersPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    customers,
    projects,
    categories,
    uoms,
    manufacturers,
    suppliers,
    saveCustomer,
    deleteCustomer,
    saveProject,
    deleteProject,
    saveCategory,
    deleteCategory,
    saveUOM,
    deleteUOM,
    saveManufacturer,
    deleteManufacturer,
    saveSupplier,
    deleteSupplier,
    canDo,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'projects' | 'customers' | 'categories' | 'uoms' | 'manufacturers' | 'suppliers'
  >('projects');

  // Common Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog & Modal states
  const [modalType, setModalType] = useState<
    'project' | 'customer' | 'category' | 'uom' | 'manufacturer' | 'supplier' | null
  >(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState<string | null>(null);

  // Confirmation Delete States
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'project' | 'customer' | 'category' | 'uom' | 'manufacturer' | 'supplier' | null;
    id: string | null;
    title: string;
    message: string;
    warningNote?: string;
    isBlocked?: boolean;
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: '',
    message: '',
  });

  // Category view selection for hierarchical tree
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('CAT-PLC');

  // --- Handlers for Form Modals ---
  const handleOpenCreate = (type: typeof modalType) => {
    setModalType(type);
    setModalMode('create');
    setFormError(null);
    if (type === 'project') {
      setEditingItem({ code: '', name: '', customerId: customers[0]?.id || '', startDate: new Date().toISOString().split('T')[0], status: 'IN_PROGRESS', notes: '' });
    } else if (type === 'customer') {
      setEditingItem({ code: '', name: '', address: '' });
    } else if (type === 'category') {
      setEditingItem({ name: '', parentId: '', status: 'ACTIVE' });
    } else if (type === 'uom') {
      setEditingItem({ code: '', status: 'ACTIVE' });
    } else if (type === 'manufacturer') {
      setEditingItem({ code: '', name: '', status: 'ACTIVE' });
    } else if (type === 'supplier') {
      setEditingItem({ taxCode: '', name: '', address: '', status: 'ACTIVE', contactPerson: '', phone: '', email: '' });
    }
  };

  const handleOpenEdit = (type: typeof modalType, item: any) => {
    setModalType(type);
    setModalMode('edit');
    setFormError(null);
    setEditingItem({ ...item });
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let res: { success: boolean; message?: string } = { success: false };

    if (modalType === 'project') {
      res = saveProject(editingItem);
    } else if (modalType === 'customer') {
      res = saveCustomer(editingItem);
    } else if (modalType === 'category') {
      res = saveCategory(editingItem);
    } else if (modalType === 'uom') {
      res = saveUOM(editingItem);
    } else if (modalType === 'manufacturer') {
      res = saveManufacturer(editingItem);
    } else if (modalType === 'supplier') {
      res = saveSupplier(editingItem);
    }

    if (res.success) {
      setModalType(null);
      setEditingItem(null);
    } else {
      setFormError(res.message || 'Đã có lỗi xảy ra.');
    }
  };

  // --- Handlers for Deletion ---
  const handleRequestDelete = (
    type: 'project' | 'customer' | 'category' | 'uom' | 'manufacturer' | 'supplier',
    item: any
  ) => {
    if (type === 'project') {
      setDeleteConfirm({
        isOpen: true,
        type: 'project',
        id: item.id,
        title: `Xác nhận xóa dự án: ${item.code}`,
        message: 'Điều kiện xóa dự án chưa được khóa trong Final SPEC. Thao tác này chỉ là mô phỏng UI.',
        warningNote: 'Dữ liệu BOM và hóa đơn liên quan sẽ được gỡ bỏ trong phiên demo.',
        isBlocked: false,
      });
    } else if (type === 'customer') {
      const res = deleteCustomer(item.id);
      if (!res.success) {
        setDeleteConfirm({
          isOpen: true,
          type: 'customer',
          id: item.id,
          title: 'Không thể xóa khách hàng',
          message: res.message || 'Khách hàng đang được tham chiếu.',
          isBlocked: true,
        });
      }
    } else if (type === 'category') {
      const res = deleteCategory(item.id);
      if (!res.success) {
        setDeleteConfirm({
          isOpen: true,
          type: 'category',
          id: item.id,
          title: 'Không thể xóa nhóm vật tư',
          message: res.message || 'Nhóm vật tư đang được tham chiếu.',
          isBlocked: true,
        });
      }
    } else if (type === 'uom') {
      const res = deleteUOM(item.id);
      if (!res.success) {
        setDeleteConfirm({
          isOpen: true,
          type: 'uom',
          id: item.id,
          title: 'Không thể xóa đơn vị tính',
          message: res.message || 'Đơn vị tính đang được tham chiếu bởi Vật tư.',
          isBlocked: true,
        });
      }
    } else if (type === 'manufacturer') {
      const res = deleteManufacturer(item.id);
      if (!res.success) {
        setDeleteConfirm({
          isOpen: true,
          type: 'manufacturer',
          id: item.id,
          title: 'Không thể xóa hãng sản xuất',
          message: res.message || 'Hãng sản xuất đang được tham chiếu.',
          isBlocked: true,
        });
      }
    } else if (type === 'supplier') {
      const res = deleteSupplier(item.id);
      if (!res.success) {
        setDeleteConfirm({
          isOpen: true,
          type: 'supplier',
          id: item.id,
          title: 'Không thể xóa nhà cung cấp',
          message: res.message || 'Nhà cung cấp đang có ràng buộc trong hệ thống.',
          isBlocked: true,
        });
      }
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === 'project' && deleteConfirm.id) {
      deleteProject(deleteConfirm.id);
    }
    setDeleteConfirm({ isOpen: false, type: null, id: null, title: '', message: '' });
  };

  // --- Filtering Datasets ---
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const customer = customers.find((c) => c.id === p.customerId);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        p.code?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        customer?.name?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, customers, searchQuery, statusFilter]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        searchQuery === '' ||
        c.code?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const filteredUOMs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return uoms.filter((u) => searchQuery === '' || u.code?.toLowerCase().includes(q));
  }, [uoms, searchQuery]);

  const filteredManufacturers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return manufacturers.filter(
      (m) =>
        searchQuery === '' ||
        m.code?.toLowerCase().includes(q) ||
        m.name?.toLowerCase().includes(q)
    );
  }, [manufacturers, searchQuery]);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return suppliers.filter(
      (s) =>
        searchQuery === '' ||
        s.taxCode?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
    );
  }, [suppliers, searchQuery]);

  // Hierarchical category structure
  const parentCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const selectedCategory = useMemo(() => categories.find((c) => c.id === selectedCategoryId) || categories[0], [categories, selectedCategoryId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Danh mục hệ thống</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý dữ liệu Master Data danh mục: Dự án, Khách hàng, Nhóm vật tư, ĐVT, Hãng SX & Nhà cung cấp
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 rounded-t-lg overflow-x-auto">
        <button
          type="button"
          onClick={() => { setActiveTab('projects'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'projects'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Dự án ({projects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('customers'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'customers'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Khách hàng ({customers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tags className="w-4 h-4" />
          <span>Nhóm vật tư ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('uoms'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'uoms'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span>Đơn vị tính ({uoms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('manufacturers'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'manufacturers'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Hãng sản xuất ({manufacturers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'suppliers'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Nhà cung cấp ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: DỰ ÁN */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Tìm theo mã / tên dự án..."
                className="w-72"
              />
              <SelectDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Tất cả trạng thái"
                options={[
                  { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
                  { value: 'COMPLETED', label: 'Hoàn thành' },
                  { value: 'ON_HOLD', label: 'Tạm dừng' },
                  { value: 'ATTENTION_NEEDED', label: 'Cần chú ý' },
                ]}
              />
            </div>
            <button
              type="button"
              onClick={() => handleOpenCreate('project')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm dự án</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Mã dự án</th>
                  <th className="px-4 py-3">Tên dự án</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Ngày bắt đầu</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredProjects.map((p) => {
                  const cust = customers.find((c) => c.id === p.customerId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{p.code}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-slate-600">{cust?.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(p.startDate)}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={p.status} type="project" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ActionIconBtn
                            icon={Eye}
                            label="Xem chi tiết dự án"
                            variant="primary"
                            onClick={() => navigate(`/projects/${p.id}`)}
                          />
                          <ActionIconBtn
                            icon={Pencil}
                            label="Sửa dự án"
                            onClick={() => handleOpenEdit('project', p)}
                          />
                          <ActionIconBtn
                            icon={Trash2}
                            label="Xóa dự án (Mô phỏng)"
                            variant="danger"
                            onClick={() => handleRequestDelete('project', p)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: KHÁCH HÀNG */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm theo mã / tên khách hàng..."
              className="w-72"
            />
            <button
              type="button"
              onClick={() => handleOpenCreate('customer')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm khách hàng</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 w-28">Mã KH</th>
                  <th className="px-4 py-3">Tên khách hàng</th>
                  <th className="px-4 py-3">Địa chỉ</th>
                  <th className="px-4 py-3 text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{c.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.address}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionIconBtn
                          icon={Pencil}
                          label="Sửa khách hàng"
                          onClick={() => handleOpenEdit('customer', c)}
                        />
                        <ActionIconBtn
                          icon={Trash2}
                          label="Xóa khách hàng"
                          variant="danger"
                          onClick={() => handleRequestDelete('customer', c)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: NHÓM VẬT TƯ (Hierarchical Tree + Detail View) */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm nhóm vật tư..."
              className="w-72"
            />
            <button
              type="button"
              onClick={() => handleOpenCreate('category')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm nhóm</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left: Category Tree */}
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 font-bold text-xs text-slate-900">
                <FolderTree className="w-4 h-4 text-blue-600" />
                <span>Cây danh mục phân cấp</span>
              </div>

              <div className="space-y-2">
                {parentCategories.map((parent) => {
                  const children = categories.filter((c) => c.parentId === parent.id);
                  const isParentSelected = selectedCategoryId === parent.id;

                  return (
                    <div key={parent.id} className="space-y-1">
                      <div
                        onClick={() => setSelectedCategoryId(parent.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer text-xs font-bold transition ${
                          isParentSelected
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
                          <span>{parent.name}</span>
                        </div>
                        <StatusBadge status={parent.status} type="master" />
                      </div>

                      {/* Sub items */}
                      <div className="pl-6 space-y-1 border-l-2 border-slate-200 ml-3">
                        {children.map((child) => {
                          const isChildSelected = selectedCategoryId === child.id;
                          return (
                            <div
                              key={child.id}
                              onClick={() => setSelectedCategoryId(child.id)}
                              className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer text-xs font-medium transition ${
                                isChildSelected
                                  ? 'bg-blue-100 text-blue-800 font-semibold'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">└</span>
                                <span>{child.name}</span>
                              </div>
                              <StatusBadge status={child.status} type="master" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Category Detail */}
            <div className="md:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
              {selectedCategory ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Chi tiết nhóm vật tư
                      </span>
                      <h2 className="text-base font-bold text-slate-900">{selectedCategory.name}</h2>
                    </div>
                    <div className="flex items-center gap-1">
                      <ActionIconBtn
                        icon={Pencil}
                        label="Sửa nhóm"
                        onClick={() => handleOpenEdit('category', selectedCategory)}
                      />
                      <ActionIconBtn
                        icon={Trash2}
                        label="Xóa nhóm"
                        variant="danger"
                        onClick={() => handleRequestDelete('category', selectedCategory)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">Tên nhóm:</span>
                      <span className="font-semibold text-slate-900 text-sm">{selectedCategory.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Nhóm cha:</span>
                      <span className="font-semibold text-slate-800">
                        {categories.find((c) => c.id === selectedCategory.parentId)?.name || '— (Nhóm gốc)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Trạng thái:</span>
                      <StatusBadge status={selectedCategory.status} type="master" />
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState title="Chọn nhóm vật tư từ cây bên trái để xem chi tiết" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ĐƠN VỊ TÍNH (UOM) */}
      {activeTab === 'uoms' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm theo mã ĐVT..."
              className="w-72"
            />
            <button
              type="button"
              onClick={() => handleOpenCreate('uom')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm ĐVT</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden max-w-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Mã ĐVT</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredUOMs.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{u.code}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={u.status} type="master" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionIconBtn
                          icon={Pencil}
                          label="Sửa ĐVT"
                          onClick={() => handleOpenEdit('uom', u)}
                        />
                        <ActionIconBtn
                          icon={Trash2}
                          label="Xóa ĐVT"
                          variant="danger"
                          onClick={() => handleRequestDelete('uom', u)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: HÃNG SẢN XUẤT */}
      {activeTab === 'manufacturers' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm theo mã / tên hãng..."
              className="w-72"
            />
            <button
              type="button"
              onClick={() => handleOpenCreate('manufacturer')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm hãng</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 w-32">Mã hãng</th>
                  <th className="px-4 py-3">Tên hãng sản xuất</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredManufacturers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{m.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{m.name}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={m.status} type="master" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionIconBtn
                          icon={Pencil}
                          label="Sửa hãng"
                          onClick={() => handleOpenEdit('manufacturer', m)}
                        />
                        <ActionIconBtn
                          icon={Trash2}
                          label="Xóa hãng"
                          variant="danger"
                          onClick={() => handleRequestDelete('manufacturer', m)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: NHÀ CUNG CẤP */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm theo Mã số thuế / Tên NCC..."
              className="w-72"
            />
            <button
              type="button"
              onClick={() => handleOpenCreate('supplier')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm NCC</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 w-32">Mã số thuế</th>
                  <th className="px-4 py-3">Tên nhà cung cấp</th>
                  <th className="px-4 py-3">Địa chỉ</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{s.taxCode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.address}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={s.status} type="master" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionIconBtn
                          icon={Eye}
                          label="Xem chi tiết Nhà cung cấp & Bảng giá"
                          variant="primary"
                          onClick={() => navigate(`/suppliers/${s.id}`)}
                        />
                        <ActionIconBtn
                          icon={Pencil}
                          label="Sửa NCC"
                          onClick={() => handleOpenEdit('supplier', s)}
                        />
                        <ActionIconBtn
                          icon={Trash2}
                          label="Xóa NCC"
                          variant="danger"
                          onClick={() => handleRequestDelete('supplier', s)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CRUD MODAL --- */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {modalMode === 'create' ? 'Thêm mới' : 'Chỉnh sửa'}{' '}
                {modalType === 'project'
                  ? 'Dự án'
                  : modalType === 'customer'
                  ? 'Khách hàng'
                  : modalType === 'category'
                  ? 'Nhóm vật tư'
                  : modalType === 'uom'
                  ? 'Đơn vị tính'
                  : modalType === 'manufacturer'
                  ? 'Hãng sản xuất'
                  : 'Nhà cung cấp'}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="p-5 space-y-3.5 text-xs">
                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                    {formError}
                  </div>
                )}

                {/* Project Form */}
                {modalType === 'project' && (
                  <>
                    <FormField label="Mã dự án" required>
                      <input
                        type="text"
                        required
                        value={editingItem.code || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        placeholder="VD: PRJ-004"
                      />
                    </FormField>

                    <FormField label="Tên dự án" required>
                      <input
                        type="text"
                        required
                        value={editingItem.name || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        placeholder="VD: Nâng cấp biến tần trạm bơm"
                      />
                    </FormField>

                    <FormField label="Khách hàng" required>
                      <select
                        value={editingItem.customerId || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, customerId: e.target.value })}
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
                          value={editingItem.startDate || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, startDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </FormField>

                      <FormField label="Trạng thái">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={editingItem.status || 'IN_PROGRESS'}
                            onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
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
                        rows={2}
                        value={editingItem.notes || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </FormField>
                  </>
                )}

                {/* Customer Form */}
                {modalType === 'customer' && (
                  <>
                    <FormField label="Mã khách hàng" required>
                      <input
                        type="text"
                        required
                        value={editingItem.code || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        placeholder="VD: KH004"
                      />
                    </FormField>

                    <FormField label="Tên khách hàng" required>
                      <input
                        type="text"
                        required
                        value={editingItem.name || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        placeholder="Tên đầy đủ theo pháp nhân công ty"
                      />
                    </FormField>

                    <FormField label="Địa chỉ">
                      <input
                        type="text"
                        value={editingItem.address || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </FormField>
                  </>
                )}

                {/* Category Form */}
                {modalType === 'category' && (
                  <>
                    <FormField label="Tên nhóm vật tư" required>
                      <input
                        type="text"
                        required
                        value={editingItem.name || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        placeholder="VD: Inverter / Sensor"
                      />
                    </FormField>

                    <FormField label="Nhóm cha (để trống nếu là nhóm gốc)">
                      <select
                        value={editingItem.parentId || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, parentId: e.target.value || null })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="">— Không có (Nhóm gốc cấp 1) —</option>
                        {categories
                          .filter((c) => !c.parentId && c.id !== editingItem.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </FormField>

                    <FormField label="Trạng thái">
                      <select
                        value={editingItem.status || 'ACTIVE'}
                        onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="INACTIVE">Ngưng hoạt động</option>
                      </select>
                    </FormField>
                  </>
                )}

                {/* UOM Form */}
                {modalType === 'uom' && (
                  <>
                    <FormField label="Mã ĐVT" required helperText="Chỉ dùng ký hiệu viết tắt (pcs, m, set, cuộn...)">
                      <input
                        type="text"
                        required
                        value={editingItem.code || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        placeholder="pcs / m / set / pack"
                      />
                    </FormField>

                    <FormField label="Trạng thái">
                      <select
                        value={editingItem.status || 'ACTIVE'}
                        onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="INACTIVE">Ngưng hoạt động</option>
                      </select>
                    </FormField>
                  </>
                )}

                {/* Manufacturer Form */}
                {modalType === 'manufacturer' && (
                  <>
                    <FormField label="Mã hãng" required>
                      <input
                        type="text"
                        required
                        value={editingItem.code || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        placeholder="VD: MFG-MITSUBISHI"
                      />
                    </FormField>

                    <FormField label="Tên hãng sản xuất" required>
                      <input
                        type="text"
                        required
                        value={editingItem.name || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        placeholder="VD: Mitsubishi Electric"
                      />
                    </FormField>

                    <FormField label="Trạng thái">
                      <select
                        value={editingItem.status || 'ACTIVE'}
                        onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="INACTIVE">Ngưng hoạt động</option>
                      </select>
                    </FormField>
                  </>
                )}

                {/* Supplier Form */}
                {modalType === 'supplier' && (
                  <>
                    <FormField label="Mã số thuế (MST)" required>
                      <input
                        type="text"
                        required
                        value={editingItem.taxCode || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, taxCode: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        placeholder="VD: 0312345678"
                      />
                    </FormField>

                    <FormField label="Tên nhà cung cấp" required>
                      <input
                        type="text"
                        required
                        value={editingItem.name || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        placeholder="VD: Công ty TNHH Thiết Bị Điện ABC"
                      />
                    </FormField>

                    <FormField label="Địa chỉ">
                      <input
                        type="text"
                        value={editingItem.address || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Người liên hệ">
                        <input
                          type="text"
                          value={editingItem.contactPerson || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, contactPerson: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </FormField>

                      <FormField label="Số điện thoại">
                        <input
                          type="text"
                          value={editingItem.phone || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </FormField>
                    </div>

                    <FormField label="Trạng thái">
                      <select
                        value={editingItem.status || 'ACTIVE'}
                        onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="INACTIVE">Ngưng hoạt động</option>
                      </select>
                    </FormField>
                  </>
                )}
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thông tin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation / Blocked Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        warningNote={deleteConfirm.warningNote}
        isBlocked={deleteConfirm.isBlocked}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: null, id: null, title: '', message: '' })}
      />
    </div>
  );
};
