import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ArrowRight, MapPin } from 'lucide-react';

const RestaurantCard = ({ restaurant }) => {
  // Generate a clean 2-letter monogram for typographic branding without stock images
  const monogram = (restaurant.name || 'CB')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div>
        {/* Brand Crest Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius)',
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverted)',
              fontFamily: 'var(--font-headings)',
              fontWeight: 800,
              fontSize: 'var(--font-size-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '0.05em',
            }}
          >
            {monogram}
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
              {restaurant.name}
            </h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <MapPin size={12} /> Campus Canteen
            </span>
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-5)',
            minHeight: '42px',
          }}
        >
          {restaurant.description || 'Serving freshly prepared campus favorites, student meals, and beverages.'}
        </p>
      </div>

      {/* Action Footer */}
      <Link
        to={`/restaurants/${restaurant.id}`}
        className="btn-primary"
        style={{
          width: '100%',
          textDecoration: 'none',
        }}
      >
        <span>View Menu</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
};

export default RestaurantCard;
