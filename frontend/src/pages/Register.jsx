import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const userProfile = await register(name, email, password, role);

      // Redirect user according to newly registered role
      if (userProfile.role === 'restaurant_owner') {
        navigate('/owner');
      } else if (userProfile.role === 'delivery_partner') {
        navigate('/delivery');
      } else {
        navigate('/restaurants');
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Registration failed. Please verify your details or use a different email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
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
          maxWidth: '460px',
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
          <h2>Join CampusBite</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
            Order, cook, or deliver food across campus.
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
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              required
              placeholder="e.g. Maya Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="reg-email">Campus Email</label>
            <input
              id="reg-email"
              type="email"
              required
              placeholder="e.g. maya@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="reg-password">Password (min 6 characters)</label>
            <input
              id="reg-password"
              type="password"
              required
              placeholder="Create a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="reg-role">I am joining as a:</label>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="customer">Customer (Student / Faculty)</option>
              <option value="restaurant_owner">Restaurant Owner (Campus Kitchen)</option>
              <option value="delivery_partner">Delivery Partner (Student Courier)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={loading}
          >
            <UserPlus size={18} />
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
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
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
