import React from 'react';
import { AlertCircle } from 'lucide-react';

const OverdueAlertCard = ({ book, student, daysLate, onSendReminder }) => {
    return (
        <div className="alert-card">
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div className="alert-card__icon">
                    <AlertCircle size={20} />
                </div>
                <div className="alert-card__content">
                    <div className="alert-card__title">
                        {book?.title || 'Unknown Book'}
                        <span className="alert-badge">{daysLate} DAYS LATE</span>
                    </div>
                    <div className="alert-card__meta">
                        Issued to {student?.user?.name || 'Unknown Student'} • {student?.department || 'N/A'}
                    </div>
                </div>
            </div>
            <button className="alert-card__button" onClick={onSendReminder}>
                Send Reminder
            </button>
        </div>
    );
};

export default OverdueAlertCard;
