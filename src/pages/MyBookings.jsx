import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatMinutes, calculateScheduledDuration } from './admin/AdminBookings';

export default function MyBookings() {
  const { user, authFetch } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch('/api/user/bookings');
      if (!res.ok) throw new Error('Failed to load your bookings.');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId, instrumentName) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your reservation for "${instrumentName}"?\nThis will immediately free the time slot for others.`
    );
    if (!confirmed) return;

    try {
      const res = await authFetch(`/api/user/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel booking.');

      setNotification({
        type: 'success',
        text: 'Your booking has been cancelled and the time slot is now available.',
      });
      setTimeout(() => setNotification(null), 4000);

      fetchMyBookings();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message,
      });
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

  return (
    <div className="page-container">
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">My Instrument Bookings</h1>
          <p className="page-subtitle">
            Personal reservation history for <strong>{user?.name}</strong> • Automatic confirmations and usage tracking
          </p>
        </div>
        <Link to="/book" className="btn btn-primary">
          + Book Another Slot
        </Link>
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

      {loading ? (
        <div className="loading-state">Loading your bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <h3>No bookings found</h3>
          <p>You have not reserved any laboratory instruments yet.</p>
          <Link to="/book" className="btn btn-primary btn-sm mt-3">
            Book an Instrument Now
          </Link>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Date</th>
                  <th>Scheduled Slot</th>
                  <th>Actual Usage Duration</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const instName =
                    typeof booking.instrumentId === 'object' && booking.instrumentId !== null
                      ? booking.instrumentId.name
                      : 'Scientific Instrument';

                  const canCancel = booking.status === 'Confirmed';
                  const scheduledText = calculateScheduledDuration(
                    booking.startTime,
                    booking.endTime
                  );

                  return (
                    <tr
                      key={booking._id}
                      className={`booking-row-${booking.status.toLowerCase().replace(' ', '-')}`}
                    >
                      <td>
                        <span className="instrument-table-name">{instName}</span>
                      </td>
                      <td>{booking.date}</td>
                      <td className="time-cell">
                        <div>{booking.startTime} - {booking.endTime}</div>
                        <div className="text-muted text-xs">({scheduledText})</div>
                      </td>
                      <td>
                        {booking.status === 'Completed' && (
                          <span className="actual-usage-badge text-primary font-bold">
                            ⏱️ {formatMinutes(booking.actualUsageDuration)}
                          </span>
                        )}
                        {booking.status === 'In Progress' && (
                          <span className="text-warning font-semibold text-xs">
                            🟢 Live Run in Progress
                          </span>
                        )}
                        {(booking.status === 'Confirmed' || booking.status === 'Cancelled') && (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="purpose-cell" title={booking.purpose}>
                        {booking.purpose}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(booking.status)}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        {canCancel ? (
                          <button
                            onClick={() => handleCancel(booking._id, instName)}
                            className="btn btn-danger-outline btn-xs"
                            title="Cancel your reservation and release time slot"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-muted text-xs">
                            {booking.status === 'Cancelled'
                              ? 'Cancelled'
                              : booking.status === 'In Progress'
                              ? 'Active'
                              : 'Completed'}
                          </span>
                        )}
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
