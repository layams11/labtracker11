import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatMinutes } from './AdminBookings';

export default function AdminUtilization() {
  const { authFetch } = useAuth();
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
      const res = await authFetch('/api/admin/utilization');
      if (!res.ok) throw new Error('Failed to load utilization statistics.');
      const data = await res.json();
      setUtilizationData(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async (instId, currentStatus) => {
    const newStatus = currentStatus === 'Available' ? 'Maintenance' : 'Available';
    try {
      const res = await authFetch(`/api/admin/instruments/${instId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update instrument status');
      fetchUtilization();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading utilization analytics...</div>
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

  const totalScheduledHours = utilizationData.reduce(
    (acc, c) => acc + (c.scheduledHours || 0),
    0
  );
  const totalActualMinutes = utilizationData.reduce(
    (acc, c) => acc + (c.actualUsageMinutes || 0),
    0
  );
  const totalCompletedRuns = utilizationData.reduce(
    (acc, c) => acc + (c.completedCount || 0),
    0
  );

  const topInst = utilizationData.length > 0 ? utilizationData[0] : null;

  return (
    <div className="page-container">
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Instrument Utilization: Scheduled vs. Actual Usage</h1>
          <p className="page-subtitle">
            Quantitative measurement of laboratory hardware booking schedules vs. recorded running runtimes
          </p>
        </div>
        <button onClick={fetchUtilization} className="btn btn-outline btn-sm">
          🔄 Refresh Metrics
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="stats-grid mb-6">
        <div className="stat-card stat-theme-blue">
          <div className="stat-card-header">
            <span className="stat-title">Total Scheduled Hours</span>
            <span className="stat-icon-wrapper">📅</span>
          </div>
          <div className="stat-value">{totalScheduledHours.toFixed(1)} hrs</div>
          <div className="stat-subtitle">Combined booking duration (endTime − startTime)</div>
        </div>

        <div className="stat-card stat-theme-green">
          <div className="stat-card-header">
            <span className="stat-title">Total Actual Usage</span>
            <span className="stat-icon-wrapper">⏱️</span>
          </div>
          <div className="stat-value">{formatMinutes(totalActualMinutes)}</div>
          <div className="stat-subtitle">
            Measured runtimes from completed sessions ({totalCompletedRuns} runs)
          </div>
        </div>

        <div className="stat-card stat-theme-indigo">
          <div className="stat-card-header">
            <span className="stat-title">Most Utilized Equipment</span>
            <span className="stat-icon-wrapper">🏆</span>
          </div>
          <div className="stat-value text-base font-bold">
            {topInst && topInst.scheduledHours > 0 ? topInst.instrumentName : 'N/A'}
          </div>
          <div className="stat-subtitle">
            {topInst && topInst.scheduledHours > 0
              ? `${topInst.scheduledHours} scheduled hrs • ${formatMinutes(
                  topInst.actualUsageMinutes
                )} actual`
              : 'No usage recorded yet'}
          </div>
        </div>
      </div>

      {/* Scheduled vs Actual Explanation Callout (Section 11) */}
      <div className="explainer-card mb-4">
        <div className="explainer-icon">ℹ️</div>
        <div className="explainer-text">
          <strong>Scheduled vs. Actual Usage:</strong>
          <p className="mt-1">
            • <strong>Scheduled Duration</strong> = Calculated from booked reservation slot (<code>End Time − Start Time</code>).
            <br />
            • <strong>Actual Usage Duration</strong> = Recorded live by admin when experiment starts and finishes (<code>actualEndTime − actualStartTime</code>).
            <br />
            • <em>Only completed bookings contribute to actual usage statistics. Cancelled bookings contribute nothing.</em>
          </p>
        </div>
      </div>

      {/* Utilization Table (Section 10 & 12) */}
      {utilizationData.length === 0 ? (
        <div className="empty-state">No utilization data available.</div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Total Bookings</th>
                  <th>Scheduled Hours</th>
                  <th>Actual Usage</th>
                  <th>Avg Session Duration</th>
                  <th>Last Used Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {utilizationData.map((item) => (
                  <tr key={item.instrumentId}>
                    <td className="font-semibold">{item.instrumentName}</td>
                    <td>
                      <span className="category-pill">{item.category}</span>
                    </td>
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
                    <td className="text-center font-bold">{item.totalBookings}</td>
                    <td className="text-center font-bold text-primary">
                      {item.scheduledHours} hrs
                    </td>
                    <td className="text-center font-bold text-success">
                      {formatMinutes(item.actualUsageMinutes)}
                    </td>
                    <td className="text-center text-muted">
                      {item.completedCount > 0
                        ? formatMinutes(item.averageUsageMinutes)
                        : '—'}
                    </td>
                    <td className="text-muted">
                      {item.lastUsedDate !== 'Never Used'
                        ? item.lastUsedDate
                        : 'Never'}
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          handleToggleMaintenance(item.instrumentId, item.status)
                        }
                        className={`btn btn-xs ${
                          item.status === 'Available'
                            ? 'btn-danger-outline'
                            : 'btn-success-outline'
                        }`}
                        title="Toggle maintenance mode"
                      >
                        {item.status === 'Available'
                          ? 'Set Maintenance'
                          : 'Set Available'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
