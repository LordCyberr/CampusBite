import React, { useState, useEffect } from 'react';
import { Search, Utensils, Sparkles, Star, Clock, Tag, X, ArrowRight } from 'lucide-react';
import { fetchRestaurants } from '../api/restaurants';
import RestaurantCard from '../components/RestaurantCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 6;

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🍽️', query: '' },
  { id: 'pizza', label: 'Pizza & Italian', icon: '🍕', query: 'Pizza' },
  { id: 'curry', label: 'Curries & Bowls', icon: '🍛', query: 'Spice' },
  { id: 'burger', label: 'Burgers & Fries', icon: '🍔', query: 'Burger' },
  { id: 'sandwich', label: 'Sandwiches', icon: '🥪', query: 'Sandwich' },
  { id: 'drinks', label: 'Shakes & Brews', icon: '🥤', query: 'Cafe' },
  { id: 'veg', label: 'Pure Veg', icon: '🥗', query: 'Veg' },
  { id: 'dessert', label: 'Bakery & Sweets', icon: '🍰', query: 'Bake' },
];

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filterRating4Plus, setFilterRating4Plus] = useState(false);
  const [filterFastDelivery, setFilterFastDelivery] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce search input by 400ms to prevent excessive backend requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
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

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat.id);
    setSearchTerm(cat.query);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setActiveCategory('all');
    setFilterRating4Plus(false);
    setFilterFastDelivery(false);
    setPage(1);
  };

  // Client-side quick filter overlays (rating & fast delivery)
  const displayedRestaurants = restaurants.filter((r) => {
    if (filterRating4Plus && Number(r.average_rating || 4.8) < 4.5) return false;
    if (filterFastDelivery && !/pizza|slice|express/i.test(r.name)) return false;
    return true;
  });

  const hasActiveFilters = Boolean(searchTerm || activeCategory !== 'all' || filterRating4Plus || filterFastDelivery);

  return (
    <div className="container page-wrapper">
      {/* 1. Uber Eats Style Category Bubbles Carousel */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800 }}>Explore Categories</h3>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Swipe for more</span>
        </div>

        <div className="category-scroll-track">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-pill-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
              aria-label={`Category ${cat.label}`}
            >
              <div className="category-pill-icon">
                {cat.icon}
              </div>
              <span className="category-pill-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Uber Eats "Special Offers" Hero Banner */}
      <div className="uber-promo-banner">
        <div style={{ maxWidth: '580px', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 79, 24, 0.2)',
              border: '1px solid rgba(255, 79, 24, 0.4)',
              color: '#FF7A45',
              borderRadius: 'var(--radius-full)',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
            }}
          >
            <Sparkles size={12} /> Special Campus Offers • Limited Time
          </div>

          <h2
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.25,
              marginBottom: '8px',
            }}
          >
            Craving Fresh Bites Between Lectures?
          </h2>

          <p
            style={{
              color: '#94A3B8',
              fontSize: '14px',
              lineHeight: 1.5,
              marginBottom: '16px',
            }}
          >
            Student couriers deliver directly to your dorm room, lecture hall, or campus library in under 20 minutes!
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px dashed #FF7A45',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                color: '#FF9E2C',
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Tag size={13} /> USE CODE: CAMPUSBITE
            </div>

            <span style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: 600 }}>
              ⚡ Flat 20% OFF + Free Delivery
            </span>
          </div>
        </div>

        {/* Decorative Graphic Element (Hidden on small screens) */}
        <div
          style={{
            fontSize: '84px',
            lineHeight: 1,
            userSelect: 'none',
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))',
            display: 'none',
          }}
          className="promo-graphic-badge"
        >
          🍔
        </div>
      </div>

      {/* 3. Search & Interactive Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Main Search Input */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search dishes, canteens, cuisines (e.g. Pizza, Spice, Paneer)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '40px',
                paddingRight: searchTerm ? '36px' : '14px',
                height: '42px',
                borderRadius: '10px',
              }}
              aria-label="Search Restaurants"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                aria-label="Clear Search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Zomato Quick Filter Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn-secondary btn-sm ${filterRating4Plus ? 'btn-primary' : ''}`}
              style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '12px' }}
              onClick={() => setFilterRating4Plus(!filterRating4Plus)}
            >
              <Star size={12} fill={filterRating4Plus ? '#FFFFFF' : '#D97706'} color={filterRating4Plus ? '#FFFFFF' : '#D97706'} />
              <span>Rating 4.5+</span>
            </button>

            <button
              type="button"
              className={`btn-secondary btn-sm ${filterFastDelivery ? 'btn-primary' : ''}`}
              style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '12px' }}
              onClick={() => setFilterFastDelivery(!filterFastDelivery)}
            >
              <Clock size={12} />
              <span>Fast Delivery (&lt;20m)</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn-secondary btn-sm"
                style={{ borderRadius: 'var(--radius-full)', padding: '6px 12px', fontSize: '12px' }}
                onClick={handleClearFilters}
              >
                <X size={12} /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Section Title & Results Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
          {debouncedSearch ? `Search results for "${debouncedSearch}"` : 'Top Campus Canteens & Eateries'}
        </h2>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          {displayedRestaurants.length} {displayedRestaurants.length === 1 ? 'place' : 'places'} available
        </span>
      </div>

      {/* 5. Content States */}
      {loading ? (
        <Loader message="Fetching campus restaurants..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : displayedRestaurants.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title={hasActiveFilters ? 'No matching restaurants found' : 'No restaurants open'}
          description={
            hasActiveFilters
              ? 'Try clearing your filters or searching for another keyword.'
              : 'There are currently no active restaurants listed on campus.'
          }
          action={
            hasActiveFilters ? (
              <button className="btn-secondary btn-sm" onClick={handleClearFilters}>
                Clear All Filters
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
              gap: 'var(--space-6)',
            }}
          >
            {displayedRestaurants.map((restaurant) => (
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

      {/* Inline styles for media query adjustments */}
      <style>{`
        @media (min-width: 768px) {
          .promo-graphic-badge {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Restaurants;
