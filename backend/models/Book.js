const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    match: [/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9X]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Please enter a valid ISBN']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Publication Details
  publisher: {
    type: String,
    required: [true, 'Publisher is required'],
    trim: true
  },
  publicationYear: {
    type: Number,
    required: [true, 'Publication year is required'],
    min: [1000, 'Publication year must be valid'],
    max: [new Date().getFullYear() + 1, 'Publication year cannot be in the future']
  },
  edition: {
    type: String,
    default: '1st Edition'
  },
  language: {
    type: String,
    default: 'English',
    enum: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian', 'Other']
  },
  
  // Categorization
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    enum: ['fiction', 'non-fiction', 'science', 'history', 'biography', 'mystery', 'romance', 'fantasy', 'sci-fi', 'thriller', 'self-help', 'business', 'technology', 'art', 'philosophy', 'poetry', 'drama', 'comedy', 'education', 'reference', 'children', 'young-adult']
  },
  subGenre: [String],
  tags: [String],
  
  // Physical Properties
  pages: {
    type: Number,
    min: [1, 'Book must have at least 1 page']
  },
  format: {
    type: String,
    enum: ['hardcover', 'paperback', 'ebook', 'audiobook', 'magazine', 'journal'],
    default: 'paperback'
  },
  dimensions: {
    height: Number,
    width: Number,
    thickness: Number
  },
  weight: Number, // in grams
  
  // Availability and Status
  totalCopies: {
    type: Number,
    required: [true, 'Total copies is required'],
    min: [1, 'Must have at least 1 copy'],
    default: 1
  },
  availableCopies: {
    type: Number,
    required: [true, 'Available copies is required'],
    min: [0, 'Available copies cannot be negative'],
    default: function() { return this.totalCopies; }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  location: {
    shelf: String,
    section: String,
    floor: Number,
    room: String
  },
  
  // Digital Properties
  coverImage: {
    type: String,
    default: null
  },
  digitalFile: {
    type: String,
    default: null
  },
  audioFile: {
    type: String,
    default: null
  },
  
  // Content Information
  tableOfContents: [String],
  summary: String,
  keyTopics: [String],
  targetAudience: {
    type: String,
    enum: ['children', 'young-adult', 'adult', 'academic', 'professional', 'general'],
    default: 'adult'
  },
  readingLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  
  // Reviews and Ratings
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  
  // Popularity and Analytics
  totalBorrows: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  },
  popularityScore: {
    type: Number,
    default: 0
  },
  trendingScore: {
    type: Number,
    default: 0
  },
  
  // Recommendations and Similarity
  similarBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }],
  recommendedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Administrative
  acquisitionDate: {
    type: Date,
    default: Date.now
  },
  acquisitionCost: Number,
  condition: {
    type: String,
    enum: ['new', 'excellent', 'good', 'fair', 'poor', 'damaged'],
    default: 'new'
  },
  lastMaintenance: Date,
  maintenanceNotes: String,
  
  // Digital Rights and Access
  digitalRights: {
    hasDigitalCopy: {
      type: Boolean,
      default: false
    },
    canDownload: {
      type: Boolean,
      default: false
    },
    canPrint: {
      type: Boolean,
      default: false
    },
    maxDownloads: {
      type: Number,
      default: 0
    },
    expiryDate: Date
  },
  
  // Social Features
  readingGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReadingGroup'
  }],
  bookClubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookClub'
  }],
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  lastAccessed: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for availability status
bookSchema.virtual('availabilityStatus').get(function() {
  if (!this.isAvailable || this.isDeleted) return 'unavailable';
  if (this.availableCopies === 0) return 'out_of_stock';
  if (this.availableCopies < this.totalCopies * 0.2) return 'low_stock';
  return 'available';
});

// Virtual for full location
bookSchema.virtual('fullLocation').get(function() {
  const parts = [];
  if (this.location.room) parts.push(this.location.room);
  if (this.location.floor) parts.push(`Floor ${this.location.floor}`);
  if (this.location.section) parts.push(this.location.section);
  if (this.location.shelf) parts.push(`Shelf ${this.location.shelf}`);
  return parts.join(', ') || 'Not specified';
});

// Pre-save middleware to update availability
bookSchema.pre('save', function(next) {
  this.isAvailable = this.availableCopies > 0 && !this.isDeleted;
  next();
});

// Method to calculate popularity score
bookSchema.methods.calculatePopularityScore = function() {
  const borrowWeight = this.totalBorrows * 2;
  const viewWeight = this.totalViews * 0.1;
  const ratingWeight = this.averageRating * 10;
  const recentWeight = this.totalBorrows > 0 ? 5 : 0;
  
  this.popularityScore = borrowWeight + viewWeight + ratingWeight + recentWeight;
  return this.popularityScore;
};

// Method to update trending score
bookSchema.methods.updateTrendingScore = function() {
  const now = new Date();
  const daysSinceLastBorrow = this.lastAccessed ? 
    (now - this.lastAccessed) / (1000 * 60 * 60 * 24) : 365;
  
  const recentBorrows = this.totalBorrows * (1 / (1 + daysSinceLastBorrow / 30));
  this.trendingScore = recentBorrows + (this.averageRating * 2);
  return this.trendingScore;
};

// Method to check if book can be borrowed
bookSchema.methods.canBeBorrowed = function() {
  return this.isAvailable && 
         this.availableCopies > 0 && 
         !this.isDeleted && 
         this.condition !== 'damaged';
};

// Static method to find similar books
bookSchema.statics.findSimilarBooks = function(bookId, limit = 5) {
  return this.findById(bookId)
    .then(book => {
      if (!book) return [];
      
      return this.find({
        _id: { $ne: bookId },
        genre: book.genre,
        isActive: true,
        isAvailable: true
      })
      .sort({ averageRating: -1, popularityScore: -1 })
      .limit(limit);
    });
};

// Indexes for better query performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ genre: 1 });
bookSchema.index({ averageRating: -1 });
bookSchema.index({ popularityScore: -1 });
bookSchema.index({ trendingScore: -1 });
bookSchema.index({ isAvailable: 1, availableCopies: 1 });

module.exports = mongoose.model('Book', bookSchema);
