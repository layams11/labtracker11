import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

export default function UserDashboard() {
  const { user, authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick Availability Checker State
  const [checkForm, setCheckForm] = useState({
    instrumentId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
  });
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchInstruments();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch('/api/user/dashboard');
      if (!res.ok) throw new Error('Failed to load user dashboard.');
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstruments = async () => {
    try {
      const res = await fetch('/api/instruments');
      if (res.ok) {
        const insts = await res.json();
        setInstruments(insts);
        if (insts.length > 0 && !checkForm.instrumentId) {
          setCheckForm((prev) => ({ ...prev, instrumentId: insts[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    setCheckResult(null);

    if (!checkForm.instrumentId || !checkForm.date || !checkForm.startTime || !checkForm.endTime) {
      setCheckResult({ available: false, message: 'Please select all availability check fields.' });
      return;
    }

    try {
      setChecking(true);
      const res = await authFetch('/api/user/check-availability', {
        method: 'POST',
        body: JSON.stringify(checkForm),
      });
      const result = await res.json();
      setCheckResult(result);
    } catch (err) {
      setCheckResult({ available: false, message: err.message || 'Availability check failed.' });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading user dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert-box alert-error">
          <p>{error}</p>
          <button onClick={fetchDashboard} className="btn btn-outline btn-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    availableInstrumentsCount = 0,
    unavailableInstrumentsCount = 0,
    activeBookingsCount = 0,
    completedBookingsCount = 0,
    recentBookings = [],
  } = data || {};

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div>
          <h1 className="page-title">Welcome, {user?.name}</h1>
          <p className="page-subtitle">
            Student &amp; Researcher Laboratory Portal • Instant slot confirmations and usage monitoring
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/instruments" className="btn btn-outline">
            Browse Instruments
          </Link>
          <Link to="/book" className="btn btn-primary">
            + Book an Instrument
          </Link>
          <Link to="/my-bookings" className="btn btn-outline">
            My Bookings
          </Link>
        </div>
      </div>

      {/* 4 User Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Available Instruments"
          value={availableInstrumentsCount}
          icon="✅"
          subtitle="Open for immediate slot reservation"
          colorTheme="green"
        />
        <StatCard
          title="Unavailable Instruments"
          value={unavailableInstrumentsCount}
          icon="⚠️"
          subtitle="Under lab maintenance or offline"
          colorTheme="amber"
        />
        <StatCard
          title="My Active Bookings"
          value={activeBookingsCount}
          icon="📅"
          subtitle="Confirmed slots &amp; live runs"
          colorTheme="blue"
        />
        <StatCard
          title="My Completed Bookings"
          value={completedBookingsCount}
          icon="🧪"
          subtitle="Finished experimental sessions"
          colorTheme="indigo"
        />
      </div>

      {/* Two-Column Grid: Availability Checker + Recent Bookings */}
      <div className="dashboard-grid">
        {/* Left: Quick Availability Checker Widget (Section 14) */}
        <section className="dashboard-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Check Instrument Availability</h2>
              <p className="section-desc">Instantly test whether a time slot is open before booking</p>
            </div>
          </div>

          <form onSubmit={handleCheckAvailability} className="availability-checker-form">
            <div className="form-group">
              <label htmlFor="check-instrument">Select Scientific Instrument</label>
              <select
                id="check-instrument"
                value={checkForm.instrumentId}
                onChange={(e) =>
                  setCheckForm({ ...checkForm, instrumentId: e.target.value })
                }
                required
              >
                {instruments.map((inst) => (
                  <option key={inst._id} value={inst._id}>
                    {inst.name} ({inst.category}) — [{inst.status}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row-three">
              <div className="form-group">
                <label htmlFor="check-date">Date</label>
                <input
                  type="date"
                  id="check-date"
                  value={checkForm.date}
                  onChange={(e) => setCheckForm({ ...checkForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="check-start">Start Time</label>
                <input
                  type="time"
                  id="check-start"
                  value={checkForm.startTime}
                  onChange={(e) =>
                    setCheckForm({ ...checkForm, startTime: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="check-end">End Time</label>
                <input
                  type="time"
                  id="check-end"
                  value={checkForm.endTime}
                  onChange={(e) =>
                    setCheckForm({ ...checkForm, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="checker-actions">
              <button
                type="submit"
                className="btn btn-outline btn-block"
                disabled={checking}
              >
                {checking ? 'Checking MongoDB Slots...' : '🔍 Check Availability'}
              </button>
            </div>
          </form>

          {/* Availability Result Display */}
          {checkResult && (
            <div
              className={`availability-banner ${
                checkResult.available ? 'banner-available' : 'banner-unavailable'
              }`}
            >
              <div className="availability-text">
                <span className="availability-icon">
                  {checkResult.available ? '✅' : '❌'}
                </span>
                <div>
                  <strong>{checkResult.available ? 'AVAILABLE' : 'NOT AVAILABLE'}</strong>
                  <p className="text-xs mt-1">{checkResult.message}</p>
                </div>
              </div>
              {checkResult.available && (
                <Link
                  to={`/book?instrumentId=${checkForm.instrumentId}&date=${checkForm.date}&startTime=${checkForm.startTime}&endTime=${checkForm.endTime}`}
                  className="btn btn-primary btn-sm"
                >
                  Confirm Booking →
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Right: User's Recent Bookings */}
        <section className="dashboard-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">My Recent Bookings</h2>
              <p className="section-desc">Latest reservation status for your laboratory slots</p>
            </div>
            <Link to="/my-bookings" className="btn-link">
              View All →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="empty-state">
              <p>You have not made any bookings yet.</p>
              <Link to="/book" className="btn btn-primary btn-sm mt-3">
                Book First Instrument
              </Link>
            </div>
          ) : (
            <div className="user-recent-list">
              {recentBookings.map((b) => {
                const instName =
                  typeof b.instrumentId === 'object' && b.instrumentId !== null
                    ? b.instrumentId.name
                    : 'Instrument';

                return (
                  <div key={b._id} className="user-recent-card">
                    <div className="user-recent-main">
                      <h4 className="user-recent-inst">{instName}</h4>
                      <span className="user-recent-date">
                        📅 {b.date} • 🕒 {b.startTime} - {b.endTime}
                      </span>
                    </div>
                    <span
                      className={`status-badge status-${b.status.toLowerCase().replace(' ', '-')}`}
                    >
                      {b.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
