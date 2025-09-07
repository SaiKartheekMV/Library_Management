const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const { authenticateToken, authorize, checkResourceAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management operations
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, overdue, cancelled, lost, damaged]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [borrow, return, renew, reserve, cancel_reservation, late_return, lost_book, damaged_book]
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, authorize('admin', 'librarian'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'active', 'completed', 'overdue', 'cancelled', 'lost', 'damaged']).withMessage('Invalid status'),
  query('type').optional().isIn(['borrow', 'return', 'renew', 'reserve', 'cancel_reservation', 'late_return', 'lost_book', 'damaged_book']).withMessage('Invalid type')
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

    const { page = 1, limit = 10, status, type } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const transactions = await Transaction.find(query)
      .populate('user', 'firstName lastName email libraryCardNumber')
      .populate('book', 'title author isbn coverImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTransactions: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
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
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'firstName lastName email libraryCardNumber')
      .populate('book', 'title author isbn coverImage')
      .lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user can access this transaction
    if (req.user.role !== 'admin' && req.user.role !== 'librarian' && 
        transaction.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/transactions/{id}/renew:
 *   post:
 *     summary: Renew a transaction
 *     tags: [Transactions]
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
 *               days:
 *                 type: integer
 *                 default: 14
 *     responses:
 *       200:
 *         description: Transaction renewed successfully
 *       400:
 *         description: Transaction cannot be renewed
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/renew', authenticateToken, [
  body('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30')
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

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user can renew this transaction
    if (req.user.role !== 'admin' && req.user.role !== 'librarian' && 
        transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!transaction.canRenew) {
      return res.status(400).json({
        success: false,
        message: 'This transaction cannot be renewed'
      });
    }

    const days = req.body.days || 14;
    await transaction.renew(days);

    res.json({
      success: true,
      message: 'Transaction renewed successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Renew transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew transaction',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/transactions/{id}/return:
 *   post:
 *     summary: Return a book (Admin/Librarian only)
 *     tags: [Transactions]
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
 *               waiveFine:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Book returned successfully
 *       400:
 *         description: Transaction not found or cannot be returned
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/return', authenticateToken, authorize('admin', 'librarian'), [
  body('condition').optional().isIn(['new', 'excellent', 'good', 'fair', 'poor', 'damaged']).withMessage('Invalid condition'),
  body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('waiveFine').optional().isBoolean().withMessage('Waive fine must be a boolean')
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

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'active' && transaction.status !== 'overdue') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not active'
      });
    }

    // Return the book
    await transaction.returnBook(req.body.condition, req.body.notes);

    // Waive fine if requested
    if (req.body.waiveFine && transaction.fineAmount > 0) {
      transaction.fineStatus = 'waived';
      await transaction.save();
    }

    // Update book availability
    const book = await Book.findById(transaction.book);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    // Update user's current borrowed books
    const user = await User.findById(transaction.user);
    if (user) {
      user.currentBorrowedBooks = user.currentBorrowedBooks.filter(
        bookId => bookId.toString() !== transaction.book.toString()
      );
      user.totalBooksRead += 1;
      await user.save();
    }

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
 * /api/transactions/overdue:
 *   get:
 *     summary: Get overdue transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/overdue', authenticateToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const overdueTransactions = await Transaction.findOverdue();

    res.json({
      success: true,
      data: { transactions: overdueTransactions }
    });

  } catch (error) {
    console.error('Get overdue transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overdue transactions',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/transactions/due-soon:
 *   get:
 *     summary: Get transactions due soon
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 3
 *     responses:
 *       200:
 *         description: Due soon transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/due-soon', authenticateToken, authorize('admin', 'librarian'), [
  query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30')
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

    const days = parseInt(req.query.days) || 3;
    const dueSoonTransactions = await Transaction.findDueSoon(days);

    res.json({
      success: true,
      data: { transactions: dueSoonTransactions }
    });

  } catch (error) {
    console.error('Get due soon transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve due soon transactions',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/transactions/{id}/fine:
 *   post:
 *     summary: Update fine for transaction
 *     tags: [Transactions]
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
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *                 enum: [late_return, damaged_book, lost_book, overdue_renewal, reservation_no_show]
 *               status:
 *                 type: string
 *                 enum: [pending, paid, waived, disputed]
 *     responses:
 *       200:
 *         description: Fine updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/fine', authenticateToken, authorize('admin', 'librarian'), [
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('reason').optional().isIn(['late_return', 'damaged_book', 'lost_book', 'overdue_renewal', 'reservation_no_show']).withMessage('Invalid reason'),
  body('status').optional().isIn(['pending', 'paid', 'waived', 'disputed']).withMessage('Invalid status')
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

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (req.body.amount !== undefined) {
      transaction.fineAmount = req.body.amount;
    }
    if (req.body.reason !== undefined) {
      transaction.fineReason = req.body.reason;
    }
    if (req.body.status !== undefined) {
      transaction.fineStatus = req.body.status;
    }

    if (req.body.status === 'paid') {
      transaction.finePaidDate = new Date();
    }

    await transaction.save();

    res.json({
      success: true,
      message: 'Fine updated successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Update fine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update fine',
      error: error.message
    });
  }
});

module.exports = router;
