import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ message = 'Something went wrong.', onRetry }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        background: 'var(--color-error-surface)',
        border: '1px solid var(--color-error-border)',
        borderRadius: 'var(--radius)',
        maxWidth: '540px',
        margin: 'var(--space-6) auto',
        textAlign: 'center',
        gap: 'var(--space-3)',
      }}
    >
      <AlertCircle size={32} color="var(--color-error)" />
      <div>
        <h4 style={{ color: 'var(--color-error)', marginBottom: 'var(--space-1)' }}>
          Unable to Load Data
        </h4>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm" style={{ marginTop: 'var(--space-2)' }}>
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
