import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, MenuItem, Grid, Card, CardContent, Typography, Chip, CircularProgress, Pagination, Alert } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ViewBooks = ({ onStatsUpdate }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [error, setError] = useState('');
  const fetchBooks = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) { setError('Please login again'); return; }
      const response = await axios.get(`${API_BASE_URL}/api/library/books`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        params: { page, limit: 12, search: debouncedSearch, category }
      });
      const booksData = response.data?.books || [];
      setBooks(booksData);
      setPagination({ page: response.data?.currentPage || 1, totalPages: response.data?.totalPages || 1, total: response.data?.total || 0 });
      const newCategories = booksData.map(book => book.category).filter(Boolean);
      setCategories(prev => [...new Set([...prev, ...newCategories])].sort());
    } catch (error) {
      console.error('Error fetching books:', error.message);
      setError(error.response?.status === 401 ? 'Session expired. Please login again.' : 'Failed to fetch books. Please try again.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchBooks(1); }, [debouncedSearch, category]);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { setDebouncedSearch(search); }, 400);
    return () => clearTimeout(debounceTimer.current);
  }, [search]);
  const handlePageChange = (event, value) => { fetchBooks(value); };
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search Books"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, author, or ISBN"
          sx={{ minWidth: 250, '& .MuiOutlinedInput-root': { borderRadius: 2.5, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' } }}
        />
        <TextField
          select
          label="Filter by Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2.5, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' } }}
        >
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
        </TextField>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {books.map((book) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={book._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, border: '1px solid', borderColor: 'grey.200', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', transition: 'all 0.2s', '&:hover': { boxShadow: '0 8px 24px rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', transform: 'translateY(-2px)' } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom noWrap sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      {book.title}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.85rem' }}>by {book.author}</Typography>
                    <Chip
                      label={book.category} size="small"
                      sx={{ mb: 1, bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)', fontWeight: 600, fontSize: '0.7rem' }}
                    />
                    <Typography variant="body2" color="textSecondary">ISBN: {book.isbn}</Typography>
                    <Typography variant="body2" color="textSecondary">Publisher: {book.publisher}</Typography>
                    <Typography variant="body2" color="textSecondary">Year: {book.publication_year}</Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color={book.available_copies > 0 ? 'success.main' : 'error.main'}>Available: {book.available_copies}/{book.total_copies}</Typography>
                      {book.location && <Typography variant="body2" color="textSecondary">Shelf: {book.location}</Typography>}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}

          {books.length === 0 && !loading && !error && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">No books found</Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ViewBooks;