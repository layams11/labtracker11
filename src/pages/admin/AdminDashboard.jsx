import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { formatMinutes } from './AdminBookings';

export default function AdminDashboard() {
  const { user, authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const fetchAdminDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Failed to load admin dashboard metrics.');
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartUsage = async (bookingId) => {
    try {
      const res = await authFetch(`/api/admin/bookings/${bookingId}/start-usage`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to start usage');
      fetchAdminDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEndUsage = async (bookingId) => {
    try {
      const res = await authFetch(`/api/admin/bookings/${bookingId}/end-usage`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to end usage');
      fetchAdminDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this booking and free the slot?');
    if (!confirmed) return;

    try {
      const res = await authFetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to cancel booking');
      fetchAdminDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading admin overview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert-box alert-error">
          <p>{error}</p>
          <button onClick={fetchAdminDashboard} className="btn btn-outline btn-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    totalInstruments = 0,
    availableInstruments = 0,
    maintenanceInstruments = 0,
    totalBookings = 0,
    confirmedBookings = 0,
    inProgressBookings = 0,
    completedBookings = 0,
    cancelledBookings = 0,
    recentBookings = [],
  } = data || {};

  return (
    <div className="page-container">
      {/* Admin Hero Header */}
      <div className="dashboard-hero admin-hero">
        <div>
          <div className="admin-title-badge">🛡️ Laboratory Administrator Control Panel</div>
          <h1 className="page-title mt-1">System Overview &amp; Laboratory Operations</h1>
          <p className="page-subtitle">
            Welcome, <strong>{user?.name}</strong> • Real-time operational tracking of equipment schedules and live usage
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/admin/instruments" className="btn btn-primary">
            + Manage Equipment
          </Link>
          <Link to="/admin/bookings" className="btn btn-outline">
            Review Bookings ({confirmedBookings} Confirmed)
          </Link>
          <Link to="/admin/utilization" className="btn btn-outline">
            View Utilization
          </Link>
        </div>
      </div>

      {/* 8 Metric Cards Grid */}
      <div className="admin-stats-grid">
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
          subtitle="Open for automatic reservation"
          colorTheme="green"
        />
        <StatCard
          title="Under Maintenance"
          value={maintenanceInstruments}
          icon="🔧"
          subtitle="Unavailable for reservation"
          colorTheme="amber"
        />
        <StatCard
          title="Total Bookings"
          value={totalBookings}
          icon="📊"
          subtitle="All historical records"
          colorTheme="indigo"
        />
        <StatCard
          title="Confirmed Bookings"
          value={confirmedBookings}
          icon="👍"
          subtitle="Automatically confirmed slots"
          colorTheme="blue"
        />
        <StatCard
          title="In Progress"
          value={inProgressBookings}
          icon="🟢"
          subtitle="Currently active live runs"
          colorTheme="amber"
        />
        <StatCard
          title="Completed Bookings"
          value={completedBookings}
          icon="🧪"
          subtitle="Finished laboratory experiments"
          colorTheme="green"
        />
        <StatCard
          title="Cancelled Bookings"
          value={cancelledBookings}
          icon="❌"
          subtitle="Freed slots"
          colorTheme="indigo"
        />
      </div>

      {/* Recent Bookings Section */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Recent Laboratory Bookings (All Users)</h2>
            <p className="section-desc">Latest reservations placed by students and researchers</p>
          </div>
          <Link to="/admin/bookings" className="btn-link">
            Manage All Bookings ({totalBookings}) →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="empty-state">No bookings found in the system.</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Instrument</th>
                  <th>Date</th>
                  <th>Scheduled Time</th>
                  <th>Actual Usage</th>
                  <th>Status</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => {
                  const userName = b.userId?.name || 'Student';
                  const userEmail = b.userId?.email || '';
                  const instName = b.instrumentId?.name || 'Instrument';

                  return (
                    <tr key={b._id}>
                      <td>
                        <div className="font-semibold">{userName}</div>
                        <div className="text-muted text-xs">{userEmail}</div>
                      </td>
                      <td>
                        <span className="instrument-table-name">{instName}</span>
                      </td>
                      <td>{b.date}</td>
                      <td className="time-cell">
                        {b.startTime} - {b.endTime}
                      </td>
                      <td>
                        {b.status === 'Completed' && (
                          <span className="actual-usage-badge text-primary font-bold">
                            ⏱️ {formatMinutes(b.actualUsageDuration)}
                          </span>
                        )}
                        {b.status === 'In Progress' && (
                          <span className="text-warning font-semibold">
                            🟢 Running...
                          </span>
                        )}
                        {(b.status === 'Confirmed' || b.status === 'Cancelled') && (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${b.status.toLowerCase().replace(' ', '-')}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          {b.status === 'Confirmed' && (
                            <>
                              <button
                                onClick={() => handleStartUsage(b._id)}
                                className="btn btn-primary btn-xs"
                                title="Start live experiment run"
                              >
                                Start
                              </button>
                              <button
                                onClick={() => handleCancelBooking(b._id)}
                                className="btn btn-danger-outline btn-xs"
                                title="Cancel booking"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {b.status === 'In Progress' && (
                            <>
                              <button
                                onClick={() => handleEndUsage(b._id)}
                                className="btn btn-success-outline btn-xs"
                                title="End usage and record runtime"
                              >
                                End Usage
                              </button>
                              <button
                                onClick={() => handleCancelBooking(b._id)}
                                className="btn btn-danger-outline btn-xs"
                                title="Cancel booking"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {(b.status === 'Completed' || b.status === 'Cancelled') && (
                            <span className="text-muted text-xs">{b.status}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
