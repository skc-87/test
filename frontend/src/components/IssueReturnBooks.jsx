import React, { useState, useEffect } from 'react';
import { Users, BookOpen, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import IssuedBookCard from './LibrarianUI/IssuedBookCard';
import '../styles/LibrarianDashboard.css';

const IssueReturnBooks = ({ onStatsUpdate }) => {
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [issueForm, setIssueForm] = useState({ studentId: '', bookId: '', dueDays: 15 });

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) { showSnackbar('Please login again', 'error'); return; }

      const response = await axios.get(`${API_BASE_URL}/api/library/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const studentsList = response.data?.students || [];
      setStudents(Array.isArray(studentsList) ? studentsList : []);
    } catch (error) {
      if (error.response?.status === 401) {
        showSnackbar('Session expired. Please login again.', 'error');
      } else {
        showSnackbar('Failed to load students. Please try again.', 'error');
      }
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/api/library/books`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });
      const availableBooks = (response.data?.books || []).filter(book => book.available_copies > 0);
      setBooks(availableBooks);
    } catch (error) {
      setBooks([]);
    }
  };

  const fetchIssuedBooks = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/api/library/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'issued', limit: 50 }
      });
      setIssuedBooks(response.data?.transactions || []);
    } catch (error) {
      setIssuedBooks([]);
    }
  };

  useEffect(() => { fetchStudents(); fetchAvailableBooks(); fetchIssuedBooks(); }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar({ ...snackbar, open: false }), 3000);
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("authToken");
      await axios.post(`${API_BASE_URL}/api/library/issue`, issueForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSnackbar('Book issued successfully');
      setIssueForm({ studentId: '', bookId: '', dueDays: 15 });
      fetchAvailableBooks();
      fetchIssuedBooks();
      onStatsUpdate?.();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Error issuing book', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnBook = async (transactionId) => {
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.post(`${API_BASE_URL}/api/library/return`,
        { transactionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const fineMsg = response.data.fineAmount > 0 ? ` with fine: ₹${response.data.fineAmount}` : '';
      showSnackbar(`Book returned successfully${fineMsg}`);
      fetchAvailableBooks();
      fetchIssuedBooks();
      onStatsUpdate?.();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Error returning book', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedStudent = () => students.find(s => s._id === issueForm.studentId);
  const getSelectedBook = () => books.find(b => b._id === issueForm.bookId);
  const isStudentAtLimit = () => { const student = getSelectedStudent(); return student && student.currently_borrowed_books >= student.max_books_allowed; };
  const isOverdue = (dueDate) => new Date(dueDate) < new Date();
  const calculateFine = (dueDate) => {
    if (!isOverdue(dueDate)) return 0;
    const overdueDays = Math.ceil((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
    return overdueDays * 5;
  };

  return (
    <div>
      {/* Snackbar */}
      {snackbar.open && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: snackbar.severity === 'error' ? 'rgba(255, 90, 95, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          border: `1px solid ${snackbar.severity === 'error' ? '#FF5A5F' : '#10b981'}`,
          color: snackbar.severity === 'error' ? '#FF5A5F' : '#10b981',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          {snackbar.message}
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '24px',
        marginBottom: '32px',
      }}>
        {/* Issue Book Form */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          height: 'fit-content',
          position: 'sticky',
          top: '20px',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
            Issue Book to Student
          </h3>
          <form onSubmit={handleIssueBook}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Student Selection */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#0f172a',
                  marginBottom: '8px',
                }}>
                  Select Student *
                </label>
                <select
                  value={issueForm.studentId}
                  onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
                  className="form-group__select"
                  disabled={studentsLoading}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.user?.name} - {student.department} (Year {student.year})
                    </option>
                  ))}
                </select>
                {students.length === 0 && !studentsLoading && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'rgba(255, 167, 38, 0.1)',
                    border: '1px solid #FFA726',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#FFA726',
                  }}>
                    No students found in system
                  </div>
                )}
              </div>

              {/* Book Selection */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#0f172a',
                  marginBottom: '8px',
                }}>
                  Select Book *
                </label>
                <select
                  value={issueForm.bookId}
                  onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                  className="form-group__select"
                  required
                >
                  <option value="">Select Book</option>
                  {books.map((book) => (
                    <option key={book._id} value={book._id}>
                      {book.title} ({book.available_copies} available)
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Days */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#0f172a',
                  marginBottom: '8px',
                }}>
                  Due Days *
                </label>
                <input
                  type="number"
                  value={issueForm.dueDays}
                  onChange={(e) => setIssueForm({ ...issueForm, dueDays: parseInt(e.target.value) || 1 })}
                  className="form-group__input"
                  min="1"
                  max="30"
                  required
                />
              </div>

              {/* Student Info Alert */}
              {issueForm.studentId && (
                <div style={{
                  padding: '12px',
                  background: isStudentAtLimit() ? 'rgba(255, 90, 95, 0.1)' : 'rgba(45, 127, 249, 0.1)',
                  border: `1px solid ${isStudentAtLimit() ? '#FF5A5F' : '#2D7FF9'}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: isStudentAtLimit() ? '#FF5A5F' : '#2D7FF9',
                }}>
                  <strong>{getSelectedStudent()?.user?.name}</strong><br />
                  Department: {getSelectedStudent()?.department}<br />
                  Year: {getSelectedStudent()?.year}<br />
                  Borrowed: {getSelectedStudent()?.currently_borrowed_books || 0}/{getSelectedStudent()?.max_books_allowed || 3} books
                  {isStudentAtLimit() && <div style={{ marginTop: '4px', fontWeight: '600' }}>⚠ MAX LIMIT REACHED!</div>}
                </div>
              )}

              {/* Book Info Alert */}
              {issueForm.bookId && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(45, 127, 249, 0.1)',
                  border: '1px solid #2D7FF9',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#2D7FF9',
                }}>
                  <strong>{getSelectedBook()?.title}</strong><br />
                  Author: {getSelectedBook()?.author}<br />
                  Available: {getSelectedBook()?.available_copies} copies
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  background: isStudentAtLimit() || !issueForm.studentId || !issueForm.bookId ? '#d1d5db' : '#2D7FF9',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isStudentAtLimit() || !issueForm.studentId || !issueForm.bookId ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                }}
                disabled={submitting || !issueForm.studentId || !issueForm.bookId || isStudentAtLimit() || students.length === 0}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.background = '#1e5bc0';
                    e.target.style.boxShadow = '0 4px 12px rgba(45, 127, 249, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.background = '#2D7FF9';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {submitting ? 'Processing...' : 'Issue Book'}
              </button>
            </div>
          </form>
        </div>

        {/* Issued Books List */}
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} style={{ color: '#2D7FF9' }} />
              Currently Issued Books ({issuedBooks.length})
            </h3>
          </div>

          {issuedBooks.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}>
              <BookOpen size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                No books currently issued
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {issuedBooks.map((transaction) => (
                <IssuedBookCard
                  key={transaction._id}
                  transaction={transaction}
                  isOverdue={isOverdue(transaction.due_date)}
                  fineAmount={calculateFine(transaction.due_date)}
                  onConfirmReturn={handleReturnBook}
                  loading={submitting}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive Adjustment */}
      <style>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: 1fr 2fr"] {
            grid-template-columns: 1fr;
          }
          
          div[style*="position: sticky"] {
            position: static;
          }
        }
      `}</style>
    </div>
  );
};

export default IssueReturnBooks;