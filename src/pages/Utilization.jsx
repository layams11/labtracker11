import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Utilization() {
  const [utilizationData, setUtilizationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUtilization();
  }, []);

  const fetchUtilization = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/utilization');
      if (!res.ok) throw new Error('Failed to load utilization statistics.');
      const data = await res.json();
      setUtilizationData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading utilization data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert-box alert-error">
          <p>{error}</p>
          <button onClick={fetchUtilization} className="btn btn-outline btn-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Facility-wide totals
  const totalFacilityHours = utilizationData.reduce((acc, curr) => acc + (curr.totalUsageHours || 0), 0);
  const totalValidBookings = utilizationData.reduce((acc, curr) => acc + (curr.bookingCount || 0), 0);
  const maxHours = Math.max(...utilizationData.map((u) => u.totalUsageHours || 0), 1);
  const topInstrument = utilizationData.length > 0 ? utilizationData[0] : null;

  return (
    <div className="page-container">
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Instrument Utilization Tracking</h1>
          <p className="page-subtitle">
            Quantitative analysis of laboratory equipment usage hours and reservation frequency
          </p>
        </div>
        <button onClick={fetchUtilization} className="btn btn-outline btn-sm">
          🔄 Refresh Metrics
        </button>
      </div>

      {/* Utilization Summary Cards */}
      <div className="stats-grid mb-6">
        <div className="stat-card stat-theme-blue">
          <div className="stat-card-header">
            <span className="stat-title">Total Lab Usage Hours</span>
            <span className="stat-icon-wrapper">⏱️</span>
          </div>
          <div className="stat-value">{totalFacilityHours.toFixed(1)} hrs</div>
          <div className="stat-subtitle">Cumulative time from all non-cancelled bookings</div>
        </div>

        <div className="stat-card stat-theme-green">
          <div className="stat-card-header">
            <span className="stat-title">Total Completed / Active Uses</span>
            <span className="stat-icon-wrapper">🧪</span>
          </div>
          <div className="stat-value">{totalValidBookings}</div>
          <div className="stat-subtitle">Total experimental sessions conducted</div>
        </div>

        <div className="stat-card stat-theme-indigo">
          <div className="stat-card-header">
            <span className="stat-title">Most Utilized Equipment</span>
            <span className="stat-icon-wrapper">🏆</span>
          </div>
          <div className="stat-value text-base font-bold">
            {topInstrument && topInstrument.totalUsageHours > 0
              ? topInstrument.instrumentName
              : 'N/A'}
          </div>
          <div className="stat-subtitle">
            {topInstrument && topInstrument.totalUsageHours > 0
              ? `${topInstrument.totalUsageHours} hours (${topInstrument.bookingCount} bookings)`
              : 'No usage recorded yet'}
          </div>
        </div>
      </div>

      {/* Utilization Calculation Explainer Callout */}
      <div className="explainer-card">
        <div className="explainer-icon">ℹ️</div>
        <div className="explainer-text">
          <strong>How is utilization calculated?</strong>
          <p>
            Usage hours are dynamically calculated from actual bookings: <code>Usage = End Time − Start Time</code>.
            Cancelled bookings are automatically excluded from the totals. Equipment with low hours may be underutilized or newly installed.
          </p>
        </div>
      </div>

      {/* Utilization Table */}
      {utilizationData.length === 0 ? (
        <div className="empty-state">No utilization data available.</div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Instrument Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Total Bookings</th>
                  <th>Total Usage Hours</th>
                  <th>Relative Utilization</th>
                  <th>Last Used Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {utilizationData.map((item) => {
                  const percent = Math.min(
                    100,
                    Math.round((item.totalUsageHours / maxHours) * 100)
                  );

                  return (
                    <tr key={item.instrumentId}>
                      <td className="font-semibold">{item.instrumentName}</td>
                      <td>
                        <span className="category-pill">{item.category}</span>
                      </td>
                      <td className="text-muted">{item.location}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            item.status === 'Available'
                              ? 'status-available'
                              : 'status-maintenance'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="text-center font-bold">
                        {item.bookingCount}
                      </td>
                      <td className="text-center font-bold text-primary">
                        {item.totalUsageHours} hrs
                      </td>
                      <td className="progress-cell">
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="progress-text">{percent}%</span>
                      </td>
                      <td className="text-muted">
                        {item.lastUsedDate !== 'Never Used'
                          ? item.lastUsedDate
                          : <span className="text-muted italic">Never</span>}
                      </td>
                      <td>
                        {item.status === 'Available' ? (
                          <Link
                            to={`/book?instrumentId=${item.instrumentId}`}
                            className="btn btn-primary btn-xs"
                          >
                            Book
                          </Link>
                        ) : (
                          <span className="text-xs text-muted">Maintenance</span>
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
