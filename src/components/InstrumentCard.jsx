import React from 'react';
import { Link } from 'react-router-dom';

export default function InstrumentCard({ instrument, onEdit, onDelete }) {
  const isAvailable = instrument.status === 'Available';

  const handleDeleteClick = () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this instrument "${instrument.name}"?`
    );
    if (confirmed) {
      onDelete(instrument._id);
    }
  };

  return (
    <div className={`instrument-card ${isAvailable ? 'card-available' : 'card-maintenance'}`}>
      <div className="instrument-card-header">
        <div className="instrument-info">
          <h3 className="instrument-name">{instrument.name}</h3>
          <span className="instrument-category-badge">{instrument.category}</span>
        </div>
        <span className={`status-badge ${isAvailable ? 'status-available' : 'status-maintenance'}`}>
          {instrument.status}
        </span>
      </div>

      <div className="instrument-location">
        <span className="location-icon">📍</span>
        <span className="location-text">{instrument.location}</span>
      </div>

      <p className="instrument-description">{instrument.description}</p>

      <div className="instrument-card-actions">
        {isAvailable ? (
          <Link
            to={`/book?instrumentId=${instrument._id}`}
            className="btn btn-primary btn-sm"
          >
            📅 Book Instrument
          </Link>
        ) : (
          <button className="btn btn-disabled btn-sm" disabled>
            Under Maintenance
          </button>
        )}

        <div className="secondary-actions">
          {onEdit && (
            <button
              onClick={() => onEdit(instrument)}
              className="btn btn-outline btn-sm"
              title="Edit Instrument"
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              className="btn btn-danger-outline btn-sm"
              title="Delete Instrument"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
