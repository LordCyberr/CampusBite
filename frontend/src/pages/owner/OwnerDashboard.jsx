import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Star,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { fetchOwnerStats, fetchOwnerReminders } from '../../api/owner';
import { useCurrency } from '../../context/CurrencyContext';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

const OwnerDashboard = () => {
  const { formatPrice } = useCurrency();
  const [stats, setStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [includeResolved, setIncludeResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const loadDashboardData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError('');
    try {
      const [statsData, remindersData] = await Promise.all([
        fetchOwnerStats(),
        fetchOwnerReminders({ includeResolved, page: 1, pageSize: 6 }),
      ]);
      setStats(statsData);
      setReminders(remindersData.items || []);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to load kitchen dashboard. Please check your restaurant setup.'
      );
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [includeResolved]);

  // Live dashboard polling every 30 seconds with cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(timer);
  }, [includeResolved]);

  if (loading) return <Loader message="Loading kitchen dashboard metrics..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => loadDashboardData(false)} />;
  if (!stats) return null;

  return (
    <div className="container page-wrapper">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1>Kitchen Control Dashboard</h1>
          <p style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
            Real-time kitchen metrics, revenue performance, and stuck order alerts.
          </p>
        </div>

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
          <RefreshCw size={12} />
          <span>Auto-refreshed: {lastRefreshed.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 1. Stat Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {/* Total Orders */}
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Total Orders
            </span>
            <ShoppingBag size={18} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
            {stats.total_orders}
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            Lifetime orders received
          </p>
        </div>

        {/* Realized Revenue */}
        <div className="card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Realized Revenue
            </span>
            <DollarSign size={18} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-success)' }}>
            {formatPrice(stats.total_revenue)}
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            Strictly delivered orders (refunds excluded)
          </p>
        </div>

        {/* Average Rating */}
        <div className="card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Average Rating
            </span>
            <Star size={18} color="var(--color-warning)" />
          </div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-warning)' }}>
            ★ {Number(stats.average_rating).toFixed(1)} / 5.0
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            Verified customer reviews
          </p>
        </div>

        {/* Pending Returns */}
        <div
          className="card"
          style={{
            borderLeft: stats.pending_return_requests > 0 ? '4px solid var(--color-error)' : '4px solid var(--color-border)',
            backgroundColor: stats.pending_return_requests > 0 ? 'var(--color-error-surface)' : 'var(--color-bg-surface)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Pending Returns
            </span>
            <AlertTriangle size={18} color={stats.pending_return_requests > 0 ? 'var(--color-error)' : 'var(--color-text-muted)'} />
          </div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', color: stats.pending_return_requests > 0 ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
            {stats.pending_return_requests}
          </h2>
          <Link
            to="/owner/returns"
            style={{
              display: 'inline-block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              marginTop: 'var(--space-1)',
              color: stats.pending_return_requests > 0 ? 'var(--color-error)' : 'var(--color-primary)',
            }}
          >
            Review return queue →
          </Link>
        </div>
      </div>

      {/* 2. Middle Row: Status Distribution & Top Dishes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {/* Orders by Status */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <Clock size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: 'var(--font-size-md)' }}>Order Status Breakdown</h3>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {Object.entries(stats.orders_per_status || {}).map(([st, count]) => (
              <div
                key={st}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'var(--color-bg-page)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <StatusBadge status={st} />
                <span style={{ fontWeight: 800, fontSize: 'var(--font-size-sm)' }}>{count}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
            <Link to="/owner/orders" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
              View & fulfill active kitchen orders →
            </Link>
          </div>
        </div>

        {/* Top 3 Bestselling Dishes */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <TrendingUp size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: 'var(--font-size-md)' }}>Top Bestselling Dishes</h3>
          </div>

          {stats.top_three_dishes && stats.top_three_dishes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {stats.top_three_dishes.map((dish, idx) => (
                <div
                  key={dish.dish_name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'var(--color-bg-page)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                    #{idx + 1} {dish.dish_name}
                  </span>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>
                    {dish.quantity_sold} sold
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              No completed order sales yet.
            </p>
          )}

          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
            <Link to="/owner/menu" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
              Manage menu dishes & prices →
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Stuck Order Reminders Panel */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Bell size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: 'var(--font-size-md)' }}>Stuck Order Kitchen Reminders</h3>
          </div>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
              userSelect: 'none',
              fontWeight: 500,
            }}
          >
            <input
              type="checkbox"
              checked={includeResolved}
              onChange={(e) => setIncludeResolved(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <span>Include resolved reminders</span>
          </label>
        </div>

        {reminders.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              backgroundColor: 'var(--color-bg-page)',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--color-border)',
            }}
          >
            <CheckCircle2 size={24} color="var(--color-success)" style={{ display: 'inline-block', marginBottom: 'var(--space-1)' }} />
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
              {includeResolved
                ? 'No reminders found for this kitchen.'
                : 'All caught up! No kitchen orders are currently stalled beyond 15 minutes.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {reminders.map((rem) => (
              <div
                key={rem.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: rem.is_still_pending ? 'var(--status-placed-bg)' : 'var(--color-bg-page)',
                  border: rem.is_still_pending ? '1px solid var(--status-placed-border)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '2px' }}>
                    <StatusBadge status={rem.order_status} />
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      {new Date(rem.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', margin: 0 }}>
                    {rem.message}
                  </p>
                </div>

                <Link
                  to={`/orders/${rem.order_id}`}
                  className="btn-secondary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  View Order #{rem.order_id} →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
