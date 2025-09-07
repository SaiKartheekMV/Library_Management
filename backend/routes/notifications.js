const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management operations
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
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
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isArchived
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isString().withMessage('Type must be a string'),
  query('isRead').optional().isBoolean().withMessage('IsRead must be a boolean'),
  query('isArchived').optional().isBoolean().withMessage('IsArchived must be a boolean')
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
      limit = 20,
      type,
      isRead,
      isArchived = false
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      type,
      status: null,
      isRead,
      isArchived
    };

    const notifications = await Notification.getUserNotifications(req.user._id, options);
    const total = await Notification.countDocuments({
      user: req.user._id,
      isArchived: isArchived,
      isActive: true,
      ...(type && { type }),
      ...(isRead !== null && { isRead })
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
      isArchived: false,
      isActive: true
    });

    res.json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
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
 *         description: Notification retrieved successfully
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    })
    .populate('relatedBook', 'title author coverImage')
    .populate('relatedTransaction', 'type status dueDate')
    .populate('relatedUser', 'firstName lastName')
    .lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: { notification }
    });

  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/click:
 *   post:
 *     summary: Mark notification as clicked
 *     tags: [Notifications]
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
 *         description: Notification marked as clicked
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/click', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsClicked();

    res.json({
      success: true,
      message: 'Notification marked as clicked'
    });

  } catch (error) {
    console.error('Mark notification as clicked error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as clicked',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/archive:
 *   post:
 *     summary: Archive notification
 *     tags: [Notifications]
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
 *         description: Notification archived
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/archive', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isArchived = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification archived'
    });

  } catch (error) {
    console.error('Archive notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive notification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/pin:
 *   post:
 *     summary: Pin/unpin notification
 *     tags: [Notifications]
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
 *         description: Notification pin status updated
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/pin', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isPinned = !notification.isPinned;
    await notification.save();

    res.json({
      success: true,
      message: `Notification ${notification.isPinned ? 'pinned' : 'unpinned'}`,
      data: { isPinned: notification.isPinned }
    });

  } catch (error) {
    console.error('Pin notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification pin status',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});


/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create notification (Admin/Librarian only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - title
 *               - message
 *               - type
 *               - deliveryMethod
 *             properties:
 *               user:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *               deliveryMethod:
 *                 type: string
 *                 enum: [push, email, sms, in_app]
 *               category:
 *                 type: string
 *                 enum: [urgent, important, info, reminder, promotion, social]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               actionUrl:
 *                 type: string
 *               actionText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, authorize('admin', 'librarian'), [
  body('user').isMongoId().withMessage('Valid user ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('type').isIn([
    'book_due_reminder', 'book_overdue', 'book_available', 'reservation_ready',
    'reservation_expired', 'fine_notice', 'new_book_added', 'book_recommendation',
    'reading_goal_achieved', 'friend_activity', 'system_announcement',
    'maintenance_notice', 'welcome', 'account_verification', 'password_reset', 'security_alert'
  ]).withMessage('Invalid notification type'),
  body('deliveryMethod').isIn(['push', 'email', 'sms', 'in_app']).withMessage('Invalid delivery method'),
  body('category').optional().isIn(['urgent', 'important', 'info', 'reminder', 'promotion', 'social']).withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('actionUrl').optional().isURL().withMessage('Action URL must be a valid URL'),
  body('actionText').optional().isString().isLength({ max: 50 }).withMessage('Action text cannot exceed 50 characters')
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

    const notificationData = {
      ...req.body,
      createdBy: req.user._id
    };

    const notification = await Notification.send(notificationData);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification }
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notifications/bulk:
 *   post:
 *     summary: Send bulk notifications (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - users
 *               - title
 *               - message
 *               - type
 *               - deliveryMethod
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *               deliveryMethod:
 *                 type: string
 *                 enum: [push, email, sms, in_app]
 *     responses:
 *       201:
 *         description: Bulk notifications sent successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/bulk', authenticateToken, authorize('admin'), [
  body('users').isArray({ min: 1 }).withMessage('Users array is required'),
  body('users.*').isMongoId().withMessage('Each user must be a valid ID'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('type').isIn([
    'book_due_reminder', 'book_overdue', 'book_available', 'reservation_ready',
    'reservation_expired', 'fine_notice', 'new_book_added', 'book_recommendation',
    'reading_goal_achieved', 'friend_activity', 'system_announcement',
    'maintenance_notice', 'welcome', 'account_verification', 'password_reset', 'security_alert'
  ]).withMessage('Invalid notification type'),
  body('deliveryMethod').isIn(['push', 'email', 'sms', 'in_app']).withMessage('Invalid delivery method')
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

    const { users, ...notificationData } = req.body;
    const notifications = [];

    for (const userId of users) {
      const notification = await Notification.send({
        ...notificationData,
        user: userId,
        createdBy: req.user._id
      });
      notifications.push(notification);
    }

    res.status(201).json({
      success: true,
      message: `Bulk notifications sent to ${notifications.length} users`,
      data: { notifications }
    });

  } catch (error) {
    console.error('Send bulk notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notifications',
      error: error.message
    });
  }
});

module.exports = router;
