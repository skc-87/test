import React from 'react';

const StatCard = ({ title, value, icon: Icon, subtitle, loading, color = 'blue' }) => {
    const colorClasses = {
        blue: 'stat-card__icon--blue',
        green: 'stat-card__icon--green',
        red: 'stat-card__icon--red',
        orange: 'stat-card__icon--orange',
    };

    return (
        <div className="stat-card">
            <div className="stat-card__header">
                <div className="stat-card__label">{title}</div>
                <div className="stat-card__value">
                    {loading ? (
                        <div style={{ width: '100px', height: '32px', background: '#e2e8f0', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    ) : (
                        value.toLocaleString()
                    )}
                </div>
                {subtitle && <div className="stat-card__subtitle">{subtitle}</div>}
            </div>
            <div className={`stat-card__icon ${colorClasses[color]}`}>
                <Icon size={24} />
            </div>
        </div>
    );
};

export default StatCard;
