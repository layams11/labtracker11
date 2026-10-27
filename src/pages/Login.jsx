import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError(null);
    setEmail('');
    setPassword('');
  };

  const handleFillDemo = (role) => {
    if (role === 'admin') {
      setActiveTab('admin');
      setEmail('admin@lab.edu');
      setPassword('admin123');
    } else {
      setActiveTab('user');
      setEmail('user@lab.edu');
      setPassword('user123');
    }
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login(email, password, activeTab);

      // Route based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🔬</div>
          <h1 className="login-title">Centralized Instrument Booking</h1>
          <p className="login-subtitle">
            Central Instrumentation Facility &amp; Research Laboratories
          </p>
        </div>

        {/* Two Separate Login Portals Selection Tabs */}
        <div className="portal-selector">
          <button
            type="button"
            className={`portal-btn ${activeTab === 'user' ? 'active user-active' : ''}`}
            onClick={() => handleTabSwitch('user')}
          >
            <span className="portal-icon">🎓</span>
            <div>
              <span className="portal-name">User Login</span>
              <span className="portal-hint">Students &amp; Researchers</span>
            </div>
          </button>

          <button
            type="button"
            className={`portal-btn ${activeTab === 'admin' ? 'active admin-active' : ''}`}
            onClick={() => handleTabSwitch('admin')}
          >
            <span className="portal-icon">🛡️</span>
            <div>
              <span className="portal-name">Admin Login</span>
              <span className="portal-hint">Lab Managers &amp; Staff</span>
            </div>
          </button>
        </div>

        {/* Portal Notice */}
        <div className={`portal-banner banner-${activeTab}`}>
          {activeTab === 'user' ? (
            <span>Logging into <strong>User Portal</strong> (Browse, check slots, reserve equipment)</span>
          ) : (
            <span>Logging into <strong>Admin Portal</strong> (Manage instruments, approve &amp; track utilization)</span>
          )}
        </div>

        {/* Error message */}
        {error && <div className="alert-box alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              {activeTab === 'admin' ? 'Admin Email' : 'Student / Researcher Email'}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={activeTab === 'admin' ? 'admin@lab.edu' : 'user@lab.edu'}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className={`btn btn-block ${activeTab === 'admin' ? 'btn-admin' : 'btn-primary'}`}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : activeTab === 'admin' ? 'Login as Admin' : 'Login as User'}
          </button>
        </form>

        {/* Viva Quick Demo Fill Helper */}
        <div className="demo-credentials-box">
          <p className="demo-title">💡 One-Click Demo Credentials:</p>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => handleFillDemo('user')}
            >
              Fill User: user@lab.edu
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => handleFillDemo('admin')}
            >
              Fill Admin: admin@lab.edu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
