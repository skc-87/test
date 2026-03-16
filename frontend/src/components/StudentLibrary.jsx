import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Alert, CircularProgress } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { CountUp } from './reactbits';

const StudentLibrary = () => {
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchMyIssuedBooks = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) { setError('Please login again'); return; }
      const response = await axios.get(`${API_BASE_URL}/api/library/student/my-books`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIssuedBooks(response.data || []);
    } catch (error) {
      setError('Failed to load your issued books');
      setIssuedBooks([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchMyIssuedBooks(); }, []);
  const isOverdue = (dueDate) => new Date(dueDate) < new Date();
  const calculateFine = (dueDate) => {
    if (!isOverdue(dueDate)) return 0;
    return Math.ceil((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24)) * 5;
  };
  const getDaysRemaining = (dueDate) => Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  return (
    <Box>
      <Typography variant="h6" gutterBottom className="text-xl font-bold text-slate-800">
        My Library Books
      </Typography>
      {error && <Alert severity="error" className="mb-4">{error}</Alert>}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom className="text-lg font-semibold text-gray-800">
            Currently Issued Books
          </Typography>
          {loading ? (
            <Box className="flex justify-center items-center h-32">
              <CircularProgress />
            </Box>
          ) : issuedBooks.length === 0 ? (
            <Alert severity="info">You don't have any books issued currently.</Alert>
          ) : (
            <TableContainer component={Paper} className="border border-slate-200 rounded-lg">
              <Table>
                <TableHead className="bg-slate-50">
                  <TableRow>
                    <TableCell className="font-semibold">Book Title</TableCell>
                    <TableCell className="font-semibold">Author</TableCell>
                    <TableCell className="font-semibold">Issue Date</TableCell>
                    <TableCell className="font-semibold">Due Date</TableCell>
                    <TableCell className="font-semibold">Days Remaining</TableCell>
                    <TableCell className="font-semibold">Fine</TableCell>
                    <TableCell className="font-semibold">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {issuedBooks.map((transaction) => {
                    const daysRemaining = getDaysRemaining(transaction.due_date);
                    const fineAmount = calculateFine(transaction.due_date);
                    const isBookOverdue = isOverdue(transaction.due_date);
                    return (
                      <TableRow key={transaction._id} className="hover:bg-slate-50">
                        <TableCell>
                          <Typography className="font-semibold">{transaction.book?.title}</Typography>
                        </TableCell>
                        <TableCell>{transaction.book?.author}</TableCell>
                        <TableCell>{new Date(transaction.issue_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(transaction.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={isBookOverdue ? 'Overdue' : `${daysRemaining} days`}
                            color={isBookOverdue ? "error" : daysRemaining <= 3 ? "warning" : "success"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography className={fineAmount > 0 ? "text-rose-600 font-bold" : "text-slate-600"}>₹{fineAmount}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={transaction.status.toUpperCase()} color={transaction.status === 'issued' ? "primary" : "default"} size="small" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      {issuedBooks.length > 0 && (
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', mt: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom className="text-lg font-semibold text-slate-800">
              Summary
            </Typography>
            <Box className="flex gap-6 flex-wrap">
              <Box>
                <Typography className="text-sm text-slate-600">Total Books Issued</Typography>
                <Typography className="text-xl font-bold"><CountUp from={0} to={issuedBooks.length} separator="" duration={0.8} /></Typography>
              </Box>
              <Box>
                <Typography className="text-sm text-slate-600">Overdue Books</Typography>
                <Typography className="text-xl font-bold text-rose-600"><CountUp from={0} to={issuedBooks.filter(t => isOverdue(t.due_date)).length} separator="" duration={0.8} /></Typography>
              </Box>
              <Box>
                <Typography className="text-sm text-slate-600">Total Fine</Typography>
                <Typography className="text-xl font-bold text-rose-600">₹{issuedBooks.reduce((sum, t) => sum + calculateFine(t.due_date), 0)}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default StudentLibrary;