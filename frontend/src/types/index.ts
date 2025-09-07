// User Types
export interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'admin' | 'librarian' | 'member' | 'student'
  isActive: boolean
  libraryCardNumber: string
  membershipType: 'basic' | 'premium' | 'student' | 'faculty'
  membershipExpiry: string
  readingPreferences: {
    genres: string[]
    authors: string[]
    languages: string[]
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  }
  totalBooksBorrowed: number
  totalBooksRead: number
  currentBorrowedBooks: string[]
  readingHistory: ReadingHistory[]
  notificationPreferences: {
    email: boolean
    sms: boolean
    push: boolean
    dueDateReminders: boolean
    newBookAlerts: boolean
    recommendationAlerts: boolean
  }
  profilePicture?: string
  bio?: string
  lastLogin?: string
  loginCount: number
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface ReadingHistory {
  book: string
  borrowedDate: string
  returnedDate?: string
  rating?: number
  review?: string
}

// Book Types
export interface Book {
  _id: string
  title: string
  author: string
  isbn: string
  description?: string
  publisher: string
  publicationYear: number
  edition?: string
  language: string
  genre: string
  subGenre?: string[]
  tags?: string[]
  pages?: number
  format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook' | 'magazine' | 'journal'
  dimensions?: {
    height: number
    width: number
    thickness: number
  }
  weight?: number
  totalCopies: number
  availableCopies: number
  isAvailable: boolean
  location?: {
    shelf?: string
    section?: string
    floor?: number
    room?: string
  }
  coverImage?: string
  digitalFile?: string
  audioFile?: string
  tableOfContents?: string[]
  summary?: string
  keyTopics?: string[]
  targetAudience: 'children' | 'young-adult' | 'adult' | 'academic' | 'professional' | 'general'
  readingLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  averageRating: number
  totalRatings: number
  totalReviews: number
  totalBorrows: number
  totalViews: number
  popularityScore: number
  trendingScore: number
  similarBooks?: string[]
  recommendedFor?: string[]
  acquisitionDate: string
  acquisitionCost?: number
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  lastMaintenance?: string
  maintenanceNotes?: string
  digitalRights: {
    hasDigitalCopy: boolean
    canDownload: boolean
    canPrint: boolean
    maxDownloads: number
    expiryDate?: string
  }
  isActive: boolean
  isDeleted: boolean
  lastAccessed?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// Transaction Types
export interface Transaction {
  _id: string
  user: string | User
  book: string | Book
  type: 'borrow' | 'return' | 'renew' | 'reserve' | 'cancel_reservation' | 'late_return' | 'lost_book' | 'damaged_book'
  status: 'pending' | 'active' | 'completed' | 'overdue' | 'cancelled' | 'lost' | 'damaged'
  borrowDate: string
  dueDate?: string
  returnDate?: string
  actualReturnDate?: string
  renewalCount: number
  maxRenewals: number
  lastRenewalDate?: string
  reservationDate?: string
  reservationExpiry?: string
  reservationPriority: number
  fineAmount: number
  fineReason?: 'late_return' | 'damaged_book' | 'lost_book' | 'overdue_renewal' | 'reservation_no_show'
  fineStatus: 'none' | 'pending' | 'paid' | 'waived' | 'disputed'
  finePaidDate?: string
  bookConditionAtBorrow: 'new' | 'excellent' | 'good' | 'fair' | 'poor'
  bookConditionAtReturn?: 'new' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  conditionNotes?: string
  isDigital: boolean
  digitalAccessExpiry?: string
  downloadCount: number
  maxDownloads: number
  notificationsSent: NotificationSent[]
  processedBy?: string
  notes?: string
  adminNotes?: string
  isActive: boolean
  autoRenewal: boolean
  reminderSent: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationSent {
  type: 'due_reminder' | 'overdue_notice' | 'reservation_ready' | 'return_reminder' | 'fine_notice'
  sentDate: string
  method: 'email' | 'sms' | 'push'
}

// Review Types
export interface Review {
  _id: string
  user: string | User
  book: string | Book
  transaction: string | Transaction
  rating: number
  title: string
  content: string
  detailedRatings?: {
    plot?: number
    writing?: number
    characters?: number
    pacing?: number
    originality?: number
  }
  categories?: ('spoiler' | 'spoiler-free' | 'detailed' | 'brief' | 'critical' | 'praise' | 'comparison' | 'recommendation')[]
  helpfulVotes: number
  notHelpfulVotes: number
  voters: ReviewVoter[]
  status: 'draft' | 'published' | 'hidden' | 'reported' | 'removed'
  isVerified: boolean
  reportedBy: ReviewReport[]
  moderatedBy?: string
  moderationNotes?: string
  likes: string[]
  comments: ReviewComment[]
  readingTime?: number
  difficulty?: 'very_easy' | 'easy' | 'moderate' | 'challenging' | 'very_challenging'
  wouldRecommend: boolean
  targetAudience?: 'children' | 'young_adult' | 'adult' | 'academic' | 'professional' | 'general'
  tags?: string[]
  topics?: string[]
  quotes?: ReviewQuote[]
  isEdited: boolean
  editedAt?: string
  editHistory: EditHistory[]
  createdAt: string
  updatedAt: string
}

export interface ReviewVoter {
  user: string
  helpful: boolean
  votedAt: string
}

export interface ReviewReport {
  user: string
  reason: 'inappropriate' | 'spam' | 'offensive' | 'irrelevant' | 'fake' | 'other'
  reportedAt: string
}

export interface ReviewComment {
  user: string
  content: string
  createdAt: string
  isEdited: boolean
  editedAt?: string
}

export interface ReviewQuote {
  text: string
  page: number
}

export interface EditHistory {
  content: string
  editedAt: string
}

// Notification Types
export interface Notification {
  _id: string
  user: string | User
  title: string
  message: string
  type: 'book_due_reminder' | 'book_overdue' | 'book_available' | 'reservation_ready' | 'reservation_expired' | 'fine_notice' | 'new_book_added' | 'book_recommendation' | 'reading_goal_achieved' | 'friend_activity' | 'system_announcement' | 'maintenance_notice' | 'welcome' | 'account_verification' | 'password_reset' | 'security_alert'
  category: 'urgent' | 'important' | 'info' | 'reminder' | 'promotion' | 'social'
  priority: 'low' | 'medium' | 'high' | 'critical'
  relatedBook?: string | Book
  relatedTransaction?: string | Transaction
  relatedUser?: string | User
  actionUrl?: string
  actionText?: string
  actionData?: any
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'clicked' | 'failed' | 'cancelled'
  deliveryMethod: 'push' | 'email' | 'sms' | 'in_app'
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  clickedAt?: string
  scheduledFor: string
  expiresAt: string
  retryCount: number
  lastRetryAt?: string
  nextRetryAt?: string
  templateId?: string
  language: string
  variables: any
  groupId?: string
  batchId?: string
  isRead: boolean
  isArchived: boolean
  isPinned: boolean
  openCount: number
  clickCount: number
  engagementScore: number
  isActive: boolean
  createdBy?: string
  metadata: any
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  errors?: any[]
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
  membershipType: 'basic' | 'premium' | 'student' | 'faculty'
}

export interface BookForm {
  title: string
  author: string
  isbn: string
  description?: string
  publisher: string
  publicationYear: number
  edition?: string
  language: string
  genre: string
  subGenre?: string[]
  tags?: string[]
  pages?: number
  format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook' | 'magazine' | 'journal'
  totalCopies: number
  location?: {
    shelf?: string
    section?: string
    floor?: number
    room?: string
  }
  coverImage?: string
  summary?: string
  keyTopics?: string[]
  targetAudience: 'children' | 'young-adult' | 'adult' | 'academic' | 'professional' | 'general'
  readingLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  acquisitionCost?: number
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
}

export interface ReviewForm {
  rating: number
  title: string
  content: string
  detailedRatings?: {
    plot?: number
    writing?: number
    characters?: number
    pacing?: number
    originality?: number
  }
  wouldRecommend: boolean
  readingTime?: number
  difficulty?: 'very_easy' | 'easy' | 'moderate' | 'challenging' | 'very_challenging'
  tags?: string[]
  topics?: string[]
}

// Filter and Search Types
export interface BookFilters {
  search?: string
  genre?: string
  author?: string
  available?: boolean
  sort?: 'title' | 'author' | 'rating' | 'popularity' | 'trending' | 'newest'
  page?: number
  limit?: number
}

export interface UserFilters {
  search?: string
  role?: 'admin' | 'librarian' | 'member' | 'student'
  membershipType?: 'basic' | 'premium' | 'student' | 'faculty'
  isActive?: boolean
  page?: number
  limit?: number
}

export interface TransactionFilters {
  status?: 'pending' | 'active' | 'completed' | 'overdue' | 'cancelled' | 'lost' | 'damaged'
  type?: 'borrow' | 'return' | 'renew' | 'reserve' | 'cancel_reservation' | 'late_return' | 'lost_book' | 'damaged_book'
  user?: string
  book?: string
  page?: number
  limit?: number
}

// Analytics Types
export interface DashboardAnalytics {
  overview: {
    totalBooks: number
    totalUsers: number
    totalTransactions: number
    totalReviews: number
    activeTransactions: number
    overdueTransactions: number
  }
  recentActivity: {
    recentBorrows: number
    recentReturns: number
    recentUsers: number
    recentReviews: number
  }
  popularGenres: Array<{
    _id: string
    count: number
  }>
  monthlyTrends: Array<{
    _id: {
      year: number
      month: number
    }
    borrows: number
    returns: number
  }>
}

export interface BookAnalytics {
  mostBorrowed: Array<{
    _id: string
    title: string
    author: string
    coverImage?: string
    borrowCount: number
  }>
  mostReviewed: Array<{
    _id: string
    title: string
    author: string
    coverImage?: string
    reviewCount: number
    averageRating: number
  }>
  genreDistribution: Array<{
    _id: string
    count: number
  }>
  availabilityStatus: {
    totalBooks: number
    availableBooks: number
    outOfStockBooks: number
  }
}

// Recommendation Types
export interface Recommendation {
  _id: string
  title: string
  author: string
  coverImage?: string
  averageRating: number
  totalRatings: number
  popularityScore: number
  trendingScore: number
  genre: string
  recommendationReason?: string
  similarityScore?: number
}

export interface RecommendationResponse {
  recommendations: Recommendation[]
  algorithms: {
    historyBased: number
    preferenceBased: number
    collaborative: number
    trending: number
  }
}

// Store Types
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface BookState {
  books: Book[]
  currentBook: Book | null
  filters: BookFilters
  pagination: PaginationInfo | null
  isLoading: boolean
  error: string | null
}

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
}

export interface UserState {
  users: User[]
  currentUser: User | null
  filters: UserFilters
  pagination: PaginationInfo | null
  isLoading: boolean
  error: string | null
}

export interface TransactionState {
  transactions: Transaction[]
  currentTransaction: Transaction | null
  filters: TransactionFilters
  pagination: PaginationInfo | null
  isLoading: boolean
  error: string | null
}

export interface ReviewState {
  reviews: Review[]
  currentReview: Review | null
  pagination: PaginationInfo | null
  isLoading: boolean
  error: string | null
}

// Component Props Types
export interface BookCardProps {
  book: Book
  onBorrow?: (bookId: string) => void
  onReserve?: (bookId: string) => void
  onView?: (bookId: string) => void
  showActions?: boolean
}

export interface UserCardProps {
  user: User
  onView?: (userId: string) => void
  onEdit?: (userId: string) => void
  showActions?: boolean
}

export interface TransactionCardProps {
  transaction: Transaction
  onRenew?: (transactionId: string) => void
  onReturn?: (transactionId: string) => void
  showActions?: boolean
}

export interface ReviewCardProps {
  review: Review
  onVote?: (reviewId: string, helpful: boolean) => void
  onLike?: (reviewId: string) => void
  onComment?: (reviewId: string, content: string) => void
  showActions?: boolean
}

// Google Books API Types
export interface GoogleBook {
  googleId: string
  title: string
  author: string
  description?: string
  publisher?: string
  publicationYear?: number
  isbn?: string
  pages?: number
  language?: string
  genre?: string
  coverImage?: string
  previewLink?: string
  infoLink?: string
  averageRating?: number
  ratingsCount?: number
}
