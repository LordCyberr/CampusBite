import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Sun,
  Moon,
  Store,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const { totalCount } = useCart();
  const { currencyMode, setCurrencyMode } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  const navLinkStyle = ({ isActive }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    backgroundColor: isActive ? 'var(--color-primary-tint)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  });

  const mobileLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
    backgroundColor: isActive ? 'var(--color-primary-tint)' : 'transparent',
    textDecoration: 'none',
  });

  return (
    <>
      {/* Top Main Navigation Bar */}
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
            gap: '16px',
          }}
        >
          {/* Left Zone: Brand Logo & Campus Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to={getHomeLink()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: 'var(--font-headings)',
                fontSize: '19px',
                fontWeight: 800,
                color: 'var(--color-primary)',
                textDecoration: 'none',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(255, 79, 24, 0.3)',
                }}
              >
                <UtensilsCrossed size={20} />
              </div>
              <span>CampusBite</span>
            </Link>

            {/* Subtle Campus Location Badge (Hidden on small mobile) */}
            <div className="campus-location-pill" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              <MapPin size={13} color="var(--color-primary)" />
              <span style={{ fontWeight: 600 }}>Campus</span>
            </div>
          </div>

          {/* Center Zone: Desktop Primary Navigation Tabs */}
          {isAuthenticated && (
            <nav className="desktop-nav-center" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {role === 'customer' && (
                <>
                  <NavLink to="/restaurants" style={navLinkStyle}>
                    <Store size={16} />
                    <span>Canteens</span>
                  </NavLink>
                  <NavLink to="/orders" style={navLinkStyle}>
                    <Clock size={16} />
                    <span>My Orders</span>
                  </NavLink>
                  <NavLink to="/insights" style={navLinkStyle}>
                    <Sparkles size={16} />
                    <span>AI Insights</span>
                  </NavLink>
                </>
              )}

              {role === 'restaurant_owner' && (
                <>
                  <NavLink to="/owner" end style={navLinkStyle}>
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                  </NavLink>
                  <NavLink to="/owner/orders" style={navLinkStyle}>
                    <ClipboardList size={16} />
                    <span>Orders</span>
                  </NavLink>
                  <NavLink to="/owner/menu" style={navLinkStyle}>
                    <BookOpen size={16} />
                    <span>Menu</span>
                  </NavLink>
                  <NavLink to="/owner/returns" style={navLinkStyle}>
                    <RotateCcw size={16} />
                    <span>Returns</span>
                  </NavLink>
                </>
              )}

              {role === 'delivery_partner' && (
                <NavLink to="/delivery" style={navLinkStyle}>
                  <Truck size={16} />
                  <span>Delivery Queue</span>
                </NavLink>
              )}
            </nav>
          )}

          {/* Right Zone: Controls, Cart, Theme, Currency & User */}
          <div className="desktop-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Currency Mode Selector */}
            <div className="currency-switcher" title="Toggle Currency ($ USD / ₹ INR / Dual)">
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
                ₹
              </button>
              <button
                type="button"
                className={`currency-btn ${currencyMode === 'usd' ? 'active' : ''}`}
                onClick={() => setCurrencyMode('usd')}
              >
                $
              </button>
            </div>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? <Sun size={17} color="#FBBF24" /> : <Moon size={17} color="#64748B" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Cart Button (Customer only) */}
                {role === 'customer' && (
                  <Link
                    to="/cart"
                    className="btn-primary btn-sm"
                    style={{
                      position: 'relative',
                      textDecoration: 'none',
                      gap: '6px',
                    }}
                  >
                    <ShoppingBag size={15} />
                    <span>Cart</span>
                    {totalCount > 0 && (
                      <span
                        style={{
                          backgroundColor: '#FFFFFF',
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
                )}

                {/* User Profile Chip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    backgroundColor: 'var(--color-bg-page)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                    fontWeight: 600,
                    maxWidth: '180px',
                  }}
                >
                  <User size={14} color="var(--color-primary)" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name || 'User'}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '10px', textTransform: 'capitalize' }}>
                    ({role === 'restaurant_owner' ? 'Owner' : role === 'delivery_partner' ? 'Courier' : 'Student'})
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-secondary btn-sm"
                  title="Log Out"
                  aria-label="Log Out"
                  style={{ padding: '6px 10px' }}
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link to="/login" className="btn-secondary btn-sm">
                  <LogIn size={15} />
                  <span>Log In</span>
                </Link>
                <Link to="/register" className="btn-primary btn-sm">
                  <UserPlus size={15} />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Theme + Cart + Hamburger Toggle */}
          <div className="mobile-header-controls" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} color="#FBBF24" /> : <Moon size={16} color="#64748B" />}
            </button>

            {isAuthenticated && role === 'customer' && (
              <Link
                to="/cart"
                className="btn-primary btn-sm"
                style={{ padding: '6px 10px', textDecoration: 'none', gap: '4px' }}
                aria-label="View Cart"
              >
                <ShoppingBag size={15} />
                {totalCount > 0 && <span style={{ fontWeight: 800 }}>{totalCount}</span>}
              </Link>
            )}

            <button
              type="button"
              className="mobile-toggle btn-secondary btn-sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              style={{ padding: '6px 10px' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Collapsible Drawer Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderTop: '1px solid var(--color-border)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: 'var(--shadow-lg)',
            }}
            className="mobile-drawer"
          >
            {/* User Profile Card on Mobile */}
            {isAuthenticated ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: 'var(--color-bg-page)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-tint)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  <User size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{user?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {user?.email} • <span style={{ textTransform: 'capitalize' }}>{role?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Currency Mode Selector on Mobile */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Currency Display:
              </span>
              <div className="currency-switcher">
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
            </div>

            {/* Navigation Links on Mobile */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {role === 'customer' && (
                  <>
                    <NavLink to="/restaurants" style={mobileLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                      <Store size={18} />
                      <span>Campus Canteens</span>
                    </NavLink>
                    <NavLink to="/orders" style={mobileLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                      <Clock size={18} />
                      <span>My Orders</span>
                    </NavLink>
                    <NavLink to="/insights" style={mobileLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                      <Sparkles size={18} />
                      <span>AI Insights</span>
                    </NavLink>
                    <NavLink to="/cart" style={mobileLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                      <ShoppingBag size={18} />
                      <span>My Cart ({totalCount} items)</span>
                    </NavLink>
                  </>
                )}

                {role === 'restaurant_owner' && (
                  <>
                    <NavLink to="/owner" end style={mobileLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard size={18} />
                      <span>Kitchen Dashboard</span>
                    </NavLink>
                    <NavLink to="/owner/orders" style={mobileLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                      <ClipboardList size={18} />
                      <span>Order Management</span>
                    </NavLink>
                    <NavLink to="/owner/menu" style={mobileLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                      <BookOpen size={18} />
                      <span>Menu Catalog</span>
                    </NavLink>
                    <NavLink to="/owner/returns" style={mobileLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                      <RotateCcw size={18} />
                      <span>Return Claims</span>
                    </NavLink>
                  </>
                )}

                {role === 'delivery_partner' && (
                  <NavLink to="/delivery" style={mobileLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                    <Truck size={18} />
                    <span>Courier Delivery Queue</span>
                  </NavLink>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-danger btn-sm"
                  style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <Link to="/login" className="btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                  <LogIn size={16} />
                  <span>Sign In</span>
                </Link>
                <Link to="/register" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Responsive CSS Media Queries */}
        <style>{`
          @media (max-width: 992px) {
            .desktop-nav-center {
              display: none !important;
            }
            .desktop-nav-right {
              display: none !important;
            }
            .campus-location-pill {
              display: none !important;
            }
            .mobile-header-controls {
              display: flex !important;
            }
          }
          @media (min-width: 993px) {
            .mobile-header-controls {
              display: none !important;
            }
            .mobile-drawer {
              display: none !important;
            }
          }
        `}</style>
      </header>

      {/* Swiggy/Zomato Fixed Bottom Navigation Bar for Mobile (< 768px) */}
      {isAuthenticated && role === 'customer' && (
        <nav
          className="mobile-bottom-nav"
          style={{
            display: 'none',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '62px',
            backgroundColor: 'var(--color-bg-surface)',
            borderTop: '1px solid var(--color-border)',
            zIndex: 900,
            justifyContent: 'space-around',
            alignItems: 'center',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <NavLink
            to="/restaurants"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              textDecoration: 'none',
            })}
          >
            <Store size={18} />
            <span>Canteens</span>
          </NavLink>

          <NavLink
            to="/orders"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              textDecoration: 'none',
            })}
          >
            <Clock size={18} />
            <span>Orders</span>
          </NavLink>

          <NavLink
            to="/cart"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              textDecoration: 'none',
              position: 'relative',
            })}
          >
            <div style={{ position: 'relative' }}>
              <ShoppingBag size={18} />
              {totalCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {totalCount}
                </span>
              )}
            </div>
            <span>Cart</span>
          </NavLink>

          <NavLink
            to="/insights"
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              textDecoration: 'none',
            })}
          >
            <Sparkles size={18} />
            <span>AI Insights</span>
          </NavLink>
        </nav>
      )}

      {/* Style rule to activate bottom bar only on mobile screens (< 768px) */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex !important;
          }
          .page-wrapper {
            padding-bottom: 84px !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
