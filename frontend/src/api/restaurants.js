import apiClient from './client';

export const fetchRestaurants = async ({ page = 1, pageSize = 9, q = '' } = {}) => {
  const params = { page, page_size: pageSize };
  if (q && q.trim()) {
    params.q = q.trim();
  }
  const response = await apiClient.get('/restaurants', { params });
  return response.data;
};

export const fetchRestaurantById = async (id) => {
  const response = await apiClient.get(`/restaurants/${id}`);
  return response.data;
};

export const fetchRestaurantMenu = async (restaurantId, { page = 1, pageSize = 12, q = '', minPrice, maxPrice } = {}) => {
  const params = { page, page_size: pageSize };
  if (q && q.trim()) {
    params.q = q.trim();
  }
  if (minPrice !== undefined && minPrice !== '') {
    params.min_price = minPrice;
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    params.max_price = maxPrice;
  }
  const response = await apiClient.get(`/restaurants/${restaurantId}/menu`, { params });
  return response.data;
};
