import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Helper to format minutes into human readable "1 hr 34 min"
export function formatMinutes(mins) {
  if (mins === null || mins === undefined || isNaN(mins)) return '—';
  const total = Math.round(mins);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

// Helper to calculate scheduled duration from startTime and endTime
export function calculateScheduledDuration(startTime, endTime) {
  if (!startTime || !endTime) return '—';
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const diffMinutes = Math.max(0, eH * 60 + eM - (sH * 60 + sM));
  return formatMinutes(diffMinutes);
}

export default function AdminBookings() {
  const { authFetch } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch('/api/admin/bookings');
      if (!res.ok) throw new Error('Failed to load laboratory bookings.');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Start Usage
  const handleStartUsage = async (bookingId, instrumentName, userName) => {
    const confirmed = window.confirm(
      `Start actual instrument usage for "${instrumentName}" (User: ${userName})?\nThis will record the current timestamp and set status to "In Progress".`
    );
    if (!confirmed) return;

    try {
      setProcessingId(bookingId);
      const res = await authFetch(`/api/admin/bookings/${bookingId}/start-usage`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start usage.');

      setNotification({
        type: 'success',
        text: `Usage started for ${instrumentName}. Status is now "In Progress".`,
      });
      setTimeout(() => setNotification(null), 4000);
      fetchBookings();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // End Usage
  const handleEndUsage = async (bookingId, instrumentName, userName) => {
    const confirmed = window.confirm(
      `End actual instrument usage for "${instrumentName}" (User: ${userName})?\nThis will record the end time, calculate the actual usage duration, and mark as "Completed".`
    );
    if (!confirmed) return;

    try {
      setProcessingId(bookingId);
      const res = await authFetch(`/api/admin/bookings/${bookingId}/end-usage`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to end usage.');

      setNotification({
        type: 'success',
        text: `Usage ended for ${instrumentName}. Recorded: ${formatMinutes(
          data.booking?.actualUsageDuration
        )}. Status: "Completed".`,
      });
      setTimeout(() => setNotification(null), 5000);
      fetchBookings();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId, instrumentName, userName) => {
    const confirmed = window.confirm(
      `Cancel reservation for "${instrumentName}" (User: ${userName})?\nThis will immediately free the time slot for future bookings.`
    );
    if (!confirmed) return;

    try {
      setProcessingId(bookingId);
      const res = await authFetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel booking.');

      setNotification({
        type: 'success',
        text: `Booking cancelled and time slot released.`,
      });
      setTimeout(() => setNotification(null), 4000);
      fetchBookings();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'status-badge status-approved';
      case 'In Progress':
        return 'status-badge status-in-progress';
      case 'Completed':
        return 'status-badge status-completed';
      case 'Cancelled':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge';
    }
  };

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const userName = (b.userId?.name || '').toLowerCase();
      const userEmail = (b.userId?.email || '').toLowerCase();
      const instName = (b.instrumentId?.name || '').toLowerCase();
      const purpose = (b.purpose || '').toLowerCase();

      return (
        userName.includes(term) ||
        userEmail.includes(term) ||
        instName.includes(term) ||
        purpose.includes(term)
      );
    }
    return true;
  });

  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length;
  const inProgressCount = bookings.filter((b) => b.status === 'In Progress').length;
  const completedCount = bookings.filter((b) => b.status === 'Completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'Cancelled').length;

  return (
    <div className="page-container">
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Manage Laboratory Bookings &amp; Usage</h1>
          <p className="page-subtitle">
            Track scheduled vs actual instrument usage runtimes, start/end lab sessions, and manage reservations
          </p>
        </div>
        <button onClick={fetchBookings} className="btn btn-outline btn-sm">
          🔄 Refresh
        </button>
      </div>

      {notification && (
        <div className={`alert-box alert-${notification.type}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="alert-close">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="alert-box alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="alert-close">
            ×
          </button>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="filter-and-search-container">
        <div className="status-tabs">
          <button
            className={`tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All ({bookings.length})
          </button>
          <button
            className={`tab-btn ${statusFilter === 'Confirmed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Confirmed')}
          >
            Confirmed ({confirmedCount})
          </button>
          <button
            className={`tab-btn ${statusFilter === 'In Progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('In Progress')}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            className={`tab-btn ${statusFilter === 'Completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Completed')}
          >
            Completed ({completedCount})
          </button>
          <button
            className={`tab-btn ${statusFilter === 'Cancelled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Cancelled')}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>

        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by student, email, or equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="search-clear-btn"
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Admin Booking Table (Section 9) */}
      {loading ? (
        <div className="loading-state">Loading bookings schedule...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No matching reservations found.</div>
      ) : (
        <div className="table-card">
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const userName = b.userId?.name || 'Student';
                  const userEmail = b.userId?.email || 'N/A';
                  const instName = b.instrumentId?.name || 'Instrument';

                  const scheduledDurationText = calculateScheduledDuration(
                    b.startTime,
                    b.endTime
                  );
                  const isProcessing = processingId === b._id;

                  return (
                    <tr key={b._id} className={`booking-row-${b.status.toLowerCase().replace(' ', '-')}`}>
                      <td>
                        <div className="font-semibold">{userName}</div>
                        <div className="text-muted text-xs">{userEmail}</div>
                      </td>
                      <td>
                        <span className="instrument-table-name">{instName}</span>
                      </td>
                      <td>{b.date}</td>
                      <td className="time-cell">
                        <div>{b.startTime} - {b.endTime}</div>
                        <div className="text-muted text-xs">({scheduledDurationText})</div>
                      </td>
                      <td>
                        {b.status === 'Completed' && (
                          <span className="actual-usage-badge font-bold text-primary">
                            ⏱️ {formatMinutes(b.actualUsageDuration)}
                          </span>
                        )}
                        {b.status === 'In Progress' && (
                          <span className="actual-usage-running text-warning font-semibold">
                            🟢 Running...
                          </span>
                        )}
                        {(b.status === 'Confirmed' || b.status === 'Cancelled') && (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(b.status)}>{b.status}</span>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          {/* If Confirmed: [ Start Usage ] [ Cancel ] */}
                          {b.status === 'Confirmed' && (
                            <>
                              <button
                                onClick={() => handleStartUsage(b._id, instName, userName)}
                                className="btn btn-primary btn-xs"
                                disabled={isProcessing}
                                title="Click when user begins using the equipment"
                              >
                                ▶ Start Usage
                              </button>
                              <button
                                onClick={() => handleCancelBooking(b._id, instName, userName)}
                                className="btn btn-danger-outline btn-xs"
                                disabled={isProcessing}
                                title="Cancel booking and free the slot"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {/* If In Progress: [ End Usage ] [ Cancel ] */}
                          {b.status === 'In Progress' && (
                            <>
                              <button
                                onClick={() => handleEndUsage(b._id, instName, userName)}
                                className="btn btn-success-outline btn-xs"
                                disabled={isProcessing}
                                title="Click when user finishes experiment to record actual duration"
                              >
                                ⏹ End Usage
                              </button>
                              <button
                                onClick={() => handleCancelBooking(b._id, instName, userName)}
                                className="btn btn-danger-outline btn-xs"
                                disabled={isProcessing}
                                title="Cancel booking"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {/* If Completed or Cancelled: No start/end buttons */}
                          {b.status === 'Completed' && (
                            <span className="text-success text-xs font-semibold">✓ Completed</span>
                          )}
                          {b.status === 'Cancelled' && (
                            <span className="text-muted text-xs">Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
