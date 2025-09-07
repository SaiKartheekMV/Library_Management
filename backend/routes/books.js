const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const { authenticateToken, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book management operations
 */

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books with filtering and pagination
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [title, author, rating, popularity, trending, newest]
 *     responses:
 *       200:
 *         description: Books retrieved successfully
 */
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().trim(),
  query('genre').optional().isString().trim(),
  query('author').optional().isString().trim(),
  query('available').optional().isBoolean(),
  query('sort').optional().isIn(['title', 'author', 'rating', 'popularity', 'trending', 'newest'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      search,
      genre,
      author,
      available,
      sort = 'newest'
    } = req.query;

    // Build query
    const query = { isActive: true, isDeleted: false };

    if (search) {
      query.$text = { $search: search };
    }

    if (genre) {
      query.genre = genre;
    }

    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }

    if (available !== undefined) {
      if (available === 'true') {
        query.availableCopies = { $gt: 0 };
        query.isAvailable = true;
      } else {
        query.$or = [
          { availableCopies: 0 },
          { isAvailable: false }
        ];
      }
    }

    // Build sort
    let sortObj = {};
    switch (sort) {
      case 'title':
        sortObj = { title: 1 };
        break;
      case 'author':
        sortObj = { author: 1 };
        break;
      case 'rating':
        sortObj = { averageRating: -1 };
        break;
      case 'popularity':
        sortObj = { popularityScore: -1 };
        break;
      case 'trending':
        sortObj = { trendingScore: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    // Execute query
    const skip = (page - 1) * limit;
    const books = await Book.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName')
      .lean();

    const total = await Book.countDocuments(query);

    // Update view count for each book
    if (books.length > 0) {
      const bookIds = books.map(book => book._id);
      await Book.updateMany(
        { _id: { $in: bookIds } },
        { $inc: { totalViews: 1 }, lastAccessed: new Date() }
      );
    }

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBooks: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve books',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book retrieved successfully
 *       404:
 *         description: Book not found
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('similarBooks', 'title author coverImage')
      .lean();

    if (!book || !book.isActive || book.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Update view count
    await Book.findByIdAndUpdate(req.params.id, {
      $inc: { totalViews: 1 },
      lastAccessed: new Date()
    });

    // Get recent reviews
    const reviews = await Review.find({ book: req.params.id, status: 'published' })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get similar books
    const similarBooks = await Book.findSimilarBooks(req.params.id, 5);

    res.json({
      success: true,
      data: {
        book,
        reviews,
        similarBooks
      }
    });

  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - isbn
 *               - publisher
 *               - publicationYear
 *               - genre
 *               - totalCopies
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               isbn:
 *                 type: string
 *               description:
 *                 type: string
 *               publisher:
 *                 type: string
 *               publicationYear:
 *                 type: integer
 *               genre:
 *                 type: string
 *               totalCopies:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Book created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, authorize('admin', 'librarian'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('isbn').isISBN().withMessage('Valid ISBN is required'),
  body('publisher').trim().notEmpty().withMessage('Publisher is required'),
  body('publicationYear').isInt({ min: 1000, max: new Date().getFullYear() + 1 }).withMessage('Valid publication year is required'),
  body('genre').isIn(['fiction', 'non-fiction', 'science', 'history', 'biography', 'mystery', 'romance', 'fantasy', 'sci-fi', 'thriller', 'self-help', 'business', 'technology', 'art', 'philosophy', 'poetry', 'drama', 'comedy', 'education', 'reference', 'children', 'young-adult']).withMessage('Valid genre is required'),
  body('totalCopies').isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
  body('description').optional().isString().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('pages').optional().isInt({ min: 1 }).withMessage('Pages must be at least 1'),
  body('language').optional().isString().withMessage('Language must be a string'),
  body('format').optional().isIn(['hardcover', 'paperback', 'ebook', 'audiobook', 'magazine', 'journal']).withMessage('Invalid format'),
  body('location.shelf').optional().isString().withMessage('Shelf must be a string'),
  body('location.section').optional().isString().withMessage('Section must be a string'),
  body('location.floor').optional().isInt({ min: 1 }).withMessage('Floor must be a positive integer'),
  body('location.room').optional().isString().withMessage('Room must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const bookData = {
      ...req.body,
      createdBy: req.user._id,
      availableCopies: req.body.totalCopies
    };

    const book = new Book(bookData);
    await book.save();

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: { book }
    });

  } catch (error) {
    console.error('Create book error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Update book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       404:
 *         description: Book not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticateToken, authorize('admin', 'librarian'), [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('author').optional().trim().notEmpty().withMessage('Author cannot be empty'),
  body('isbn').optional().isISBN().withMessage('Valid ISBN is required'),
  body('publisher').optional().trim().notEmpty().withMessage('Publisher cannot be empty'),
  body('publicationYear').optional().isInt({ min: 1000, max: new Date().getFullYear() + 1 }).withMessage('Valid publication year is required'),
  body('genre').optional().isIn(['fiction', 'non-fiction', 'science', 'history', 'biography', 'mystery', 'romance', 'fantasy', 'sci-fi', 'thriller', 'self-help', 'business', 'technology', 'art', 'philosophy', 'poetry', 'drama', 'comedy', 'education', 'reference', 'children', 'young-adult']).withMessage('Valid genre is required'),
  body('totalCopies').optional().isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
  body('description').optional().isString().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const book = await Book.findById(req.params.id);
    if (!book || !book.isActive || book.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Update available copies if total copies changed
    if (req.body.totalCopies && req.body.totalCopies !== book.totalCopies) {
      const difference = req.body.totalCopies - book.totalCopies;
      req.body.availableCopies = Math.max(0, book.availableCopies + difference);
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: { book: updatedBook }
    });

  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete book (soft delete)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       404:
 *         description: Book not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticateToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || book.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book has active transactions
    const activeTransactions = await Transaction.countDocuments({
      book: req.params.id,
      status: { $in: ['active', 'overdue'] }
    });

    if (activeTransactions > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book with active transactions'
      });
    }

    book.isDeleted = true;
    book.isActive = false;
    await book.save();

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });

  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/books/{id}/borrow:
 *   post:
 *     summary: Borrow a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book borrowed successfully
 *       400:
 *         description: Book not available or borrowing limit reached
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/borrow', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || !book.isActive || book.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (!book.canBeBorrowed()) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available for borrowing'
      });
    }

    // Check if user already has this book
    const existingTransaction = await Transaction.findOne({
      user: req.user._id,
      book: req.params.id,
      status: { $in: ['active', 'overdue'] }
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'You already have this book borrowed'
      });
    }

    // Create transaction
    const transaction = new Transaction({
      user: req.user._id,
      book: req.params.id,
      type: 'borrow',
      status: 'active',
      bookConditionAtBorrow: book.condition
    });

    await transaction.save();

    // Update book availability
    book.availableCopies -= 1;
    await book.save();

    // Update user's current borrowed books
    req.user.currentBorrowedBooks.push(req.params.id);
    req.user.totalBooksBorrowed += 1;
    await req.user.save();

    res.json({
      success: true,
      message: 'Book borrowed successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Borrow book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to borrow book',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/books/{id}/return:
 *   post:
 *     summary: Return a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condition:
 *                 type: string
 *                 enum: [new, excellent, good, fair, poor, damaged]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Book returned successfully
 *       400:
 *         description: Book not borrowed by user
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/return', authenticateToken, [
  body('condition').optional().isIn(['new', 'excellent', 'good', 'fair', 'poor', 'damaged']).withMessage('Invalid condition'),
  body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const transaction = await Transaction.findOne({
      user: req.user._id,
      book: req.params.id,
      status: { $in: ['active', 'overdue'] }
    });

    if (!transaction) {
      return res.status(400).json({
        success: false,
        message: 'You do not have this book borrowed'
      });
    }

    // Return the book
    await transaction.returnBook(req.body.condition, req.body.notes);

    // Update book availability
    const book = await Book.findById(req.params.id);
    book.availableCopies += 1;
    await book.save();

    // Update user's current borrowed books
    req.user.currentBorrowedBooks = req.user.currentBorrowedBooks.filter(
      bookId => bookId.toString() !== req.params.id
    );
    req.user.totalBooksRead += 1;
    await req.user.save();

    res.json({
      success: true,
      message: 'Book returned successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to return book',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/books/{id}/renew:
 *   post:
 *     summary: Renew a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book renewed successfully
 *       400:
 *         description: Book cannot be renewed
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/renew', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      user: req.user._id,
      book: req.params.id,
      status: { $in: ['active', 'overdue'] }
    });

    if (!transaction) {
      return res.status(400).json({
        success: false,
        message: 'You do not have this book borrowed'
      });
    }

    if (!transaction.canRenew) {
      return res.status(400).json({
        success: false,
        message: 'This book cannot be renewed'
      });
    }

    await transaction.renew();

    res.json({
      success: true,
      message: 'Book renewed successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Renew book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew book',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/books/{id}/reserve:
 *   post:
 *     summary: Reserve a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book reserved successfully
 *       400:
 *         description: Book not available for reservation
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/reserve', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || !book.isActive || book.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if user already has this book borrowed or reserved
    const existingTransaction = await Transaction.findOne({
      user: req.user._id,
      book: req.params.id,
      status: { $in: ['active', 'overdue', 'pending'] }
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'You already have this book borrowed or reserved'
      });
    }

    // Create reservation
    const transaction = new Transaction({
      user: req.user._id,
      book: req.params.id,
      type: 'reserve',
      status: 'pending',
      reservationDate: new Date(),
      reservationExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Book reserved successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Reserve book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reserve book',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/books/{id}/cancel-reservation:
 *   post:
 *     summary: Cancel book reservation
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *       400:
 *         description: No active reservation found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/cancel-reservation', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      user: req.user._id,
      book: req.params.id,
      type: 'reserve',
      status: 'pending'
    });

    if (!transaction) {
      return res.status(400).json({
        success: false,
        message: 'No active reservation found for this book'
      });
    }

    transaction.status = 'cancelled';
    await transaction.save();

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel reservation',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/books/trending:
 *   get:
 *     summary: Get trending books
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending books retrieved successfully
 */
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const books = await Book.find({ 
      isActive: true, 
      isDeleted: false,
      availableCopies: { $gt: 0 }
    })
    .sort({ trendingScore: -1, popularityScore: -1 })
    .limit(limit)
    .populate('createdBy', 'firstName lastName')
    .lean();

    res.json({
      success: true,
      data: { books }
    });

  } catch (error) {
    console.error('Get trending books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trending books',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/books/popular:
 *   get:
 *     summary: Get popular books
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Popular books retrieved successfully
 */
router.get('/popular', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const books = await Book.find({ 
      isActive: true, 
      isDeleted: false,
      availableCopies: { $gt: 0 }
    })
    .sort({ popularityScore: -1, averageRating: -1 })
    .limit(limit)
    .populate('createdBy', 'firstName lastName')
    .lean();

    res.json({
      success: true,
      data: { books }
    });

  } catch (error) {
    console.error('Get popular books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve popular books',
      error: error.message
    });
  }
});

module.exports = router;
