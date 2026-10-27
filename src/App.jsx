import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import Instruments from './pages/Instruments';
import BookInstrument from './pages/BookInstrument';
import MyBookings from './pages/MyBookings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminInstruments from './pages/admin/AdminInstruments';
import AdminBookings from './pages/admin/AdminBookings';
import AdminUtilization from './pages/admin/AdminUtilization';

// Database Inspector
import DatabaseExplorer from './pages/DatabaseExplorer';

import './App.css';

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* USER PROTECTED ROUTES */}
              <Route
                path="/user/dashboard"
                element={
                  <ProtectedRoute allowedRole="user">
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instruments"
                element={
                  <ProtectedRoute>
                    <Instruments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book"
                element={
                  <ProtectedRoute allowedRole="user">
                    <BookInstrument />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute allowedRole="user">
                    <MyBookings />
                  </ProtectedRoute>
                }
              />

              {/* ADMIN PROTECTED ROUTES */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/instruments"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminInstruments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/utilization"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminUtilization />
                  </ProtectedRoute>
                }
              />

              {/* Database Inspector Route */}
              <Route path="/database" element={<DatabaseExplorer />} />

              {/* Root & Catch-all */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </main>

          <footer className="app-footer">
            <div className="footer-container">
              <p>
                <strong>Centralized Scientific Instrument Booking &amp; Utilization Tracking System</strong>
              </p>
              <p className="text-muted text-xs">
                Two-Role Role-Based Architecture (USER &amp; ADMIN) • Central Instrumentation Facility &amp; Research Labs
              </p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
