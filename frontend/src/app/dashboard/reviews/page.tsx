'use client'

import { useEffect, useState } from 'react'
import { useReviewsStore } from '@/store/reviewsStore'
import { useAuthStore } from '@/store/authStore'
import {
  Star,
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Heart,
  Flag,
  Eye,
  Edit,
  Trash2,
  BookOpen,
  User,
  Calendar,
  Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReviewsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { 
    reviews, 
    pagination, 
    isLoading, 
    error, 
    fetchReviews,
    deleteReview,
    voteReview,
    likeReview,
    reportReview,
    setFilters,
    clearFilters 
  } = useReviewsStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRating, setSelectedRating] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showReportedOnly, setShowReportedOnly] = useState(false)

  const ratings = [
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' }
  ]

  const statuses = [
    { value: 'published', label: 'Published', color: 'bg-green-100 text-green-800' },
    { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'hidden', label: 'Hidden', color: 'bg-gray-100 text-gray-800' },
    { value: 'reported', label: 'Reported', color: 'bg-red-100 text-red-800' },
    { value: 'removed', label: 'Removed', color: 'bg-red-100 text-red-800' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'helpful', label: 'Most Helpful' },
    { value: 'likes', label: 'Most Liked' }
  ]

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated && user) {
      fetchReviews({
        search: searchTerm,
        rating: selectedRating ? parseInt(selectedRating) : undefined,
        status: selectedStatus,
        page: 1,
        limit: 12
      })
    }
  }, [isAuthenticated, user, searchTerm, selectedRating, selectedStatus, sortBy, showReportedOnly, fetchReviews])

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview(reviewId)
        toast.success('Review deleted successfully')
      } catch (error) {
        toast.error('Failed to delete review')
      }
    }
  }

  const handleVoteReview = async (reviewId: string, helpful: boolean) => {
    try {
      await voteReview(reviewId, { helpful })
      toast.success(`Review marked as ${helpful ? 'helpful' : 'not helpful'}`)
    } catch (error) {
      toast.error('Failed to vote on review')
    }
  }

  const handleLikeReview = async (reviewId: string) => {
    try {
      await likeReview(reviewId)
      toast.success('Review liked')
    } catch (error) {
      toast.error('Failed to like review')
    }
  }

  const handleReportReview = async (reviewId: string) => {
    const reason = prompt('Please provide a reason for reporting this review:')
    if (reason) {
      try {
        await reportReview(reviewId, { reason })
        toast.success('Review reported successfully')
      } catch (error) {
        toast.error('Failed to report review')
      }
    }
  }

  const handlePageChange = (page: number) => {
    fetchReviews({
      search: searchTerm,
      rating: selectedRating ? parseInt(selectedRating) : undefined,
      status: selectedStatus,
      page,
      limit: 12
    })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedRating('')
    setSelectedStatus('')
    setShowReportedOnly(false)
    setSortBy('newest')
    clearFilters()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    const statusObj = statuses.find(s => s.value === status)
    return statusObj?.color || 'bg-gray-100 text-gray-800'
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => fetchReviews()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
          <p className="text-gray-600">Manage book reviews and ratings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reviews by content or book title..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Ratings</option>
              {ratings.map(rating => (
                <option key={rating.value} value={rating.value}>{rating.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showReportedOnly}
                onChange={(e) => setShowReportedOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Reported reviews only</span>
            </label>
          </div>
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Review Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center">
                        {renderStars(review.rating)}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                        {review.status}
                      </span>
                      {review.isVerified && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      )}
                    </div>

                    {/* Review Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {review.title}
                    </h3>

                    {/* Review Content */}
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {review.content}
                    </p>

                    {/* Review Meta */}
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        <span>
                          {typeof review.book === 'object' ? review.book.title : 'Book'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>
                          {typeof review.user === 'object' 
                            ? `${review.user.firstName} ${review.user.lastName}`
                            : 'User'
                          }
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>

                    {/* Review Stats */}
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{review.helpfulVotes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ThumbsDown className="h-4 w-4" />
                        <span>{review.notHelpfulVotes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>{review.likes.length}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{review.comments.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {/* View review details */}}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleVoteReview(review._id, true)}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Mark as Helpful"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleLikeReview(review._id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Like Review"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                    {(user?.role === 'admin' || user?.role === 'librarian') && (
                      <>
                        <button
                          onClick={() => {/* Edit review */}}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Edit Review"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete Review"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleReportReview(review._id)}
                      className="p-1 text-gray-400 hover:text-orange-600"
                      title="Report Review"
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * 12) + 1} to {Math.min(pagination.currentPage * 12, pagination.totalItems)} of {pagination.totalItems} reviews
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
