import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../utils/roleRedirect';
import { formatUserRole } from '../constants/translations';
import ThemeToggle from '../components/common/ThemeToggle';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoToMyDashboard = () => {
    if (user && user.role) {
      const targetDashboard = getDashboardByRole(user.role);
      navigate(targetDashboard, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSwitchAccount = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      
      {/* Nút Chuyển đổi Giao diện Light/Dark ở góc trên bên phải */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Trang trí Nền mờ Amber */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 dark:bg-amber-600/15 rounded-full blur-3xl"></div>
      </div>

      {/* Card Nội dung chính */}
      <div className="relative z-10 max-w-md w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 p-8 text-center transition-colors">
        
        {/* Biểu tượng Cảnh báo 403 (Amber) */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-center mb-6 text-amber-500 dark:text-amber-400 shadow-sm">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Mã lỗi Badge */}
        <span className="inline-block text-[11px] font-bold tracking-wider text-amber-800 dark:text-amber-300 uppercase bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 px-3 py-1 rounded-full">
          Mã lỗi 403 • Restricted Access
        </span>

        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">
          Truy cập bị từ chối
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Tài khoản của bạn không được phân quyền để truy cập vào tài nguyên này trong Hệ thống Quản lý Hóa đơn.
        </p>

        {/* Khối hiển thị Thông tin Tài khoản */}
        {user && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 text-left">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Tài khoản hiện tại
            </p>
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {user.full_name || user.email}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 text-xs font-semibold">
                {formatUserRole(user.role)}
              </span>
            </div>
          </div>
        )}

        {/* Nút Hành động */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleGoToMyDashboard}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold shadow-md shadow-amber-500/20 transition-all text-sm flex justify-center items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Trở về Trang quản lý chính</span>
          </button>

          <button
            onClick={handleSwitchAccount}
            className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold transition-all text-sm flex justify-center items-center gap-2"
          >
            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            <span>Đăng nhập tài khoản khác</span>
          </button>
        </div>

      </div>
    </div>
  );
}