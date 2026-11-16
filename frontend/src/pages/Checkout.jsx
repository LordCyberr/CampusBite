import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, MapPin, AlertCircle, ShoppingBag, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { createOrder } from '../api/orders';

const Checkout = () => {
  const { restaurantId, restaurantName, items, totalAmount, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const [deliveryAddress, setDeliveryAddress] = useState('Dormitory B, Room 204');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="container page-wrapper" style={{ textAlign: 'center', paddingTop: 'var(--space-12)' }}>
        <h2>No Items to Checkout</h2>
        <p style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link to="/restaurants" className="btn-primary" style={{ textDecoration: 'none' }}>
          Browse Restaurants
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!deliveryAddress.trim()) {
      setError('Please provide a campus delivery address (e.g. Hall name & room number).');
      return;
    }

    setLoading(true);

    try {
      const order = await createOrder({
        restaurantId,
        deliveryAddress: deliveryAddress.trim(),
        items,
      });

      // Clear client-side cart after backend confirms order creation
      clearCart();

      // Navigate directly to the live Order Tracking page
      navigate(`/orders/${order.id}`);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        'Unable to complete order. An item might be unavailable or out of stock.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-wrapper" style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/cart" className="btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <ArrowLeft size={16} /> Back to Cart
        </Link>
      </div>

      <h1 style={{ marginBottom: 'var(--space-2)' }}>Checkout & Confirm</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
        Review your tray, provide delivery instructions, and confirm your campus order.
      </p>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-error-surface)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-error)',
            marginBottom: 'var(--space-5)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Delivery Address Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <MapPin size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: 'var(--font-size-md)' }}>Campus Delivery Destination</h3>
          </div>
          <div>
            <label htmlFor="delivery-address">Building, Hall & Room Number</label>
            <input
              id="delivery-address"
              type="text"
              required
              placeholder="e.g. Science Block 2, Laboratory 104, or Hostel 3 Room 21"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              Our student delivery courier will bring your order directly to this location.
            </p>
          </div>
        </div>

        {/* Order Items Review */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ShoppingBag size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 'var(--font-size-md)' }}>Order Summary</h3>
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Kitchen: {restaurantName}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            {items.map((item) => (
              <div
                key={item.menu_item_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-sm)',
                  paddingBottom: 'var(--space-2)',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
              >
                <span>
                  <strong>{item.quantity}x</strong> {item.name}
                </span>
                <span style={{ fontWeight: 600 }}>
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: 'var(--space-2)',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>Order Total:</span>
            <span style={{ fontWeight: 800, fontSize: 'var(--font-size-xl)', color: 'var(--color-primary)' }}>
              {formatPrice(totalAmount)}
            </span>
          </div>
        </div>

        {/* Demo Payment Notice */}
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--color-primary-tint)',
            border: '1px solid #f5c7b3',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
          }}
        >
          <ShieldCheck size={24} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', marginBottom: '2px' }}>
              Simulated University Payment Ledger
            </h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              This is an academic capstone demonstration. No real bank, credit card, or UPI transfer will be charged.
              Clicking &quot;Place Order&quot; creates an immutable transaction entry in the backend <code>PaymentLedger</code> database.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', padding: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}
          disabled={loading}
        >
          <CheckCircle2 size={20} />
          <span>{loading ? 'Processing Order...' : `Confirm & Place Order (${formatPrice(totalAmount)})`}</span>
        </button>
      </form>
    </div>
  );
};

export default Checkout;
