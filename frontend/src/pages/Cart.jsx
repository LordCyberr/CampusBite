import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import EmptyState from '../components/EmptyState';

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
              Browse Restaurants
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container page-wrapper" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1>Your Order Cart</h1>
          <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
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

      {/* Cart Items List */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 0, overflow: 'hidden' }}>
        <div style={{ divideY: '1px solid var(--color-border)' }}>
          {items.map((item, idx) => (
            <div
              key={item.menu_item_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: idx < items.length - 1 ? '1px solid var(--color-border)' : 'none',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
              }}
            >
              {/* Item Info */}
              <div style={{ flex: '1 1 200px' }}>
                <h4 style={{ fontSize: 'var(--font-size-base)', marginBottom: '2px' }}>
                  {item.name}
                </h4>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  ${Number(item.price).toFixed(2)} each
                </p>
              </div>

              {/* Quantity Stepper & Subtotal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--color-bg-page)',
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: 'var(--space-2)', border: 'none', background: 'transparent' }}
                    onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span
                    style={{
                      padding: '0 var(--space-3)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 700,
                    }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: 'var(--space-2)', border: 'none', background: 'transparent' }}
                    onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <span
                  style={{
                    fontWeight: 700,
                    minWidth: '70px',
                    textAlign: 'right',
                    fontSize: 'var(--font-size-base)',
                  }}
                >
                  ${(item.price * item.quantity).toFixed(2)}
                </span>

                <button
                  type="button"
                  onClick={() => removeItem(item.menu_item_id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: 'var(--space-1)',
                  }}
                  title="Remove item"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary Card */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Items Subtotal ({totalCount} items)
          </span>
          <span style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>
            ${totalAmount.toFixed(2)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Campus Delivery Fee
          </span>
          <span style={{ fontWeight: 600, color: 'var(--color-success)', fontSize: 'var(--font-size-sm)' }}>
            FREE (Campus Student Courier)
          </span>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>
            Estimated Total
          </span>
          <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary)' }}>
            ${totalAmount.toFixed(2)}
          </span>
        </div>

        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-5)',
            backgroundColor: 'var(--color-bg-page)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          * Display estimate only. The backend server verifies and computes the immutable order total directly from database dish prices during order placement.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <Link to={`/restaurants/${restaurantId}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Add More Food
          </Link>

          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/checkout')}
            style={{ flex: 1 }}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
