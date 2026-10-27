import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InstrumentCard from '../components/InstrumentCard';

export default function Instruments() {
  const { isAdmin } = useAuth();
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      setError(err.message || 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInstruments = instruments.filter((inst) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      inst.name.toLowerCase().includes(query) ||
      inst.category.toLowerCase().includes(query) ||
      inst.location.toLowerCase().includes(query)
    );
  });

  return (
    <div className="page-container">
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Laboratory Instruments Catalog</h1>
          <p className="page-subtitle">
            Browse available scientific equipment, view specifications, and reserve experiment slots
          </p>
        </div>
        {isAdmin && (
          <Link to="/admin/instruments" className="btn btn-outline">
            ⚙️ Open Admin Equipment Manager
          </Link>
        )}
      </div>

      {error && (
        <div className="alert-box alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="alert-close">
            ×
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search instruments by name or category (e.g. 'PCR', 'Microscopy', 'Spectroscopy')..."
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
          Showing {filteredInstruments.length} of {instruments.length} instruments
        </div>
      </div>

      {/* Instruments Grid (Read-only for normal users) */}
      {loading ? (
        <div className="loading-state">Loading instruments catalog...</div>
      ) : filteredInstruments.length === 0 ? (
        <div className="empty-state">
          <h3>No instruments found</h3>
          <p>
            {searchQuery
              ? `No instruments matching "${searchQuery}". Try a different keyword.`
              : 'No instruments available in the laboratory database.'}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="btn btn-outline btn-sm">
              Reset Search
            </button>
          )}
        </div>
      ) : (
        <div className="instruments-grid">
          {filteredInstruments.map((instrument) => (
            <InstrumentCard
              key={instrument._id}
              instrument={instrument}
              // Normal users do not have edit/delete callbacks
            />
          ))}
        </div>
      )}
    </div>
  );
}
