import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Tag,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import EmptyState from '../components/EmptyState';

const CART_THUMBNAILS = {
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&auto=format&fit=crop&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=80',
  curry: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=150&auto=format&fit=crop&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=150&auto=format&fit=crop&q=80',
  fries: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=150&auto=format&fit=crop&q=80',
  drink: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80',
};

const getItemImage = (name) => {
  const n = (name || '').toLowerCase();
  if (/pizza/i.test(n)) return CART_THUMBNAILS.pizza;
  if (/burger/i.test(n)) return CART_THUMBNAILS.burger;
  if (/curry|biryani|dal|paneer|rice/i.test(n)) return CART_THUMBNAILS.curry;
  if (/sandwich|wrap/i.test(n)) return CART_THUMBNAILS.sandwich;
  if (/fries/i.test(n)) return CART_THUMBNAILS.fries;
  if (/drink|shake|coffee|tea/i.test(n)) return CART_THUMBNAILS.drink;
  return CART_THUMBNAILS.default;
};

const Cart = () => {
  const {
    restaurantId,
    restaurantName,
    items,
    totalCount,
    totalAmount,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { formatPrice } = useCurrency();

  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container page-wrapper">
        <EmptyState
          icon={ShoppingBag}
          title="Your Cart is Empty"
          description="You haven't added any dishes to your tray yet. Explore our campus kitchens and treat yourself!"
          action={
            <Link to="/restaurants" className="btn-primary" style={{ textDecoration: 'none' }}>
              Browse Canteens
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container page-wrapper" style={{ maxWidth: '820px' }}>
      {/* Header with Canteen Name & Clear Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 79, 24, 0.1)',
                color: 'var(--color-primary)',
                fontWeight: 800,
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              Bundled Campus Order
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Order Cart</h1>
          <p style={{ marginTop: '2px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Ordering from:{' '}
            <Link to={`/restaurants/${restaurantId}`} style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              {restaurantName || 'Campus Canteen'}
            </Link>
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={clearCart}
          style={{ color: 'var(--color-error)' }}
        >
          <Trash2 size={14} /> Clear Cart
        </button>
      </div>

      {/* Uber Eats Style "Free Delivery for items" Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid #BBE3C9',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#EAF6EE',
            color: '#1E7B48',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#135C34' }}>
            No additional delivery fee for student orders
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Student couriers deliver directly to your campus room or library desk.
          </div>
        </div>
      </div>

      {/* Cart Items List with Food Thumbnails */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 0, overflow: 'hidden', borderRadius: '14px' }}>
        <div>
          {items.map((item, idx) => {
            const isNonVeg = /chicken|meat|beef|pork|bacon|pepperoni|fish|mutton|prawn|egg/i.test(item.name);
            return (
              <div
                key={item.menu_item_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: idx < items.length - 1 ? '1px solid var(--color-border)' : 'none',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                {/* Thumbnail + Item Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 240px' }}>
                  <img
                    src={getItemImage(item.name)}
                    alt={item.name}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '1px solid var(--color-border)',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span className={isNonVeg ? 'nonveg-badge' : 'veg-badge'} />
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {item.name}
                      </h4>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                      {formatPrice(item.price)} each
                    </p>
                  </div>
                </div>

                {/* Swiggy / Uber Eats Stepper & Line Subtotal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="swiggy-stepper">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <span
                    style={{
                      fontWeight: 800,
                      minWidth: '80px',
                      textAlign: 'right',
                      fontSize: '15px',
                      fontFamily: 'var(--font-headings)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {formatPrice(item.price * item.quantity)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.menu_item_id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Uber Eats "Saving with promotions" tag */}
      <div
        style={{
          backgroundColor: '#FFF2ED',
          border: '1px solid #FFD4C4',
          borderRadius: '10px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#FF4F18',
          fontWeight: 700,
          fontSize: '13px',
          marginBottom: 'var(--space-6)',
        }}
      >
        <Tag size={16} />
        <span>Saving with Campus Student Promotions: 100% Free Courier Delivery Applied</span>
      </div>

      {/* Order Summary Card */}
      <div className="card" style={{ padding: '24px', borderRadius: '14px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '16px' }}>
          Bill Details
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Item Total ({totalCount} items)
          </span>
          <span style={{ fontWeight: 700, fontSize: '14px' }}>
            {formatPrice(totalAmount)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Campus Courier Delivery
          </span>
          <span style={{ fontWeight: 700, color: 'var(--color-veg)', fontSize: '13px' }}>
            FREE
          </span>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <div>
            <span style={{ fontSize: '16px', fontWeight: 800 }}>
              To Pay
            </span>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Inclusive of all taxes & student delivery
            </div>
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-headings)' }}>
            {formatPrice(totalAmount)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <Link to={`/restaurants/${restaurantId}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Add More Food
          </Link>

          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/checkout')}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '15px',
            }}
          >
            <span>Go to Checkout</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
