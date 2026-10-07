import React, { useState, useEffect, useCallback } from 'react';
import serviceApi from '../../api/serviceApi';
import { useIdleRefresh } from '../../utils/useIdleRefresh';

export default function ServiceManagement() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- STATE BỘ LỌC & PHÂN TRANG ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [page, setPage] = useState(1);
  const limit = 10;

  // --- STATE MODAL & FORM ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedService, setSelectedService] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const initialFormState = {
    name: '',
    code: '',
    description: '',
    unit_price: 0,
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Debounce từ khóa tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- HÀM TẢI DANH SÁCH DỊCH VỤ TỪ BACKEND ---
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        skip: (page - 1) * limit,
        limit: limit,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active';
      }

      // Gọi API serviceApi.getAll tương thích với backend /api/v1/services/
      const response = await serviceApi.getAll(params);
      setServices(response.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách dịch vụ:', err);
      setError(
        err.response?.data?.detail || 'Không thể tải danh sách dịch vụ. Vui lòng thử lại!'
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  // Tải dữ liệu lần đầu và khi bộ lọc thay đổi
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // --- TÍCH HỢP USEIDLEREFRESH ---
  // Tự động làm mới danh sách dịch vụ sau 5 phút không tương tác (Disabled khi đang mở Modal)
  const isAnyModalOpen = isModalOpen || deleteModalOpen;
  useIdleRefresh(fetchServices, 5 * 60 * 1000, isAnyModalOpen);

  // --- MỞ MODAL TẠO MỚI / CHỈNH SỬA ---
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedService(null);
    setFormData(initialFormState);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service) => {
    setModalMode('edit');
    setSelectedService(service);
    setFormData({
      name: service.name || '',
      code: service.code || '',
      description: service.description || '',
      unit_price: service.unit_price || 0,
      is_active: service.is_active ?? true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (service) => {
    setSelectedService(service);
    setDeleteModalOpen(true);
  };

  // --- VALIDATE FORM ---
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Tên dịch vụ không được để trống';
    if (!formData.code.trim()) errors.code = 'Mã dịch vụ không được để trống';
    if (formData.unit_price === '' || Number(formData.unit_price) < 0) {
      errors.unit_price = 'Đơn giá phải lớn hơn hoặc bằng 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- XỬ LÝ LƯU (CREATE / UPDATE) ---
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...formData,
        unit_price: parseFloat(formData.unit_price),
      };

      if (modalMode === 'create') {
        await serviceApi.create(payload);
        showSuccessAlert('Thêm mới dịch vụ thành công!');
      } else {
        await serviceApi.update(selectedService.id, payload);
        showSuccessAlert('Cập nhật thông tin dịch vụ thành công!');
      }

      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      console.error('Lỗi lưu dịch vụ:', err);
      const apiMsg = err.response?.data?.detail;
      setError(typeof apiMsg === 'string' ? apiMsg : 'Đã có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- BẬT / TẮT TRẠNG THÁI HOẠT ĐỘNG (TOGGLE STATUS) ---
  const handleToggleStatus = async (service) => {
    try {
      const newStatus = !service.is_active;
      await serviceApi.updateStatus(service.id, newStatus);
      showSuccessAlert(
        `Đã ${newStatus ? 'kích hoạt' : 'ngừng hoạt động'} dịch vụ "${service.name}".`
      );
      fetchServices();
    } catch (err) {
      console.error('Lỗi đổi trạng thái:', err);
      setError(err.response?.data?.detail || 'Không thể thay đổi trạng thái dịch vụ.');
    }
  };

  // --- XỬ LÝ XÓA DỊCH VỤ ---
  const handleDeleteService = async () => {
    if (!selectedService) return;
    setSubmitting(true);
    setError('');
    try {
      await serviceApi.delete(selectedService.id);
      showSuccessAlert(`Đã xóa dịch vụ "${selectedService.name}" thành công!`);
      setDeleteModalOpen(false);
      fetchServices();
    } catch (err) {
      console.error('Lỗi xóa dịch vụ:', err);
      // Hiển thị thông báo ràng buộc toàn vẹn từ backend (nếu dịch vụ đã thuộc hóa đơn)
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Không thể xóa dịch vụ này.');
      setDeleteModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper hiển thị thông báo thành công tạm thời
  const showSuccessAlert = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Helper định dạng Tiền tệ VNĐ
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  // Helper định dạng Ngày tháng
  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER TÊU ĐỀ & NÚT THÊM MỚI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🏷️</span> Quản lý Danh mục Dịch vụ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý thông tin, mã dịch vụ, đơn giá kinh doanh và trạng thái hoạt động hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchServices}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all flex items-center gap-2"
            title="Tải lại danh sách"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <span>➕</span> Thêm dịch vụ mới
          </button>
        </div>
      </div>

      {/* THÔNG BÁO ALERT (SUCCESS / ERROR) */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span> {successMsg}
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-xs font-bold hover:opacity-80">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
          <button onClick={() => setError('')} className="text-xs font-bold hover:opacity-80">✕</button>
        </div>
      )}

      {/* THANH BỘ LỌC TÌM KIẾM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
        <div className="md:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo Tên dịch vụ hoặc Mã dịch vụ..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang kinh doanh (Active)</option>
            <option value="inactive">Ngừng kinh doanh (Inactive)</option>
          </select>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU DỊCH VỤ */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700/80 text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">ID</th>
                <th className="py-3.5 px-4">Mã Dịch vụ</th>
                <th className="py-3.5 px-4 min-w-[100px] whitespace-nowrap">Tên Sản phẩm / Dịch vụ</th>
                <th className="py-3.5 px-4">Mô tả</th>
                <th className="py-3.5 px-4 text-right">Đơn giá</th>
                <th className="py-3.5 px-4 text-center min-w-[160px] whitespace-nowrap">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Ngày tạo</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tải dữ liệu dịch vụ từ máy chủ...</span>
                    </div>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📭</span>
                      <span>Không tìm thấy dịch vụ nào phù hợp.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                services.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-500">#{item.id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {item.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate" title={item.description}>
                      {item.description || '---'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-900 dark:text-emerald-400">
                      {formatVND(item.unit_price)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        title="Click để đổi trạng thái"
                        className="cursor-pointer transition-transform active:scale-95"
                      >
                        {item.is_active ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang kinh doanh
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20 whitespace-nowrap inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Tạm ngừng
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all"
                          title="Sửa thông tin"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(item)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all"
                          title="Xóa dịch vụ"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Hiển thị tối đa <strong className="font-semibold text-slate-800 dark:text-slate-200">{limit}</strong> bản ghi / trang
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              ◀ Trang trước
            </button>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md">
              Trang {page}
            </span>
            <button
              disabled={services.length < limit || loading}
              onClick={() => setPage((prev) => prev + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              Trang sau ▶
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL THÊM MỚI / CHỈNH SỬA DỊCH VỤ --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>{modalMode === 'create' ? '➕ Thêm dịch vụ mới' : '✏️ Chỉnh sửa dịch vụ'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã Dịch vụ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: DV_IN_01, WASH_02..."
                  className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                    formErrors.code ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  } text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
                {formErrors.code && <p className="text-xs text-rose-500 mt-1">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Sản phẩm / Dịch vụ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên dịch vụ hiển thị..."
                  className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                    formErrors.name ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  } text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
                {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Đơn giá (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder="0"
                  className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                    formErrors.unit_price ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  } text-slate-900 dark:text-slate-100 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
                {formErrors.unit_price && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.unit_price}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ghi chú thêm về dịch vụ..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active_checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                />
                <label htmlFor="is_active_checkbox" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Kích hoạt trạng thái kinh doanh ngay
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>}
                  <span>{modalMode === 'create' ? 'Tạo mới' : 'Cập nhật'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL XÁC NHẬN XÓA DỊCH VỤ --- */}
      {deleteModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mx-auto">
              🗑️
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Xác nhận xóa dịch vụ?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bạn có chắc chắn muốn xóa dịch vụ <strong className="text-amber-500">"{selectedService.name}"</strong> ({selectedService.code}) khỏi hệ thống?
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteService}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}