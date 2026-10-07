import axiosClient from './axiosClient';

const customerApi = {
  /**
   * Lấy danh sách khách hàng có phân trang và tìm kiếm từ khóa.
   * @param {Object} params - Tham số truy vấn { skip, limit, search }
   * @returns {Promise} Danh sách khách hàng (CustomerOut[])
   */
  getCustomers: (params = {}) => {
    return axiosClient.get('/customers/', { params });
  },

  /**
   * Xem thông tin chi tiết của một khách hàng theo ID.
   * @param {number|string} id - ID của khách hàng
   * @returns {Promise} Thông tin chi tiết khách hàng (CustomerOut)
   */
  getCustomerById: (id) => {
    return axiosClient.get(`/customers/${id}`);
  },

  /**
   * Tạo hồ sơ khách hàng mới.
   * @param {Object} data - Dữ liệu khách hàng { full_name, phone, email, tax_code, address, notes }
   * @returns {Promise} Khách hàng vừa được tạo (CustomerOut)
   */
  createCustomer: (data) => {
    return axiosClient.post('/customers/', data);
  },

  /**
   * Cập nhật thông tin hồ sơ khách hàng.
   * @param {number|string} id - ID của khách hàng
   * @param {Object} data - Thông tin cập nhật (CustomerUpdate)
   * @returns {Promise} Khách hàng sau khi cập nhật (CustomerOut)
   */
  updateCustomer: (id, data) => {
    return axiosClient.put(`/customers/${id}`, data);
  },

  /**
   * Xóa hồ sơ khách hàng (Lưu ý: Chỉ xóa được nếu chưa phát sinh hóa đơn).
   * @param {number|string} id - ID của khách hàng cần xóa
   * @returns {Promise} Thông báo phản hồi từ server
   */
  deleteCustomer: (id) => {
    return axiosClient.delete(`/customers/${id}`);
  },
};

export default customerApi;