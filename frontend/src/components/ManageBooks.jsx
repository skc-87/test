import React, { useState, useEffect } from 'react';
import { Edit, Delete, Plus, Search, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import BookForm from './LibrarianUI/BookForm';
import '../styles/LibrarianDashboard.css';

const ManageBooks = ({ onStatsUpdate }) => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science'];

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/api/library/books`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });
      setBooks(response.data?.books || []);
      setFilteredBooks(response.data?.books || []);
    } catch (error) {
      showSnackbar('Error fetching books', 'error');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, []);

  useEffect(() => {
    const filtered = books.filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm)
    );
    setFilteredBooks(filtered);
  }, [searchTerm, books]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar({ ...snackbar, open: false }), 3000);
  };

  const handleOpenForm = (book = null) => {
    setEditingBook(book || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingBook(null);
  };

  const handleSubmitForm = async (formData, bookId) => {
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("authToken");

      if (editingBook) {
        await axios.put(`${API_BASE_URL}/api/library/books/${bookId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Book updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/library/books`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Book added successfully');
      }

      handleCloseForm();
      fetchBooks();
      onStatsUpdate?.();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Error saving book', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;

    try {
      const token = sessionStorage.getItem("authToken");
      await axios.delete(`${API_BASE_URL}/api/library/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSnackbar('Book deleted successfully');
      fetchBooks();
      onStatsUpdate?.();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Error deleting book', 'error');
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
        <div style={{ flex: 1, minWidth: '250px' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '12px',
              color: '#64748b',
              pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>
        <button
          onClick={() => handleOpenForm()}
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
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#1e5bc0';
            e.target.style.boxShadow = '0 4px 12px rgba(45, 127, 249, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#2D7FF9';
            e.target.style.boxShadow = 'none';
          }}
        >
          <Plus size={18} />
          Add Book
        </button>
      </div>

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
            Loading books...
          </p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}>
          {books.length === 0 ? (
            <>
              <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#64748b' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                No books in library
              </h3>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>
                Start by adding your first book to the library
              </p>
              <button
                onClick={() => handleOpenForm()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#2D7FF9',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <Plus size={18} />
                Add First Book
              </button>
            </>
          ) : (
            <>
              <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#64748b' }} />
              <p style={{ color: '#64748b' }}>
                No books match your search
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {filteredBooks.map((book) => (
            <div
              key={book._id}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Book Title */}
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '8px',
                wordBreak: 'break-word',
              }}>
                {book.title}
              </h3>

              {/* Author */}
              <p style={{
                fontSize: '13px',
                color: '#64748b',
                marginBottom: '12px',
              }}>
                By {book.author}
              </p>

              {/* Category Badge */}
              <div style={{ marginBottom: '12px' }}>
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(45, 127, 249, 0.1)',
                  color: '#2D7FF9',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}>
                  {book.category}
                </span>
              </div>

              {/* Book Details */}
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '12px',
                borderTop: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0',
                padding: '12px 0',
                lineHeight: '1.6',
              }}>
                <div>ISBN: <strong>{book.isbn}</strong></div>
                <div>Publisher: {book.publisher} ({book.publication_year})</div>
                <div>
                  Copies: <strong>{book.available_copies}/{book.total_copies}</strong> available
                </div>
                {book.location && <div>Location: <strong>{book.location}</strong></div>}
              </div>

              {/* Description */}
              {book.description && (
                <p style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginBottom: '12px',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {book.description}
                </p>
              )}

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: 'auto',
              }}>
                <button
                  onClick={() => handleOpenForm(book)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(45, 127, 249, 0.1)',
                    color: '#2D7FF9',
                    border: '1px solid #2D7FF9',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#2D7FF9';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(45, 127, 249, 0.1)';
                    e.target.style.color = '#2D7FF9';
                  }}
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteBook(book._id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(255, 90, 95, 0.1)',
                    color: '#FF5A5F',
                    border: '1px solid #FF5A5F',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#FF5A5F';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 90, 95, 0.1)';
                    e.target.style.color = '#FF5A5F';
                  }}
                >
                  <Delete size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Form Modal */}
      <BookForm
        isOpen={openForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        loading={submitting}
        editingBook={editingBook}
      />
    </div>
  );
};

export default ManageBooks;