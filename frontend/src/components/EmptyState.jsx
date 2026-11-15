import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  action = null,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-4)',
        background: 'var(--color-bg-surface)',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius)',
        textAlign: 'center',
        gap: 'var(--space-3)',
        maxWidth: '600px',
        margin: 'var(--space-6) auto',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-primary-tint)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={28} color="var(--color-primary)" />
      </div>
      <div>
        <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-1)' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          {description}
        </p>
      </div>
      {action && <div style={{ marginTop: 'var(--space-2)' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
