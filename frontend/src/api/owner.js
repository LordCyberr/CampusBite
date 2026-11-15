import apiClient from './client';

export const fetchOwnerStats = async () => {
  const response = await apiClient.get('/owner/stats');
  return response.data;
};

export const fetchOwnerReminders = async ({ includeResolved = false, page = 1, pageSize = 10 } = {}) => {
  const params = {
    include_resolved: includeResolved,
    page,
    page_size: pageSize,
  };
  const response = await apiClient.get('/owner/reminders', { params });
  return response.data;
};

export const fetchOwnerOrders = async ({
  status = '',
  dateFrom = '',
  dateTo = '',
  page = 1,
  pageSize = 10,
} = {}) => {
  const params = { page, page_size: pageSize };
  if (status && status !== 'ALL') params.status = status;
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  const response = await apiClient.get('/owner/orders', { params });
  return response.data;
};

export const updateOrderStatusByOwner = async (orderId, newStatus) => {
  const response = await apiClient.patch(`/orders/${orderId}/status`, {
    status: newStatus,
  });
  return response.data;
};

export const fetchDeliveryPartners = async () => {
  const response = await apiClient.get('/owner/delivery-partners');
  return response.data;
};

export const assignDeliveryPartner = async (orderId, courierId) => {
  const response = await apiClient.patch(`/orders/${orderId}/assign`, {
    delivery_partner_id: Number(courierId),
  });
  return response.data;
};

export const fetchMyRestaurant = async () => {
  const response = await apiClient.get('/restaurants/mine');
  return response.data;
};

export const createRestaurant = async ({ name, description }) => {
  const response = await apiClient.post('/restaurants', { name, description });
  return response.data;
};

export const updateRestaurant = async (restaurantId, { name, description }) => {
  const response = await apiClient.put(`/restaurants/${restaurantId}`, { name, description });
  return response.data;
};

export const addMenuItem = async (restaurantId, { name, description, price }) => {
  const response = await apiClient.post(`/restaurants/${restaurantId}/menu`, {
    name,
    description,
    price: Number(price),
  });
  return response.data;
};

export const updateMenuItem = async (itemId, { name, description, price }) => {
  const response = await apiClient.put(`/menu-items/${itemId}`, {
    name,
    description,
    price: Number(price),
  });
  return response.data;
};

export const toggleMenuItemAvailability = async (itemId, isAvailable) => {
  const response = await apiClient.patch(`/menu-items/${itemId}/availability`, {
    is_available: isAvailable,
  });
  return response.data;
};

export const deleteMenuItem = async (itemId) => {
  const response = await apiClient.delete(`/menu-items/${itemId}`);
  return response.data;
};

export const fetchOwnerReturns = async ({ page = 1, pageSize = 10 } = {}) => {
  const params = { page, page_size: pageSize };
  const response = await apiClient.get('/owner/returns', { params });
  return response.data;
};

export const decideReturnRequest = async (orderId, decision) => {
  const response = await apiClient.patch(`/orders/${orderId}/return/decision`, {
    decision, // 'approve' or 'reject'
  });
  return response.data;
};
