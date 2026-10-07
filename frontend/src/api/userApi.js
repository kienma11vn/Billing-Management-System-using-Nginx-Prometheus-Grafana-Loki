import axiosClient from './axiosClient';

export const userApi = {
  /**
   * Lấy danh sách người dùng trong hệ thống (Dành cho Admin)
   * @param {Object} [params] - Các tham số truy vấn
   * @param {number} [params.skip=0] - Số bản ghi bỏ qua
   * @param {number} [params.limit=20] - Số lượng bản ghi lấy ra (1 - 100)
   * @param {string} [params.search] - Tìm kiếm theo Tên hoặc Email
   * @param {string} [params.role] - Lọc theo Vai trò ('admin' | 'staff')
   * @param {boolean} [params.is_active] - Lọc theo trạng thái hoạt động (true/false)
   */
  getAll: (params) => axiosClient.get('/users/', { params }),

  /**
   * Lấy thông tin chi tiết một người dùng theo ID
   * @param {number|string} id - ID người dùng
   */
  getById: (id) => axiosClient.get(`/users/${id}`),

  /**
   * Tạo tài khoản người dùng mới (Dành cho Admin)
   * @param {Object} data - { email, password, full_name, role, is_active }
   */
  create: (data) => axiosClient.post('/users/', data),

  /**
   * Cập nhật thông tin người dùng (Họ tên, Vai trò, Trạng thái)
   * @param {number|string} id - ID người dùng
   * @param {Object} data - { full_name, role, is_active }
   */
  update: (id, data) => axiosClient.put(`/users/${id}`, data),

  /**
   * Khóa hoặc Mở khóa tài khoản người dùng (Dành cho Admin)
   * @param {number|string} id - ID người dùng
   * @param {boolean} isActive - Trạng thái hoạt động mới (true/false)
   */
  updateStatus: (id, isActive) =>
    axiosClient.patch(`/users/${id}/status`, null, {
      params: { is_active: isActive },
    }),

  /**
   * Admin chủ động đặt lại mật khẩu cho nhân viên
   * @param {number|string} id - ID người dùng
   * @param {Object} data - { new_password }
   */
  resetPassword: (id, data) => axiosClient.post(`/users/${id}/reset-password`, data),
};

export default userApi;