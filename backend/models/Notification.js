const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Basic Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  
  // Notification Content
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  
  // Notification Type and Category
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'book_due_reminder',
      'book_overdue',
      'book_available',
      'reservation_ready',
      'reservation_expired',
      'fine_notice',
      'new_book_added',
      'book_recommendation',
      'reading_goal_achieved',
      'friend_activity',
      'system_announcement',
      'maintenance_notice',
      'welcome',
      'account_verification',
      'password_reset',
      'security_alert'
    ]
  },
  category: {
    type: String,
    enum: ['urgent', 'important', 'info', 'reminder', 'promotion', 'social'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Related Data
  relatedBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Action and Navigation
  actionUrl: {
    type: String,
    maxlength: [500, 'Action URL cannot exceed 500 characters']
  },
  actionText: {
    type: String,
    maxlength: [50, 'Action text cannot exceed 50 characters']
  },
  actionData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Delivery and Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'clicked', 'failed', 'cancelled'],
    default: 'pending'
  },
  deliveryMethod: {
    type: String,
    enum: ['push', 'email', 'sms', 'in_app'],
    required: [true, 'Delivery method is required']
  },
  
  // Delivery Details
  sentAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  readAt: {
    type: Date,
    default: null
  },
  clickedAt: {
    type: Date,
    default: null
  },
  
  // Scheduling
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
  },
  
  // Retry Logic
  retryCount: {
    type: Number,
    default: 0,
    max: [5, 'Maximum retry count exceeded']
  },
  lastRetryAt: {
    type: Date,
    default: null
  },
  nextRetryAt: {
    type: Date,
    default: null
  },
  
  // Template and Localization
  templateId: {
    type: String,
    default: null
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'ru']
  },
  variables: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Grouping and Batching
  groupId: {
    type: String,
    default: null
  },
  batchId: {
    type: String,
    default: null
  },
  
  // User Interaction
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  
  // Analytics
  openCount: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  },
  engagementScore: {
    type: Number,
    default: 0
  },
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for can retry
notificationSchema.virtual('canRetry').get(function() {
  return this.status === 'failed' && 
         this.retryCount < 5 && 
         (!this.nextRetryAt || new Date() >= this.nextRetryAt);
});

// Pre-save middleware to update read status
notificationSchema.pre('save', function(next) {
  if (this.readAt && !this.isRead) {
    this.isRead = true;
  }
  next();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as clicked
notificationSchema.methods.markAsClicked = function() {
  this.clickedAt = new Date();
  this.clickCount += 1;
  this.updateEngagementScore();
  return this.save();
};

// Method to update engagement score
notificationSchema.methods.updateEngagementScore = function() {
  let score = 0;
  
  if (this.isRead) score += 1;
  if (this.clickedAt) score += 2;
  if (this.openCount > 0) score += this.openCount * 0.5;
  if (this.clickCount > 0) score += this.clickCount * 1;
  
  this.engagementScore = score;
  return score;
};

// Method to schedule retry
notificationSchema.methods.scheduleRetry = function() {
  if (this.retryCount >= 5) {
    this.status = 'failed';
    return this.save();
  }
  
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  
  // Exponential backoff: 1min, 5min, 15min, 1hr, 4hr
  const retryDelays = [1, 5, 15, 60, 240]; // in minutes
  const delay = retryDelays[Math.min(this.retryCount - 1, retryDelays.length - 1)];
  this.nextRetryAt = new Date(Date.now() + delay * 60 * 1000);
  
  return this.save();
};

// Static method to send notification
notificationSchema.statics.send = async function(notificationData) {
  const notification = new this(notificationData);
  await notification.save();
  
  // Here you would integrate with your notification service
  // (email service, push notification service, SMS service, etc.)
  
  return notification;
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    limit = 20,
    offset = 0,
    type = null,
    status = null,
    isRead = null,
    isArchived = false
  } = options;
  
  const query = { 
    user: userId,
    isArchived: isArchived,
    isActive: true
  };
  
  if (type) query.type = type;
  if (status) query.status = status;
  if (isRead !== null) query.isRead = isRead;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('relatedBook relatedTransaction relatedUser', 'title author firstName lastName');
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { 
      expiresAt: { $lt: new Date() },
      isActive: true 
    },
    { 
      isActive: false 
    }
  );
};

// Indexes for better query performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1, isArchived: 1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ expiresAt: 1, isActive: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
