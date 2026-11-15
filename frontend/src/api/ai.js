import apiClient from './client';

export const fetchAIInsights = async (question) => {
  const payload = question && question.trim() ? { question: question.trim() } : {};
  const response = await apiClient.post('/ai/insights', payload);
  return response.data;
};
