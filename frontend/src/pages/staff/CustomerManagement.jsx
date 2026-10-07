import React, { useState, useEffect, useCallback } from 'react';
import { useIdleRefresh } from '../../utils/useIdleRefresh';
import customerApi from '../../api/customerApi';

export default function CustomerManagement() {
  // --- States Quản lý Dữ liệu ---
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // --- States Tìm kiếm & Phân trang ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  // --- States Modals ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- States Form & Đối tượng được chọn ---
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    tax_code: '',
    address: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Debounce từ khóa tìm kiếm (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset về trang 1 khi thực hiện tìm kiếm mới
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Hiển thị thông báo Toast tự tắt sau 4s
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- Fetch Danh sách Khách hàng từ Backend FastAPI ---
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const skip = (page - 1) * limit;
      const params = { skip, limit, search: debouncedSearch.trim() || undefined };
      const response = await customerApi.getCustomers(params);
      const data = response.data || response;

      setCustomers(data);
      // Kiểm tra nếu số lượng trả về ít hơn limit tức là đã hết dữ liệu trang sau
      setHasMore(data.length === limit);
    } catch (err) {
      console.error('Lỗi tải danh sách khách hàng:', err);
      const apiError = err.response?.data?.detail || 'Không thể tải danh sách khách hàng.';
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  const isAnyModalOpen = isFormModalOpen || isDetailModalOpen || isDeleteModalOpen;
  useIdleRefresh(fetchCustomers, 5 * 60 * 1000, isAnyModalOpen);

  // --- Xử lý Form Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.full_name.trim()) {
      errors.full_name = 'Vui lòng nhập họ và tên khách hàng.';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại.';
    } else if (!/^[0-9+--\s]{8,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Số điện thoại không đúng định dạng.';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Địa chỉ email không hợp lệ.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedCustomer(null);
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      tax_code: '',
      address: '',
      notes: '',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (customer) => {
    setIsEditing(true);
    setSelectedCustomer(customer);
    setFormData({
      full_name: customer.full_name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      tax_code: customer.tax_code || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const handleOpenDeleteModal = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  // Submit Tạo mới / Cập nhật Khách hàng
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        tax_code: formData.tax_code.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (isEditing && selectedCustomer) {
        await customerApi.updateCustomer(selectedCustomer.id, payload);
        showToast('Cập nhật thông tin khách hàng thành công!');
      } else {
        await customerApi.createCustomer(payload);
        showToast('Thêm khách hàng mới thành công!');
      }

      setIsFormModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error('Lỗi khi lưu khách hàng:', err);
      const backendError = err.response?.data?.detail;
      if (typeof backendError === 'string') {
        showToast(backendError, 'error');
      } else {
        showToast('Thao tác thất bại. Vui lòng kiểm tra lại dữ liệu.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Xác nhận Xóa Khách hàng (Xử lý ràng buộc hóa đơn từ Backend)
  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;

    setSubmitting(true);
    try {
      const res = await customerApi.deleteCustomer(selectedCustomer.id);
      showToast(res?.data?.message || 'Đã xóa khách hàng thành công!');
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error('Lỗi khi xóa khách hàng:', err);
      const backendError = err.response?.data?.detail || 'Không thể xóa khách hàng này.';
      showToast(backendError, 'error');
      setIsDeleteModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white shadow-rose-600/20'
              : 'bg-emerald-600 text-white shadow-emerald-600/20'
          }`}
        >
          <span>{toastMessage.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Header & Thanh Công Cụ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/60">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>👥</span> Quản lý Khách hàng
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu, thêm mới và cập nhật thông tin khách hàng trong hệ thống
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm Khách hàng
        </button>
      </div>

      {/* Thanh Tìm kiếm & Lọc */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, số điện thoại, email hoặc mã số thuế..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={fetchCustomers}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <span>🔄</span>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Danh Sách Bảng Khách Hàng */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/60 overflow-hidden">
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">#ID</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4">Số điện thoại</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Mã số thuế</th>
                <th className="py-3.5 px-4">Ngày khởi tạo</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-amber-500 border-t-transparent"></div>
                    <p className="mt-2 text-xs">Đang tải danh sách khách hàng...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <p className="text-2xl mb-1">📭</p>
                    <p className="text-sm font-medium">Không tìm thấy khách hàng nào</p>
                    {debouncedSearch && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Thử tìm kiếm với từ khóa khác
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      #{cust.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {cust.full_name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-amber-600 dark:text-amber-400">
                      {cust.phone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {cust.email || <span className="text-slate-400 text-xs italic">Chưa có</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                      {cust.tax_code || <span className="text-slate-400 italic font-sans">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(cust.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetailModal(cust)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Xem chi tiết"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(cust)}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(cust)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Xóa khách hàng"
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

        {/* Thanh Phân Trang */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hiển thị trang <span className="font-bold text-slate-800 dark:text-slate-200">{page}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Trang trước
            </button>
            <button
              disabled={!hasMore || loading}
              onClick={() => setPage((prev) => prev + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Trang sau →
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL: THÊM / CẬP NHẬT KHÁCH HÀNG ================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isEditing ? '✏️ Cập nhật Hồ sơ Khách hàng' : '➕ Thêm Khách hàng Mới'}</span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border ${
                    formErrors.full_name ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                />
                {formErrors.full_name && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.full_name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0912345678"
                    className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border ${
                      formErrors.phone ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-rose-500 mt-1">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Mã số thuế
                  </label>
                  <input
                    type="text"
                    name="tax_code"
                    value={formData.tax_code}
                    onChange={handleInputChange}
                    placeholder="MST doanh nghiệp"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@domain.com"
                  className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border ${
                    formErrors.email ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                />
                {formErrors.email && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Địa chỉ giao dịch hoặc công ty"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú
                </label>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Ghi chú thêm về khách hàng..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submitting && (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent"></span>
                  )}
                  <span>{isEditing ? 'Cập nhật' : 'Thêm mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: XEM CHI TIẾT KHÁCH HÀNG ================= */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋 Hồ sơ Khách hàng #{selectedCustomer.id}</span>
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <span className="text-xs text-slate-400 uppercase font-semibold">Họ và tên</span>
                <p className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                  {selectedCustomer.full_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Số điện thoại</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {selectedCustomer.phone}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Mã số thuế</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedCustomer.tax_code || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <span className="text-xs text-slate-400 uppercase font-semibold">Email</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedCustomer.email || 'Chưa có thông tin'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <span className="text-xs text-slate-400 uppercase font-semibold">Địa chỉ</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedCustomer.address || 'Chưa có thông tin'}
                </p>
              </div>

              {selectedCustomer.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Ghi chú</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 italic">
                    "{selectedCustomer.notes}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div>Tạo ngày: {new Date(selectedCustomer.created_at).toLocaleString('vi-VN')}</div>
                <div>Cập nhật: {new Date(selectedCustomer.updated_at).toLocaleString('vi-VN')}</div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: XÁC NHẬN XÓA KHÁCH HÀNG ================= */}
      {isDeleteModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 text-2xl flex items-center justify-center mx-auto">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Xác nhận xóa khách hàng?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Bạn có chắc chắn muốn xóa khách hàng{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  "{selectedCustomer.full_name}"
                </span>{' '}
                (SĐT: {selectedCustomer.phone}) không?
              </p>
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60 text-left">
                * Lưu ý: Khách hàng chỉ có thể bị xóa nếu chưa từng phát sinh hóa đơn giao dịch nào trong hệ thống.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {submitting && (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                )}
                <span>Xác nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}