import axiosClient from './axiosClient';

const invoiceApi = {
  /**
   * Lấy danh sách hóa đơn hỗ trợ phân trang và bộ lọc
   * @param {Object} params - Các tham số truy vấn
   * @param {number} [params.skip=0] - Số bản ghi bỏ qua (phân trang)
   * @param {number} [params.limit=20] - Số lượng bản ghi lấy ra (1 - 100)
   * @param {number} [params.customer_id] - Lọc theo ID khách hàng
   * @param {string} [params.status] - Lọc theo trạng thái ('unpaid', 'partial', 'paid', 'cancelled')
   * @param {string} [params.search] - Tìm kiếm theo Tên hoặc SĐT Khách hàng
   */
  getInvoices: (params = {}) => {
    return axiosClient.get('/invoices/', { params });
  },

  /**
   * Lấy thông tin chi tiết một hóa đơn theo ID (Bao gồm danh sách mặt hàng & lịch sử thanh toán)
   * @param {number|string} id - ID của hóa đơn
   */
  getInvoiceById: (id) => {
    return axiosClient.get(`/invoices/${id}`);
  },

  /**
   * Lập hóa đơn mới
   * @param {Object} data - Dữ liệu hóa đơn (customer_id, items, discount_amount, note)
   */
  createInvoice: (data) => {
    return axiosClient.post('/invoices/', data);
  },

  /**
   * Thu tiền / Thêm đợt thanh toán cho hóa đơn
   * @param {number|string} id - ID của hóa đơn
   * @param {Object} paymentData - { amount, payment_method, note }
   */
  collectPayment: (id, paymentData) => {
    return axiosClient.post(`/invoices/${id}/payments`, paymentData);
  },

  /**
   * Hủy hóa đơn
   * @param {number|string} id - ID của hóa đơn
   * @param {string} [reason] - Lý do hủy hóa đơn (truyền dưới dạng query param)
   */
  cancelInvoice: (id, reason = '') => {
    return axiosClient.post(`/invoices/${id}/cancel`, null, {
      params: reason ? { reason } : {},
    });
  },
};

export default invoiceApi;