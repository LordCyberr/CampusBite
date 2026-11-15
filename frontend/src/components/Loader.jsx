import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ message = 'Loading delicious food...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-4)',
        gap: 'var(--space-3)',
      }}
    >
      <Loader2
        size={36}
        color="var(--color-primary)"
        style={{ animation: 'spin 1s linear infinite' }}
      />
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
        {message}
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
