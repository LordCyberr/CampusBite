import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  UtensilsCrossed,
  MapPin,
  X,
  Star,
  MessageSquare,
  User,
  Calendar,
} from 'lucide-react';
import { fetchRestaurantById, fetchRestaurantMenu } from '../api/restaurants';
import { fetchRestaurantReviews } from '../api/reviews';
import DishCard from '../components/DishCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 8;
const REVIEWS_PAGE_SIZE = 5;

const RestaurantMenu = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsTotalCount, setReviewsTotalCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Debounce search by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadRestaurantAndMenu = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch restaurant info if not already loaded
      if (!restaurant) {
        const restData = await fetchRestaurantById(id);
        setRestaurant(restData);
      }

      // 2. Fetch dishes with search & price filters
      const menuData = await fetchRestaurantMenu(id, {
        page,
        pageSize: PAGE_SIZE,
        q: debouncedSearch,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      });

      setDishes(menuData.items || []);
      setTotalCount(menuData.total_count || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load restaurant menu.');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const data = await fetchRestaurantReviews(id, {
        page: reviewsPage,
        pageSize: REVIEWS_PAGE_SIZE,
      });
      setReviews(data.items || []);
      setReviewsTotalCount(data.total_count || 0);
      setAverageRating(data.average_rating || 0);
    } catch (err) {
      console.error('Failed to load restaurant reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurantAndMenu();
  }, [id, page, debouncedSearch, minPrice, maxPrice]);

  useEffect(() => {
    loadReviews();
  }, [id, reviewsPage]);

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchTerm || minPrice || maxPrice);

  return (
    <div className="container page-wrapper">
      {/* Back button */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link
          to="/restaurants"
          className="btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}
        >
          <ArrowLeft size={16} /> Back to Canteens
        </Link>
      </div>

      {/* Restaurant Header Banner */}
      {restaurant && (
        <div
          className="card"
          style={{
            marginBottom: 'var(--space-6)',
            backgroundColor: 'var(--color-bg-surface)',
            borderLeft: '5px solid var(--color-primary)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <MapPin size={16} color="var(--color-primary)" />
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Campus Food Stall #{restaurant.id}
              </span>
            </div>

            {/* Rating pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: 'var(--space-1) var(--space-3)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                color: '#d97706',
              }}
            >
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <span>
                {reviewsTotalCount > 0
                  ? `${Number(averageRating).toFixed(1)} ★ (${reviewsTotalCount} ${
                      reviewsTotalCount === 1 ? 'review' : 'reviews'
                    })`
                  : 'New (No reviews yet)'}
              </span>
            </div>
          </div>

          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>
            {restaurant.name}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
            {restaurant.description || 'Welcome! Browse our kitchen menu below to order directly.'}
          </p>
        </div>
      )}

      {/* Filter Toolbar: Search, Min Price, Max Price */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-6)',
          padding: 'var(--space-4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            alignItems: 'center',
          }}
        >
          {/* Dish Search */}
          <div style={{ flex: '2 1 200px', position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search dishes by name (e.g. Samosa, Burger)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 'var(--space-8)' }}
              aria-label="Search Dishes"
            />
          </div>

          {/* Min Price */}
          <div style={{ flex: '1 1 110px' }}>
            <input
              type="number"
              placeholder="Min ($)"
              min="0"
              step="0.5"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPage(1);
              }}
              aria-label="Minimum Price"
            />
          </div>

          {/* Max Price */}
          <div style={{ flex: '1 1 110px' }}>
            <input
              type="number"
              placeholder="Max ($)"
              min="0"
              step="0.5"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPage(1);
              }}
              aria-label="Maximum Price"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={clearFilters}
              style={{ flex: '0 0 auto' }}
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Dishes Grid */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        {loading ? (
          <Loader message="Loading canteen menu..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadRestaurantAndMenu} />
        ) : dishes.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title={hasActiveFilters ? 'No matching dishes' : 'No menu items available'}
            description={
              hasActiveFilters
                ? 'No dishes found matching your search or price criteria. Try adjusting your filters.'
                : 'This kitchen currently has no available dishes on the menu.'
            }
            action={
              hasActiveFilters ? (
                <button className="btn-secondary btn-sm" onClick={clearFilters}>
                  Reset Filters
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 'var(--space-5)',
              }}
            >
              {dishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  restaurantId={Number(id)}
                  restaurantName={restaurant?.name || ''}
                />
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

      {/* Customer Reviews Section */}
      <div className="card" style={{ padding: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--space-3)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <MessageSquare size={20} color="var(--color-primary)" />
              Customer Reviews
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', margin: 'var(--space-1) 0 0 0' }}>
              Verified feedback from students who ordered from this canteen
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-primary)' }}>
              {Number(averageRating).toFixed(1)}
            </span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((starVal) => (
                <Star
                  key={starVal}
                  size={16}
                  color={starVal <= Math.round(averageRating) ? '#f59e0b' : '#d1d5db'}
                  fill={starVal <= Math.round(averageRating) ? '#f59e0b' : 'none'}
                />
              ))}
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              ({reviewsTotalCount} total)
            </span>
          </div>
        </div>

        {reviewsLoading ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              backgroundColor: 'var(--color-bg-page)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <p style={{ margin: 0, fontWeight: 500 }}>No reviews yet. Be the first to review!</p>
            <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Place an order and share your dining experience after delivery.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--color-bg-page)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(235, 94, 40, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <User size={14} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                      {rev.customer_name || 'Verified Student'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {/* Stars */}
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          color={s <= rev.rating ? '#f59e0b' : '#d1d5db'}
                          fill={s <= rev.rating ? '#f59e0b' : 'none'}
                        />
                      ))}
                    </div>

                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Calendar size={12} />
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {rev.comment && (
                  <p
                    style={{
                      margin: 'var(--space-2) 0 0 0',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}

            {/* Reviews Pagination */}
            {reviewsTotalCount > REVIEWS_PAGE_SIZE && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  marginTop: 'var(--space-3)',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                  disabled={reviewsPage === 1}
                >
                  Previous
                </button>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  Page {reviewsPage} of {Math.ceil(reviewsTotalCount / REVIEWS_PAGE_SIZE)}
                </span>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setReviewsPage((p) => p + 1)}
                  disabled={reviewsPage >= Math.ceil(reviewsTotalCount / REVIEWS_PAGE_SIZE)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantMenu;
