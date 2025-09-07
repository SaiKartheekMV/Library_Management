const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Basic Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book is required']
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: [true, 'Transaction is required']
  },
  
  // Review Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Review content is required'],
    trim: true,
    maxlength: [2000, 'Review content cannot exceed 2000 characters']
  },
  
  // Detailed Ratings
  detailedRatings: {
    plot: {
      type: Number,
      min: 1,
      max: 5
    },
    writing: {
      type: Number,
      min: 1,
      max: 5
    },
    characters: {
      type: Number,
      min: 1,
      max: 5
    },
    pacing: {
      type: Number,
      min: 1,
      max: 5
    },
    originality: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Review Categories
  categories: [{
    type: String,
    enum: ['spoiler', 'spoiler-free', 'detailed', 'brief', 'critical', 'praise', 'comparison', 'recommendation']
  }],
  
  // Social Features
  helpfulVotes: {
    type: Number,
    default: 0
  },
  notHelpfulVotes: {
    type: Number,
    default: 0
  },
  voters: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    helpful: Boolean,
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Review Status
  status: {
    type: String,
    enum: ['draft', 'published', 'hidden', 'reported', 'removed'],
    default: 'published'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Moderation
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'offensive', 'irrelevant', 'fake', 'other']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderationNotes: String,
  
  // Engagement
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date
  }],
  
  // Reading Experience
  readingTime: {
    type: Number, // in minutes
    min: [1, 'Reading time must be at least 1 minute']
  },
  difficulty: {
    type: String,
    enum: ['very_easy', 'easy', 'moderate', 'challenging', 'very_challenging']
  },
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  targetAudience: {
    type: String,
    enum: ['children', 'young_adult', 'adult', 'academic', 'professional', 'general']
  },
  
  // Tags and Topics
  tags: [String],
  topics: [String],
  quotes: [{
    text: String,
    page: Number
  }],
  
  // System Fields
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for helpfulness score
reviewSchema.virtual('helpfulnessScore').get(function() {
  const totalVotes = this.helpfulVotes + this.notHelpfulVotes;
  if (totalVotes === 0) return 0;
  return (this.helpfulVotes / totalVotes) * 100;
});

// Virtual for average detailed rating
reviewSchema.virtual('averageDetailedRating').get(function() {
  const ratings = Object.values(this.detailedRatings).filter(rating => rating);
  if (ratings.length === 0) return this.rating;
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Virtual for total engagement
reviewSchema.virtual('totalEngagement').get(function() {
  return this.helpfulVotes + this.likes.length + this.comments.length;
});

// Pre-save middleware to update book ratings
reviewSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'published') {
    await this.constructor.updateBookRatings(this.book);
  }
  next();
});

// Pre-save middleware to save edit history
reviewSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
    
    if (this.editHistory.length === 0) {
      this.editHistory.push({
        content: this.content,
        editedAt: this.editedAt
      });
    }
  }
  next();
});

// Method to vote on review helpfulness
reviewSchema.methods.voteHelpfulness = function(userId, helpful) {
  const existingVote = this.voters.find(vote => vote.user.toString() === userId.toString());
  
  if (existingVote) {
    // Update existing vote
    if (existingVote.helpful !== helpful) {
      existingVote.helpful = helpful;
      existingVote.votedAt = new Date();
      
      if (helpful) {
        this.helpfulVotes += 1;
        this.notHelpfulVotes -= 1;
      } else {
        this.helpfulVotes -= 1;
        this.notHelpfulVotes += 1;
      }
    }
  } else {
    // Add new vote
    this.voters.push({
      user: userId,
      helpful: helpful,
      votedAt: new Date()
    });
    
    if (helpful) {
      this.helpfulVotes += 1;
    } else {
      this.notHelpfulVotes += 1;
    }
  }
  
  return this.save();
};

// Method to add comment
reviewSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content,
    createdAt: new Date()
  });
  
  return this.save();
};

// Method to like review
reviewSchema.methods.like = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to unlike review
reviewSchema.methods.unlike = function(userId) {
  this.likes = this.likes.filter(like => like.toString() !== userId.toString());
  return this.save();
};

// Method to report review
reviewSchema.methods.report = function(userId, reason) {
  this.reportedBy.push({
    user: userId,
    reason: reason,
    reportedAt: new Date()
  });
  
  return this.save();
};

// Static method to update book ratings
reviewSchema.statics.updateBookRatings = async function(bookId) {
  const reviews = await this.find({ 
    book: bookId, 
    status: 'published' 
  });
  
  if (reviews.length === 0) return;
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  await mongoose.model('Book').findByIdAndUpdate(bookId, {
    averageRating: Math.round(averageRating * 10) / 10,
    totalRatings: reviews.length,
    totalReviews: reviews.length
  });
};

// Static method to get top reviews
reviewSchema.statics.getTopReviews = function(limit = 10) {
  return this.find({ status: 'published' })
    .sort({ helpfulnessScore: -1, helpfulVotes: -1, createdAt: -1 })
    .limit(limit)
    .populate('user book', 'firstName lastName title author');
};

// Indexes for better query performance
reviewSchema.index({ book: 1, status: 1 });
reviewSchema.index({ user: 1, status: 1 });
reviewSchema.index({ rating: 1, status: 1 });
reviewSchema.index({ helpfulVotes: -1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
