import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  User,
  Sparkles,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  RotateCcw,
  Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const Navbar = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const { totalCount } = useCart();
  const { currencyMode, setCurrencyMode } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const getHomeLink = () => {
    if (!isAuthenticated) return '/login';
    if (role === 'restaurant_owner') return '/owner';
    if (role === 'delivery_partner') return '/delivery';
    return '/restaurants';
  };

  return (
    <header
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '68px',
        }}
      >
        {/* Brand Logo */}
        <Link
          to={getHomeLink()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontFamily: 'var(--font-headings)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 800,
            color: 'var(--color-primary)',
            textDecoration: 'none',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UtensilsCrossed size={20} />
          </div>
          <span>CampusBite</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}
          className="desktop-nav"
        >
          {/* Currency Mode Selector */}
          <div className="currency-switcher" title="Select Currency Display">
            <button
              type="button"
              className={`currency-btn ${currencyMode === 'both' ? 'active' : ''}`}
              onClick={() => setCurrencyMode('both')}
            >
              $ & ₹
            </button>
            <button
              type="button"
              className={`currency-btn ${currencyMode === 'inr' ? 'active' : ''}`}
              onClick={() => setCurrencyMode('inr')}
            >
              ₹ INR
            </button>
            <button
              type="button"
              className={`currency-btn ${currencyMode === 'usd' ? 'active' : ''}`}
              onClick={() => setCurrencyMode('usd')}
            >
              $ USD
            </button>
          </div>

          {isAuthenticated ? (
            <>
              {/* Customer Links */}
              {role === 'customer' && (
                <>
                  <Link
                    to="/restaurants"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                    }}
                  >
                    Restaurants
                  </Link>

                  <Link
                    to="/orders"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                    }}
                  >
                    <Clock size={16} /> My Orders
                  </Link>

                  <Link
                    to="/insights"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                    }}
                  >
                    <Sparkles size={16} color="var(--color-primary)" /> AI Insights
                  </Link>

                  <Link
                    to="/cart"
                    className="btn-primary btn-sm"
                    style={{
                      position: 'relative',
                      textDecoration: 'none',
                    }}
                  >
                    <ShoppingBag size={16} />
                    <span>Cart</span>
                    {totalCount > 0 && (
                      <span
                        style={{
                          backgroundColor: 'var(--color-bg-surface)',
                          color: 'var(--color-primary)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          marginLeft: '2px',
                        }}
                      >
                        {totalCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {/* Restaurant Owner Links */}
              {role === 'restaurant_owner' && (
                <>
                  <Link
                    to="/owner"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                    }}
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>

                  <Link
                    to="/owner/orders"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                    }}
                  >
                    <ClipboardList size={16} /> Orders
                  </Link>

                  <Link
                    to="/owner/menu"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                    }}
                  >
                    <BookOpen size={16} /> Menu
                  </Link>

                  <Link
                    to="/owner/returns"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                    }}
                  >
                    <RotateCcw size={16} /> Returns
                  </Link>
                </>
              )}

              {/* Delivery Partner Links */}
              {role === 'delivery_partner' && (
                <Link
                  to="/delivery"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                  }}
                >
                  <Truck size={16} /> Deliveries
                </Link>
              )}

              {/* User Profile Chip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-1) var(--space-3)',
                  backgroundColor: 'var(--color-bg-page)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                }}
              >
                <User size={14} color="var(--color-text-secondary)" />
                <span>{user?.name || 'User'}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '10px', textTransform: 'capitalize' }}>
                  ({role?.replace('_', ' ')})
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="btn-secondary btn-sm"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary btn-sm">
                <LogIn size={16} /> Log In
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                <UserPlus size={16} /> Register
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="mobile-toggle btn-secondary btn-sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderTop: '1px solid var(--color-border)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
          className="mobile-menu"
        >
          {/* Currency Mode Selector */}
          <div className="currency-switcher" title="Select Currency Display">
            <button
              type="button"
              className={`currency-btn ${currencyMode === 'both' ? 'active' : ''}`}
              onClick={() => setCurrencyMode('both')}
            >
              $ & ₹
            </button>
            <button
              type="button"
              className={`currency-btn ${currencyMode === 'inr' ? 'active' : ''}`}
              onClick={() => setCurrencyMode('inr')}
            >
              ₹ INR
            </button>
            <button
              type="button"
              className={`currency-btn ${currencyMode === 'usd' ? 'active' : ''}`}
              onClick={() => setCurrencyMode('usd')}
            >
              $ USD
            </button>
          </div>

          {isAuthenticated ? (
            <>
              <div style={{ paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', margin: 0 }}>{user?.name}</p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                  {user?.email} • ({role?.replace('_', ' ')})
                </p>
              </div>

              {role === 'customer' && (
                <>
                  <Link
                    to="/restaurants"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: 'var(--space-2) 0', fontWeight: 600 }}
                  >
                    Browse Restaurants
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: 'var(--space-2) 0', fontWeight: 600 }}
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/insights"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: 'var(--space-2) 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                  >
                    <Sparkles size={16} color="var(--color-primary)" /> AI Insights
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: 'var(--space-2) 0', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Shopping Cart</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{totalCount} items</span>
                  </Link>
                </>
              )}

              {role === 'restaurant_owner' && (
                <>
                  <Link
                    to="/owner"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: 'var(--space-2) 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                  >
                    <LayoutDashboard size={16} /> Kitchen Dashboard
                  </Link>
                  <Link
                    to="/owner/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: 'var(--space-2) 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                  >
                    <ClipboardList size={16} /> Manage Orders
                  </Link>
                  <Link
                    to="/owner/menu"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: 'var(--space-2) 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                  >
                    <BookOpen size={16} /> Menu Management
                  </Link>
                  <Link
                    to="/owner/returns"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: 'var(--space-2) 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                  >
                    <RotateCcw size={16} /> Return Requests
                  </Link>
                </>
              )}

              {role === 'delivery_partner' && (
                <Link
                  to="/delivery"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: 'var(--space-2) 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <Truck size={16} /> Deliveries
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="btn-danger btn-sm"
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                <LogOut size={16} /> Log Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Link to="/login" className="btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                <LogIn size={16} /> Log In
              </Link>
              <Link to="/register" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>
                <UserPlus size={16} /> Register
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Responsive media query styling */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: inline-flex !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-toggle {
            display: none !important;
          }
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
