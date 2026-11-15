import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div
      className="container page-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        paddingTop: 'var(--space-12)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-primary-tint)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
        }}
      >
        <Compass size={32} />
      </div>

      <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>
        404 - Page Not Found
      </h1>

      <p style={{ color: 'var(--color-text-secondary)', maxWidth: '440px', marginBottom: 'var(--space-6)' }}>
        Oops! The campus route you are looking for does not exist or may have moved.
      </p>

      <Link to="/restaurants" className="btn-primary" style={{ textDecoration: 'none' }}>
        <Home size={16} /> Return to Campus Canteens
      </Link>
    </div>
  );
};

export default NotFound;
