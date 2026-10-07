import axiosClient from './axiosClient';

export const serviceApi = {
  /**
   * Lấy danh sách sản phẩm / dịch vụ
   * @param {Object} [params] - Các tham số truy vấn
   * @param {number} [params.skip=0] - Số bản ghi bỏ qua
   * @param {number} [params.limit=20] - Số lượng bản ghi lấy ra (1 - 100)
   * @param {string} [params.search] - Tìm kiếm theo Tên hoặc Mã dịch vụ
   * @param {boolean} [params.is_active] - Lọc theo trạng thái hoạt động (true/false)
   */
  getAll: (params) => axiosClient.get('/services/', { params }),

  /**
   * Lấy thông tin chi tiết một dịch vụ theo ID
   * @param {number|string} id - ID dịch vụ
   */
  getById: (id) => axiosClient.get(`/services/${id}`),

  /**
   * Thêm mới sản phẩm / dịch vụ (Admin)
   * @param {Object} data - { name, code, description, unit_price, is_active }
   */
  create: (data) => axiosClient.post('/services/', data),

  /**
   * Cập nhật thông tin / đơn giá dịch vụ (Admin)
   * @param {number|string} id - ID dịch vụ
   * @param {Object} data - Các trường cần cập nhật (ServiceUpdate)
   */
  update: (id, data) => axiosClient.put(`/services/${id}`, data),

  /**
   * Bật / Tắt trạng thái hoạt động của dịch vụ (Admin)
   * @param {number|string} id - ID dịch vụ
   * @param {boolean} isActive - Trạng thái mới (true/false)
   */
  updateStatus: (id, isActive) => 
    axiosClient.patch(`/services/${id}/status`, null, {
      params: { is_active: isActive },
    }),

  /**
   * Xóa sản phẩm / dịch vụ khỏi hệ thống (Admin)
   * @param {number|string} id - ID dịch vụ
   */
  delete: (id) => axiosClient.delete(`/services/${id}`),
};

export default serviceApi;