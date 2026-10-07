import axiosClient from './axiosClient';

export const auditApi = {
  getAll: (params) => {
    const { startDate, endDate, ...rest } = params || {};
    return axiosClient.get('/audit-logs/', {
      params: {
        ...rest,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      },
    });
  },
  
  export: () => axiosClient.get('/audit-logs/export', { responseType: 'blob' }),
};