import React, { useState, useEffect } from 'react';
import { RefreshCw, Book, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import TransactionItem from './LibrarianUI/TransactionItem';
import '../styles/LibrarianDashboard.css';

const BookTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [studentDetails, setStudentDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    totalPages: 1,
    total: 0
  });
  const [error, setError] = useState('');

  const fetchStudentDetails = async (studentId) => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/api/library/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  };

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) { setError('Please login again'); return; }

      const response = await axios.get(`${API_BASE_URL}/api/library/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { ...filters, page, limit: 10 }
      });
      const allTransactions = response.data?.transactions || [];
      // Filter out transactions with missing book data
      const transactionsData = allTransactions.filter(t => t.book && t.book.title);
      setTransactions(transactionsData);
      setPagination({
        totalPages: response.data?.totalPages || 1,
        total: response.data?.total || 0
      });

      const studentDetailsMap = {};
      const fetchPromises = [];
      for (const transaction of transactionsData) {
        if (transaction.student && typeof transaction.student === 'string') {
          const studentId = transaction.student;
          fetchPromises.push(
            fetchStudentDetails(studentId).then(studentData => {
              if (studentData) studentDetailsMap[studentId] = studentData;
            })
          );
        } else if (transaction.student && transaction.student._id) {
          studentDetailsMap[transaction.student._id] = transaction.student;
        }
      }
      await Promise.all(fetchPromises);
      setStudentDetails(studentDetailsMap);
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to fetch transactions');
      }
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(1); }, [filters.status]);

  const handleRefresh = () => { fetchTransactions(filters.page); };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    fetchTransactions(newPage);
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const token = sessionStorage.getItem("authToken");
      await axios.delete(`${API_BASE_URL}/api/library/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh transactions after deletion
      fetchTransactions(filters.page);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert(error.response?.data?.error || 'Failed to delete transaction');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'issued': return '#FFA726';
      case 'returned': return '#10b981';
      case 'overdue': return '#FF5A5F';
      default: return '#2D7FF9';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'issued': return 'Issued';
      case 'returned': return 'Returned';
      case 'overdue': return 'Overdue';
      default: return status;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            📚 Book Transactions History
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Total: {pagination.total} transactions
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#2D7FF9',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.background = '#1e5bc0';
              e.target.style.boxShadow = '0 4px 12px rgba(45, 127, 249, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.background = '#2D7FF9';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(255, 90, 95, 0.1)',
          border: '1px solid #FF5A5F',
          color: '#FF5A5F',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#2D7FF9';
            e.target.style.boxShadow = '0 0 0 3px rgba(45, 127, 249, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
            e.target.style.boxShadow = 'none';
          }}
        >
          <option value="">All Statuses</option>
          <option value="issued">Issued</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
        </select>
        <div style={{
          display: 'inline-block',
          background: 'rgba(45, 127, 249, 0.1)',
          color: '#2D7FF9',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
        }}>
          {transactions.length} transactions shown
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #2D7FF9',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
            Loading transactions...
          </p>
        </div>
      ) : transactions.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}>
          <Book size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
            No transactions found
          </h3>
          <p style={{ color: '#64748b' }}>
            {filters.status ? `No ${filters.status} transactions yet` : 'No transactions recorded yet'}
          </p>
        </div>
      ) : (
        <div>
          {/* Transactions List */}
          <div style={{ marginBottom: '24px' }}>
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction._id}
                transaction={transaction}
                studentDetails={studentDetails}
                role={user?.role}
                onDelete={handleDeleteTransaction}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination__btn"
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                style={{
                  opacity: filters.page === 1 ? 0.5 : 1,
                  cursor: filters.page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Prev
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination__btn ${filters.page === page ? 'pagination__btn--active' : ''}`}
                  onClick={() => handlePageChange(page)}
                  style={{
                    background: filters.page === page ? '#2D7FF9' : 'white',
                    color: filters.page === page ? 'white' : '#0f172a',
                    borderColor: filters.page === page ? '#2D7FF9' : '#e2e8f0',
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination__btn"
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.totalPages}
                style={{
                  opacity: filters.page === pagination.totalPages ? 0.5 : 1,
                  cursor: filters.page === pagination.totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookTransactions;