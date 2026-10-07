import React, { useState, useEffect, useCallback } from 'react';
import { useIdleRefresh } from '../../utils/useIdleRefresh';
import invoiceApi from '../../api/invoiceApi';
import customerApi from '../../api/customerApi';
import serviceApi from '../../api/serviceApi';

export default function InvoiceManagement() {
  // --- States Quản lý Dữ liệu Hóa đơn ---
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // --- States Bộ lọc & Phân trang ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  // --- States Quản lý Modals ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // --- State Hóa đơn được chọn & Chi tiết ---
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // --- States Dữ liệu Danh mục (Dùng cho Modal Lập hóa đơn) ---
  const [customersList, setCustomersList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  // --- State Form Lập Hóa đơn Mới ---
  const [createFormData, setCreateFormData] = useState({
    customer_id: '',
    discount_amount: 0,
    note: '',
    items: [],
  });

  // --- States Autocomplete cho Form Lập Hóa đơn ---
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [openServiceDropdownIndex, setOpenServiceDropdownIndex] = useState(null);

  // --- State Form Thu Tiền Thanh Toán ---
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    payment_method: 'Tiền mặt',
    note: '',
  });

  // --- State Form Hủy Hóa đơn ---
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Debounce từ khóa tìm kiếm (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Hiển thị Toast Notification
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Định dạng hiển thị tiền tệ VNĐ
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  // --- API 1: Fetch Danh Sách Hóa Đơn ---
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const skip = (page - 1) * limit;
      const params = {
        skip,
        limit,
        status: statusFilter || undefined,
        search: debouncedSearch.trim() || undefined,
      };
      const response = await invoiceApi.getInvoices(params);
      const data = response.data || response;

      setInvoices(data);
      setHasMore(data.length === limit);
    } catch (err) {
      console.error('Lỗi tải danh sách hóa đơn:', err);
      const apiError = err.response?.data?.detail || 'Không thể tải danh sách hóa đơn.';
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // =========================================================================
  // TÍCH HỢP USEIDLEREFRESH: Tự động làm mới dữ liệu sau 5 phút không hoạt động
  // Tạm dừng (disabled) nếu bất kỳ Modal nào đang mở để tránh mất dữ liệu nhập
  // =========================================================================
  const isAnyModalOpen =
    isCreateModalOpen || isDetailModalOpen || isPaymentModalOpen || isCancelModalOpen;
  useIdleRefresh(fetchInvoices, 5 * 60 * 1000, isAnyModalOpen);

  // --- API 2: Fetch Chi Tiết Hóa Đơn ---
  const fetchInvoiceDetail = async (invoiceId) => {
    setDetailLoading(true);
    try {
      const res = await invoiceApi.getInvoiceById(invoiceId);
      setInvoiceDetail(res.data || res);
    } catch (err) {
      console.error('Lỗi xem chi tiết hóa đơn:', err);
      showToast('Không thể tải thông tin chi tiết hóa đơn.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  // --- Mở Modal Xem Chi Tiết ---
  const handleOpenDetailModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
    fetchInvoiceDetail(invoice.id);
  };

  // --- Mở Modal Lập Hóa Đơn Mới ---
  const handleOpenCreateModal = async () => {
    // Reset state Autocomplete
    setCustomerSearch('');
	setShowCustomerDropdown(false);
	setOpenServiceDropdownIndex(null);

    setCreateFormData({
      customer_id: '',
      discount_amount: 0,
      note: '',
      items: [{ service_id: '', service_search: '', quantity: 1, unit_price: 0 }],
    });
    setIsCreateModalOpen(true);

    // Tải danh sách Khách hàng và Dịch vụ...
    try {
      const [resCust, resServ] = await Promise.all([
        customerApi.getCustomers({ limit: 100 }),
		serviceApi.getAll({ limit: 100, is_active: true }),
      ]);
      setCustomersList(resCust.data || resCust || []);
      setServicesList(resServ.data || resServ || []);
    } catch (err) {
      console.error('Lỗi tải danh mục khách hàng/dịch vụ:', err);
      showToast('Không thể tải danh mục Khách hàng hoặc Dịch vụ.', 'error');
    }
  };

  // Thay đổi Dịch vụ trong dòng Item của Form Lập hóa đơn
  const handleItemServiceChange = (index, serviceId) => {
    const selectedService = servicesList.find((s) => s.id === Number(serviceId));
    const newItems = [...createFormData.items];
    newItems[index] = {
      ...newItems[index],
      service_id: serviceId,
      unit_price: selectedService ? selectedService.unit_price : 0,
    };
    setCreateFormData((prev) => ({ ...prev, items: newItems }));
  };

  // Thay đổi Số lượng / Đơn giá dòng Item
  const handleItemFieldChange = (index, field, value) => {
    const newItems = [...createFormData.items];
    newItems[index] = { ...newItems[index], [field]: Number(value) };
    setCreateFormData((prev) => ({ ...prev, items: newItems }));
  };

  // Thêm dòng dịch vụ mới
  const handleAddLineItem = () => {
    setCreateFormData((prev) => ({
      ...prev,
      items: [...prev.items, { service_id: '', service_search: '', quantity: 1, unit_price: 0 }],
    }));
  };

  // Xóa dòng dịch vụ
  const handleRemoveLineItem = (index) => {
    if (createFormData.items.length <= 1) return;
    setCreateFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Tính tổng tiền xem trước khi lập hóa đơn
  const calculateCreateTotals = () => {
    const subtotal = createFormData.items.reduce((sum, item) => {
      return sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
    }, 0);
    const discount = Number(createFormData.discount_amount) || 0;
    const final = Math.max(0, subtotal - discount);
    return { subtotal, discount, final };
  };

  // --- API 3: Submit Lập Hóa Đơn Mới ---
  const handleSubmitCreateInvoice = async (e) => {
    e.preventDefault();
    if (!createFormData.customer_id) {
      showToast('Vui lòng chọn khách hàng.', 'error');
      return;
    }

    const invalidItem = createFormData.items.find((it) => !it.service_id || it.quantity <= 0);
    if (invalidItem) {
      showToast('Vui lòng chọn hợp lệ dịch vụ và số lượng cho tất cả các dòng.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: Number(createFormData.customer_id),
        discount_amount: Number(createFormData.discount_amount) || 0,
        note: createFormData.note.trim() || null,
        items: createFormData.items.map((it) => ({
          service_id: Number(it.service_id),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      };

      await invoiceApi.createInvoice(payload);
      showToast('Lập hóa đơn mới thành công!');
      setIsCreateModalOpen(false);
      fetchInvoices();
    } catch (err) {
      console.error('Lỗi khi tạo hóa đơn:', err);
      const backendError = err.response?.data?.detail || 'Tạo hóa đơn thất bại.';
      showToast(backendError, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Mở Modal Thu Tiền Thanh Toán ---
  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    const remaining = Number(invoice.final_amount) - Number(invoice.paid_amount);
    setPaymentFormData({
      amount: remaining > 0 ? remaining : '',
      payment_method: 'Tiền mặt',
      note: '',
    });
    setIsPaymentModalOpen(true);
  };

  // --- API 4: Submit Thu Tiền Thanh Toán ---
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amount = Number(paymentFormData.amount);
    if (!amount || amount <= 0) {
      showToast('Số tiền thanh toán phải lớn hơn 0.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        amount,
        payment_method: paymentFormData.payment_method,
        note: paymentFormData.note.trim() || null,
      };

      await invoiceApi.collectPayment(selectedInvoice.id, payload);
      showToast('Thu tiền thanh toán thành công!');
      setIsPaymentModalOpen(false);
      fetchInvoices();
    } catch (err) {
      console.error('Lỗi thu tiền hóa đơn:', err);
      const backendError = err.response?.data?.detail || 'Thao tác thu tiền thất bại.';
      showToast(backendError, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Mở Modal Hủy Hóa Đơn ---
  const handleOpenCancelModal = (invoice) => {
    setSelectedInvoice(invoice);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  // --- API 5: Submit Hủy Hóa Đơn ---
  const handleSubmitCancelInvoice = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setSubmitting(true);
    try {
      await invoiceApi.cancelInvoice(selectedInvoice.id, cancelReason.trim());
      showToast('Hủy hóa đơn thành công!');
      setIsCancelModalOpen(false);
      fetchInvoices();
    } catch (err) {
      console.error('Lỗi hủy hóa đơn:', err);
      const backendError = err.response?.data?.detail || 'Không thể hủy hóa đơn này.';
      showToast(backendError, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Render Badge Trạng Thái Hóa Đơn
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            ✅ Đã thanh toán
          </span>
        );
      case 'partial':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 whitespace-nowrap">
            ⏳ Thanh toán 1 phần
          </span>
        );
      case 'unpaid':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            ⚠️ Chưa thanh toán
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            🚫 Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
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
            <span>🧾</span> Quản lý Hóa đơn
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu, lập mới, thu tiền thanh toán và theo dõi trạng thái hóa đơn dịch vụ
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Lập Hóa đơn Mới
        </button>
      </div>

      {/* Thanh Tìm kiếm & Bộ Lọc Trạng Thái */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/60 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Tên hoặc Số điện thoại Khách hàng..."
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

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Lọc Trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-48 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="unpaid">Chưa thanh toán</option>
            <option value="partial">Thanh toán 1 phần</option>
            <option value="paid">Đã thanh toán</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          <button
            onClick={fetchInvoices}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>🔄</span>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Danh Sách Bảng Hóa Đơn */}
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
                <th className="py-3.5 px-4">Mã HĐ</th>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4 text-right">Tổng phải trả</th>
                <th className="py-3.5 px-4 text-right">Đã thanh toán</th>
                <th className="py-3.5 px-4 text-center min-w-[160px] whitespace-nowrap">Trạng thái</th>
                <th className="py-3.5 px-4">Người lập</th>
                <th className="py-3.5 px-4">Ngày tạo</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-amber-500 border-t-transparent"></div>
                    <p className="mt-2 text-xs">Đang tải danh sách hóa đơn...</p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <p className="text-2xl mb-1">📭</p>
                    <p className="text-sm font-medium">Không tìm thấy hóa đơn nào</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      #{inv.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {inv.customer?.full_name || `Khách hàng #${inv.customer_id}`}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {inv.customer?.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(inv.final_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(inv.paid_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {renderStatusBadge(inv.status)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {inv.created_by_user?.full_name || 'Hệ thống'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(inv.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetailModal(inv)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Xem chi tiết"
                        >
                          👁️
                        </button>

                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button
                            onClick={() => handleOpenPaymentModal(inv)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                            title="Thu tiền thanh toán"
                          >
                            💵
                          </button>
                        )}

                        {inv.status !== 'cancelled' && (
                          <button
                            onClick={() => handleOpenCancelModal(inv)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                            title="Hủy hóa đơn"
                          >
                            🚫
                          </button>
                        )}
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

      {/* ================= MODAL 1: LẬP HÓA ĐƠN MỚI ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>➕ Lập Hóa Đơn Dịch Vụ Mới</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCreateInvoice} className="space-y-4">
              {/* Chọn Khách Hàng (Input + Autocomplete Dropdown) */}
				<div className="relative">
				  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
					Khách hàng <span className="text-rose-500">*</span>
				  </label>
				  <input
					type="text"
					placeholder="Gõ tên hoặc SĐT để tìm khách hàng..."
					value={customerSearch}
					onChange={(e) => {
					  const val = e.target.value;
					  setCustomerSearch(val);
					  setShowCustomerDropdown(true);
					  if (!val) {
						setCreateFormData((prev) => ({ ...prev, customer_id: '' }));
					  }
					}}
					onFocus={() => setShowCustomerDropdown(true)}
					className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
					required
				  />

				  {/* Dropdown danh sách gợi ý khách hàng */}
				  {showCustomerDropdown && (
					<ul className="absolute z-30 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-700/60">
					  {customersList
						.filter(
						  (c) =>
							c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
							c.phone?.includes(customerSearch)
						)
						.map((c) => (
						  <li
							key={c.id}
							onClick={() => {
							  setCreateFormData((prev) => ({ ...prev, customer_id: c.id }));
							  setCustomerSearch(`${c.full_name} (${c.phone})`);
							  setShowCustomerDropdown(false);
							}}
							className="px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors"
						  >
							<div className="font-bold">{c.full_name}</div>
							<div className="text-xs text-slate-400">{c.phone}</div>
						  </li>
						))}
					  {customersList.filter(
						(c) =>
						  c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
						  c.phone?.includes(customerSearch)
					  ).length === 0 && (
						<li className="px-3.5 py-2 text-xs text-slate-400 italic">
						  Không tìm thấy khách hàng phù hợp
						</li>
					  )}
					</ul>
				  )}
				</div>

              {/* Danh sách Dịch vụ / Mặt hàng */}
              <div className="space-y-2">
			  <div className="flex items-center justify-between">
				<label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
				  Danh mục Dịch vụ <span className="text-rose-500">*</span>
				</label>
				<button
				  type="button"
				  onClick={handleAddLineItem}
				  className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
				>
				  ➕ Thêm dịch vụ
				</button>
			  </div>

			  {createFormData.items.map((item, idx) => (
				<div
				  key={idx}
				  className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2"
				>
				  {/* Input Dịch vụ với Autocomplete */}
				  <div className="relative flex-1 w-full">
					<input
					  type="text"
					  placeholder="Gõ tìm kiếm dịch vụ..."
					  value={item.service_search || ''}
					  onChange={(e) => {
						const val = e.target.value;
						const newItems = [...createFormData.items];
						newItems[idx] = { ...newItems[idx], service_search: val, service_id: '' };
						setCreateFormData((prev) => ({ ...prev, items: newItems }));
						setOpenServiceDropdownIndex(idx);
					  }}
					  onFocus={() => setOpenServiceDropdownIndex(idx)}
					  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
					  required
					/>

					{/* Dropdown danh sách gợi ý dịch vụ */}
					{openServiceDropdownIndex === idx && (
					  <ul className="absolute z-30 w-full mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-700/60">
						{servicesList
						  .filter((s) =>
							s.name?.toLowerCase().includes((item.service_search || '').toLowerCase())
						  )
						  .map((s) => (
							<li
							  key={s.id}
							  onClick={() => {
								const newItems = [...createFormData.items];
								newItems[idx] = {
								  ...newItems[idx],
								  service_id: s.id,
								  service_search: s.name,
								  unit_price: s.unit_price,
								};
								setCreateFormData((prev) => ({ ...prev, items: newItems }));
								setOpenServiceDropdownIndex(null);
							  }}
							  className="px-3 py-2 text-sm text-slate-800 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors flex justify-between items-center"
							>
							  <span>{s.name}</span>
							  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
								{formatCurrency(s.unit_price)}
							  </span>
							</li>
						  ))}
						{servicesList.filter((s) =>
						  s.name?.toLowerCase().includes((item.service_search || '').toLowerCase())
						).length === 0 && (
						  <li className="px-3 py-2 text-xs text-slate-400 italic">Không tìm thấy dịch vụ</li>
						)}
					  </ul>
					)}
				  </div>

				  <div className="flex items-center gap-2 w-full sm:w-auto">
					<input
					  type="number"
					  min="1"
					  value={item.quantity}
					  onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
					  placeholder="Số lượng"
					  className="w-20 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-center"
					  required
					/>

					<input
					  type="number"
					  min="0"
					  value={item.unit_price}
					  onChange={(e) => handleItemFieldChange(idx, 'unit_price', e.target.value)}
					  placeholder="Đơn giá"
					  className="w-28 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-right"
					  required
					/>

					{createFormData.items.length > 1 && (
					  <button
						type="button"
						onClick={() => handleRemoveLineItem(idx)}
						className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
						title="Xóa dòng"
					  >
						✕
					  </button>
					)}
				  </div>
				</div>
			  ))}
			</div>

              {/* Giảm giá & Ghi chú */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Số tiền Giảm giá (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createFormData.discount_amount}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({ ...prev, discount_amount: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Ghi chú Hóa đơn
                  </label>
                  <input
                    type="text"
                    value={createFormData.note}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({ ...prev, note: e.target.value }))
                    }
                    placeholder="Ghi chú thêm..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Tính toán Tiền Xem Trước */}
              {(() => {
                const { subtotal, discount, final } = calculateCreateTotals();
                return (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 space-y-1 text-sm">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Tổng tiền hàng:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Chiết khấu giảm giá:</span>
                      <span>- {formatCurrency(discount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base text-amber-700 dark:text-amber-400 pt-1 border-t border-amber-200 dark:border-amber-800/50">
                      <span>Tổng phải trả:</span>
                      <span>{formatCurrency(final)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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
                  <span>Lập Hóa Đơn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: XEM CHI TIẾT HÓA ĐƠN ================= */}
      {isDetailModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋 Chi Tiết Hóa Đơn #{selectedInvoice.id}</span>
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-amber-500 border-t-transparent"></div>
                <p className="mt-2 text-xs">Đang tải chi tiết hóa đơn...</p>
              </div>
            ) : invoiceDetail ? (
              <div className="space-y-4 text-sm">
                {/* Thông tin Khách hàng */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Khách hàng: {invoiceDetail.customer?.full_name}
                    </span>
                    {renderStatusBadge(invoiceDetail.status)}
                  </div>
                  <p className="text-xs text-slate-500">SĐT: {invoiceDetail.customer?.phone}</p>
                  {invoiceDetail.customer?.email && (
                    <p className="text-xs text-slate-500">Email: {invoiceDetail.customer?.email}</p>
                  )}
                </div>

                {/* Danh sách Dịch vụ */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Danh mục Dịch vụ</h4>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500">
                        <tr>
                          <th className="py-2 px-3 text-left">Dịch vụ</th>
                          <th className="py-2 px-3 text-center">SL</th>
                          <th className="py-2 px-3 text-right">Đơn giá</th>
                          <th className="py-2 px-3 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {invoiceDetail.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {item.service?.name || `Dịch vụ #${item.service_id}`}
                            </td>
                            <td className="py-2 px-3 text-center">{item.quantity}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="py-2 px-3 text-right font-bold">
                              {formatCurrency(item.unit_price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tổng kết Tiền */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Tổng tiền hàng:</span>
                    <span>{formatCurrency(invoiceDetail.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Giảm giá:</span>
                    <span>- {formatCurrency(invoiceDetail.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Tổng phải trả:</span>
                    <span>{formatCurrency(invoiceDetail.final_amount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Đã thanh toán:</span>
                    <span>{formatCurrency(invoiceDetail.paid_amount)}</span>
                  </div>
                </div>

                {/* Lịch sử Thu tiền */}
                {invoiceDetail.payments && invoiceDetail.payments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Lịch sử Thanh toán</h4>
                    <div className="space-y-1.5">
                      {invoiceDetail.payments.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg text-xs flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60"
                        >
                          <div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              +{formatCurrency(p.amount)}
                            </span>
                            <span className="ml-2 text-slate-400">({p.payment_method})</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(p.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

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

      {/* ================= MODAL 3: THU TIỀN THANH TOÁN ================= */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>💵 Thu Tiền Hóa Đơn #{selectedInvoice.id}</span>
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tổng tiền phải trả:</span>
                  <span>{formatCurrency(selectedInvoice.final_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Đã thanh toán:</span>
                  <span>{formatCurrency(selectedInvoice.paid_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-700 dark:text-amber-400 border-t border-amber-200 dark:border-amber-800/50 pt-1">
                  <span>Còn lại cần thu:</span>
                  <span>
                    {formatCurrency(
                      Number(selectedInvoice.final_amount) - Number(selectedInvoice.paid_amount)
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Số tiền thu (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={Number(selectedInvoice.final_amount) - Number(selectedInvoice.paid_amount)}
                  value={paymentFormData.amount}
                  onChange={(e) =>
                    setPaymentFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Phương thức thanh toán
                </label>
                <select
                  value={paymentFormData.payment_method}
                  onChange={(e) =>
                    setPaymentFormData((prev) => ({ ...prev, payment_method: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="Tiền mặt">Tiền mặt</option>
                  <option value="Chuyển khoản">Chuyển khoản ngân hàng</option>
                  <option value="Thẻ ATM/Visa">Thẻ ATM / Visa / Master</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú đợt thu
                </label>
                <input
                  type="text"
                  value={paymentFormData.note}
                  onChange={(e) =>
                    setPaymentFormData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Ghi chú thêm..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submitting && (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  )}
                  <span>Xác Nhận Thu Tiền</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: HỦY HÓA ĐƠN ================= */}
      {isCancelModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 text-2xl flex items-center justify-center mx-auto">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Xác nhận Hủy Hóa Đơn #{selectedInvoice.id}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Khách hàng: <span className="font-bold">{selectedInvoice.customer?.full_name}</span> - Tổng tiền:{' '}
                <span className="font-bold">{formatCurrency(selectedInvoice.final_amount)}</span>
              </p>
            </div>

            <form onSubmit={handleSubmitCancelInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Lý do hủy hóa đơn
                </label>
                <textarea
                  rows="3"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập chi tiết lý do hủy hóa đơn..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  )}
                  <span>Xác Nhận Hủy HĐ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}