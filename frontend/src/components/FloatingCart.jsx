import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const FloatingCart = () => {
  const { totalCount, totalAmount, restaurantName } = useCart();
  const { formatPrice } = useCurrency();
  const location = useLocation();

  // Hide on Cart and Checkout pages to avoid visual redundancy
  if (totalCount === 0 || location.pathname === '/cart' || location.pathname === '/checkout') {
    return null;
  }

  return (
    <div className="floating-cart-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            background: 'var(--color-primary)',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(255, 79, 24, 0.4)',
          }}
        >
          <ShoppingBag size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>
            {totalCount} {totalCount === 1 ? 'item' : 'items'} | {formatPrice(totalAmount)}
          </div>
          {restaurantName && (
            <div style={{ fontSize: '12px', color: '#B0B0B0' }}>
              From {restaurantName}
            </div>
          )}
        </div>
      </div>

      <Link
        to="/cart"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--color-primary)',
          color: '#FFFFFF',
          padding: '8px 18px',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 700,
          fontSize: '14px',
          textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(255, 79, 24, 0.3)',
          transition: 'background 0.15s ease',
        }}
      >
        <span>View Cart</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
};

export default FloatingCart;
