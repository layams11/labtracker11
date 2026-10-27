import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BookInstrument() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();

  const urlInstrumentId = searchParams.get('instrumentId') || '';
  const urlDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const urlStartTime = searchParams.get('startTime') || '10:00';
  const urlEndTime = searchParams.get('endTime') || '12:00';

  const [instruments, setInstruments] = useState([]);
  const [loadingInstruments, setLoadingInstruments] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    instrumentId: urlInstrumentId,
    date: urlDate,
    startTime: urlStartTime,
    endTime: urlEndTime,
    purpose: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  // Availability Pre-check state
  const [availabilityStatus, setAvailabilityStatus] = useState(null); // { available: bool, message: string }
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Popup Modal state for conflicting slot
  const [conflictPopup, setConflictPopup] = useState(null);

  // Existing schedule for selected instrument & date
  const [existingSchedule, setExistingSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    fetchInstruments();
  }, []);

  useEffect(() => {
    if (urlInstrumentId) {
      setFormData((prev) => ({
        ...prev,
        instrumentId: urlInstrumentId,
        date: urlDate,
        startTime: urlStartTime,
        endTime: urlEndTime,
      }));
    }
  }, [urlInstrumentId, urlDate, urlStartTime, urlEndTime]);

  useEffect(() => {
    if (formData.instrumentId && formData.date) {
      fetchExistingSchedule(formData.instrumentId, formData.date);
      setAvailabilityStatus(null);
    }
  }, [formData.instrumentId, formData.date, formData.startTime, formData.endTime]);

  const fetchInstruments = async () => {
    try {
      setLoadingInstruments(true);
      const res = await fetch('/api/instruments');
      const data = await res.json();
      setInstruments(data);
      if (!formData.instrumentId && data.length > 0) {
        const firstAvailable = data.find((i) => i.status === 'Available') || data[0];
        setFormData((prev) => ({ ...prev, instrumentId: firstAvailable._id }));
      }
    } catch (err) {
      console.error(err);
      setFormError('Failed to load instruments list.');
    } finally {
      setLoadingInstruments(false);
    }
  };

  const fetchExistingSchedule = async (instId, date) => {
    try {
      setLoadingSchedule(true);
      const res = await authFetch('/api/admin/bookings');
      if (res.ok) {
        const allBookings = await res.json();
        const relevant = allBookings.filter((b) => {
          const bInstId =
            typeof b.instrumentId === 'object' && b.instrumentId !== null
              ? b.instrumentId._id
              : b.instrumentId;
          return bInstId === instId && b.date === date && b.status !== 'Cancelled';
        });
        setExistingSchedule(relevant);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setAvailabilityStatus(null);
    if (formError) setFormError(null);
  };

  // Pre-check availability
  const handlePreCheck = async () => {
    if (!formData.instrumentId || !formData.date || !formData.startTime || !formData.endTime) {
      setFormError('Please fill in instrument, date, start time, and end time.');
      return;
    }

    try {
      setCheckingAvailability(true);
      setFormError(null);
      const res = await authFetch('/api/user/check-availability', {
        method: 'POST',
        body: JSON.stringify({
          instrumentId: formData.instrumentId,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
        }),
      });
      const data = await res.json();
      setAvailabilityStatus(data);
    } catch (err) {
      setFormError(err.message || 'Availability check failed.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessInfo(null);
    setConflictPopup(null);

    if (!formData.instrumentId) {
      setFormError('Please select a scientific instrument.');
      return;
    }
    if (!formData.date) {
      setFormError('Date is required.');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      setFormError('Start time and end time are required.');
      return;
    }

    const [sH, sM] = formData.startTime.split(':').map(Number);
    const [eH, eM] = formData.endTime.split(':').map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    if (endMins <= startMins) {
      setFormError('End time must be later than start time.');
      return;
    }

    if (!formData.purpose.trim()) {
      setFormError('Purpose of booking is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authFetch('/api/user/bookings', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      // If conflicting slot (HTTP 409 Conflict)
      if (res.status === 409) {
        setConflictPopup({
          title: 'Slot Not Available',
          message:
            data.message ||
            'This instrument is already booked during the selected time.',
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || 'Unable to complete reservation.');
      }

      // Automatic Confirmation (Section 1)
      setSuccessInfo({
        message: 'Booking confirmed successfully.',
        booking: data.booking,
      });

      setFormData((prev) => ({
        ...prev,
        purpose: '',
      }));
      setAvailabilityStatus(null);

      fetchExistingSchedule(formData.instrumentId, formData.date);
    } catch (err) {
      setFormError(err.message || 'Booking submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedInstrument = instruments.find((i) => i._id === formData.instrumentId);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Book a Scientific Instrument</h1>
        <p className="page-subtitle">
          Logged in as <strong>{user?.name}</strong> • Conflict-free instant confirmation
        </p>
      </div>

      {/* POPUP MODAL FOR CONFLICTING SLOT (Section 1 & 2) */}
      {conflictPopup && (
        <div className="modal-overlay">
          <div className="modal-card modal-conflict">
            <div className="modal-icon">🚫</div>
            <h2 className="modal-title">{conflictPopup.title}</h2>
            <p className="modal-message">{conflictPopup.message}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => setConflictPopup(null)}
              >
                Choose Another Date or Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automatic Confirmation Banner (Section 1) */}
      {successInfo && (
        <div className="alert-box alert-success mb-6">
          <div>
            <strong>✓ {successInfo.message}</strong>
            <p className="text-sm mt-1">
              Your reservation for <strong>{selectedInstrument?.name}</strong> on{' '}
              <strong>{successInfo.booking?.date}</strong> ({successInfo.booking?.startTime} -{' '}
              {successInfo.booking?.endTime}) is <strong>Confirmed</strong>. No waiting for admin approval!
            </p>
          </div>
          <div className="alert-banner-actions">
            <Link to="/my-bookings" className="btn btn-sm btn-outline">
              View My Bookings
            </Link>
            <button
              onClick={() => setSuccessInfo(null)}
              className="btn btn-sm btn-primary"
            >
              Book Another
            </button>
          </div>
        </div>
      )}

      {/* Form Error Notice */}
      {formError && (
        <div className="alert-box alert-error mb-6">
          <div className="error-icon">⚠️</div>
          <div>
            <strong>Validation Error:</strong> {formError}
          </div>
        </div>
      )}

      <div className="booking-layout-grid">
        {/* Reservation Form Card */}
        <div className="booking-form-card">
          <h2 className="card-section-title">Automatic Slot Reservation</h2>
          <p className="card-section-desc">
            Instantly verifies availability and confirms your reservation if no conflict exists
          </p>

          <form onSubmit={handleSubmit} className="booking-form">
            {/* Auto-filled User Details */}
            <div className="form-row user-autofill-banner">
              <div>
                <span className="text-xs text-muted">Student / Researcher:</span>
                <p className="font-semibold text-sm">👤 {user?.name}</p>
              </div>
              <div>
                <span className="text-xs text-muted">Email:</span>
                <p className="font-semibold text-sm">✉️ {user?.email}</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="instrumentId">
                Select Instrument <span className="req">*</span>
              </label>
              {loadingInstruments ? (
                <div className="input-loading">Loading instruments...</div>
              ) : (
                <select
                  id="instrumentId"
                  name="instrumentId"
                  value={formData.instrumentId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Choose a Scientific Instrument --</option>
                  {instruments.map((inst) => (
                    <option
                      key={inst._id}
                      value={inst._id}
                      disabled={inst.status === 'Maintenance'}
                    >
                      {inst.name} ({inst.category}) — {inst.location}{' '}
                      {inst.status === 'Maintenance' ? '[Under Maintenance]' : '[Available]'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-row form-row-three">
              <div className="form-group">
                <label htmlFor="date">
                  Date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="startTime">
                  Start Time <span className="req">*</span>
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endTime">
                  End Time <span className="req">*</span>
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Quick Availability Verification Button & Indicator */}
            <div className="availability-precheck-row mb-4">
              <button
                type="button"
                onClick={handlePreCheck}
                className="btn btn-outline btn-sm"
                disabled={checkingAvailability}
              >
                {checkingAvailability ? 'Checking...' : '🔍 Check Availability'}
              </button>

              {availabilityStatus && (
                <div
                  className={`availability-badge ${
                    availabilityStatus.available ? 'badge-available' : 'badge-unavailable'
                  }`}
                >
                  {availabilityStatus.available ? 'AVAILABLE' : 'NOT AVAILABLE'}
                  <span className="badge-sub"> — {availabilityStatus.message}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="purpose">
                Purpose of Experiment / Analysis <span className="req">*</span>
              </label>
              <textarea
                id="purpose"
                name="purpose"
                rows={3}
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="Describe your research experiment or coursework sample analysis..."
                required
              />
            </div>

            <div className="form-actions mt-4">
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={submitting || (selectedInstrument && selectedInstrument.status === 'Maintenance')}
              >
                {submitting ? 'Verifying & Confirming Slot...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar: Instrument Info & Booked Slots */}
        <div className="booking-sidebar">
          {selectedInstrument && (
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <h3>{selectedInstrument.name}</h3>
                <span
                  className={`status-badge ${
                    selectedInstrument.status === 'Available'
                      ? 'status-available'
                      : 'status-maintenance'
                  }`}
                >
                  {selectedInstrument.status}
                </span>
              </div>
              <p className="text-sm text-muted mb-1">
                <strong>Category:</strong> {selectedInstrument.category}
              </p>
              <p className="text-sm text-muted mb-2">
                <strong>Location:</strong> {selectedInstrument.location}
              </p>
              <p className="text-xs text-muted">{selectedInstrument.description}</p>
            </div>
          )}

          <div className="sidebar-card">
            <h3 className="sidebar-title">Booked Slots on {formData.date}</h3>
            <p className="text-xs text-muted mb-3">
              Active reservations for {selectedInstrument?.name || 'this equipment'}:
            </p>

            {loadingSchedule ? (
              <div className="loading-state text-xs">Checking schedule...</div>
            ) : existingSchedule.length === 0 ? (
              <div className="empty-slot-msg">
                ✨ No reservations yet for this date. Time slots are open!
              </div>
            ) : (
              <ul className="slot-list">
                {existingSchedule.map((slot) => (
                  <li key={slot._id} className="slot-item">
                    <span className="slot-time">
                      🕒 {slot.startTime} - {slot.endTime}
                    </span>
                    <span className="slot-user">
                      Status: <strong>{slot.status}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="conflict-rule-note">
              <strong>💡 Conflict Rule:</strong> Two bookings overlap when{' '}
              <code>newStartTime &lt; existingEndTime AND newEndTime &gt; existingStartTime</code>.
              Consecutive bookings starting when an earlier booking ends are allowed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
