import apiClient from './client';

export const fetchDeliveryOrders = async ({ status = '', page = 1, pageSize = 10 } = {}) => {
  const params = { page, page_size: pageSize };
  if (status && status !== 'ALL') {
    params.status = status;
  }
  const response = await apiClient.get('/delivery/orders', { params });
  return response.data;
};

export const updateDeliveryOrderStatus = async (orderId, newStatus) => {
  const response = await apiClient.patch(`/delivery/orders/${orderId}/status`, {
    status: newStatus,
  });
  return response.data;
};
