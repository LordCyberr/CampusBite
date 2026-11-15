import apiClient from './client';

export const createOrder = async ({ restaurantId, deliveryAddress, items }) => {
  const payload = {
    restaurant_id: Number(restaurantId),
    delivery_address: deliveryAddress,
    items: items.map((item) => ({
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
    })),
  };
  const response = await apiClient.post('/orders', payload);
  return response.data;
};

export const fetchMyOrders = async ({
  page = 1,
  pageSize = 10,
  status = '',
  dateFrom = '',
  dateTo = '',
} = {}) => {
  const params = { page, page_size: pageSize };
  if (status && status !== 'ALL') {
    params.status = status;
  }
  if (dateFrom) {
    params.date_from = dateFrom;
  }
  if (dateTo) {
    params.date_to = dateTo;
  }
  const response = await apiClient.get('/orders', { params });
  return response.data;
};

export const fetchOrderById = async (orderId) => {
  const response = await apiClient.get(`/orders/${orderId}`);
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const response = await apiClient.post(`/orders/${orderId}/cancel`);
  return response.data;
};

export const submitOrderReturn = async (orderId, reason) => {
  const response = await apiClient.post(`/orders/${orderId}/return`, {
    reason,
  });
  return response.data;
};

