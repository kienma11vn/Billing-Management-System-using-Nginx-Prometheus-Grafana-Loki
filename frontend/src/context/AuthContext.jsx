import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 1. Khởi tạo trạng thái user từ localStorage (có try-catch tránh crash do JSON lỗi)
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user_info');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Lỗi khi đọc user_info từ localStorage:', error);
      localStorage.removeItem('user_info');
      return null;
    }
  });

  // 2. Khởi tạo trạng thái access token từ localStorage
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));

  // 3. Hàm cập nhật thông tin người dùng (khi cập nhật profile hoặc sau khi gọi API /me)
  const updateUser = useCallback((userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user_info', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user_info');
    }
  }, []);

  // 4. Hàm đăng nhập (Lưu token và thông tin người dùng)
  const login = useCallback((accessToken, userData = null) => {
    setToken(accessToken);
    localStorage.setItem('access_token', accessToken);

    if (userData) {
      updateUser(userData);
    }
  }, [updateUser]);

  // 5. Hàm đăng xuất (Xóa sạch token và dữ liệu user)
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user_info');
    localStorage.removeItem('access_token');
  }, []);

  // Chuẩn hóa role về dạng chữ thường ('admin' hoặc 'staff')
  const role = user?.role ? String(user.role).toLowerCase() : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};