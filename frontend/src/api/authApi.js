import axiosClient from './axiosClient';

const authApi = {
  /**
   * Đăng nhập hệ thống
   * @param {Object} credentials - { username: 'email@example.com', password: 'yourpassword' }
   */
  login: async (credentials) => {
    // FastAPI OAuth2PasswordRequestForm yêu cầu định dạng application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('username', credentials.username || credentials.email);
    formData.append('password', credentials.password);

    return await axiosClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  /**
   * Đăng xuất hệ thống
   */
  logout: async () => {
    return await axiosClient.post('/auth/logout');
  },

  /**
   * Lấy thông tin người dùng đang đăng nhập
   */
  getMe: async () => {
    return await axiosClient.get('/auth/me');
  },

  /**
   * Đổi mật khẩu cá nhân
   * @param {Object} data - { current_password: '...', new_password: '...' }
   */
  changePassword: async (data) => {
    return await axiosClient.post('/auth/change-password', {
      current_password: data.current_password,
      new_password: data.new_password,
    });
  },
  
  /**
   * Yêu cầu gửi email khôi phục mật khẩu
   * @param {string} email
   */
  forgotPassword: async (email) => {
    return await axiosClient.post('/auth/forgot-password', { email });
  },
  
  /**
   * Thực hiện đặt lại mật khẩu bằng Token
   * @param {string} token
   * @param {string} newPassword
   */
  resetPassword: async (token, newPassword) => {
    return await axiosClient.post('/auth/reset-password', {
      token: token,
      new_password: newPassword,
    });
  },
};

export default authApi;