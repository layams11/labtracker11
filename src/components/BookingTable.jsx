import React from 'react';

export default function BookingTable({
  bookings = [],
  loading = false,
  onCancel,
  onComplete,
}) {
  if (loading) {
    return <div className="loading-state">Loading bookings...</div>;
  }

  if (!bookings || bookings.length === 0) {
    return <div className="empty-state">No bookings found.</div>;
  }

  const handleCancelClick = (bookingId, instrumentName) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel this booking for "${instrumentName}"?`
    );
    if (confirmed && onCancel) {
      onCancel(bookingId);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Booked':
        return 'status-badge status-booked';
      case 'Completed':
        return 'status-badge status-completed';
      case 'Cancelled':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>User Name</th>
            <th>Email</th>
            <th>Instrument</th>
            <th>Date</th>
            <th>Time Slot</th>
            <th>Purpose</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const instrumentName =
              typeof booking.instrumentId === 'object' && booking.instrumentId !== null
                ? booking.instrumentId.name
                : 'Instrument';

            return (
              <tr key={booking._id} className={`booking-row-${booking.status.toLowerCase()}`}>
                <td className="font-semibold">{booking.userName}</td>
                <td className="text-muted">{booking.email}</td>
                <td>
                  <span className="instrument-table-name">{instrumentName}</span>
                </td>
                <td>{booking.date}</td>
                <td className="time-cell">
                  {booking.startTime} - {booking.endTime}
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
                  <div className="action-buttons-group">
                    {booking.status === 'Booked' && (
                      <>
                        <button
                          onClick={() => handleCancelClick(booking._id, instrumentName)}
                          className="btn btn-danger-outline btn-xs"
                          title="Cancel this booking"
                        >
                          Cancel
                        </button>
                        {onComplete && (
                          <button
                            onClick={() => onComplete(booking._id)}
                            className="btn btn-success-outline btn-xs"
                            title="Mark as completed"
                          >
                            Complete
                          </button>
                        )}
                      </>
                    )}
                    {booking.status === 'Cancelled' && (
                      <span className="text-muted text-xs">Cancelled</span>
                    )}
                    {booking.status === 'Completed' && (
                      <span className="text-success text-xs">Completed</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
