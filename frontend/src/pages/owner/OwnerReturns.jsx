import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { fetchOwnerReturns, decideReturnRequest } from '../../api/owner';
import StatusBadge from '../../components/StatusBadge';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 8;

const OwnerReturns = () => {
  const [returns, setReturns] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const loadReturns = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchOwnerReturns({ page, pageSize: PAGE_SIZE });
      setReturns(data.items || []);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load return requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, [page]);

  const handleDecision = async (orderId, decision) => {
    const actionText = decision === 'approve' ? 'APPROVE and issue a full refund' : 'REJECT';
    const confirm = window.confirm(
      `Are you sure you want to ${actionText} for Order #${orderId}?`
    );
    if (!confirm) return;

    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      await decideReturnRequest(orderId, decision);
      await loadReturns();
    } catch (err) {
      alert(err.response?.data?.detail || `Failed to ${decision} return request.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  if (loading) return <Loader message="Loading student return requests..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadReturns} />;

  return (
    <div className="container page-wrapper">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1>Customer Return & Refund Queue</h1>
        <p style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
          Review food issues submitted by students on delivered orders. Approving automatically writes a refund into the financial ledger.
        </p>
      </div>

      {returns.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No Return Requests"
          description="Your kitchen currently has no pending or resolved customer return requests."
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {returns.map((order) => {
              const isWaiting = (order.return_status || '').toLowerCase() === 'requested';
              const isBusy = actionLoading[order.id];

              return (
                <div
                  key={order.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-5)',
                    borderLeft: isWaiting ? '5px solid var(--color-warning)' : '5px solid var(--color-border)',
                  }}
                >
                  {/* Top Bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                      borderBottom: '1px solid var(--color-border)',
                      paddingBottom: 'var(--space-3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 800, fontSize: 'var(--font-size-md)' }}>
                        Order #{order.id}
                      </span>
                      <StatusBadge status={order.status} />
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
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
                        }}
                      >
                        Return Status: {order.return_status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        Student: <strong>{order.customer_name || `Customer #${order.customer_id}`}</strong>
                      </span>
                      <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: 'var(--color-primary)' }}>
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Customer Reason Box */}
                  <div
                    style={{
                      backgroundColor: 'var(--color-bg-page)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                      Student&apos;s Return Explanation:
                    </span>
                    <p style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)', marginTop: '2px', color: 'var(--color-text-primary)' }}>
                      &quot;{order.return_reason || 'No explanation specified.'}&quot;
                    </p>
                  </div>

                  {/* Action Buttons: Only shown while return request is waiting */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      paddingTop: 'var(--space-2)',
                    }}
                  >
                    {isWaiting ? (
                      <>
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          disabled={isBusy}
                          onClick={() => handleDecision(order.id, 'reject')}
                        >
                          <X size={14} /> Reject Request
                        </button>
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          disabled={isBusy}
                          onClick={() => handleDecision(order.id, 'approve')}
                          style={{ backgroundColor: 'var(--color-success)' }}
                        >
                          <Check size={14} /> Approve & Refund ($
                          {Number(order.total_amount).toFixed(2)})
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        Resolution completed ({order.return_status}).
                      </span>
                    )}
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

export default OwnerReturns;
