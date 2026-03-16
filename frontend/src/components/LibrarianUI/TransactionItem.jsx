import React from 'react';
import { BookOpen, Trash2 } from 'lucide-react';

const TransactionItem = ({ transaction, studentDetails, role, onDelete }) => {
    const isReturn = transaction.status === 'returned';
    const student = transaction.student?.user?.name || studentDetails?.[transaction.student]?.user?.name || 'Unknown';
    const timestamp = new Date(transaction.created_at).toLocaleDateString();
    const isAdmin = role === 'admin';

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this transaction record?')) {
            onDelete?.(transaction._id);
        }
    };

    return (
        <div className="transaction-item">
            <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                <div className="transaction-item__icon">
                    <BookOpen size={16} />
                </div>
                <div className="transaction-item__content">
                    <div className="transaction-item__title">
                        {transaction.book?.title || '(Deleted Book)'}
                    </div>
                    <div className="transaction-item__meta">
                        {student} • {isReturn ? 'Returned' : 'Issued'}
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                <span className="transaction-item__status">
                    {isReturn ? 'Returned' : 'Issued'}
                </span>
                <span className="transaction-item__time">{timestamp}</span>
                {isAdmin && (
                    <button
                        onClick={handleDelete}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#FF5A5F',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e74c52';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FF5A5F';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Delete transaction"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TransactionItem;
