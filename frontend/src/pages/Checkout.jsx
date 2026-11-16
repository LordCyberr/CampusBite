import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Smartphone,
  QrCode,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { createOrder } from '../api/orders';

const CAMPUS_PRESETS = [
  'Hostel 4, Room 312',
  'Central Library, 2nd Floor Cubicle',
  'LHC (Lecture Hall Complex), Room 102',
  'SAC (Student Activity Center)',
];

const Checkout = () => {
  const { restaurantId, restaurantName, items, totalAmount, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const [deliveryAddress, setDeliveryAddress] = useState('Hostel 4, Room 312');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'meal_card' | 'cod'
  const [upiId, setUpiId] = useState('student@okhdfcbank');
  const [showQrModal, setShowQrModal] = useState(false);
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
          Browse Canteens
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

    if (paymentMethod === 'upi' && !upiId.trim()) {
      setError('Please enter a valid UPI ID or scan the campus QR code.');
      return;
    }

    setLoading(true);

    try {
      // Append payment indicator cleanly to address while respecting length constraints
      const paymentTag =
        paymentMethod === 'upi'
          ? `[UPI: ${upiId.trim()}]`
          : paymentMethod === 'meal_card'
          ? '[Campus Meal Card]'
          : '[COD]';

      const finalAddress = `${deliveryAddress.trim()} ${paymentTag}`.slice(0, 250);

      const order = await createOrder({
        restaurantId,
        deliveryAddress: finalAddress,
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
        <Link
          to="/cart"
          className="btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}
        >
          <ArrowLeft size={16} /> Back to Cart
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span
          style={{
            backgroundColor: 'rgba(255, 79, 24, 0.12)',
            color: 'var(--color-primary)',
            fontWeight: 800,
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase',
          }}
        >
          Instant Campus Delivery
        </span>
      </div>

      <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
        Checkout & Confirm
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
        Select your campus drop point, pick your preferred student payment method, and confirm your order.
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
        {/* 1. Delivery Address Card with Quick Campus Presets */}
        <div className="card" style={{ borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <MapPin size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Campus Delivery Drop Point</h3>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="delivery-address" style={{ fontWeight: 600, fontSize: '13px' }}>
              Building, Hostel & Room / Desk Number
            </label>
            <input
              id="delivery-address"
              type="text"
              required
              placeholder="e.g. Hostel 4 Room 312, or Central Library Desk 14"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              style={{ marginTop: '6px' }}
            />
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Quick Campus Locations:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {CAMPUS_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDeliveryAddress(preset)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: deliveryAddress === preset ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: deliveryAddress === preset ? 'rgba(255, 79, 24, 0.08)' : 'var(--color-bg-surface)',
                    color: deliveryAddress === preset ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  📍 {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Indian Campus Payment Selector */}
        <div className="card" style={{ borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Payment Method</h3>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#135C34', backgroundColor: '#EAF6EE', padding: '2px 8px', borderRadius: '4px' }}>
              100% Student Verified
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* UPI Option */}
            <div
              onClick={() => setPaymentMethod('upi')}
              style={{
                border: paymentMethod === 'upi' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: paymentMethod === 'upi' ? 'rgba(255, 79, 24, 0.04)' : 'var(--color-bg-surface)',
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    id="pay-upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    style={{ cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <label htmlFor="pay-upi" style={{ fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                      ⚡ UPI Instant Pay (Google Pay / PhonePe / Paytm / BHIM)
                    </label>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                      Zero gateway fees • Instant order routing to canteen counter
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#EBF4FF', color: '#1E40AF', padding: '2px 6px', borderRadius: '4px' }}>
                    GPay
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#F3E8FF', color: '#6B21A8', padding: '2px 6px', borderRadius: '4px' }}>
                    PhonePe
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#E0F2FE', color: '#0369A1', padding: '2px 6px', borderRadius: '4px' }}>
                    Paytm
                  </span>
                </div>
              </div>

              {paymentMethod === 'upi' && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 240px' }}>
                      <input
                        type="text"
                        placeholder="Enter UPI ID (e.g. mobile@upi or name@okaxis)"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        style={{ height: '38px', fontSize: '13px' }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setShowQrModal(!showQrModal)}
                      style={{ height: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                    >
                      <QrCode size={14} /> {showQrModal ? 'Hide QR' : 'Show Campus QR'}
                    </button>
                  </div>

                  {showQrModal && (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '14px',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px dashed var(--color-primary)',
                        borderRadius: '10px',
                        textAlign: 'center',
                        color: '#0F172A',
                      }}
                    >
                      <div style={{ fontSize: '48px', marginBottom: '6px' }}>📲</div>
                      <div style={{ fontWeight: 800, fontSize: '13px' }}>CampusBite Central Merchant VPA</div>
                      <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace', marginTop: '2px' }}>
                        campusbite.orders@icici
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#16A34A', fontWeight: 700, marginTop: '6px' }}>
                        <CheckCircle2 size={13} /> Auto-verified sandbox payment
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campus Student Card Option */}
            <div
              onClick={() => setPaymentMethod('meal_card')}
              style={{
                border: paymentMethod === 'meal_card' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: paymentMethod === 'meal_card' ? 'rgba(255, 79, 24, 0.04)' : 'var(--color-bg-surface)',
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    id="pay-card"
                    checked={paymentMethod === 'meal_card'}
                    onChange={() => setPaymentMethod('meal_card')}
                    style={{ cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <label htmlFor="pay-card" style={{ fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                      💳 University Student Meal Card / Campus Wallet
                    </label>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                      Pre-authorized student allowance • ID: 2026-CAMPUS-042
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Bal: ₹2,500
                </span>
              </div>
            </div>

            {/* Cash on Delivery Option */}
            <div
              onClick={() => setPaymentMethod('cod')}
              style={{
                border: paymentMethod === 'cod' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: paymentMethod === 'cod' ? 'rgba(255, 79, 24, 0.04)' : 'var(--color-bg-surface)',
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  id="pay-cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  style={{ cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                />
                <div>
                  <label htmlFor="pay-cod" style={{ fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                    💵 Cash on Hostel / LHC Delivery (COD)
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                    Pay in cash directly to your student courier upon food arrival
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Order Items Review */}
        <div className="card" style={{ borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ShoppingBag size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Order Summary</h3>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
              {restaurantName}
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              Student Courier Delivery
            </span>
            <span style={{ fontWeight: 800, color: 'var(--color-veg)', fontSize: '12px' }}>
              FREE
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Total Amount To Pay:</span>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Inclusive of all campus kitchen taxes
              </div>
            </div>
            <span style={{ fontWeight: 800, fontSize: '22px', color: 'var(--color-primary)', fontFamily: 'var(--font-headings)' }}>
              {formatPrice(totalAmount)}
            </span>
          </div>
        </div>

        {/* 4. Simulated Ledger Notice */}
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--color-primary-tint)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <ShieldCheck size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 800, marginBottom: '2px' }}>
              Simulated University Payment Ledger
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Demonstration Mode: Clicking &quot;Confirm & Place Order&quot; creates an immutable transaction entry in the backend <code>PaymentLedger</code> database and immediately routes your order to the canteen.
            </p>
          </div>
        </div>

        {/* 5. Submit Button */}
        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 800, borderRadius: '12px' }}
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
