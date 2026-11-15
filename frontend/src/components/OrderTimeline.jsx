import React from 'react';
import {
  Clock,
  Check,
  Flame,
  Package,
  UserCheck,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';

const LIFECYCLE_STEPS = [
  { key: 'PLACED', label: 'Placed', icon: Clock },
  { key: 'ACCEPTED', label: 'Accepted', icon: Check },
  { key: 'PREPARING', label: 'Preparing', icon: Flame },
  { key: 'READY', label: 'Ready', icon: Package },
  { key: 'ASSIGNED', label: 'Assigned', icon: UserCheck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

const OrderTimeline = ({ status }) => {
  const currentStatus = (status || '').toUpperCase();

  // Handle Terminal Cancelled State
  if (currentStatus === 'CANCELLED') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--status-cancelled-bg)',
          border: '1px solid var(--status-cancelled-border)',
          borderRadius: 'var(--radius)',
          color: 'var(--status-cancelled-text)',
        }}
      >
        <XCircle size={28} />
        <div>
          <h4 style={{ color: 'var(--status-cancelled-text)', marginBottom: '2px' }}>
            Order Cancelled
          </h4>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: 0, color: 'var(--color-text-secondary)' }}>
            This order was cancelled while in PLACED status. A refund has been recorded in the ledger.
          </p>
        </div>
      </div>
    );
  }

  // Handle Terminal Refunded State
  if (currentStatus === 'REFUNDED') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--status-refunded-bg)',
          border: '1px solid var(--status-refunded-border)',
          borderRadius: 'var(--radius)',
          color: 'var(--status-refunded-text)',
        }}
      >
        <RotateCcw size={28} />
        <div>
          <h4 style={{ color: 'var(--status-refunded-text)', marginBottom: '2px' }}>
            Order Returned & Refunded
          </h4>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: 0, color: 'var(--color-text-secondary)' }}>
            The restaurant approved your return request. The full amount has been refunded in the ledger.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div
      style={{
        padding: 'var(--space-5)',
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          overflowX: 'auto',
          paddingBottom: 'var(--space-2)',
        }}
      >
        {LIFECYCLE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = currentIndex >= idx;
          const isCurrent = currentIndex === idx;

          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                flex: 1,
                minWidth: '85px',
                position: 'relative',
              }}
            >
              {/* Step Circle */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isCurrent
                    ? 'var(--color-primary)'
                    : isDone
                    ? 'var(--color-success)'
                    : 'var(--color-bg-page)',
                  color: isDone || isCurrent ? 'var(--color-text-inverted)' : 'var(--color-text-muted)',
                  border: isDone || isCurrent ? 'none' : '2px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-2)',
                  zIndex: 2,
                  boxShadow: isCurrent ? '0 0 0 4px var(--color-primary-tint)' : 'none',
                }}
              >
                <Icon size={16} />
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: isCurrent ? 700 : isDone ? 600 : 500,
                  color: isCurrent
                    ? 'var(--color-primary)'
                    : isDone
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
