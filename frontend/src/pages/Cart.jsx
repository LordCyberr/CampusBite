import React, { useState } from 'react';
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
  X,
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
    appliedCoupon,
    discountAmount,
    finalAmount,
    applyCoupon,
    removeCoupon,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { formatPrice } = useCurrency();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState(null);

  const navigate = useNavigate();

  const handleApplyCoupon = (codeToApply) => {
    const code = codeToApply || couponInput;
    const result = applyCoupon(code);
    if (result.success) {
      setCouponFeedback({ type: 'success', text: result.message });
      setCouponInput('');
    } else {
      setCouponFeedback({ type: 'error', text: result.message });
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponFeedback({ type: 'info', text: 'Coupon removed successfully.' });
    setTimeout(() => setCouponFeedback(null), 3000);
  };

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

      {/* Interactive Coupons & Student Discounts Section */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: '20px', borderRadius: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Coupons & Student Offers</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700 }}>
            ⚡ Instant Savings
          </span>
        </div>

        {appliedCoupon ? (
          /* Applied State with Clear "Remove Coupon" Button */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1.5px dashed #16A34A',
              borderRadius: '12px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#DCFCE7',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '15px',
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#15803D' }}>
                  Code &apos;{appliedCoupon.code}&apos; Applied!
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  You save {formatPrice(discountAmount)} ({appliedCoupon.description})
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="btn-secondary btn-sm"
              style={{
                color: 'var(--color-error)',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
              }}
            >
              <X size={14} /> Remove Coupon
            </button>
          </div>
        ) : (
          /* Input Box & Quick Tap Promo Chips */
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyCoupon();
              }}
              style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}
            >
              <input
                type="text"
                placeholder="Enter Coupon Code (e.g. CAMPUSBITE)..."
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  if (couponFeedback) setCouponFeedback(null);
                }}
                style={{
                  flex: 1,
                  height: '42px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
                aria-label="Coupon Code Input"
              />
              <button
                type="submit"
                className="btn-primary"
                style={{
                  height: '42px',
                  padding: '0 20px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '13px',
                }}
              >
                Apply
              </button>
            </form>

            {couponFeedback && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor:
                    couponFeedback.type === 'error'
                      ? 'var(--color-error-surface)'
                      : 'rgba(34, 197, 94, 0.08)',
                  color:
                    couponFeedback.type === 'error'
                      ? 'var(--color-error)'
                      : '#15803D',
                  border: `1px solid ${
                    couponFeedback.type === 'error'
                      ? 'var(--color-error-border)'
                      : '#86EFAC'
                  }`,
                }}
              >
                {couponFeedback.text}
              </div>
            )}

            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Available Student Campus Offers (Tap to Apply):
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleApplyCoupon('CAMPUSBITE')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1.5px dashed var(--color-primary)',
                    backgroundColor: 'rgba(255, 79, 24, 0.06)',
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <Tag size={12} />
                  <span>CAMPUSBITE</span>
                  <span style={{ fontWeight: 500, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    (20% OFF)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyCoupon('FIRSTBITE')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1.5px dashed #8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.06)',
                    color: '#8B5CF6',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={12} />
                  <span>FIRSTBITE</span>
                  <span style={{ fontWeight: 500, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    (25% OFF)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyCoupon('CHAI10')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1.5px dashed #059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.06)',
                    color: '#059669',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <span>☕ CHAI10</span>
                  <span style={{ fontWeight: 500, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    (₹20 OFF)
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Campus Courier Delivery
          </span>
          <span style={{ fontWeight: 700, color: 'var(--color-veg)', fontSize: '13px' }}>
            FREE
          </span>
        </div>

        {appliedCoupon && discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#16A34A', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={13} /> Coupon Discount ({appliedCoupon.code})
            </span>
            <span style={{ fontWeight: 800, color: '#16A34A', fontSize: '14px' }}>
              -{formatPrice(discountAmount)}
            </span>
          </div>
        )}

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
            {formatPrice(finalAmount)}
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
