import React, { useState, useEffect } from 'react';
import { Search, Utensils } from 'lucide-react';
import { fetchRestaurants } from '../api/restaurants';
import RestaurantCard from '../components/RestaurantCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 6;

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce search input by 400ms to prevent excessive backend requests on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchRestaurants({
        page,
        pageSize: PAGE_SIZE,
        q: debouncedSearch,
      });
      setRestaurants(data.items || []);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load campus restaurants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    loadData();
    return () => {
      active = false;
    };
  }, [page, debouncedSearch]);

  return (
    <div className="container page-wrapper">
      {/* Header & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div>
          <h1>Campus Restaurants & Canteens</h1>
          <p style={{ marginTop: 'var(--space-1)' }}>
            Choose your favorite campus eatery, browse menus, and order fresh food directly to your dorm or hall.
          </p>
        </div>

        {/* Search Bar & Quick Category Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: '640px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search canteens and kitchens by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 'var(--space-8)' }}
              aria-label="Search Restaurants"
            />
          </div>

          {/* Swiggy Quick Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn-secondary btn-sm ${searchTerm === '' ? 'btn-primary' : ''}`}
              style={{ borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '12px' }}
              onClick={() => setSearchTerm('')}
            >
              All Canteens
            </button>
            <button
              type="button"
              className={`btn-secondary btn-sm ${searchTerm === 'Pizza' ? 'btn-primary' : ''}`}
              style={{ borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '12px' }}
              onClick={() => setSearchTerm('Pizza')}
            >
              🍕 Pizzeria
            </button>
            <button
              type="button"
              className={`btn-secondary btn-sm ${searchTerm === 'Spice' ? 'btn-primary' : ''}`}
              style={{ borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '12px' }}
              onClick={() => setSearchTerm('Spice')}
            >
              🍛 Curries & Bowls
            </button>
          </div>
        </div>
      </div>

      {/* Content States */}
      {loading ? (
        <Loader message="Fetching campus restaurants..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : restaurants.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title={debouncedSearch ? 'No matching restaurants found' : 'No restaurants open'}
          description={
            debouncedSearch
              ? `We couldn't find any canteens matching "${debouncedSearch}". Try a different keyword.`
              : 'There are currently no active restaurants listed on campus.'
          }
          action={
            debouncedSearch ? (
              <button className="btn-secondary btn-sm" onClick={() => setSearchTerm('')}>
                Clear Search
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default Restaurants;
