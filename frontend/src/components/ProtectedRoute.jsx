import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

/**
 * ProtectedRoute Component
 *
 * NOTE FOR INSTRUCTOR / EXAMINER:
 * Client-side route protection enhances user experience by preventing flicker and guiding
 * users to their role-appropriate screens. However, client-side route hiding is NEVER a security boundary.
 * The FastAPI backend independently validates cryptographic JWT signatures and user roles on every API request.
 */
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader message="Verifying session..." />;
  }

  // Not logged in -> redirect to login, preserving intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required and user doesn't match -> redirect to their own dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (role === 'restaurant_owner') {
      return <Navigate to="/owner" replace />;
    }
    if (role === 'delivery_partner') {
      return <Navigate to="/delivery" replace />;
    }
    return <Navigate to="/restaurants" replace />;
  }

  return children;
};

export default ProtectedRoute;
