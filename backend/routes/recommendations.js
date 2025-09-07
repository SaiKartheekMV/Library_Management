const express = require('express');
const { query, validationResult } = require('express-validator');
const Book = require('../models/Book');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: Book recommendation operations
 */

/**
 * @swagger
 * /api/recommendations/personal:
 *   get:
 *     summary: Get personalized book recommendations
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Personalized recommendations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/personal', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user._id;

    // Get user's reading history
    const userTransactions = await Transaction.find({
      user: userId,
      status: 'completed'
    }).populate('book');

    // Get user's reviews
    const userReviews = await Review.find({
      user: userId,
      status: 'published'
    }).populate('book');

    // Get user's preferences
    const user = await User.findById(userId);
    const userPreferences = user.readingPreferences;

    // Algorithm 1: Based on reading history and ratings
    const historyBasedRecommendations = await getHistoryBasedRecommendations(
      userTransactions,
      userReviews,
      limit
    );

    // Algorithm 2: Based on user preferences
    const preferenceBasedRecommendations = await getPreferenceBasedRecommendations(
      userPreferences,
      limit
    );

    // Algorithm 3: Collaborative filtering (users with similar tastes)
    const collaborativeRecommendations = await getCollaborativeRecommendations(
      userId,
      userReviews,
      limit
    );

    // Algorithm 4: Trending books in user's preferred genres
    const trendingRecommendations = await getTrendingRecommendations(
      userPreferences,
      limit
    );

    // Combine and deduplicate recommendations
    const allRecommendations = [
      ...historyBasedRecommendations,
      ...preferenceBasedRecommendations,
      ...collaborativeRecommendations,
      ...trendingRecommendations
    ];

    const uniqueRecommendations = deduplicateRecommendations(allRecommendations, limit);

    res.json({
      success: true,
      data: {
        recommendations: uniqueRecommendations,
        algorithms: {
          historyBased: historyBasedRecommendations.length,
          preferenceBased: preferenceBasedRecommendations.length,
          collaborative: collaborativeRecommendations.length,
          trending: trendingRecommendations.length
        }
      }
    });

  } catch (error) {
    console.error('Get personal recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get personal recommendations',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/recommendations/similar/{bookId}:
 *   get:
 *     summary: Get books similar to a specific book
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Similar books retrieved successfully
 *       404:
 *         description: Book not found
 */
router.get('/similar/:bookId', optionalAuth, [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
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

    const { bookId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const book = await Book.findById(bookId);
    if (!book || !book.isActive || book.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Get similar books using multiple criteria
    const similarBooks = await Book.find({
      _id: { $ne: bookId },
      isActive: true,
      isDeleted: false,
      availableCopies: { $gt: 0 },
      $or: [
        { genre: book.genre },
        { author: book.author },
        { publisher: book.publisher }
      ]
    })
    .sort({ averageRating: -1, popularityScore: -1 })
    .limit(limit * 2) // Get more to filter better
    .lean();

    // Score and rank similar books
    const scoredBooks = similarBooks.map(similarBook => {
      let score = 0;
      
      // Genre match (highest weight)
      if (similarBook.genre === book.genre) score += 3;
      
      // Author match
      if (similarBook.author === book.author) score += 2;
      
      // Publisher match
      if (similarBook.publisher === book.publisher) score += 1;
      
      // Rating bonus
      score += similarBook.averageRating * 0.5;
      
      // Popularity bonus
      score += similarBook.popularityScore * 0.01;
      
      return { ...similarBook, similarityScore: score };
    });

    // Sort by similarity score and take top results
    const topSimilarBooks = scoredBooks
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        originalBook: {
          _id: book._id,
          title: book.title,
          author: book.author,
          genre: book.genre
        },
        similarBooks: topSimilarBooks
      }
    });

  } catch (error) {
    console.error('Get similar books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get similar books',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/recommendations/trending:
 *   get:
 *     summary: Get trending book recommendations
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trending recommendations retrieved successfully
 */
router.get('/trending', optionalAuth, [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('genre').optional().isString().withMessage('Genre must be a string')
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

    const limit = parseInt(req.query.limit) || 10;
    const genre = req.query.genre;

    const query = {
      isActive: true,
      isDeleted: false,
      availableCopies: { $gt: 0 }
    };

    if (genre) {
      query.genre = genre;
    }

    // Get trending books based on recent activity and ratings
    const trendingBooks = await Book.find(query)
      .sort({ trendingScore: -1, popularityScore: -1, averageRating: -1 })
      .limit(limit)
      .populate('createdBy', 'firstName lastName')
      .lean();

    res.json({
      success: true,
      data: { recommendations: trendingBooks }
    });

  } catch (error) {
    console.error('Get trending recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending recommendations',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/recommendations/popular:
 *   get:
 *     summary: Get popular book recommendations
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Popular recommendations retrieved successfully
 */
router.get('/popular', optionalAuth, [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('genre').optional().isString().withMessage('Genre must be a string')
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

    const limit = parseInt(req.query.limit) || 10;
    const genre = req.query.genre;

    const query = {
      isActive: true,
      isDeleted: false,
      availableCopies: { $gt: 0 }
    };

    if (genre) {
      query.genre = genre;
    }

    // Get popular books based on borrows, views, and ratings
    const popularBooks = await Book.find(query)
      .sort({ popularityScore: -1, totalBorrows: -1, averageRating: -1 })
      .limit(limit)
      .populate('createdBy', 'firstName lastName')
      .lean();

    res.json({
      success: true,
      data: { recommendations: popularBooks }
    });

  } catch (error) {
    console.error('Get popular recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular recommendations',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/recommendations/new-releases:
 *   get:
 *     summary: Get new book releases
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: New releases retrieved successfully
 */
router.get('/new-releases', optionalAuth, [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
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

    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get recently added books
    const newReleases = await Book.find({
      isActive: true,
      isDeleted: false,
      availableCopies: { $gt: 0 },
      createdAt: { $gte: cutoffDate }
    })
    .sort({ createdAt: -1, averageRating: -1 })
    .limit(limit)
    .populate('createdBy', 'firstName lastName')
    .lean();

    res.json({
      success: true,
      data: { recommendations: newReleases }
    });

  } catch (error) {
    console.error('Get new releases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get new releases',
      error: error.message
    });
  }
});

// Helper functions for recommendation algorithms

async function getHistoryBasedRecommendations(userTransactions, userReviews, limit) {
  if (userTransactions.length === 0) return [];

  // Get genres and authors from user's reading history
  const genres = [...new Set(userTransactions.map(t => t.book?.genre).filter(Boolean))];
  const authors = [...new Set(userTransactions.map(t => t.book?.author).filter(Boolean))];

  // Get highly rated books from user's reviews
  const highlyRatedBooks = userReviews
    .filter(review => review.rating >= 4)
    .map(review => review.book);

  const recommendations = await Book.find({
    _id: { $nin: userTransactions.map(t => t.book._id) },
    isActive: true,
    isDeleted: false,
    availableCopies: { $gt: 0 },
    $or: [
      { genre: { $in: genres } },
      { author: { $in: authors } }
    ]
  })
  .sort({ averageRating: -1, popularityScore: -1 })
  .limit(limit)
  .lean();

  return recommendations.map(book => ({
    ...book,
    recommendationReason: 'Based on your reading history'
  }));
}

async function getPreferenceBasedRecommendations(userPreferences, limit) {
  if (!userPreferences || !userPreferences.genres || userPreferences.genres.length === 0) {
    return [];
  }

  const recommendations = await Book.find({
    isActive: true,
    isDeleted: false,
    availableCopies: { $gt: 0 },
    genre: { $in: userPreferences.genres }
  })
  .sort({ averageRating: -1, popularityScore: -1 })
  .limit(limit)
  .lean();

  return recommendations.map(book => ({
    ...book,
    recommendationReason: 'Based on your preferences'
  }));
}

async function getCollaborativeRecommendations(userId, userReviews, limit) {
  if (userReviews.length === 0) return [];

  // Find users with similar reading tastes
  const userBookIds = userReviews.map(review => review.book._id);
  
  const similarUsers = await Review.aggregate([
    {
      $match: {
        user: { $ne: userId },
        book: { $in: userBookIds },
        rating: { $gte: 4 }
      }
    },
    {
      $group: {
        _id: '$user',
        commonBooks: { $sum: 1 }
      }
    },
    { $sort: { commonBooks: -1 } },
    { $limit: 10 }
  ]);

  if (similarUsers.length === 0) return [];

  const similarUserIds = similarUsers.map(user => user._id);

  // Get books liked by similar users that current user hasn't read
  const recommendations = await Review.aggregate([
    {
      $match: {
        user: { $in: similarUserIds },
        rating: { $gte: 4 },
        book: { $nin: userBookIds }
      }
    },
    {
      $group: {
        _id: '$book',
        recommendationScore: { $sum: 1 }
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
      $match: {
        'book.isActive': true,
        'book.isDeleted': false,
        'book.availableCopies': { $gt: 0 }
      }
    },
    { $sort: { recommendationScore: -1, 'book.averageRating': -1 } },
    { $limit: limit }
  ]);

  return recommendations.map(rec => ({
    ...rec.book,
    recommendationReason: 'Recommended by users with similar tastes'
  }));
}

async function getTrendingRecommendations(userPreferences, limit) {
  const genres = userPreferences?.genres || ['fiction', 'non-fiction'];
  
  const recommendations = await Book.find({
    isActive: true,
    isDeleted: false,
    availableCopies: { $gt: 0 },
    genre: { $in: genres }
  })
  .sort({ trendingScore: -1, popularityScore: -1 })
  .limit(limit)
  .lean();

  return recommendations.map(book => ({
    ...book,
    recommendationReason: 'Trending in your favorite genres'
  }));
}

function deduplicateRecommendations(recommendations, limit) {
  const seen = new Set();
  const unique = [];

  for (const rec of recommendations) {
    if (!seen.has(rec._id.toString())) {
      seen.add(rec._id.toString());
      unique.push(rec);
      if (unique.length >= limit) break;
    }
  }

  return unique;
}

module.exports = router;
