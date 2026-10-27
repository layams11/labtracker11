import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <Link
          to={isAdmin ? '/admin/dashboard' : isUser ? '/user/dashboard' : '/login'}
          className="navbar-brand"
        >
          <div className="brand-icon">🔬</div>
          <div className="brand-text">
            <span className="brand-title">LabTrack Central</span>
            <span className="brand-subtitle">
              {isAdmin ? 'Administrator Portal' : isUser ? 'Student & Researcher Portal' : 'Scientific Instrument Booking'}
            </span>
          </div>
        </Link>

        <nav className="navbar-nav">
          {/* USER NAVIGATION */}
          {isAuthenticated && isUser && (
            <>
              <NavLink
                to="/user/dashboard"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/instruments"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                Instruments
              </NavLink>
              <NavLink
                to="/book"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                Book Instrument
              </NavLink>
              <NavLink
                to="/my-bookings"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                My Bookings
              </NavLink>
            </>
          )}

          {/* ADMIN NAVIGATION */}
          {isAuthenticated && isAdmin && (
            <>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/instruments"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                Instruments
              </NavLink>
              <NavLink
                to="/admin/bookings"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                Manage Bookings
              </NavLink>
              <NavLink
                to="/admin/utilization"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                Utilization
              </NavLink>
            </>
          )}

          <NavLink
            to="/database"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>🗄️</span> Database
          </NavLink>

          {/* USER PROFILE & LOGOUT */}
          {isAuthenticated ? (
            <div className="nav-user-controls">
              <div className={`user-badge user-badge-${user.role}`}>
                <span className="user-icon">{user.role === 'admin' ? '🛡️' : '👤'}</span>
                <span className="user-name">{user.name}</span>
                <span className="role-tag">({user.role.toUpperCase()})</span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-xs nav-logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
