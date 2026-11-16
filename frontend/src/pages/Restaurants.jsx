import React, { useState, useEffect } from 'react';
import { Search, Utensils, Sparkles, Star, Clock, Tag, X } from 'lucide-react';
import { fetchRestaurants } from '../api/restaurants';
import RestaurantCard from '../components/RestaurantCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 12;

const CATEGORIES = [
  { id: 'all', label: 'Sab Kuch (All)', icon: '🍽️', matcher: () => true },
  { id: 'chai_maggi', label: 'Chai & Maggi', icon: '☕', matcher: (r) => /chai|tapri|nescafe|maggi|samosa|tea|pakora|coffee|bun maska/i.test(`${r.name} ${r.description}`) },
  { id: 'thali_biryani', label: 'Thalis & Biryani', icon: '🍛', matcher: (r) => /spice|junction|dhaba|thali|biryani|curry|dal|chole|rajma|roti|paratha/i.test(`${r.name} ${r.description}`) },
  { id: 'dosa', label: 'Dosa & Tiffins', icon: '🥞', matcher: (r) => /anna|dosa|idli|south|udupi|tiffin|vada|sambar/i.test(`${r.name} ${r.description}`) },
  { id: 'rolls', label: 'Kathi Rolls & Chaat', icon: '🌯', matcher: (r) => /roll|kathi|shawarma|frankie|street|chaat|bites|kolkata/i.test(`${r.name} ${r.description}`) },
  { id: 'pizza', label: 'Desi Pizza & Italian', icon: '🍕', matcher: (r) => /pizza|italian|cafe|mario|bread/i.test(`${r.name} ${r.description}`) },
  { id: 'veg', label: '100% Pure Veg', icon: '🌱', matcher: (r) => /dosa|tiffin|chai|tapri/i.test(`${r.name} ${r.description}`) || !/chicken|pepperoni|meat/i.test(`${r.name} ${r.description}`) },
  { id: 'mithai', label: 'Mithai & Shakes', icon: '🍨', matcher: (r) => /sweet|dessert|mithai|bakery|shake|lassi|chai|coffee|brownie|jamun/i.test(`${r.name} ${r.description}`) },
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
    loadData();
  }, [page, debouncedSearch]);

  const handleCategoryClick = (cat) => {
    // Toggle back to 'all' if clicked again, otherwise activate selected category
    setActiveCategory((prev) => (prev === cat.id ? 'all' : cat.id));
    setPage(1);
    // Crucial: searchTerm is NOT modified! The search bar stays clean and independent.
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setActiveCategory('all');
    setFilterRating4Plus(false);
    setFilterFastDelivery(false);
    setPage(1);
  };

  // Find active category definition
  const activeCategoryObj = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  // Filtering: Category matcher, rating, and fast delivery
  const displayedRestaurants = restaurants.filter((r) => {
    if (activeCategory !== 'all' && activeCategoryObj?.matcher && !activeCategoryObj.matcher(r)) {
      return false;
    }
    if (filterRating4Plus && Number(r.average_rating || 4.8) < 4.5) return false;
    if (filterFastDelivery && !/chai|tapri|roll|dosa|express|fast|pizza|slice/i.test(`${r.name} ${r.description}`)) {
      return false;
    }
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

      {/* 2. Campus Special Offers Hero Banner */}
      <div className="uber-promo-banner">
        <div style={{ maxWidth: '580px', zIndex: 1 }}>
          <div className="promo-tag-pill">
            <Sparkles size={12} /> Desi Campus Specials • Garma-Garam Bites
          </div>

          <h2 className="promo-banner-title">
            Craving Hot Canteen Bites Between Lectures?
          </h2>

          <p className="promo-banner-desc">
            Student couriers deliver steaming Kulhad Chai, Double Masala Maggi, Kathi Rolls & Biryani directly to your hostel room, library desk, or LHC in under 15 minutes!
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="promo-coupon-badge">
              <Tag size={13} /> USE CODE: CAMPUSBITE
            </div>

            <span className="promo-offer-text">
              ⚡ Flat 20% OFF + Free Hostel Delivery
            </span>
          </div>
        </div>

        {/* Decorative Graphic Element (Hidden on small screens) */}
        <div className="promo-graphic-badge">
          ☕
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
              placeholder="Search dishes, canteens (e.g. Masala Dosa, Chai, Maggi, Paneer, Biryani)..."
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
              <span>Fast Delivery (&lt;15m)</span>
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
          {debouncedSearch
            ? activeCategory !== 'all'
              ? `Search results for "${debouncedSearch}" in ${activeCategoryObj.label}`
              : `Search results for "${debouncedSearch}"`
            : activeCategory !== 'all'
            ? `${activeCategoryObj.label} Canteens & Stalls`
            : 'Top Campus Canteens, Cafeterias & Tapris'}
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
