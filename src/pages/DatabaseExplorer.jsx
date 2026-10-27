import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function DatabaseExplorer() {
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('instruments');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'json'
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/database');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch database`);
      const data = await res.json();
      setDbData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to connect to database inspection endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  const handleCopyJson = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFilteredItems = (items = []) => {
    if (!searchFilter.trim()) return items;
    const q = searchFilter.toLowerCase();
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🗄️</span>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>Database Inspector &amp; Explorer</h1>
              <p className="page-subtitle" style={{ margin: 0 }}>
                Live collections, documents, and schemas for <code>scientific_instrument_booking</code>
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={fetchDatabase} className="btn btn-outline" title="Refresh live database data">
            🔄 Refresh Data
          </button>
          <a
            href="/api/database"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            ↗ Open Raw JSON API
          </a>
        </div>
      </div>

      {/* Database Connection Status Banner */}
      {dbData && (
        <div
          style={{
            background: 'var(--surface-color, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 10px #22c55e',
              }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem', color: '#f8fafc' }}>
                Status: {dbData.status.toUpperCase()} • Engine: {dbData.databaseEngine}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Database: <strong style={{ color: '#38bdf8' }}>{dbData.databaseName}</strong> •{' '}
                {dbData.isConnected
                  ? 'Connected via live MongoDB URI'
                  : 'Resilient Mongoose In-Memory Datastore active (No MongoDB installation required)'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>{dbData.stats.usersCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Users</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a855f7' }}>{dbData.stats.instrumentsCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Instruments</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>{dbData.stats.bookingsCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bookings</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert-box alert-error" style={{ marginBottom: '1.5rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Control bar: Tabs + View Mode + Search */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {/* Collection Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => { setActiveTab('instruments'); setSearchFilter(''); }}
            className={`btn ${activeTab === 'instruments' ? 'btn-primary' : 'btn-outline'}`}
          >
            🔬 Instruments ({dbData?.stats?.instrumentsCount || 0})
          </button>
          <button
            onClick={() => { setActiveTab('bookings'); setSearchFilter(''); }}
            className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-outline'}`}
          >
            📅 Bookings ({dbData?.stats?.bookingsCount || 0})
          </button>
          <button
            onClick={() => { setActiveTab('users'); setSearchFilter(''); }}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
          >
            👥 Users ({dbData?.stats?.usersCount || 0})
          </button>
          <button
            onClick={() => { setActiveTab('schemas'); setSearchFilter(''); }}
            className={`btn ${activeTab === 'schemas' ? 'btn-primary' : 'btn-outline'}`}
          >
            📐 Schemas &amp; Config
          </button>
        </div>

        {/* View mode toggle + Search */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder={`Filter ${activeTab}...`}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #475569)',
              background: 'var(--surface-color, #1e293b)',
              color: '#f8fafc',
              fontSize: '0.85rem',
            }}
          />
          {activeTab !== 'schemas' && (
            <div style={{ display: 'flex', border: '1px solid var(--border-color, #475569)', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '0.4rem 0.75rem',
                  border: 'none',
                  background: viewMode === 'table' ? '#3b82f6' : 'transparent',
                  color: viewMode === 'table' ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('json')}
                style={{
                  padding: '0.4rem 0.75rem',
                  border: 'none',
                  background: viewMode === 'json' ? '#3b82f6' : 'transparent',
                  color: viewMode === 'json' ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                JSON Docs
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          Loading live database contents...
        </div>
      ) : dbData ? (
        <div>
          {/* TAB 1: INSTRUMENTS */}
          {activeTab === 'instruments' && (
            <div>
              {viewMode === 'table' ? (
                <div style={{ overflowX: 'auto', background: 'var(--surface-color, #1e293b)', borderRadius: '10px', border: '1px solid var(--border-color, #334155)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color, #334155)', background: 'rgba(255,255,255,0.03)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>_id (ObjectId)</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredItems(dbData.collections.instruments).map((item) => (
                        <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#38bdf8' }}>
                            {item._id}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: '0.8rem' }}>
                              {item.category}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{item.location}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                background: item.status === 'Available' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                color: item.status === 'Available' ? '#22c55e' : '#ef4444',
                              }}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', maxWidth: '300px', fontSize: '0.85rem' }}>
                            {item.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => handleCopyJson(dbData.collections.instruments)}
                    className="btn btn-outline btn-xs"
                    style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}
                  >
                    {copied ? '✓ Copied' : '📋 Copy JSON'}
                  </button>
                  <pre
                    style={{
                      background: '#0f172a',
                      padding: '1.5rem',
                      borderRadius: '10px',
                      border: '1px solid #334155',
                      overflowX: 'auto',
                      fontSize: '0.85rem',
                      color: '#e2e8f0',
                      maxHeight: '550px',
                    }}
                  >
                    {JSON.stringify(getFilteredItems(dbData.collections.instruments), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div>
              {viewMode === 'table' ? (
                <div style={{ overflowX: 'auto', background: 'var(--surface-color, #1e293b)', borderRadius: '10px', border: '1px solid var(--border-color, #334155)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color, #334155)', background: 'rgba(255,255,255,0.03)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>_id</th>
                        <th style={{ padding: '0.75rem 1rem' }}>User</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Instrument</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Date &amp; Slot</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Actual Duration</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredItems(dbData.collections.bookings).map((b) => (
                        <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#38bdf8' }}>
                            {b._id}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 600 }}>{b.userId?.name || 'User'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{b.userId?.email}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 500 }}>{b.instrumentId?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{b.instrumentId?.location}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 500 }}>{b.date}</div>
                            <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{b.startTime} - {b.endTime}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                background:
                                  b.status === 'Completed'
                                    ? 'rgba(34,197,94,0.1)'
                                    : b.status === 'In Progress'
                                    ? 'rgba(234,179,8,0.1)'
                                    : b.status === 'Confirmed'
                                    ? 'rgba(56,189,248,0.1)'
                                    : 'rgba(239,68,68,0.1)',
                                color:
                                  b.status === 'Completed'
                                    ? '#22c55e'
                                    : b.status === 'In Progress'
                                    ? '#eab308'
                                    : b.status === 'Confirmed'
                                    ? '#38bdf8'
                                    : '#ef4444',
                              }}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {b.actualUsageDuration ? (
                              <span style={{ fontWeight: 600, color: '#22c55e' }}>
                                {Math.floor(b.actualUsageDuration / 60)}h {b.actualUsageDuration % 60}m
                              </span>
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', maxWidth: '250px', fontSize: '0.85rem' }}>
                            {b.purpose}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => handleCopyJson(dbData.collections.bookings)}
                    className="btn btn-outline btn-xs"
                    style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}
                  >
                    {copied ? '✓ Copied' : '📋 Copy JSON'}
                  </button>
                  <pre
                    style={{
                      background: '#0f172a',
                      padding: '1.5rem',
                      borderRadius: '10px',
                      border: '1px solid #334155',
                      overflowX: 'auto',
                      fontSize: '0.85rem',
                      color: '#e2e8f0',
                      maxHeight: '550px',
                    }}
                  >
                    {JSON.stringify(getFilteredItems(dbData.collections.bookings), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: USERS */}
          {activeTab === 'users' && (
            <div>
              {viewMode === 'table' ? (
                <div style={{ overflowX: 'auto', background: 'var(--surface-color, #1e293b)', borderRadius: '10px', border: '1px solid var(--border-color, #334155)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color, #334155)', background: 'rgba(255,255,255,0.03)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>_id (ObjectId)</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Default Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredItems(dbData.collections.users).map((u) => (
                        <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#38bdf8' }}>
                            {u._id}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.name}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#38bdf8' }}>{u.email}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                background: u.role === 'admin' ? 'rgba(168,85,247,0.1)' : 'rgba(56,189,248,0.1)',
                                color: u.role === 'admin' ? '#a855f7' : '#38bdf8',
                                fontWeight: 600,
                              }}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {u.role === 'admin' ? 'admin123' : 'user123'} (hashed with bcrypt)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => handleCopyJson(dbData.collections.users)}
                    className="btn btn-outline btn-xs"
                    style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}
                  >
                    {copied ? '✓ Copied' : '📋 Copy JSON'}
                  </button>
                  <pre
                    style={{
                      background: '#0f172a',
                      padding: '1.5rem',
                      borderRadius: '10px',
                      border: '1px solid #334155',
                      overflowX: 'auto',
                      fontSize: '0.85rem',
                      color: '#e2e8f0',
                      maxHeight: '550px',
                    }}
                  >
                    {JSON.stringify(getFilteredItems(dbData.collections.users), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SCHEMAS & CONFIG */}
          {activeTab === 'schemas' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: 'var(--surface-color, #1e293b)', padding: '1.5rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <h3 style={{ marginTop: 0, color: '#38bdf8' }}>📄 User Schema (server/models/User.js)</h3>
                <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
{`{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // bcrypt hashed
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  timestamps: true
}`}
                </pre>
              </div>

              <div style={{ background: 'var(--surface-color, #1e293b)', padding: '1.5rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <h3 style={{ marginTop: 0, color: '#a855f7' }}>🔬 Instrument Schema (server/models/Instrument.js)</h3>
                <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
{`{
  name: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Available', 'Maintenance'], default: 'Available' },
  timestamps: true
}`}
                </pre>
              </div>

              <div style={{ background: 'var(--surface-color, #1e293b)', padding: '1.5rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <h3 style={{ marginTop: 0, color: '#22c55e' }}>📅 Booking Schema (server/models/Booking.js)</h3>
                <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
{`{
  userId: { type: ObjectId, ref: 'User', required: true },
  instrumentId: { type: ObjectId, ref: 'Instrument', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true }, // HH:mm
  purpose: { type: String, required: true },
  status: { enum: ['Confirmed', 'In Progress', 'Completed', 'Cancelled'] },
  actualStartTime: { type: Date, default: null },
  actualEndTime: { type: Date, default: null },
  actualUsageDuration: { type: Number, default: null } // minutes
}`}
                </pre>
              </div>

              <div style={{ background: 'var(--surface-color, #1e293b)', padding: '1.5rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <h3 style={{ marginTop: 0, color: '#f59e0b' }}>🔌 MongoDB Configuration (.env)</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  To connect to a live MongoDB instance (Local or Atlas Cloud), specify:
                </p>
                <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
{`MONGO_URI=mongodb://localhost:27017/scientific_instrument_booking
# or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/scientific_instrument_booking`}
                </pre>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Note: When MongoDB is not running locally, the server operates with its built-in resilient in-memory store automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
