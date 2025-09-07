const express = require('express');
const { query, validationResult } = require('express-validator');
const Book = require('../models/Book');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and reporting operations
 */

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', authenticateToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    // Get basic counts
    const [
      totalBooks,
      totalUsers,
      totalTransactions,
      totalReviews,
      activeTransactions,
      overdueTransactions
    ] = await Promise.all([
      Book.countDocuments({ isActive: true, isDeleted: false }),
      User.countDocuments({ isActive: true }),
      Transaction.countDocuments(),
      Review.countDocuments({ status: 'published' }),
      Transaction.countDocuments({ status: 'active' }),
      Transaction.countDocuments({ status: 'overdue' })
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      recentBorrows,
      recentReturns,
      recentUsers,
      recentReviews
    ] = await Promise.all([
      Transaction.countDocuments({ 
        type: 'borrow', 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      Transaction.countDocuments({ 
        type: 'return', 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      User.countDocuments({ 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      Review.countDocuments({ 
        status: 'published',
        createdAt: { $gte: thirtyDaysAgo } 
      })
    ]);

    // Get popular genres
    const popularGenres = await Book.aggregate([
      { $match: { isActive: true, isDeleted: false } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get monthly trends (last 12 months)
    const monthlyTrends = await Transaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          borrows: {
            $sum: { $cond: [{ $eq: ['$type', 'borrow'] }, 1, 0] }
          },
          returns: {
            $sum: { $cond: [{ $eq: ['$type', 'return'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalBooks,
          totalUsers,
          totalTransactions,
          totalReviews,
          activeTransactions,
          overdueTransactions
        },
        recentActivity: {
          recentBorrows,
          recentReturns,
          recentUsers,
          recentReviews
        },
        popularGenres,
        monthlyTrends
      }
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/books:
 *   get:
 *     summary: Get book analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Book analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/books', authenticateToken, authorize('admin', 'librarian'), [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
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

    const period = req.query.period || '30d';
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period];

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Most borrowed books
    const mostBorrowed = await Transaction.aggregate([
      {
        $match: {
          type: 'borrow',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$book',
          borrowCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $project: {
          title: '$book.title',
          author: '$book.author',
          coverImage: '$book.coverImage',
          borrowCount: 1
        }
      },
      { $sort: { borrowCount: -1 } },
      { $limit: 10 }
    ]);

    // Most reviewed books
    const mostReviewed = await Review.aggregate([
      {
        $match: {
          status: 'published',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$book',
          reviewCount: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $project: {
          title: '$book.title',
          author: '$book.author',
          coverImage: '$book.coverImage',
          reviewCount: 1,
          averageRating: { $round: ['$averageRating', 1] }
        }
      },
      { $sort: { reviewCount: -1 } },
      { $limit: 10 }
    ]);

    // Genre distribution
    const genreDistribution = await Book.aggregate([
      { $match: { isActive: true, isDeleted: false } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Availability status
    const availabilityStatus = await Book.aggregate([
      { $match: { isActive: true, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          availableBooks: {
            $sum: { $cond: [{ $gt: ['$availableCopies', 0] }, 1, 0] }
          },
          outOfStockBooks: {
            $sum: { $cond: [{ $eq: ['$availableCopies', 0] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        mostBorrowed,
        mostReviewed,
        genreDistribution,
        availabilityStatus: availabilityStatus[0] || {
          totalBooks: 0,
          availableBooks: 0,
          outOfStockBooks: 0
        }
      }
    });

  } catch (error) {
    console.error('Get book analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book analytics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/users:
 *   get:
 *     summary: Get user analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/users', authenticateToken, authorize('admin', 'librarian'), [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
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

    const period = req.query.period || '30d';
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period];

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // User registration trends
    const registrationTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Most active users
    const mostActiveUsers = await Transaction.aggregate([
      {
        $match: {
          type: 'borrow',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$user',
          borrowCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          email: '$user.email',
          libraryCardNumber: '$user.libraryCardNumber',
          borrowCount: 1
        }
      },
      { $sort: { borrowCount: -1 } },
      { $limit: 10 }
    ]);

    // User role distribution
    const roleDistribution = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Membership type distribution
    const membershipDistribution = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$membershipType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        registrationTrends,
        mostActiveUsers,
        roleDistribution,
        membershipDistribution
      }
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user analytics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/transactions:
 *   get:
 *     summary: Get transaction analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Transaction analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions', authenticateToken, authorize('admin', 'librarian'), [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
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

    const period = req.query.period || '30d';
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period];

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Transaction trends
    const transactionTrends = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          borrows: {
            $sum: { $cond: [{ $eq: ['$type', 'borrow'] }, 1, 0] }
          },
          returns: {
            $sum: { $cond: [{ $eq: ['$type', 'return'] }, 1, 0] }
          },
          renewals: {
            $sum: { $cond: [{ $eq: ['$type', 'renew'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Transaction status distribution
    const statusDistribution = await Transaction.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Fine analytics
    const fineAnalytics = await Transaction.aggregate([
      {
        $match: {
          fineAmount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalFines: { $sum: '$fineAmount' },
          paidFines: {
            $sum: { $cond: [{ $eq: ['$fineStatus', 'paid'] }, '$fineAmount', 0] }
          },
          pendingFines: {
            $sum: { $cond: [{ $eq: ['$fineStatus', 'pending'] }, '$fineAmount', 0] }
          },
          waivedFines: {
            $sum: { $cond: [{ $eq: ['$fineStatus', 'waived'] }, '$fineAmount', 0] }
          }
        }
      }
    ]);

    // Average return time
    const averageReturnTime = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          returnDate: { $exists: true },
          borrowDate: { $exists: true }
        }
      },
      {
        $project: {
          returnTime: {
            $divide: [
              { $subtract: ['$returnDate', '$borrowDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageReturnTime: { $avg: '$returnTime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        transactionTrends,
        statusDistribution,
        fineAnalytics: fineAnalytics[0] || {
          totalFines: 0,
          paidFines: 0,
          pendingFines: 0,
          waivedFines: 0
        },
        averageReturnTime: averageReturnTime[0]?.averageReturnTime || 0
      }
    });

  } catch (error) {
    console.error('Get transaction analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction analytics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/reports:
 *   get:
 *     summary: Generate custom reports
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [overdue, fines, popular_books, inactive_users]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Report generated successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/reports', authenticateToken, authorize('admin', 'librarian'), [
  query('type').isIn(['overdue', 'fines', 'popular_books', 'inactive_users']).withMessage('Invalid report type'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format')
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

    const { type, format = 'json' } = req.query;
    let reportData = {};

    switch (type) {
      case 'overdue':
        const overdueTransactions = await Transaction.findOverdue();
        reportData = {
          title: 'Overdue Books Report',
          generatedAt: new Date(),
          data: overdueTransactions
        };
        break;

      case 'fines':
        const fineTransactions = await Transaction.find({
          fineAmount: { $gt: 0 }
        }).populate('user book');
        reportData = {
          title: 'Fines Report',
          generatedAt: new Date(),
          data: fineTransactions
        };
        break;

      case 'popular_books':
        const popularBooks = await Book.find({ isActive: true, isDeleted: false })
          .sort({ popularityScore: -1, totalBorrows: -1 })
          .limit(50);
        reportData = {
          title: 'Popular Books Report',
          generatedAt: new Date(),
          data: popularBooks
        };
        break;

      case 'inactive_users':
        const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
        const inactiveUsers = await User.find({
          isActive: true,
          lastLogin: { $lt: sixMonthsAgo }
        }).select('-password');
        reportData = {
          title: 'Inactive Users Report',
          generatedAt: new Date(),
          data: inactiveUsers
        };
        break;
    }

    if (format === 'csv') {
      // Convert to CSV format (simplified implementation)
      const csv = convertToCSV(reportData.data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router;
