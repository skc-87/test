const mongoose = require('mongoose');
const LibraryBook = require('../models/LibraryBook');
const BookTransaction = require('../models/BookTransaction');
const Student = require('../models/Student');
const User = require('../models/User');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ALLOWED_BOOK_FIELDS = ['title', 'author', 'isbn', 'category', 'description', 'total_copies', 'available_copies', 'publisher', 'publication_year', 'location'];

const pickFields = (obj, allowedFields) => {
  const picked = {};
  for (const field of allowedFields) {
    if (obj[field] !== undefined) picked[field] = obj[field];
  }
  return picked;
};

const addBook = async (req, res) => {
  try {
    const bookData = pickFields(req.body, ALLOWED_BOOK_FIELDS);
    if (bookData.total_copies !== undefined && bookData.available_copies === undefined) {
      bookData.available_copies = bookData.total_copies;
    }
    const book = new LibraryBook(bookData);
    await book.save();
    res.status(201).json({ message: 'Book added successfully', book });
  } catch (error) {
    console.error("Add book error:", error.message);
    res.status(400).json({ error: 'Failed to add book' });
  }
};

const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const filter = {};
    if (search) {
      if (typeof search !== 'string') return res.status(400).json({ error: 'Invalid search' });
      const escaped = escapeRegex(search);
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { author: { $regex: escaped, $options: 'i' } },
        { isbn: { $regex: escaped, $options: 'i' } }
      ];
    }
    if (category) {
      if (typeof category !== 'string') return res.status(400).json({ error: 'Invalid category' });
      filter.category = category;
    }
    const books = await LibraryBook.find(filter).limit(parsedLimit).skip((parsedPage - 1) * parsedLimit).sort({ createdAt: -1 });
    const total = await LibraryBook.countDocuments(filter);
    res.json({ books, totalPages: Math.ceil(total / parsedLimit), currentPage: parsedPage, total });
  } catch (error) {
    console.error("Get books error:", error.message);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

const getBookById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid book ID' });
    const book = await LibraryBook.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    console.error("Get book error:", error.message);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
};

const updateBook = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid book ID' });
    const bookData = pickFields(req.body, ALLOWED_BOOK_FIELDS);
    const book = await LibraryBook.findByIdAndUpdate(req.params.id, bookData, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book updated successfully', book });
  } catch (error) {
    console.error("Update book error:", error.message);
    res.status(400).json({ error: 'Failed to update book' });
  }
};

const deleteBook = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid book ID' });
    const activeTransactions = await BookTransaction.countDocuments({ book: req.params.id, status: 'issued' });
    if (activeTransactions > 0) {
      return res.status(400).json({ error: `Cannot delete book — ${activeTransactions} active transaction(s) exist. Return all copies first.` });
    }
    const book = await LibraryBook.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error("Delete book error:", error.message);
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

const issueBook = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { studentId, bookId, dueDays = 15 } = req.body;
    if (!studentId || !bookId) return res.status(400).json({ error: 'studentId and bookId are required' });
    if (!isValidObjectId(studentId) || !isValidObjectId(bookId)) {
      return res.status(400).json({ error: 'Invalid studentId or bookId' });
    }
    const parsedDueDays = parseInt(dueDays);
    if (!Number.isInteger(parsedDueDays) || parsedDueDays < 1 || parsedDueDays > 90) {
      return res.status(400).json({ error: 'Due days must be between 1 and 90' });
    }
    session.startTransaction();
    const student = await Student.findById(studentId).populate('user').session(session);
    if (!student) { await session.abortTransaction(); return res.status(404).json({ error: 'Student not found' }); }
    if (student.currently_borrowed_books >= student.max_books_allowed) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Student has reached maximum book limit' });
    }
    const existingTransaction = await BookTransaction.findOne({ student: studentId, book: bookId, status: 'issued' }).session(session);
    if (existingTransaction) { await session.abortTransaction(); return res.status(400).json({ error: 'Student already has this book issued' }); }
    const book = await LibraryBook.findOneAndUpdate(
      { _id: bookId, available_copies: { $gte: 1 } },
      { $inc: { available_copies: -1 } },
      { new: true, session }
    );
    if (!book) { await session.abortTransaction(); return res.status(400).json({ error: 'Book not available' }); }
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parsedDueDays);
    const transaction = new BookTransaction({
      student: studentId, book: bookId, issue_date: issueDate, due_date: dueDate, status: 'issued'
    });
    await Student.findOneAndUpdate({ _id: studentId }, { $inc: { currently_borrowed_books: 1 } }, { new: true, session });
    await transaction.save({ session });
    await session.commitTransaction();
    res.status(201).json({ message: 'Book issued successfully', transaction, student: student.user.name, book: book.title });
  } catch (error) {
    try { await session.abortTransaction(); } catch (_) {}
    console.error("Issue book error:", error.message);
    res.status(400).json({ error: 'Failed to issue book' });
  } finally {
    session.endSession();
  }
};

const returnBook = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ error: 'transactionId is required' });
    if (!isValidObjectId(transactionId)) return res.status(400).json({ error: 'Invalid transactionId' });
    session.startTransaction();
    const returnDate = new Date();
    const transaction = await BookTransaction.findOneAndUpdate(
      { _id: transactionId, status: 'issued' },
      { $set: { status: 'returned', return_date: returnDate } },
      { new: true, session }
    ).populate('student').populate('book');
    if (!transaction) { await session.abortTransaction(); return res.status(400).json({ error: 'Transaction not found or already returned' }); }
    let fineAmount = 0;
    if (returnDate > transaction.due_date) {
      const overdueDays = Math.ceil((returnDate - transaction.due_date) / (1000 * 60 * 60 * 24));
      fineAmount = overdueDays * 5;
    }
    transaction.fine_amount = fineAmount;
    await transaction.save({ session });
    await LibraryBook.findByIdAndUpdate(transaction.book._id, { $inc: { available_copies: 1 } }, { session });
    await Student.findByIdAndUpdate(transaction.student._id, { $inc: { currently_borrowed_books: -1 } }, { session });
    await session.commitTransaction();
    res.json({ message: 'Book returned successfully', transaction, fineAmount });
  } catch (error) {
    try { await session.abortTransaction(); } catch (_) {}
    console.error("Return book error:", error.message);
    res.status(400).json({ error: 'Failed to return book' });
  } finally {
    session.endSession();
  }
};

const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const filter = {};
    if (status) {
      const VALID_STATUSES = ['issued', 'returned', 'overdue'];
      if (typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status filter' });
      }
      filter.status = status;
    }
    const transactions = await BookTransaction.find(filter)
      .populate({ path: 'student', select: 'user department year mobile_number currently_borrowed_books', populate: { path: 'user', select: 'name email role' } })
      .populate('book', 'title author isbn category')
      .limit(parsedLimit).skip((parsedPage - 1) * parsedLimit).sort({ createdAt: -1 });
    const total = await BookTransaction.countDocuments(filter);
    res.json({ transactions, totalPages: Math.ceil(total / parsedLimit), currentPage: parsedPage, total });
  } catch (error) {
    console.error("Get transactions error:", error.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const getLibraryStats = async (req, res) => {
  try {
    const totalBooks = await LibraryBook.countDocuments();
    const totalTransactions = await BookTransaction.countDocuments();
    const issuedBooks = await BookTransaction.countDocuments({ status: 'issued' });
    const overdueBooks = await BookTransaction.countDocuments({ status: 'issued', due_date: { $lt: new Date() } });
    const popularBooks = await BookTransaction.aggregate([
      { $group: { _id: '$book', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'librarybooks', localField: '_id', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' }
    ]);
    res.json({ totalBooks, totalTransactions, issuedBooks, overdueBooks, popularBooks });
  } catch (error) {
    console.error("Library stats error:", error.message);
    res.status(500).json({ error: 'Failed to fetch library statistics' });
  }
};

const getStudents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const [students, total] = await Promise.all([
      Student.find().populate('user', 'name email')
        .select('user mobile_number department year currently_borrowed_books max_books_allowed')
        .sort({ 'user.name': 1 }).skip(skip).limit(limit),
      Student.countDocuments()
    ]);
    res.json({ students, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

const getStudentById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid student ID' });
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email')
      .select('user mobile_number department year currently_borrowed_books max_books_allowed');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

const getStudentBooks = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });
    const transactions = await BookTransaction.find({ student: student._id, status: 'issued' })
      .populate('book', 'title author isbn').sort({ due_date: 1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student books' });
  }
};

module.exports = {
  addBook, getAllBooks, getBookById, updateBook, deleteBook,
  issueBook, returnBook, getTransactions, getLibraryStats,
  getStudents, getStudentById, getStudentBooks
};