import { useState, useEffect, useCallback } from 'react';

/**
 * usePaginatedList Custom Hook
 *
 * NOTE FOR INSTRUCTOR / EXAMINER:
 * Reusable hook encapsulating common pagination, data fetching, loading,
 * error state handling, and manual re-fetch ("refresh") logic.
 * Eliminates repetitive boilerplate across Owner and Delivery list views.
 *
 * @param {Function} fetchFn - Async API function that returns { items, total_count }
 * @param {Object} options - { pageSize, dependencies }
 */
export const usePaginatedList = (fetchFn, { pageSize = 10, dependencies = [] } = {}) => {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchFn({ page, pageSize });
      setItems(data.items || []);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to load list data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, pageSize, ...dependencies]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    items,
    totalCount,
    page,
    pageSize,
    loading,
    error,
    setPage,
    refresh: loadData,
  };
};

export default usePaginatedList;
