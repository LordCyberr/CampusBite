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
  Clock,
  Tag,
  ShieldCheck,
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

const COVER_IMAGES = {
  pizza: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=1200&auto=format&fit=crop&q=80',
  curry: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
  burger: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=80',
  cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
};

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
  const [vegOnly, setVegOnly] = useState(false);
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
      if (!restaurant) {
        const restData = await fetchRestaurantById(id);
        setRestaurant(restData);
      }

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
    setVegOnly(false);
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchTerm || minPrice || maxPrice || vegOnly);

  const displayedDishes = vegOnly
    ? dishes.filter(
        (dish) =>
          !/chicken|meat|beef|pork|bacon|pepperoni|fish|mutton|prawn|egg/i.test(
            `${dish.name} ${dish.description || ''}`
          )
      )
    : dishes;

  // Determine cover image and cuisine
  const nameLower = (restaurant?.name || '').toLowerCase();
  const coverImg = /pizza/i.test(nameLower)
    ? COVER_IMAGES.pizza
    : /spice|curry|junction/i.test(nameLower)
    ? COVER_IMAGES.curry
    : /burger/i.test(nameLower)
    ? COVER_IMAGES.burger
    : /cafe|coffee|dessert/i.test(nameLower)
    ? COVER_IMAGES.cafe
    : COVER_IMAGES.default;

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

      {/* Graphical Restaurant Hero Banner (Uber Eats & Zomato Style) */}
      {restaurant && (
        <div
          className="card"
          style={{
            marginBottom: 'var(--space-6)',
            padding: 0,
            overflow: 'hidden',
            borderRadius: '16px',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Cover Photo Header */}
          <div
            style={{
              position: 'relative',
              height: '200px',
              backgroundColor: '#1E293B',
              overflow: 'hidden',
            }}
          >
            <img
              src={coverImg}
              alt={restaurant.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)',
              }}
            />

            {/* Badges on Top Cover */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '24px',
                right: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 79, 24, 0.9)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'inline-block',
                    marginBottom: '6px',
                  }}
                >
                  Campus Food Stall #{restaurant.id}
                </span>
                <h1
                  style={{
                    color: '#FFFFFF',
                    fontSize: '26px',
                    fontWeight: 800,
                    margin: 0,
                    textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                  }}
                >
                  {restaurant.name}
                </h1>
              </div>

              {/* Green Star Rating Pill */}
              <div
                style={{
                  backgroundColor: '#267E3E',
                  color: '#FFFFFF',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <Star size={16} fill="#FFFFFF" color="#FFFFFF" />
                <span>{reviewsTotalCount > 0 ? Number(averageRating).toFixed(1) : '4.8'}</span>
                <span style={{ fontSize: '11px', opacity: 0.85, fontWeight: 500 }}>
                  ({reviewsTotalCount || 24} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Details & Delivery Info Bar */}
          <div style={{ padding: '20px 24px' }}>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
                margin: '0 0 16px 0',
                lineHeight: 1.5,
              }}
            >
              {restaurant.description || 'Welcome! Browse our kitchen menu below to order directly.'}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                paddingTop: '12px',
                borderTop: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="var(--color-primary)" />
                <span style={{ fontWeight: 600 }}>15-20 min campus delivery</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="var(--color-primary)" />
                <span>Central Campus Food Court</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={15} color="var(--color-veg)" />
                <span style={{ color: 'var(--color-veg)', fontWeight: 600 }}>Hygiene Verified Kitchen</span>
              </div>

              <div
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--color-primary-tint)',
                  color: 'var(--color-primary)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                <Tag size={13} />
                <span>CODE: CAMPUSBITE (20% OFF)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar: Search, Min Price, Max Price, Pure Veg */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-6)',
          padding: '16px 20px',
          borderRadius: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Dish Search */}
          <div style={{ flex: '2 1 220px', position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search dishes by name (e.g. Samosa, Burger, Fries)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px' }}
              aria-label="Search Dishes"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Min Price */}
          <div style={{ flex: '1 1 100px' }}>
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
              style={{ height: '38px' }}
              aria-label="Minimum Price"
            />
          </div>

          {/* Max Price */}
          <div style={{ flex: '1 1 100px' }}>
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
              style={{ height: '38px' }}
              aria-label="Maximum Price"
            />
          </div>

          {/* Swiggy Pure Veg Toggle */}
          <button
            type="button"
            onClick={() => setVegOnly(!vegOnly)}
            className={`btn-secondary btn-sm ${vegOnly ? 'btn-primary' : ''}`}
            style={{
              borderRadius: 'var(--radius-full)',
              gap: '6px',
              backgroundColor: vegOnly ? 'var(--color-veg)' : undefined,
              borderColor: vegOnly ? 'var(--color-veg)' : undefined,
              color: vegOnly ? '#FFFFFF' : 'var(--color-text-primary)',
              fontWeight: 700,
              fontSize: '12px',
              flex: '0 0 auto',
              height: '38px',
              padding: '0 14px',
            }}
          >
            <span className="veg-badge" style={{ width: '13px', height: '13px' }} />
            <span>Pure Veg</span>
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={clearFilters}
              style={{ flex: '0 0 auto', height: '38px' }}
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Dishes Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
          Menu Items ({displayedDishes.length})
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          All dishes prepared fresh to order
        </span>
      </div>

      {/* Dishes Grid */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        {loading ? (
          <Loader message="Loading canteen menu..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadRestaurantAndMenu} />
        ) : displayedDishes.length === 0 ? (
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {displayedDishes.map((dish) => (
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
      <div className="card" style={{ padding: 'var(--space-6)', marginTop: 'var(--space-6)', borderRadius: '14px' }}>
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
