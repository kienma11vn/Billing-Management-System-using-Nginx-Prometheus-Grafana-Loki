import { UserRole } from '../constants/enums';

/**
 * Lấy đường dẫn trang điều khiển tương ứng với vai trò người dùng
 * @param {string} role - Vai trò của user ('admin', 'staff')
 * @returns {string} Route path tương ứng
 */
export const getDashboardByRole = (role) => {
  if (!role) return '/login';

  const normalizedRole = String(role).toLowerCase();

  switch (normalizedRole) {
    case UserRole?.ADMIN || 'admin':
      return '/admin/dashboard';
    case UserRole?.STAFF || 'staff':
      return '/staff/dashboard';
    default:
      return '/login';
  }
};