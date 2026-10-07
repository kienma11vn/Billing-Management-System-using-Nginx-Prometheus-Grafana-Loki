import React, { useState, useEffect, useCallback } from 'react';
import serviceApi from '../../api/serviceApi';
import { useIdleRefresh } from '../../utils/useIdleRefresh';

export default function ServiceManagement() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- STATE BỘ LỌC & PHÂN TRANG ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [page, setPage] = useState(1);
  const limit = 10;

  // --- STATE MODAL CHI TIẾT DỊCH VỤ ---
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

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

      // Gọi API serviceApi.getAll (quyền require_authenticated)
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
  useIdleRefresh(fetchServices, 5 * 60 * 1000, detailModalOpen);

  // --- MỞ MODAL XEM CHI TIẾT ---
  const handleOpenDetailModal = (service) => {
    setSelectedService(service);
    setDetailModalOpen(true);
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
      {/* HEADER TIÊU ĐỀ & NÚT LÀM MỚI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🏷️</span> Tra cứu Danh mục Dịch vụ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu thông tin, mã dịch vụ, đơn giá kinh doanh và trạng thái hoạt động trên hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchServices}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all flex items-center gap-2"
            title="Tải lại danh sách"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* THÔNG BÁO ALERT LỖI (NẾU CÓ) */}
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
                      {item.is_active ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang kinh doanh
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20 whitespace-nowrap inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Tạm ngừng
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetailModal(item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        title="Xem chi tiết"
                      >
                        <span>👁️</span>
                      </button>
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

      {/* --- MODAL XEM CHI TIẾT DỊCH VỤ --- */}
      {detailModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>🏷️ Chi tiết Dịch vụ</span>
              </h3>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-sm text-slate-800 dark:text-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Mã Dịch vụ</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-base">{selectedService.code}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">ID Hệ thống</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">#{selectedService.id}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Tên Sản phẩm / Dịch vụ</span>
                <span className="font-bold text-slate-900 dark:text-white text-base">{selectedService.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Đơn giá niêm yết</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">{formatVND(selectedService.unit_price)}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Trạng thái kinh doanh</span>
                  <div className="mt-1">
                    {selectedService.is_active ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang kinh doanh
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Tạm ngừng
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-1">Mô tả chi tiết</span>
                <p className="text-slate-700 dark:text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">
                  {selectedService.description || 'Chưa có thông tin mô tả chi tiết cho dịch vụ này.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Ngày khởi tạo</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatDate(selectedService.created_at)}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}