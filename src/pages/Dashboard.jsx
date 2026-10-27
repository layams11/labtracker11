import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard');
      if (!res.ok) {
        throw new Error('Failed to load dashboard data');
      }
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert-box alert-error">
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-outline btn-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    totalInstruments = 0,
    availableInstruments = 0,
    activeBookings = 0,
    totalBookings = 0,
    recentBookings = [],
    availableInstrumentList = [],
  } = dashboardData || {};

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="dashboard-hero">
        <div>
          <h1 className="page-title">Laboratory Overview</h1>
          <p className="page-subtitle">
            Centralized Scientific Instrument Booking &amp; Utilization Tracking System
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/book" className="btn btn-primary">
            + New Booking
          </Link>
          <Link to="/instruments" className="btn btn-outline">
            Browse All Instruments
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Instruments"
          value={totalInstruments}
          icon="🔬"
          subtitle="Registered laboratory assets"
          colorTheme="blue"
        />
        <StatCard
          title="Available Instruments"
          value={availableInstruments}
          icon="✅"
          subtitle="Ready for student and researcher booking"
          colorTheme="green"
        />
        <StatCard
          title="Active Bookings"
          value={activeBookings}
          icon="📅"
          subtitle="Scheduled instrument reservations"
          colorTheme="amber"
        />
        <StatCard
          title="Total Bookings"
          value={totalBookings}
          icon="📊"
          subtitle="All historical booking records"
          colorTheme="indigo"
        />
      </div>

      {/* Dashboard Two-Column Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Recent Bookings */}
        <section className="dashboard-section recent-bookings-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Bookings</h2>
              <p className="section-desc">Latest reservation activity in the facility</p>
            </div>
            <Link to="/bookings" className="btn-link">
              View All ({totalBookings}) →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="empty-state">No bookings found.</div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Instrument</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => {
                    const instName =
                      typeof b.instrumentId === 'object' && b.instrumentId !== null
                        ? b.instrumentId.name
                        : 'Instrument';

                    return (
                      <tr key={b._id}>
                        <td className="font-semibold">{b.userName}</td>
                        <td>{instName}</td>
                        <td>{b.date}</td>
                        <td className="time-cell">
                          {b.startTime} - {b.endTime}
                        </td>
                        <td>
                          <span
                            className={`status-badge status-${b.status.toLowerCase()}`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right Column: Currently Available Instruments */}
        <section className="dashboard-section available-instruments-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Available Instruments</h2>
              <p className="section-desc">Equipment immediately open for booking</p>
            </div>
            <Link to="/instruments" className="btn-link">
              View All ({availableInstruments}) →
            </Link>
          </div>

          {availableInstrumentList.length === 0 ? (
            <div className="empty-state">No instruments available.</div>
          ) : (
            <div className="available-quick-list">
              {availableInstrumentList.map((inst) => (
                <div key={inst._id} className="quick-instrument-card">
                  <div className="quick-instrument-info">
                    <h4>{inst.name}</h4>
                    <div className="quick-tags">
                      <span className="mini-tag category-tag">{inst.category}</span>
                      <span className="mini-tag location-tag">📍 {inst.location}</span>
                    </div>
                  </div>
                  <Link
                    to={`/book?instrumentId=${inst._id}`}
                    className="btn btn-primary btn-xs"
                  >
                    Book Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
