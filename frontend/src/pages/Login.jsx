import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, AlertCircle, UtensilsCrossed, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userProfile = await login(email, password);

      // Redirect by role to appropriate home
      if (userProfile.role === 'restaurant_owner') {
        navigate('/owner');
      } else if (userProfile.role === 'delivery_partner') {
        navigate('/delivery');
      } else {
        const from = location.state?.from?.pathname || '/restaurants';
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Unable to log in. Please check your email and password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div
      className="container page-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-primary-tint)',
              color: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-2)',
            }}
          >
            <UtensilsCrossed size={28} />
          </div>
          <h2>Sign in to CampusBite</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
            Welcome back! Enter your campus credentials.
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-error-surface)',
              border: '1px solid var(--color-error-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-error)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="e.g. alice@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={loading}
          >
            <LogIn size={18} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-sm)',
            marginTop: 'var(--space-6)',
            color: 'var(--color-text-secondary)',
          }}
        >
          New to CampusBite?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Create an account
          </Link>
        </p>

        {/* Demo Logins Box for Viva / Evaluation (controlled by VITE_SHOW_DEMO_LOGINS) */}
        {import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true' && (
          <div
            style={{
              marginTop: 'var(--space-6)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--color-border)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
              <Info size={14} color="var(--color-primary)" />
              <span>Quick Demo Logins (Password: password123):</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => fillDemo('customer@campusbite.com')}
              >
                Student (Alex)
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => fillDemo('owner1@campusbite.com')}
              >
                Owner (Mario)
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => fillDemo('delivery@campusbite.com')}
              >
                Courier (Sam)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
