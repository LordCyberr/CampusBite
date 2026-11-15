import React from 'react';
import { ChefHat, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const OwnerHome = () => {
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
          <ChefHat size={32} />
        </div>

        <h1 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
          Restaurant Kitchen Dashboard
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
          Welcome, <strong>{user?.name}</strong>! The full kitchen management suite—including live order fulfillment, menu item editing, stuck-order reminders, courier assignment, and revenue analytics—arrives in <strong>Phase 7B</strong>.
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
          <strong>Phase 7B Upcoming Features:</strong>
          <ul style={{ paddingLeft: 'var(--space-4)', marginTop: 'var(--space-1)' }}>
            <li>Accept, prepare, and mark orders ready</li>
            <li>Assign active student couriers to pending deliveries</li>
            <li>Review and decide on customer return & refund requests</li>
            <li>Live revenue, rating metrics, and top dish statistics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OwnerHome;
