import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Filter, ArrowRight, Calendar, RotateCcw } from 'lucide-react';
import { fetchMyOrders } from '../api/orders';
import { useCurrency } from '../context/CurrencyContext';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  'ALL',
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

const MyOrders = () => {
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyOrders({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setOrders(data.items || []);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch your past orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="container page-wrapper">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1>My Campus Orders</h1>
        <p style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
          Track active meal deliveries, view past receipts, and manage food returns.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-6)',
          padding: 'var(--space-4)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          alignItems: 'center',
        }}
      >
        {/* Status Dropdown */}
        <div style={{ flex: '1 1 180px' }}>
          <label htmlFor="filter-status" style={{ fontSize: 'var(--font-size-xs)' }}>
            Status
          </label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st === 'ALL' ? 'All Order Statuses' : st.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div style={{ flex: '1 1 150px' }}>
          <label htmlFor="filter-from" style={{ fontSize: 'var(--font-size-xs)' }}>
            From Date
          </label>
          <input
            id="filter-from"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Date To */}
        <div style={{ flex: '1 1 150px' }}>
          <label htmlFor="filter-to" style={{ fontSize: 'var(--font-size-xs)' }}>
            To Date
          </label>
          <input
            id="filter-to"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Reset Filter Button */}
        {(statusFilter !== 'ALL' || dateFrom || dateTo) && (
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={clearFilters}
              style={{ height: '42px' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Orders List Content */}
      {loading ? (
        <Loader message="Loading your order history..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadOrders} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders found"
          description={
            statusFilter !== 'ALL' || dateFrom || dateTo
              ? 'No orders matched the selected filters.'
              : "You haven't placed any orders yet on CampusBite. Start by browsing campus kitchens!"
          }
          action={
            <Link to="/restaurants" className="btn-primary" style={{ textDecoration: 'none' }}>
              Explore Restaurants
            </Link>
          }
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {orders.map((order) => {
              const formattedDate = order.created_at
                ? new Date(order.created_at).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Just now';

              return (
                <div
                  key={order.id}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-5)',
                  }}
                >
                  <div style={{ flex: '1 1 240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontWeight: 800, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
                        Order #{order.id}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>

                    <h4 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>
                      {order.restaurant_name || `Restaurant #${order.restaurant_id}`}
                    </h4>

                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      Placed: {formattedDate} • Deliver to: {order.delivery_address}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        Total Amount
                      </span>
                      <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>

                    {order.return_status && order.return_status !== 'NONE' && (
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor:
                            order.return_status === 'APPROVED'
                              ? 'var(--color-success-surface)'
                              : order.return_status === 'REJECTED'
                              ? 'var(--color-error-surface)'
                              : 'var(--color-warning-surface)',
                          color:
                            order.return_status === 'APPROVED'
                              ? 'var(--color-success)'
                              : order.return_status === 'REJECTED'
                              ? 'var(--color-error)'
                              : 'var(--color-warning)',
                          fontWeight: 700,
                        }}
                      >
                        Return: {order.return_status}
                      </span>
                    )}

                    <Link
                      to={`/orders/${order.id}`}
                      className="btn-secondary btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      <span>Track Order</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default MyOrders;
