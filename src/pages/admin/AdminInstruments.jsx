import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import InstrumentCard from '../../components/InstrumentCard';

export default function AdminInstruments() {
  const { authFetch } = useAuth();
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    description: '',
    status: 'Available',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/instruments');
      if (!res.ok) throw new Error('Failed to load instruments.');
      const data = await res.json();
      setInstruments(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: '',
      location: '',
      description: '',
      status: 'Available',
    });
    setFormError(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditForm = (inst) => {
    setEditingId(inst._id);
    setFormData({
      name: inst.name,
      category: inst.category,
      location: inst.location,
      description: inst.description,
      status: inst.status,
    });
    setFormError(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.category.trim() || !formData.location.trim() || !formData.description.trim()) {
      setFormError('All fields marked with * are required.');
      return;
    }

    try {
      setSubmitting(true);
      let url = '/api/admin/instruments';
      let method = 'POST';

      if (editingId) {
        url = `/api/admin/instruments/${editingId}`;
        method = 'PUT';
      }

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Operation failed');

      setNotification({
        type: 'success',
        text: editingId ? 'Instrument updated successfully.' : 'New instrument added successfully.',
      });
      setTimeout(() => setNotification(null), 4000);

      closeForm();
      fetchInstruments();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`/api/admin/instruments/${id}`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to delete instrument');

      setNotification({
        type: 'success',
        text: 'Instrument removed from laboratory database.',
      });
      setTimeout(() => setNotification(null), 4000);

      fetchInstruments();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = instruments.filter((inst) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.category.toLowerCase().includes(q) ||
      inst.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Manage Scientific Instruments</h1>
          <p className="page-subtitle">
            Admin console to register new laboratory equipment, update specs, and switch maintenance status
          </p>
        </div>
        <button onClick={openAddForm} className="btn btn-primary">
          + Add New Instrument
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

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="form-card-container">
          <div className="form-card">
            <div className="form-header">
              <h2>{editingId ? 'Edit Instrument Specifications' : 'Register New Scientific Instrument'}</h2>
              <button onClick={closeForm} className="btn-close" type="button">
                ✕
              </button>
            </div>

            {formError && <div className="alert-box alert-error mb-4">{formError}</div>}

            <form onSubmit={handleFormSubmit} className="instrument-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    Instrument Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. UV-Visible Spectrophotometer"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">
                    Category <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g. Chromatography, Spectroscopy, Microscopy"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">
                    Location / Lab Room <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Central Instrumentation Facility Room 204"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">
                    Operational Status <span className="req">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Available">Available (Open for bookings)</option>
                    <option value="Maintenance">Maintenance (Blocks all new bookings)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  Description &amp; Specifications <span className="req">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Technical details, detector types, supported sample formats..."
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={closeForm}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update Instrument' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by instrument name, category, or lab room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear-btn"
              type="button"
            >
              Clear
            </button>
          )}
        </div>
        <div className="search-count-badge">
          Showing {filtered.length} of {instruments.length} instruments
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading inventory...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No matching instruments found.</div>
      ) : (
        <div className="instruments-grid">
          {filtered.map((inst) => (
            <InstrumentCard
              key={inst._id}
              instrument={inst}
              onEdit={openEditForm}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
