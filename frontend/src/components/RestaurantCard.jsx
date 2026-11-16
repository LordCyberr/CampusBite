import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Clock, Star } from 'lucide-react';

const RestaurantCard = ({ restaurant }) => {
  // Generate a clean 2-letter monogram for typographic branding
  const monogram = (restaurant.name || 'CB')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  // Generate deterministic appetizing food tags based on restaurant name
  const isPizza = /pizza/i.test(restaurant.name);
  const isCurry = /spice|junction|canteen|curry/i.test(restaurant.name);
  const cuisineTags = isPizza
    ? 'Italian • Pizzas • Fast Food'
    : isCurry
    ? 'Indian • Bowls • Street Food'
    : 'Campus Eats • Student Meals';

  const rating = restaurant.average_rating ? Number(restaurant.average_rating).toFixed(1) : '4.8';
  const deliveryTime = isPizza ? '15-20 min' : '20-25 min';

  return (
    <div
      className="card card-hoverable"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius)',
        padding: '0',
        overflow: 'hidden',
        background: '#FFFFFF',
      }}
    >
      {/* Visual Header Banner */}
      <div
        style={{
          background: isPizza
            ? 'linear-gradient(135deg, #FF6B4A 0%, #FF4F18 100%)'
            : 'linear-gradient(135deg, #FF9E2C 0%, #FF6F00 100%)',
          padding: '24px 20px',
          color: '#FFFFFF',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#FFFFFF',
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-headings)',
              fontWeight: 800,
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            {monogram}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: '#267E3E',
                color: '#FFFFFF',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <Star size={12} fill="#FFFFFF" /> {rating}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#FFFFFF',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <Clock size={12} /> {deliveryTime}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ marginBottom: '6px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {restaurant.name}
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {cuisineTags}
            </div>
          </div>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              marginBottom: '16px',
              lineHeight: 1.45,
            }}
          >
            {restaurant.description || 'Serving freshly prepared campus favorites, student meals, and beverages.'}
          </p>
        </div>

        {/* Footer with Location & View Menu */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-border-subtle)',
              marginBottom: '12px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="var(--color-primary)" /> Campus Canteen
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-veg)' }}>⚡ Free Delivery</span>
          </div>

          <Link
            to={`/restaurants/${restaurant.id}`}
            className="btn-primary"
            style={{
              width: '100%',
              textDecoration: 'none',
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
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
