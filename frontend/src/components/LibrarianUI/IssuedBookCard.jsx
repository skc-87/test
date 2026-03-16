import React from 'react';

const IssuedBookCard = ({ transaction, isOverdue, fineAmount, onConfirmReturn, loading }) => {
    return (
        <div className={`issued-book-card ${isOverdue ? 'issued-book-card--overdue' : ''}`}>
            <div className="issued-book-card__header">
                <div className="issued-book-card__title">
                    {transaction.book?.title || 'Unknown Book'}
                </div>
                {isOverdue && <span className="issued-book-card__badge">OVERDUE</span>}
            </div>
            <div className="issued-book-card__meta">
                <div>
                    <strong>Student:</strong><br />
                    {transaction.student?.user?.name || 'Unknown'} • {transaction.student?.department || 'N/A'}
                </div>
                <div>
                    <strong>Course:</strong><br />
                    Year {transaction.student?.year || 'N/A'}
                </div>
                <div>
                    <strong>Issue Date:</strong><br />
                    {new Date(transaction.issue_date).toLocaleDateString()}
                </div>
                <div>
                    <strong>Due Date:</strong><br />
                    {new Date(transaction.due_date).toLocaleDateString()}
                </div>
            </div>
            <div style={{ marginBottom: '12px', padding: '12px', background: '#F5F7FA', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Fine Amount</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: fineAmount > 0 ? '#FF5A5F' : '#10b981' }}>
                    ₹{fineAmount}
                </div>
            </div>
            <button
                className="issued-book-card__action"
                onClick={() => onConfirmReturn(transaction._id)}
                disabled={loading}
            >
                {loading ? 'Processing...' : 'Confirm Return'}
            </button>
        </div>
    );
};

export default IssuedBookCard;
