import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BookingTable from '../components/BookingTable';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed to load bookings.');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching bookings from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel booking.');

      setNotification({
        type: 'success',
        text: 'Booking has been successfully cancelled. The time slot is now available again.',
      });
      setTimeout(() => setNotification(null), 4000);

      fetchBookings();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to cancel booking.',
      });
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to complete booking.');

      setNotification({
        type: 'success',
        text: 'Booking marked as Completed.',
      });
      setTimeout(() => setNotification(null), 4000);

      fetchBookings();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to update booking status.',
      });
    }
  };

  // Filter bookings by status tab and search term
  const filteredBookings = bookings.filter((b) => {
    // Status Filter
    if (statusFilter !== 'ALL' && b.status !== statusFilter) {
      return false;
    }

    // Search filter (User Name, Email, Instrument Name, Purpose)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const instName =
        typeof b.instrumentId === 'object' && b.instrumentId !== null
          ? b.instrumentId.name.toLowerCase()
          : '';
      const userName = (b.userName || '').toLowerCase();
      const email = (b.email || '').toLowerCase();
      const purpose = (b.purpose || '').toLowerCase();

      return (
        instName.includes(term) ||
        userName.includes(term) ||
        email.includes(term) ||
        purpose.includes(term)
      );
    }

    return true;
  });

  const bookedCount = bookings.filter((b) => b.status === 'Booked').length;
  const completedCount = bookings.filter((b) => b.status === 'Completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'Cancelled').length;

  return (
    <div className="page-container">
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Instrument Reservations</h1>
          <p className="page-subtitle">
            Track, review, complete, or cancel scientific instrument booking schedules
          </p>
        </div>
        <Link to="/book" className="btn btn-primary">
          + Book New Slot
        </Link>
      </div>

      {/* Notifications */}
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

      {/* Filter and Search Bar */}
      <div className="filter-and-search-container">
        <div className="status-tabs">
          <button
            className={`tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            className={`tab-btn ${statusFilter === 'Booked' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Booked')}
          >
            Active ({bookedCount})
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
            placeholder="Search by student, email, instrument..."
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

      {/* Bookings Table Component */}
      <div className="table-card">
        <BookingTable
          bookings={filteredBookings}
          loading={loading}
          onCancel={handleCancelBooking}
          onComplete={handleCompleteBooking}
        />
      </div>
    </div>
  );
}
