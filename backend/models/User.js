const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  phone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: ['admin', 'librarian', 'member'],
    default: 'member'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Library Card Information
  libraryCardNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  membershipType: {
    type: String,
    enum: ['basic', 'premium', 'student', 'faculty'],
    default: 'basic'
  },
  membershipExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  },
  
  // Reading Preferences (for AI recommendations)
  readingPreferences: {
    genres: [{
      type: String,
      enum: ['fiction', 'non-fiction', 'science', 'history', 'biography', 'mystery', 'romance', 'fantasy', 'sci-fi', 'thriller', 'self-help', 'business', 'technology', 'art', 'philosophy']
    }],
    authors: [String],
    languages: [{
      type: String,
      default: 'english'
    }],
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    }
  },
  
  // Activity Tracking
  totalBooksBorrowed: {
    type: Number,
    default: 0
  },
  totalBooksRead: {
    type: Number,
    default: 0
  },
  currentBorrowedBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }],
  readingHistory: [{
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    },
    borrowedDate: Date,
    returnedDate: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String
  }],
  
  // Notifications and Communication
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    },
    dueDateReminders: {
      type: Boolean,
      default: true
    },
    newBookAlerts: {
      type: Boolean,
      default: true
    },
    recommendationAlerts: {
      type: Boolean,
      default: true
    }
  },
  
  // Social Features
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  readingGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReadingGroup'
  }],
  
  // Profile and Preferences
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  favoriteQuotes: [String],
  
  // System Fields
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for membership status
userSchema.virtual('isMembershipActive').get(function() {
  return this.membershipExpiry > new Date();
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate library card number
userSchema.pre('save', function(next) {
  if (this.isNew && !this.libraryCardNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.libraryCardNumber = `LC${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get reading statistics
userSchema.methods.getReadingStats = function() {
  const totalDays = this.readingHistory.reduce((acc, record) => {
    if (record.borrowedDate && record.returnedDate) {
      const days = Math.ceil((record.returnedDate - record.borrowedDate) / (1000 * 60 * 60 * 24));
      return acc + days;
    }
    return acc;
  }, 0);
  
  return {
    totalBooksBorrowed: this.totalBooksBorrowed,
    totalBooksRead: this.totalBooksRead,
    averageReadingTime: this.readingHistory.length > 0 ? totalDays / this.readingHistory.length : 0,
    favoriteGenres: this.readingPreferences.genres,
    membershipType: this.membershipType,
    isActive: this.isMembershipActive
  };
};

// Index for better query performance
userSchema.index({ libraryCardNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'readingPreferences.genres': 1 });

module.exports = mongoose.model('User', userSchema);
