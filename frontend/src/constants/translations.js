import { UserRole, InvoiceStatus } from './enums';

export const USER_ROLE_VI = {
  [UserRole.ADMIN]: 'Quản trị viên',
  [UserRole.STAFF]: 'Nhân viên',
};

export const INVOICE_STATUS_VI = {
  [InvoiceStatus.UNPAID]: 'Chưa thanh toán',
  [InvoiceStatus.PARTIAL]: 'Thanh toán một phần',
  [InvoiceStatus.PAID]: 'Đã thanh toán',
  [InvoiceStatus.CANCELLED]: 'Đã hủy',
};

export const formatUserRole = (role) => {
  return USER_ROLE_VI[role] || role;
};

export const formatInvoiceStatus = (status) => {
  return INVOICE_STATUS_VI[status] || status;
};