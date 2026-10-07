import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useIdleRefresh } from '../../utils/useIdleRefresh';
import userApi from '../../api/userApi';

export default function AccountManagement() {
  const { user: currentUser } = useAuth();

  // State quản lý danh sách & bộ lọc
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Tham số truy vấn (Search, Filter, Pagination)
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // State Modal (Create, Edit, Reset Password)
  const [modalType, setModalType] = useState(null); // 'create' | 'edit' | 'reset_password' | null
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'staff',
    is_active: true,
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Hiển thị thông báo Toast tự động ẩn
  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tải danh sách người dùng từ API Backend
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        skip: (page - 1) * limit,
        limit: limit,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.is_active = statusFilter === 'true';

      const response = await userApi.getAll(params);
      setUsers(response.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      setError(
        err.response?.data?.detail || 'Không thể tải danh sách tài khoản. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  useIdleRefresh(fetchUsers, 5 * 60 * 1000, modalType !== null);

  // Reset trang về 1 khi thay đổi điều kiện lọc
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setFormData({
      email: '',
      full_name: '',
      password: '',
      role: 'staff',
      is_active: true,
    });
    setFormError('');
    setSelectedUser(null);
    setModalType('create');
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (userItem) => {
    setSelectedUser(userItem);
    setFormData({
      full_name: userItem.full_name,
      role: userItem.role,
      is_active: userItem.is_active,
    });
    setFormError('');
    setModalType('edit');
  };

  // Mở modal Đặt lại mật khẩu
  const handleOpenResetPasswordModal = (userItem) => {
    setSelectedUser(userItem);
    setFormData({ password: '' });
    setFormError('');
    setModalType('reset_password');
  };

  // Đóng tất cả modal
  const handleCloseModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setFormError('');
  };

  // Xử lý tạo mới / cập nhật / reset password
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (modalType === 'create') {
        if (!formData.email || !formData.full_name || !formData.password) {
          setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
          setFormSubmitting(false);
          return;
        }
        if (formData.password.length < 6) {
          setFormError('Mật khẩu tối thiểu phải từ 6 ký tự trở lên.');
          setFormSubmitting(false);
          return;
        }

        await userApi.create({
          email: formData.email,
          full_name: formData.full_name,
          password: formData.password,
          role: formData.role,
          is_active: formData.is_active,
        });

        showToast('Tạo tài khoản mới thành công!');
        handleCloseModal();
        fetchUsers();
      } else if (modalType === 'edit') {
        if (!formData.full_name) {
          setFormError('Họ và tên không được để trống.');
          setFormSubmitting(false);
          return;
        }

        await userApi.update(selectedUser.id, {
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
        });

        showToast('Cập nhật thông tin tài khoản thành công!');
        handleCloseModal();
        fetchUsers();
      } else if (modalType === 'reset_password') {
        if (!formData.password || formData.password.length < 6) {
          setFormError('Mật khẩu mới phải từ 6 ký tự trở lên.');
          setFormSubmitting(false);
          return;
        }

        await userApi.resetPassword(selectedUser.id, {
          new_password: formData.password,
        });

        showToast(`Đặt lại mật khẩu cho ${selectedUser.email} thành công!`);
        handleCloseModal();
      }
    } catch (err) {
      console.error('Lỗi thao tác form:', err);
      setFormError(
        err.response?.data?.detail || 'Thao tác không thành công. Vui lòng kiểm tra lại.'
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Bật/Tắt trạng thái tài khoản
  const handleToggleStatus = async (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      alert('Bạn không thể tự vô hiệu hóa tài khoản của chính mình!');
      return;
    }

    const actionText = targetUser.is_active ? 'vô hiệu hóa (khóa)' : 'kích hoạt lại';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản "${targetUser.email}"?`)) {
      return;
    }

    try {
      await userApi.updateStatus(targetUser.id, !targetUser.is_active);
      showToast(
        `Đã ${targetUser.is_active ? 'khóa' : 'kích hoạt'} tài khoản ${targetUser.email} thành công.`
      );
      fetchUsers();
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái user:', err);
      showToast(
        err.response?.data?.detail || 'Khóa/mở khóa tài khoản thất bại.',
        'error'
      );
    }
  };

  // Format ngày tháng từ ISO string
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg font-medium text-sm transition-all flex items-center gap-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white shadow-rose-600/30'
              : 'bg-emerald-600 text-white shadow-emerald-600/30'
          }`}
        >
          <span>{toastMessage.type === 'error' ? '❌' : '✅'}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>👤</span>
            <span>Quản lý Tài khoản Người dùng</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tạo tài khoản Nhân viên, phân quyền Admin và quản lý trạng thái truy cập hệ thống.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span>➕</span>
          <span>Tạo tài khoản mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Tìm kiếm tên/email */}
          <div className="sm:col-span-5 relative">
            <input
              type="text"
              placeholder="Tìm theo Họ tên hoặc Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>

          {/* Lọc Role */}
          <div className="sm:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">Tất cả Vai trò</option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="staff">Nhân viên (Staff)</option>
            </select>
          </div>

          {/* Lọc Trạng thái */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Đã bị khóa</option>
            </select>
          </div>

          {/* Nút Tìm kiếm */}
          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full h-full py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center"
              title="Áp dụng lọc"
            >
              Lọc
            </button>
          </div>
        </form>
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-sm font-medium flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchUsers}
              className="underline font-bold hover:text-rose-800 dark:hover:text-rose-100"
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4"># ID</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4">Email tài khoản</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày khởi tạo</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tải danh sách tài khoản...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <p className="text-base font-semibold text-slate-500 dark:text-slate-400">
                      Không tìm thấy người dùng nào
                    </p>
                    <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-500 dark:text-slate-400">
                        #{u.id}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span>{u.full_name}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Bạn
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            👑 Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                            👤 Staff
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>Đã bị khóa</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(u.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Nút Edit */}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Sửa thông tin"
                          >
                            ✏️
                          </button>

                          {/* Nút Reset Mật khẩu */}
                          <button
                            onClick={() => handleOpenResetPasswordModal(u)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Đặt lại mật khẩu"
                          >
                            🔑
                          </button>

                          {/* Nút Bật/Tắt Trạng thái */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : u.is_active
                                ? 'text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                                : 'text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            }`}
                            title={
                              isSelf
                                ? 'Không thể khóa tài khoản cá nhân'
                                : u.is_active
                                ? 'Khóa tài khoản'
                                : 'Mở khóa tài khoản'
                            }
                          >
                            {u.is_active ? '🔒' : '🔓'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Navigation Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Trang hiện tại: <strong>{page}</strong></span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-medium transition-all"
            >
              ◀ Trang trước
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={users.length < limit || loading}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-medium transition-all"
            >
              Trang sau ▶
            </button>
          </div>
        </div>
      </div>

      {/* MODAL (Tạo mới & Cập nhật thông tin) */}
      {(modalType === 'create' || modalType === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{modalType === 'create' ? '➕' : '✏️'}</span>
                <span>
                  {modalType === 'create'
                    ? 'Tạo mới tài khoản người dùng'
                    : `Cập nhật: ${selectedUser?.email}`}
                </span>
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-300 text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              {/* Email (Chỉ cho nhập khi Tạo mới) */}
              {modalType === 'create' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Địa chỉ Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nhanvien@congty.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Email tài khoản (Không thể sửa)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={selectedUser?.email || ''}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Họ và tên đầy đủ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Mật khẩu khởi tạo (Chỉ hiển thị khi Tạo mới) */}
              {modalType === 'create' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Vai trò */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Vai trò phân quyền <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="staff">Nhân viên (Staff) - Bán hàng & Thu tiền</option>
                  <option value="admin">Quản trị viên (Admin) - Toàn quyền quản lý</option>
                </select>
              </div>

              {/* Trạng thái tài khoản */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active_checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                />
                <label
                  htmlFor="is_active_checkbox"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cho phép tài khoản hoạt động ngay
                </label>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
                >
                  {formSubmitting
                    ? 'Đang lưu...'
                    : modalType === 'create'
                    ? 'Tạo tài khoản'
                    : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL (Đặt lại mật khẩu) */}
      {modalType === 'reset_password' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>🔑</span>
                <span>Đặt lại mật khẩu</span>
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Nhập mật khẩu mới cho tài khoản{' '}
                <strong className="text-amber-500 font-mono">{selectedUser.email}</strong>. Sau khi
                đặt lại, phiên đăng nhập cũ của người dùng trên mọi thiết bị sẽ bị đăng xuất ngay
                lập tức.
              </p>

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-300 text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Nhập mật khẩu mới (Tối thiểu 6 ký tự)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
                >
                  {formSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}