import React from 'react';

export default function StatCard({ title, value, icon, subtitle, colorTheme = 'blue' }) {
  return (
    <div className={`stat-card stat-theme-${colorTheme}`}>
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        {icon && <span className="stat-icon-wrapper">{icon}</span>}
      </div>
      <div className="stat-value">{value ?? '0'}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );
}
