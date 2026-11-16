import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const getHomeLink = () => {
    if (!isAuthenticated) return '/login';
    if (role === 'restaurant_owner') return '/owner';
    if (role === 'delivery_partner') return '/delivery';
    return '/restaurants';
  };

  // User monogram for avatar
  const userInitial = (user?.name || 'U').trim().charAt(0).toUpperCase();
  const firstName = (user?.name || 'User').split(' ')[0];

  const roleLabel =
    role === 'restaurant_owner'
      ? 'Owner'
      : role === 'delivery_partner'
      ? 'Courier'
      : 'Student';

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
            height: '66px',
            gap: '16px',
          }}
        >
          {/* Left Zone: Brand Logo & Campus Location Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                letterSpacing: '-0.02em',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(255, 79, 24, 0.3)',
                  flexShrink: 0,
                }}
              >
                <UtensilsCrossed size={19} />
              </div>
              <span>CampusBite</span>
            </Link>

            {/* Subtle Divider */}
            <div
              className="navbar-brand-divider"
              style={{
                width: '1px',
                height: '22px',
                backgroundColor: 'var(--color-border)',
              }}
            />

            {/* Campus Location Pill (Interactive Zomato/Swiggy Location Selector) */}
            <div
              className="campus-location-selector"
              title="Campus Delivery Zone: Central Campus"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-bg-page)',
                border: '1px solid var(--color-border)',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                cursor: 'default',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                height: '34px',
                boxSizing: 'border-box',
              }}
            >
              <MapPin size={13} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                Central Campus
              </span>
              <ChevronDown size={12} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
            </div>
          </div>

          {/* Center Zone: Desktop Primary Navigation Tabs with Animated Bottom Indicator */}
          {isAuthenticated && (
            <nav
              className="desktop-nav-center"
              style={{
                display: 'flex',
                alignItems: 'stretch',
                height: '66px',
                gap: '4px',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {role === 'customer' && (
                <>
                  <NavLink
                    to="/restaurants"
                    className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
                  >
                    <Store size={16} />
                    <span>Canteens</span>
                  </NavLink>

                  <NavLink
                    to="/orders"
                    className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
                  >
                    <Clock size={16} />
                    <span>My Orders</span>
                  </NavLink>

                  <NavLink
                    to="/insights"
                    className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
                  >
                    <Sparkles size={16} />
                    <span>AI Insights</span>
                  </NavLink>
                </>
              )}

              {role === 'restaurant_owner' && (
                <>
                  <NavLink
                    to="/owner"
                    end
                    className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
                  >
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                  </NavLink>
                  <NavLink
                    to="/owner/orders"
                    className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
                  >
                    <ClipboardList size={16} />
                    <span>Orders</span>
                  </NavLink>
                  <NavLink
                    to="/owner/menu"
                    className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
                  >
                    <BookOpen size={16} />
                    <span>Menu</span>
                  </NavLink>
                  <NavLink
                    to="/owner/returns"
                    className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
                  >
                    <RotateCcw size={16} />
                    <span>Returns</span>
                  </NavLink>
                </>
              )}

              {role === 'delivery_partner' && (
                <NavLink
                  to="/delivery"
                  className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
                >
                  <Truck size={16} />
                  <span>Delivery Queue</span>
                </NavLink>
              )}
            </nav>
          )}

          {/* Right Zone: Currency, Theme, Cart & Profile Avatar Menu */}
          <div className="desktop-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Currency Mode Selector */}
            <div className="currency-switcher" title="Toggle Currency ($ USD / ₹ INR / Dual)" style={{ height: '34px' }}>
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

            {/* Dark / Light Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
              style={{ width: '34px', height: '34px', minHeight: '34px', maxHeight: '34px', flexShrink: 0 }}
            >
              {theme === 'dark' ? <Sun size={16} color="#FBBF24" /> : <Moon size={16} color="#64748B" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Cart Button (Customer only) */}
                {role === 'customer' && (
                  <Link
                    to="/cart"
                    className={totalCount > 0 ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <ShoppingBag size={14} />
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

                {/* Profile Avatar Dropdown Trigger */}
                <div style={{ position: 'relative', flexShrink: 0 }} ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      height: '34px',
                      padding: '0 10px 0 3px',
                      backgroundColor: profileDropdownOpen ? 'var(--color-bg-page)' : 'transparent',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-full)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      outline: 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                    aria-label="User Menu"
                    aria-expanded={profileDropdownOpen}
                  >
                    {/* User Avatar Circle */}
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF4F18 0%, #FF7A45 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '12.5px',
                        boxShadow: '0 2px 6px rgba(255, 79, 24, 0.25)',
                        flexShrink: 0,
                      }}
                    >
                      {userInitial}
                    </div>

                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                      {firstName}
                    </span>

                    <ChevronDown
                      size={13}
                      color="var(--color-text-muted)"
                      style={{
                        transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {/* Elegant Floating Popover Dropdown Card */}
                  {profileDropdownOpen && (
                    <div
                      className="profile-popover-card"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        width: '250px',
                        backgroundColor: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '14px',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '14px',
                        zIndex: 200,
                        animation: 'popoverFadeIn 0.15s ease-out',
                      }}
                    >
                      {/* Popover Header with Full User Info */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FF4F18 0%, #FF7A45 100%)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '15px',
                            flexShrink: 0,
                          }}
                        >
                          {userInitial}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: '14px',
                              color: 'var(--color-text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {user?.name || 'Student User'}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--color-primary)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            🎓 {roleLabel} Account
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--color-text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '2px',
                            }}
                          >
                            {user?.email || ''}
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Navigation Links */}
                      <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {role === 'customer' && (
                          <>
                            <Link
                              to="/orders"
                              className="dropdown-menu-link"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <Clock size={15} />
                              <span>My Order History</span>
                            </Link>
                            <Link
                              to="/cart"
                              className="dropdown-menu-link"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <ShoppingBag size={15} />
                              <span>View Cart ({totalCount})</span>
                            </Link>
                            <Link
                              to="/insights"
                              className="dropdown-menu-link"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <Sparkles size={15} />
                              <span>AI Food Insights</span>
                            </Link>
                          </>
                        )}

                        {role === 'restaurant_owner' && (
                          <>
                            <Link
                              to="/owner"
                              className="dropdown-menu-link"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <LayoutDashboard size={15} />
                              <span>Kitchen Overview</span>
                            </Link>
                            <Link
                              to="/owner/orders"
                              className="dropdown-menu-link"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <ClipboardList size={15} />
                              <span>Order Queue</span>
                            </Link>
                            <Link
                              to="/owner/menu"
                              className="dropdown-menu-link"
                              onClick={() => setProfileDropdownOpen(false)}
                            >
                              <BookOpen size={15} />
                              <span>Menu Management</span>
                            </Link>
                          </>
                        )}

                        {role === 'delivery_partner' && (
                          <Link
                            to="/delivery"
                            className="dropdown-menu-link"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Truck size={15} />
                            <span>Delivery Tasks</span>
                          </Link>
                        )}
                      </div>

                      {/* Dropdown Logout Action */}
                      <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '8px' }}>
                        <button
                          type="button"
                          onClick={handleLogout}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-error)',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-error-surface)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <LogOut size={15} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link to="/login" className="btn-secondary btn-sm" style={{ height: '36px', padding: '0 14px' }}>
                  <LogIn size={15} />
                  <span>Log In</span>
                </Link>
                <Link to="/register" className="btn-primary btn-sm" style={{ height: '36px', padding: '0 14px' }}>
                  <UserPlus size={15} />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Theme + Cart + Menu Button */}
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
                style={{
                  height: '34px',
                  padding: '0 10px',
                  borderRadius: 'var(--radius-full)',
                  gap: '4px',
                }}
                aria-label="View Cart"
              >
                <ShoppingBag size={14} />
                {totalCount > 0 && <span style={{ fontWeight: 800 }}>{totalCount}</span>}
              </Link>
            )}

            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div
            className="mobile-drawer"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderBottom: '1px solid var(--color-border)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--shadow-md)',
              animation: 'drawerSlideDown 0.2s ease-out',
            }}
          >
            {/* User Profile Info on Mobile */}
            {isAuthenticated && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-bg-page)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF4F18 0%, #FF7A45 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                  }}
                >
                  {userInitial}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {roleLabel} • {user?.email}
                  </div>
                </div>
              </div>
            )}

            {/* Currency Mode Switcher on Mobile */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Currency:
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

            {/* Mobile Nav Links */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {role === 'customer' && (
                  <>
                    <NavLink to="/restaurants" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <Store size={18} />
                      <span>Campus Canteens</span>
                    </NavLink>
                    <NavLink to="/orders" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <Clock size={18} />
                      <span>My Orders</span>
                    </NavLink>
                    <NavLink to="/insights" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <Sparkles size={18} />
                      <span>AI Insights</span>
                    </NavLink>
                    <NavLink to="/cart" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <ShoppingBag size={18} />
                      <span>Cart ({totalCount} items)</span>
                    </NavLink>
                  </>
                )}

                {role === 'restaurant_owner' && (
                  <>
                    <NavLink to="/owner" end className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard size={18} />
                      <span>Kitchen Dashboard</span>
                    </NavLink>
                    <NavLink to="/owner/orders" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <ClipboardList size={18} />
                      <span>Order Management</span>
                    </NavLink>
                    <NavLink to="/owner/menu" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <BookOpen size={18} />
                      <span>Menu Catalog</span>
                    </NavLink>
                    <NavLink to="/owner/returns" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <RotateCcw size={18} />
                      <span>Return Claims</span>
                    </NavLink>
                  </>
                )}

                {role === 'delivery_partner' && (
                  <NavLink to="/delivery" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <Truck size={18} />
                    <span>Courier Queue</span>
                  </NavLink>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-danger btn-sm"
                  style={{ width: '100%', marginTop: '10px', height: '40px', justifyContent: 'center' }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                <Link to="/login" className="btn-secondary" style={{ height: '42px' }} onClick={() => setMobileMenuOpen(false)}>
                  <LogIn size={16} />
                  <span>Log In</span>
                </Link>
                <Link to="/register" className="btn-primary" style={{ height: '42px' }} onClick={() => setMobileMenuOpen(false)}>
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Global Component Styles for Modern Navbar */}
        <style>{`
          .nav-tab-item {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 0 16px;
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-secondary);
            text-decoration: none;
            position: relative;
            white-space: nowrap !important;
            flex-shrink: 0;
            transition: color 0.15s ease;
          }
          .nav-tab-item:hover {
            color: var(--color-text-primary);
          }
          .nav-tab-item.active {
            color: var(--color-primary);
            font-weight: 700;
          }
          .nav-tab-item.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 14px;
            right: 14px;
            height: 3px;
            background-color: var(--color-primary);
            border-radius: 3px 3px 0 0;
          }

          .dropdown-menu-link {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 10px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            color: var(--color-text-primary);
            text-decoration: none;
            transition: background-color 0.15s ease, color 0.15s ease;
          }
          .dropdown-menu-link:hover {
            background-color: var(--color-bg-page);
            color: var(--color-primary);
          }

          .mobile-nav-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 11px 14px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            color: var(--color-text-primary);
            text-decoration: none;
            transition: background-color 0.15s ease;
          }
          .mobile-nav-link.active {
            color: var(--color-primary);
            background-color: var(--color-primary-tint);
            font-weight: 700;
          }

          @keyframes popoverFadeIn {
            from {
              opacity: 0;
              transform: translateY(-6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes drawerSlideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 992px) {
            .desktop-nav-center {
              display: none !important;
            }
            .desktop-nav-right {
              display: none !important;
            }
            .navbar-brand-divider {
              display: none !important;
            }
            .campus-location-selector {
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

      {/* Responsive Guard for Mobile Page Padding */}
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
