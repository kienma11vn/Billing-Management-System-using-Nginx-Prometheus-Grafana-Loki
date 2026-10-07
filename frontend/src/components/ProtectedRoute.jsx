import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  // 1. Giao diện Loading chờ xác thực (Hỗ trợ Amber theme + Light/Dark mode)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center px-4 transition-colors font-sans">
        <div className="relative flex items-center justify-center">
          {/* Vòng xoay Spinner màu Amber */}
          <div className="w-14 h-14 rounded-full border-4 border-amber-200 dark:border-amber-950 border-t-amber-500 dark:border-t-amber-400 animate-spin"></div>
          {/* Icon Hóa đơn ở giữa */}
          <div className="absolute text-xl">🧾</div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300 animate-pulse">
          Đang kiểm tra quyền truy cập...
        </p>
      </div>
    );
  }

  // 2. Chuyển hướng về trang Đăng nhập nếu chưa xác thực hoặc không có token
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Kiểm tra vai trò tài khoản (Chấp nhận cả 'ADMIN'/'admin' và 'STAFF'/'staff')
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role ? String(user.role).toLowerCase() : '';
    const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toLowerCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 4. Trả về Route hợp lệ
  return children ? children : <Outlet />;
}