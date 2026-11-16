import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Clock, Star, Tag, Heart } from 'lucide-react';

const RESTAURANT_IMAGES = {
  pizza: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=600&auto=format&fit=crop&q=80',
  curry: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
  burger: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
  cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
};

const RestaurantCard = ({ restaurant }) => {
  const [imgError, setImgError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Generate a clean 2-letter monogram for typographic branding fallback
  const monogram = (restaurant.name || 'CB')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  // Determine cuisine and banner image based on restaurant name
  const nameLower = (restaurant.name || '').toLowerCase();
  const isPizza = /pizza|italian|slice/i.test(nameLower);
  const isCurry = /spice|junction|curry|indian|dhaba|masala/i.test(nameLower);
  const isBurger = /burger|grill|bbq|wrap|crispy/i.test(nameLower);
  const isCafe = /cafe|coffee|bake|sweet|dessert|tea/i.test(nameLower);

  const cuisineTags = isPizza
    ? 'Italian • Gourmet Pizzas • Fast Bites'
    : isCurry
    ? 'North Indian • Rice Bowls • Curries'
    : isBurger
    ? 'American • Smash Burgers • Fries'
    : isCafe
    ? 'Cafe • Artisan Brews • Bakery'
    : 'Campus Eats • Student Specials';

  const bannerImg = isPizza
    ? RESTAURANT_IMAGES.pizza
    : isCurry
    ? RESTAURANT_IMAGES.curry
    : isBurger
    ? RESTAURANT_IMAGES.burger
    : isCafe
    ? RESTAURANT_IMAGES.cafe
    : RESTAURANT_IMAGES.default;

  const rating = restaurant.average_rating ? Number(restaurant.average_rating).toFixed(1) : '4.8';
  const deliveryTime = isPizza ? '15-20 min' : '20-25 min';
  const campusBuilding = isPizza ? 'North Campus • Block A' : isCurry ? 'Food Court • Central Hall' : 'Student Union • Level 1';

  return (
    <div
      className="card card-hoverable"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '16px',
        padding: '0',
        overflow: 'hidden',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Visual Photography Header with Zomato/Uber Eats Badges */}
      <div
        style={{
          position: 'relative',
          height: '180px',
          backgroundColor: '#1E293B',
          overflow: 'hidden',
        }}
      >
        {!imgError ? (
          <img
            src={bannerImg}
            alt={restaurant.name}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #FF6B4A 0%, #FF4F18 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '28px',
              fontWeight: 800,
            }}
          >
            {monogram}
          </div>
        )}

        {/* Gradient dark overlay for crystal-clear badge legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Badges: Location & Favorite Heart */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <MapPin size={11} color="var(--color-primary)" /> {campusBuilding}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
            aria-label="Add to favorites"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Heart size={16} fill={isFavorite ? '#FF4F18' : 'none'} color={isFavorite ? '#FF4F18' : '#334155'} />
          </button>
        </div>

        {/* Bottom Banner: Zomato / Uber Eats Discount Offer Strip */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            right: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '12px',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              letterSpacing: '0.02em',
            }}
          >
            <Tag size={13} color="#FBBF24" />
            <span>20% OFF UPTO $5 • CODE: CAMPUSBITE</span>
          </div>

          <span
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 7px',
              borderRadius: '5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Clock size={11} /> {deliveryTime}
          </span>
        </div>
      </div>

      {/* Card Content & Details */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {restaurant.name}
            </h3>

            {/* Zomato Green Rating Badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: '#267E3E',
                color: '#FFFFFF',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              <Star size={11} fill="#FFFFFF" /> {rating}
            </span>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
            {cuisineTags}
          </div>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              marginBottom: '16px',
              lineHeight: 1.45,
            }}
          >
            {restaurant.description || 'Serving freshly prepared campus favorites, student meals, and hot beverages.'}
          </p>
        </div>

        {/* Footer with Free Delivery & Direct Menu Link */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid var(--color-border-subtle)',
              marginBottom: '14px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--color-veg)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              ⚡ Free Campus Delivery
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>
              ~$6 (₹500) for one
            </span>
          </div>

          <Link
            to={`/restaurants/${restaurant.id}`}
            className="btn-primary"
            style={{
              width: '100%',
              textDecoration: 'none',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Explore Menu</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
