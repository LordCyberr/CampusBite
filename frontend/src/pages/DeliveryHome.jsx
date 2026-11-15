import React from 'react';
import { Bike, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DeliveryHome = () => {
  const { user } = useAuth();

  return (
    <div className="container page-wrapper" style={{ maxWidth: '640px', textAlign: 'center' }}>
      <div className="card" style={{ padding: 'var(--space-10) var(--space-6)' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary-tint)',
            color: 'var(--color-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          <Bike size={32} />
        </div>

        <h1 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
          Campus Delivery Partner Dashboard
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
          Welcome, <strong>{user?.name}</strong>! The courier delivery workflow—including assigned order pickups, delivery route tracking, and one-click status transitions to <code>OUT_FOR_DELIVERY</code> and <code>DELIVERED</code>—arrives in <strong>Phase 7B</strong>.
        </p>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-page)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            textAlign: 'left',
          }}
        >
          <strong>Phase 7B Upcoming Courier Capabilities:</strong>
          <ul style={{ paddingLeft: 'var(--space-4)', marginTop: 'var(--space-1)' }}>
            <li>Browse assigned orders awaiting kitchen pickup</li>
            <li>Customer hall/dormitory delivery address routing</li>
            <li>Mark orders Out for Delivery & Delivered with live timestamping</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DeliveryHome;
