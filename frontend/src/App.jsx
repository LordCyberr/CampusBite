import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import FloatingCart from './components/FloatingCart';
import ProtectedRoute from './components/ProtectedRoute';

// Public & Customer Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Restaurants from './pages/Restaurants';
import RestaurantMenu from './pages/RestaurantMenu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import AIInsights from './pages/customer/AIInsights';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerOrders from './pages/owner/OwnerOrders';
import OwnerMenu from './pages/owner/OwnerMenu';
import OwnerReturns from './pages/owner/OwnerReturns';

// Delivery Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

// Error Page
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="app-root">
      <Navbar />
      <main>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/restaurants" replace />} />

          {/* Protected Customer Routes */}
          <Route
            path="/restaurants"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Restaurants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurants/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RestaurantMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <AIInsights />
              </ProtectedRoute>
            }
          />

          {/* Protected Restaurant Owner Routes */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['restaurant_owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/orders"
            element={
              <ProtectedRoute allowedRoles={['restaurant_owner']}>
                <OwnerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/menu"
            element={
              <ProtectedRoute allowedRoles={['restaurant_owner']}>
                <OwnerMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/returns"
            element={
              <ProtectedRoute allowedRoles={['restaurant_owner']}>
                <OwnerReturns />
              </ProtectedRoute>
            }
          />

          {/* Protected Delivery Partner Routes */}
          <Route
            path="/delivery"
            element={
              <ProtectedRoute allowedRoles={['delivery_partner']}>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <FloatingCart />
    </div>
  );
}

export default App;
