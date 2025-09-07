const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const { authenticateToken, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review management operations
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews with filtering
 *     tags: [Reviews]
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
 *         name: book
 *         schema:
 *           type: string
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, helpful, rating]
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('book').optional().isMongoId().withMessage('Invalid book ID'),
  query('user').optional().isMongoId().withMessage('Invalid user ID'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  query('sort').optional().isIn(['newest', 'oldest', 'helpful', 'rating']).withMessage('Invalid sort option')
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

    const { page = 1, limit = 10, book, user, rating, sort = 'newest' } = req.query;

    // Build query
    const query = { status: 'published' };
    if (book) query.book = book;
    if (user) query.user = user;
    if (rating) query.rating = rating;

    // Build sort
    let sortObj = {};
    switch (sort) {
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'helpful':
        sortObj = { helpfulVotes: -1, createdAt: -1 };
        break;
      case 'rating':
        sortObj = { rating: -1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;
    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName')
      .populate('book', 'title author coverImage')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reviews',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *       404:
 *         description: Review not found
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'firstName lastName')
      .populate('book', 'title author coverImage')
      .populate('comments.user', 'firstName lastName')
      .lean();

    if (!review || review.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: { review }
    });

  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve review',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - book
 *               - transaction
 *               - rating
 *               - title
 *               - content
 *             properties:
 *               book:
 *                 type: string
 *               transaction:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               detailedRatings:
 *                 type: object
 *               wouldRecommend:
 *                 type: boolean
 *               readingTime:
 *                 type: integer
 *               difficulty:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, [
  body('book').isMongoId().withMessage('Valid book ID is required'),
  body('transaction').isMongoId().withMessage('Valid transaction ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').trim().notEmpty().withMessage('Review title is required'),
  body('content').trim().notEmpty().withMessage('Review content is required'),
  body('detailedRatings.plot').optional().isInt({ min: 1, max: 5 }).withMessage('Plot rating must be between 1 and 5'),
  body('detailedRatings.writing').optional().isInt({ min: 1, max: 5 }).withMessage('Writing rating must be between 1 and 5'),
  body('detailedRatings.characters').optional().isInt({ min: 1, max: 5 }).withMessage('Characters rating must be between 1 and 5'),
  body('detailedRatings.pacing').optional().isInt({ min: 1, max: 5 }).withMessage('Pacing rating must be between 1 and 5'),
  body('detailedRatings.originality').optional().isInt({ min: 1, max: 5 }).withMessage('Originality rating must be between 1 and 5'),
  body('wouldRecommend').optional().isBoolean().withMessage('Would recommend must be a boolean'),
  body('readingTime').optional().isInt({ min: 1 }).withMessage('Reading time must be a positive integer'),
  body('difficulty').optional().isIn(['very_easy', 'easy', 'moderate', 'challenging', 'very_challenging']).withMessage('Invalid difficulty level')
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

    const { book, transaction, rating, title, content, ...otherData } = req.body;

    // Verify transaction belongs to user and is completed
    const transactionRecord = await Transaction.findOne({
      _id: transaction,
      user: req.user._id,
      status: 'completed'
    });

    if (!transactionRecord) {
      return res.status(400).json({
        success: false,
        message: 'Transaction not found or not completed'
      });
    }

    // Check if user already reviewed this book
    const existingReview = await Review.findOne({
      user: req.user._id,
      book: book,
      status: { $ne: 'removed' }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this book'
      });
    }

    const reviewData = {
      user: req.user._id,
      book,
      transaction,
      rating,
      title,
      content,
      ...otherData,
      isVerified: true // Verified because it's linked to a completed transaction
    };

    const review = new Review(reviewData);
    await review.save();

    // Update book ratings
    await Review.updateBookRatings(book);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update review
 *     tags: [Reviews]
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
 *         description: Review updated successfully
 *       404:
 *         description: Review not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticateToken, [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().notEmpty().withMessage('Review title cannot be empty'),
  body('content').optional().trim().notEmpty().withMessage('Review content cannot be empty'),
  body('detailedRatings.plot').optional().isInt({ min: 1, max: 5 }).withMessage('Plot rating must be between 1 and 5'),
  body('detailedRatings.writing').optional().isInt({ min: 1, max: 5 }).withMessage('Writing rating must be between 1 and 5'),
  body('detailedRatings.characters').optional().isInt({ min: 1, max: 5 }).withMessage('Characters rating must be between 1 and 5'),
  body('detailedRatings.pacing').optional().isInt({ min: 1, max: 5 }).withMessage('Pacing rating must be between 1 and 5'),
  body('detailedRatings.originality').optional().isInt({ min: 1, max: 5 }).withMessage('Originality rating must be between 1 and 5')
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

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user can edit this review
    if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews'
      });
    }

    const allowedUpdates = ['rating', 'title', 'content', 'detailedRatings', 'wouldRecommend', 'readingTime', 'difficulty', 'tags', 'topics'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName').populate('book', 'title author');

    // Update book ratings if rating changed
    if (req.body.rating !== undefined) {
      await Review.updateBookRatings(review.book);
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: updatedReview }
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user can delete this review
    if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    // Soft delete
    review.status = 'removed';
    await review.save();

    // Update book ratings
    await Review.updateBookRatings(review.book);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reviews/{id}/vote:
 *   post:
 *     summary: Vote on review helpfulness
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - helpful
 *             properties:
 *               helpful:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/vote', authenticateToken, [
  body('helpful').isBoolean().withMessage('Helpful must be a boolean')
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

    const review = await Review.findById(req.params.id);
    if (!review || review.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is trying to vote on their own review
    if (review.user.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own review'
      });
    }

    await review.voteHelpfulness(req.user._id, req.body.helpful);

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: { 
        helpfulVotes: review.helpfulVotes,
        notHelpfulVotes: review.notHelpfulVotes
      }
    });

  } catch (error) {
    console.error('Vote on review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reviews/{id}/comment:
 *   post:
 *     summary: Add comment to review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/comment', authenticateToken, [
  body('content').trim().notEmpty().withMessage('Comment content is required')
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

    const review = await Review.findById(req.params.id);
    if (!review || review.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.addComment(req.user._id, req.body.content);

    res.json({
      success: true,
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reviews/{id}/like:
 *   post:
 *     summary: Like a review
 *     tags: [Reviews]
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
 *         description: Review liked successfully
 *       400:
 *         description: Review not found or already liked
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || review.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.like(req.user._id);

    res.json({
      success: true,
      message: 'Review liked successfully',
      data: { likes: review.likes.length }
    });

  } catch (error) {
    console.error('Like review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like review',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reviews/{id}/unlike:
 *   post:
 *     summary: Unlike a review
 *     tags: [Reviews]
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
 *         description: Review unliked successfully
 *       400:
 *         description: Review not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/unlike', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || review.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.unlike(req.user._id);

    res.json({
      success: true,
      message: 'Review unliked successfully',
      data: { likes: review.likes.length }
    });

  } catch (error) {
    console.error('Unlike review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike review',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reviews/{id}/report:
 *   post:
 *     summary: Report a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [inappropriate, spam, offensive, irrelevant, fake, other]
 *     responses:
 *       200:
 *         description: Review reported successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/report', authenticateToken, [
  body('reason').isIn(['inappropriate', 'spam', 'offensive', 'irrelevant', 'fake', 'other']).withMessage('Invalid reason')
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

    const review = await Review.findById(req.params.id);
    if (!review || review.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already reported this review
    const alreadyReported = review.reportedBy.some(
      report => report.user.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    await review.report(req.user._id, req.body.reason);

    res.json({
      success: true,
      message: 'Review reported successfully'
    });

  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report review',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reviews/top:
 *   get:
 *     summary: Get top reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top reviews retrieved successfully
 */
router.get('/top', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topReviews = await Review.getTopReviews(limit);

    res.json({
      success: true,
      data: { reviews: topReviews }
    });

  } catch (error) {
    console.error('Get top reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve top reviews',
      error: error.message
    });
  }
});

module.exports = router;
