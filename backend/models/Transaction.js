const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
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
  
  // Transaction Details
  type: {
    type: String,
    enum: ['borrow', 'return', 'renew', 'reserve', 'cancel_reservation', 'late_return', 'lost_book', 'damaged_book'],
    required: [true, 'Transaction type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'overdue', 'cancelled', 'lost', 'damaged'],
    default: 'pending'
  },
  
  // Dates and Timing
  borrowDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: function() {
      return ['borrow', 'renew'].includes(this.type);
    }
  },
  returnDate: {
    type: Date,
    default: null
  },
  actualReturnDate: {
    type: Date,
    default: null
  },
  
  // Renewal Information
  renewalCount: {
    type: Number,
    default: 0,
    max: [3, 'Maximum 3 renewals allowed']
  },
  maxRenewals: {
    type: Number,
    default: 3
  },
  lastRenewalDate: {
    type: Date,
    default: null
  },
  
  // Reservation Information
  reservationDate: {
    type: Date,
    default: null
  },
  reservationExpiry: {
    type: Date,
    default: null
  },
  reservationPriority: {
    type: Number,
    default: 0
  },
  
  // Fines and Penalties
  fineAmount: {
    type: Number,
    default: 0,
    min: [0, 'Fine amount cannot be negative']
  },
  fineReason: {
    type: String,
    enum: ['late_return', 'damaged_book', 'lost_book', 'overdue_renewal', 'reservation_no_show'],
    default: null
  },
  fineStatus: {
    type: String,
    enum: ['none', 'pending', 'paid', 'waived', 'disputed'],
    default: 'none'
  },
  finePaidDate: {
    type: Date,
    default: null
  },
  
  // Book Condition
  bookConditionAtBorrow: {
    type: String,
    enum: ['new', 'excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  bookConditionAtReturn: {
    type: String,
    enum: ['new', 'excellent', 'good', 'fair', 'poor', 'damaged'],
    default: null
  },
  conditionNotes: {
    type: String,
    maxlength: [500, 'Condition notes cannot exceed 500 characters']
  },
  
  // Digital Transaction
  isDigital: {
    type: Boolean,
    default: false
  },
  digitalAccessExpiry: {
    type: Date,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  maxDownloads: {
    type: Number,
    default: 0
  },
  
  // Notifications
  notificationsSent: [{
    type: {
      type: String,
      enum: ['due_reminder', 'overdue_notice', 'reservation_ready', 'return_reminder', 'fine_notice']
    },
    sentDate: Date,
    method: {
      type: String,
      enum: ['email', 'sms', 'push']
    }
  }],
  
  // Administrative
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  autoRenewal: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days overdue
transactionSchema.virtual('daysOverdue').get(function() {
  if (this.status !== 'overdue' || !this.dueDate) return 0;
  const now = new Date();
  const diffTime = now - this.dueDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days until due
transactionSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate || this.status === 'completed') return null;
  const now = new Date();
  const diffTime = this.dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for can renew
transactionSchema.virtual('canRenew').get(function() {
  return this.type === 'borrow' && 
         this.status === 'active' && 
         this.renewalCount < this.maxRenewals &&
         this.dueDate > new Date();
});

// Virtual for is overdue
transactionSchema.virtual('isOverdue').get(function() {
  return this.dueDate && 
         new Date() > this.dueDate && 
         this.status === 'active';
});

// Pre-save middleware to calculate due date
transactionSchema.pre('save', function(next) {
  if (this.isNew && this.type === 'borrow' && !this.dueDate) {
    const borrowPeriod = this.isDigital ? 14 : 21; // 14 days for digital, 21 for physical
    this.dueDate = new Date(Date.now() + borrowPeriod * 24 * 60 * 60 * 1000);
  }
  next();
});

// Pre-save middleware to update status
transactionSchema.pre('save', function(next) {
  if (this.isOverdue && this.status === 'active') {
    this.status = 'overdue';
  }
  next();
});

// Method to calculate fine
transactionSchema.methods.calculateFine = function() {
  if (this.fineStatus === 'paid' || this.fineStatus === 'waived') {
    return this.fineAmount;
  }
  
  if (!this.isOverdue) {
    this.fineAmount = 0;
    this.fineStatus = 'none';
    return 0;
  }
  
  const daysOverdue = this.daysOverdue;
  const baseFine = 0.50; // $0.50 per day
  const maxFine = 25.00; // Maximum fine of $25
  
  this.fineAmount = Math.min(daysOverdue * baseFine, maxFine);
  this.fineStatus = this.fineAmount > 0 ? 'pending' : 'none';
  
  return this.fineAmount;
};

// Method to renew transaction
transactionSchema.methods.renew = function(days = 14) {
  if (!this.canRenew) {
    throw new Error('Transaction cannot be renewed');
  }
  
  this.renewalCount += 1;
  this.lastRenewalDate = new Date();
  this.dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  this.type = 'renew';
  
  return this.save();
};

// Method to return book
transactionSchema.methods.returnBook = function(condition = null, notes = '') {
  if (this.status !== 'active' && this.status !== 'overdue') {
    throw new Error('Transaction is not active');
  }
  
  this.status = 'completed';
  this.returnDate = new Date();
  this.actualReturnDate = new Date();
  
  if (condition) {
    this.bookConditionAtReturn = condition;
  }
  
  if (notes) {
    this.conditionNotes = notes;
  }
  
  // Calculate any fines
  this.calculateFine();
  
  return this.save();
};

// Static method to find overdue transactions
transactionSchema.statics.findOverdue = function() {
  return this.find({
    status: 'active',
    dueDate: { $lt: new Date() }
  }).populate('user book');
};

// Static method to find transactions due soon
transactionSchema.statics.findDueSoon = function(days = 3) {
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.find({
    status: 'active',
    dueDate: { $lte: futureDate, $gte: new Date() }
  }).populate('user book');
};

// Indexes for better query performance
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ book: 1, status: 1 });
transactionSchema.index({ dueDate: 1, status: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ fineStatus: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
