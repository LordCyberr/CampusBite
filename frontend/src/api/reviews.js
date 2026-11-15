import apiClient from './client';

export const submitOrderReview = async (orderId, { rating, comment }) => {
  const response = await apiClient.post(`/orders/${orderId}/review`, {
    rating: Number(rating),
    comment: comment || null,
  });
  return response.data;
};

export const fetchRestaurantReviews = async (restaurantId, { page = 1, pageSize = 5 } = {}) => {
  const params = { page, page_size: pageSize };
  const response = await apiClient.get(`/restaurants/${restaurantId}/reviews`, { params });
  return response.data;
};
