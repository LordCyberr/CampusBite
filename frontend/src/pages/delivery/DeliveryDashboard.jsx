import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  MapPin,
  Store,
  Clock,
  User,
  Package,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { fetchDeliveryOrders, updateDeliveryOrderStatus } from '../../api/delivery';
import { useCurrency } from '../../context/CurrencyContext';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';

const DeliveryDashboard = () => {
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [statusFilter, setStatusFilter] = useState('ALL'); // For active tab: 'ALL' | 'ASSIGNED' | 'OUT_FOR_DELIVERY'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      if (activeTab === 'history') {
        const res = await fetchDeliveryOrders({
          status: 'DELIVERED',
          page,
          pageSize,
        });
        setOrders(res.items || []);
        setTotalCount(res.total_count || 0);
      } else {
        // Active tab: ASSIGNED or OUT_FOR_DELIVERY
        if (statusFilter === 'ASSIGNED') {
          const res = await fetchDeliveryOrders({ status: 'ASSIGNED', page: 1, pageSize: 50 });
          setOrders(res.items || []);
          setTotalCount((res.items || []).length);
        } else if (statusFilter === 'OUT_FOR_DELIVERY') {
          const res = await fetchDeliveryOrders({ status: 'OUT_FOR_DELIVERY', page: 1, pageSize: 50 });
          setOrders(res.items || []);
          setTotalCount((res.items || []).length);
        } else {
          // Fetch both and combine
          const [assignedRes, outRes] = await Promise.all([
            fetchDeliveryOrders({ status: 'ASSIGNED', page: 1, pageSize: 50 }),
            fetchDeliveryOrders({ status: 'OUT_FOR_DELIVERY', page: 1, pageSize: 50 }),
          ]);
          const combined = [...(assignedRes.items || []), ...(outRes.items || [])];
          // Sort newest first
          combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setOrders(combined);
          setTotalCount(combined.length);
        }
      }
    } catch (err) {
      console.error('Failed to load delivery orders:', err);
      setError(err.response?.data?.detail || 'Failed to load assigned deliveries.');
    } finally {
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders(false);
  }, [activeTab, statusFilter, page]);

  // Tab switch handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setStatusFilter('ALL');
  };

  // Start Delivery handler (ASSIGNED -> OUT_FOR_DELIVERY)
  const handleStartDelivery = async (order) => {
    try {
      setUpdatingId(order.id);
      await updateDeliveryOrderStatus(order.id, 'OUT_FOR_DELIVERY');
      await loadOrders(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update order status to Out for Delivery.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Mark Delivered handler (OUT_FOR_DELIVERY -> DELIVERED)
  const handleMarkDelivered = async (order) => {
    const confirmed = window.confirm(
      `Confirm delivery of order #${order.id} to ${order.delivery_address}?`
    );
    if (!confirmed) return;

    try {
      setUpdatingId(order.id);
      await updateDeliveryOrderStatus(order.id, 'DELIVERED');
      await loadOrders(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to mark order as Delivered.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container page-wrapper" style={{ maxWidth: '840px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius)',
                backgroundColor: 'rgba(235, 94, 40, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <Truck size={22} />
            </div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: 0 }}>Courier Deliveries</h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
            Campus delivery hub • Pick up prepared orders and deliver across campus
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => loadOrders(true)}
          disabled={refreshing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Main Tabs: Active vs History */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--color-border)',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('active')}
          style={{
            padding: 'var(--space-3) var(--space-5)',
            border: 'none',
            borderBottom: activeTab === 'active' ? '3px solid var(--color-primary)' : '3px solid transparent',
            background: 'none',
            fontWeight: 700,
            fontSize: 'var(--font-size-base)',
            color: activeTab === 'active' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Truck size={18} />
          <span>Active Deliveries</span>
          {activeTab === 'active' && orders.length > 0 && (
            <span
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                fontSize: 'var(--font-size-xs)',
                borderRadius: 'var(--radius-full)',
                padding: '1px 8px',
              }}
            >
              {orders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          style={{
            padding: 'var(--space-3) var(--space-5)',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid var(--color-primary)' : '3px solid transparent',
            background: 'none',
            fontWeight: 700,
            fontSize: 'var(--font-size-base)',
            color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <CheckCircle2 size={18} />
          <span>Delivery History</span>
        </button>
      </div>

      {/* Active Sub-filter Chips */}
      {activeTab === 'active' && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Active' },
            { id: 'ASSIGNED', label: 'Assigned (Pickup Needed)' },
            { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
          ].map((chip) => {
            const isSelected = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id)}
                style={{
                  padding: 'var(--space-1) var(--space-3)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'rgba(235, 94, 40, 0.1)' : 'var(--color-bg-surface)',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Error / Loading / Content */}
      {error && <ErrorMessage message={error} onRetry={() => loadOrders(false)} />}

      {loading ? (
        <Loader message="Fetching delivery orders..." />
      ) : orders.length === 0 ? (
        /* Empty State */
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: 'var(--space-8) var(--space-4)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px dashed var(--color-border)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(235, 94, 40, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              color: 'var(--color-primary)',
            }}
          >
            {activeTab === 'active' ? <Truck size={32} /> : <CheckCircle2 size={32} />}
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>
            {activeTab === 'active' ? 'No active deliveries right now' : 'No completed deliveries yet'}
          </h3>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              maxWidth: '420px',
              margin: '0 auto',
            }}
          >
            {activeTab === 'active'
              ? 'You are ready to accept new orders! Restaurant owners will assign prepared campus meals to you shortly.'
              : 'Your delivered orders will appear here once you mark deliveries as complete.'}
          </p>
        </div>
      ) : (
        /* Delivery Orders List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {orders.map((order) => {
            const isAssigned = order.status === 'ASSIGNED';
            const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
            const isDelivered = order.status === 'DELIVERED';
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="card"
                style={{
                  borderLeft: isOutForDelivery
                    ? '4px solid var(--color-primary)'
                    : isAssigned
                    ? '4px solid #3b82f6'
                    : '4px solid #10b981',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                {/* Header row: ID, Status, Placed Time */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-3)',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    paddingBottom: 'var(--space-3)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      DELIVERY TICKET
                    </span>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', margin: '2px 0 0 0' }}>
                      Order #{order.id}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <StatusBadge status={order.status} />
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Clock size={12} />
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Restaurant & Destination Details */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-4)',
                    backgroundColor: 'var(--color-bg-page)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  {/* Pick up from */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', marginBottom: '2px' }}>
                      <Store size={14} />
                      <span>PICK UP AT:</span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', margin: 0, color: 'var(--color-text-primary)' }}>
                      {order.restaurant_name || `Restaurant #${order.restaurant_id}`}
                    </p>
                  </div>

                  {/* Drop off at */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-primary)', fontSize: 'var(--font-size-xs)', marginBottom: '2px' }}>
                      <MapPin size={14} />
                      <span style={{ fontWeight: 600 }}>DELIVER TO:</span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', margin: 0, color: 'var(--color-text-primary)' }}>
                      {order.delivery_address}
                    </p>
                    {order.customer_name && (
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <User size={12} />
                        Customer: {order.customer_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Summary & Total Amount */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-4)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
                    <Package size={16} />
                    <span>
                      {order.items && order.items.length > 0
                        ? order.items.map((it) => `${it.quantity}x Dish #${it.menu_item_id}`).join(', ')
                        : 'Food Order'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginRight: '6px' }}>
                      Total Amount:
                    </span>
                    <strong style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
                      {formatPrice(order.total_amount)}
                    </strong>
                  </div>
                </div>

                {/* Big Action Buttons (Phone-Friendly) */}
                {isAssigned && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleStartDelivery(order)}
                    disabled={isUpdating}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Truck size={18} />
                    <span>{isUpdating ? 'Updating Status...' : 'Start Delivery'}</span>
                    <ArrowRight size={18} />
                  </button>
                )}

                {isOutForDelivery && (
                  <button
                    type="button"
                    onClick={() => handleMarkDelivered(order)}
                    disabled={isUpdating}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 700,
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-2)',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{isUpdating ? 'Completing Delivery...' : 'Mark Delivered'}</span>
                  </button>
                )}

                {isDelivered && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      borderRadius: 'var(--radius)',
                      color: '#065f46',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>
                      Delivered successfully at{' '}
                      {new Date(order.updated_at || order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination for History Tab */}
      {activeTab === 'history' && totalCount > pageSize && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--space-4)',
            marginTop: 'var(--space-6)',
          }}
        >
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Page {page} of {Math.ceil(totalCount / pageSize)}
          </span>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(totalCount / pageSize)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
