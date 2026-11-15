import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  XCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Star,
  RotateCcw,
  MessageSquare,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { fetchOrderById, cancelOrder, submitOrderReturn } from '../api/orders';
import { submitOrderReview } from '../api/reviews';
import OrderTimeline from '../components/OrderTimeline';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const FINAL_STATES = ['DELIVERED', 'CANCELLED', 'REFUNDED'];

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState('');
  const [submittedReview, setSubmittedReview] = useState(null);

  // Return state
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnSuccessMessage, setReturnSuccessMessage] = useState('');

  const loadOrder = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError('');
    try {
      const data = await fetchOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load order details.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadOrder();
  }, [id]);

  // Live Polling every 15 seconds while order is not in a final state
  useEffect(() => {
    if (!order || FINAL_STATES.includes(order.status)) {
      return; // Stop timer when order is delivered, cancelled, or refunded
    }

    const intervalId = setInterval(() => {
      loadOrder(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [order?.status, id]);

  const handleCancel = async () => {
    const confirm = window.confirm(
      'Are you sure you want to cancel this order? Since the kitchen has not started preparing it yet, an instant refund will be recorded in the payment ledger.'
    );
    if (!confirm) return;

    setCancelling(true);
    setCancelMessage('');
    try {
      const updatedOrder = await cancelOrder(order.id);
      setOrder(updatedOrder);
      setCancelMessage('Order was successfully cancelled. Full refund recorded in the ledger.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const savedReview = await submitOrderReview(order.id, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setSubmittedReview(savedReview);
      setReviewSuccessMessage('Thank you! Your review has been published.');
      setOrder((prev) => ({ ...prev, has_review: true }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (returnReason.trim().length < 5) {
      setReturnError('Reason must be at least 5 characters long.');
      return;
    }

    setSubmittingReturn(true);
    setReturnError('');
    try {
      const updatedOrder = await submitOrderReturn(order.id, returnReason.trim());
      setOrder(updatedOrder);
      setShowReturnForm(false);
      setReturnSuccessMessage('Return request submitted successfully. Awaiting restaurant owner review.');
    } catch (err) {
      setReturnError(err.response?.data?.detail || 'Failed to submit return request.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) return <Loader message="Fetching live order tracking..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => loadOrder(false)} />;
  if (!order) return null;

  const isFinal = FINAL_STATES.includes(order.status);
  const canCancel = order.status === 'PLACED';
  const isDelivered = order.status === 'DELIVERED';
  const isRefunded = order.status === 'REFUNDED' || order.payment_status === 'refunded';
  const hasReturn = order.return_status && order.return_status !== 'none' && order.return_status !== 'NONE';

  return (
    <div className="container page-wrapper" style={{ maxWidth: '820px' }}>
      {/* Navigation & Header */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/orders" className="btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <h1>Order #{order.id}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            From:{' '}
            <strong style={{ color: 'var(--color-primary)' }}>
              {order.restaurant_name || `Restaurant #${order.restaurant_id}`}
            </strong>{' '}
            • Placed on{' '}
            {order.created_at ? new Date(order.created_at).toLocaleString() : 'Recent'}
          </p>
        </div>

        {/* Live Refresh indicator */}
        {!isFinal && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-1) var(--space-3)',
            }}
          >
            <RefreshCw size={12} style={{ animation: 'spin 3s linear infinite' }} />
            <span>Live updates every 15s</span>
          </div>
        )}
      </div>

      {/* Prominent Refund Banner */}
      {isRefunded && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            padding: 'var(--space-4) var(--space-5)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '2px solid #ef4444',
            borderRadius: 'var(--radius)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <AlertCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: '#b91c1c', margin: '0 0 var(--space-1) 0', fontSize: 'var(--font-size-base)' }}>
              Order Refunded
            </h4>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#7f1d1d' }}>
              This order was refunded in full. Amount: <strong>${Number(order.total_amount).toFixed(2)}</strong>
              {order.return_reason ? ` • Reason: "${order.return_reason}"` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Cancel Message */}
      {cancelMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-success-surface)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-success)',
            marginBottom: 'var(--space-5)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{cancelMessage}</span>
        </div>
      )}

      {/* Return Success Feedback */}
      {returnSuccessMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid #3b82f6',
            borderRadius: 'var(--radius)',
            color: '#1d4ed8',
            marginBottom: 'var(--space-5)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{returnSuccessMessage}</span>
        </div>
      )}

      {/* Return Status Notification (If Return has been requested) */}
      {hasReturn && !isRefunded && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor:
              order.return_status === 'approved'
                ? 'rgba(16, 185, 129, 0.1)'
                : order.return_status === 'rejected'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
            border:
              order.return_status === 'approved'
                ? '1px solid #10b981'
                : order.return_status === 'rejected'
                ? '1px solid #ef4444'
                : '1px solid #f59e0b',
            borderRadius: 'var(--radius)',
            marginBottom: 'var(--space-5)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <RotateCcw
            size={18}
            color={
              order.return_status === 'approved'
                ? '#059669'
                : order.return_status === 'rejected'
                ? '#dc2626'
                : '#d97706'
            }
            style={{ flexShrink: 0, marginTop: '2px' }}
          />
          <div>
            <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>
              Return Status: {order.return_status}
            </span>
            {order.return_reason && (
              <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                Your reason: "{order.return_reason}"
              </p>
            )}
            {order.return_status === 'requested' && (
              <p style={{ margin: '2px 0 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                The restaurant owner is reviewing your return request.
              </p>
            )}
            {order.return_status === 'approved' && (
              <p style={{ margin: '2px 0 0 0', color: '#059669', fontSize: 'var(--font-size-xs)' }}>
                Refund approved and ledger updated.
              </p>
            )}
            {order.return_status === 'rejected' && (
              <p style={{ margin: '2px 0 0 0', color: '#dc2626', fontSize: 'var(--font-size-xs)' }}>
                The restaurant owner did not approve this return.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 1. Live Order Lifecycle Timeline */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>
          Delivery Status Progress
        </h3>
        <OrderTimeline status={order.status} />
      </div>

      {/* 2. Order Details & Destination */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Delivery Address */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <MapPin size={18} color="var(--color-primary)" />
            <h4 style={{ fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
              Delivery Destination
            </h4>
          </div>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
            {order.delivery_address}
          </p>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            Student Dormitory / Campus Building
          </p>
        </div>

        {/* Payment & Ledger Status */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <ShieldCheck size={18} color="var(--color-primary)" />
            <h4 style={{ fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
              Financial Ledger Status
            </h4>
          </div>
          <p style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
            Payment: {order.payment_status}
          </p>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            Recorded in immutable <code>PaymentLedger</code> database
          </p>
        </div>
      </div>

      {/* 3. Items In This Order */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-page)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)' }}>Ordered Dishes</h3>
        </div>

        <div>
          {(order.items || []).map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-3) var(--space-5)',
                borderBottom: idx < (order.items.length - 1) ? '1px solid var(--color-border-subtle)' : 'none',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                  {item.quantity}x {item.dish_name || `Dish #${item.menu_item_id}`}
                </span>
                <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Snapshot Price: ${Number(item.price_at_order).toFixed(2)}
                </span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                ${(item.quantity * item.price_at_order).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            backgroundColor: 'var(--color-bg-page)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>Total Paid</span>
          <span style={{ fontWeight: 800, fontSize: 'var(--font-size-xl)', color: 'var(--color-primary)' }}>
            ${Number(order.total_amount).toFixed(2)}
          </span>
        </div>
      </div>

      {/* 4. Customer Review Section (Only when DELIVERED and NOT REFUNDED) */}
      {isDelivered && !isRefunded && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Star size={20} color="var(--color-primary)" fill="var(--color-primary)" />
            <h3 style={{ fontSize: 'var(--font-size-md)', margin: 0 }}>Meal Review & Rating</h3>
          </div>

          {order.has_review || submittedReview ? (
            /* Already Reviewed Card */
            <div
              style={{
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-bg-page)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const activeRating = submittedReview?.rating || 5;
                    return (
                      <Star
                        key={starVal}
                        size={18}
                        color={starVal <= activeRating ? '#f59e0b' : '#d1d5db'}
                        fill={starVal <= activeRating ? '#f59e0b' : 'none'}
                      />
                    );
                  })}
                </div>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                  {submittedReview?.rating ? `${submittedReview.rating} out of 5 stars` : 'Review Submitted'}
                </span>
              </div>

              {submittedReview?.comment && (
                <p style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', margin: 'var(--space-2) 0' }}>
                  "{submittedReview.comment}"
                </p>
              )}

              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                {reviewSuccessMessage || 'Your review has been saved to the restaurant profile.'}
              </p>
            </div>
          ) : (
            /* Submit Review Form */
            <form onSubmit={handleReviewSubmit}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
                How was your meal from {order.restaurant_name || 'the kitchen'}? Rate your overall experience:
              </p>

              {/* Star Rating Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((val) => {
                    const filled = (reviewHoverRating || reviewRating) >= val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setReviewRating(val)}
                        onMouseEnter={() => setReviewHoverRating(val)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        aria-label={`Rate ${val} stars`}
                      >
                        <Star
                          size={28}
                          color={filled ? '#f59e0b' : '#d1d5db'}
                          fill={filled ? '#f59e0b' : 'none'}
                          style={{ transition: 'transform 0.1s ease', transform: filled ? 'scale(1.1)' : 'scale(1)' }}
                        />
                      </button>
                    );
                  })}
                </div>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: '#f59e0b' }}>
                  {reviewRating} of 5 Stars
                </span>
              </div>

              {/* Optional Comment */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label
                  htmlFor="review-comment"
                  style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}
                >
                  Write a review (optional):
                </label>
                <textarea
                  id="review-comment"
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell fellow campus students about the food taste, portion size, and temperature..."
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary btn-sm"
                disabled={submittingReview}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <Star size={16} />
                <span>{submittingReview ? 'Submitting Review...' : 'Submit Review'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* 5. Return / Refund Request Section (DELIVERED, NOT REFUNDED, NO EXISTING RETURN) */}
      {isDelivered && !isRefunded && !hasReturn && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <RotateCcw size={16} color="var(--color-primary)" />
                Issue with your delivery?
              </h4>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 'var(--space-1) 0 0 0' }}>
                You may request a return or full refund if items were incorrect or damaged.
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setShowReturnForm((prev) => !prev)}
            >
              {showReturnForm ? 'Cancel Request' : 'Request Return / Refund'}
            </button>
          </div>

          {showReturnForm && (
            <form onSubmit={handleReturnSubmit} style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
              {returnError && (
                <div
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid #ef4444',
                    borderRadius: 'var(--radius)',
                    color: '#dc2626',
                    fontSize: 'var(--font-size-xs)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  {returnError}
                </div>
              )}

              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label
                  htmlFor="return-reason"
                  style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}
                >
                  Return Reason (minimum 5 characters)*:
                </label>
                <textarea
                  id="return-reason"
                  rows={2}
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g., Wrong dish was delivered, missing drink item, or food arrived cold..."
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-danger btn-sm"
                disabled={submittingReturn}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <RotateCcw size={14} />
                <span>{submittingReturn ? 'Submitting Return...' : 'Submit Return Request'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* 6. Order Cancellation Action (Only if status == PLACED) */}
      {canCancel && (
        <div
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            borderColor: 'var(--color-warning-border)',
            backgroundColor: 'var(--color-warning-surface)',
          }}
        >
          <div>
            <h4 style={{ color: 'var(--color-warning)', marginBottom: '2px' }}>
              Need to cancel this order?
            </h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              You may cancel freely while the restaurant has not yet accepted or started preparing it.
            </p>
          </div>

          <button
            type="button"
            className="btn-danger btn-sm"
            onClick={handleCancel}
            disabled={cancelling}
          >
            <XCircle size={16} />
            <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
