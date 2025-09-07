'use client'

import { useEffect, useState } from 'react'
import { useNotificationsStore } from '@/store/notificationsStore'
import { useAuthStore } from '@/store/authStore'
import {
  Bell,
  Search,
  Filter,
  MarkAsRead,
  Archive,
  Pin,
  Trash2,
  Eye,
  Mail,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  BookOpen
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { 
    notifications, 
    unreadCount,
    pagination, 
    isLoading, 
    error, 
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    pinNotification,
    fetchUnreadCount,
    setFilters,
    clearFilters 
  } = useNotificationsStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [showArchivedOnly, setShowArchivedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  const types = [
    { value: 'book_due_reminder', label: 'Due Reminder', icon: Calendar },
    { value: 'book_overdue', label: 'Overdue Notice', icon: AlertTriangle },
    { value: 'book_available', label: 'Book Available', icon: BookOpen },
    { value: 'reservation_ready', label: 'Reservation Ready', icon: CheckCircle },
    { value: 'fine_notice', label: 'Fine Notice', icon: AlertTriangle },
    { value: 'new_book_added', label: 'New Book', icon: BookOpen },
    { value: 'book_recommendation', label: 'Recommendation', icon: BookOpen },
    { value: 'system_announcement', label: 'Announcement', icon: Info },
    { value: 'welcome', label: 'Welcome', icon: CheckCircle }
  ]

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'priority', label: 'Priority' },
    { value: 'unread', label: 'Unread First' }
  ]

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated && user) {
      fetchNotifications({
        type: selectedType,
        priority: selectedPriority,
        isRead: showUnreadOnly ? false : undefined,
        isArchived: showArchivedOnly,
        page: 1,
        limit: 20
      })
      fetchUnreadCount()
    }
  }, [isAuthenticated, user, selectedType, selectedPriority, showUnreadOnly, showArchivedOnly, sortBy, fetchNotifications, fetchUnreadCount])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
      toast.success('Notification marked as read')
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all notifications as read')
    }
  }

  const handleArchiveNotification = async (notificationId: string) => {
    try {
      await archiveNotification(notificationId)
      toast.success('Notification archived')
    } catch (error) {
      toast.error('Failed to archive notification')
    }
  }

  const handlePinNotification = async (notificationId: string) => {
    try {
      await pinNotification(notificationId)
      toast.success('Notification pinned')
    } catch (error) {
      toast.error('Failed to pin notification')
    }
  }

  const handlePageChange = (page: number) => {
    fetchNotifications({
      type: selectedType,
      priority: selectedPriority,
      isRead: showUnreadOnly ? false : undefined,
      isArchived: showArchivedOnly,
      page,
      limit: 20
    })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedType('')
    setSelectedPriority('')
    setShowUnreadOnly(false)
    setShowArchivedOnly(false)
    setSortBy('newest')
    clearFilters()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getPriorityColor = (priority: string) => {
    const priorityObj = priorities.find(p => p.value === priority)
    return priorityObj?.color || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type: string) => {
    const typeObj = types.find(t => t.value === type)
    const IconComponent = typeObj?.icon || Bell
    return <IconComponent className="h-4 w-4" />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => fetchNotifications()}
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
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <MarkAsRead className="h-4 w-4 mr-2" />
            Mark All as Read
          </button>
        )}
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
                placeholder="Search notifications..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {types.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
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
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Unread only</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showArchivedOnly}
                onChange={(e) => setShowArchivedOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Archived only</span>
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

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`bg-white shadow rounded-lg p-4 border-l-4 ${
                  notification.isRead ? 'border-gray-200' : 'border-primary-500'
                } ${notification.isPinned ? 'ring-2 ring-primary-200' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Notification Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-full ${
                      notification.isRead ? 'bg-gray-100' : 'bg-primary-100'
                    }`}>
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`text-sm font-medium ${
                          notification.isRead ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        {notification.isPinned && (
                          <Pin className="h-3 w-3 text-primary-500" />
                        )}
                      </div>
                      
                      <p className={`text-sm ${
                        notification.isRead ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>

                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(notification.createdAt)}
                        </div>
                        {notification.relatedBook && (
                          <div className="flex items-center">
                            <BookOpen className="h-3 w-3 mr-1" />
                            <span>
                              {typeof notification.relatedBook === 'object' 
                                ? notification.relatedBook.title 
                                : 'Book'
                              }
                            </span>
                          </div>
                        )}
                        {notification.relatedUser && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span>
                              {typeof notification.relatedUser === 'object' 
                                ? `${notification.relatedUser.firstName} ${notification.relatedUser.lastName}`
                                : 'User'
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Mark as Read"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handlePinNotification(notification._id)}
                      className={`p-1 hover:text-primary-600 ${
                        notification.isPinned ? 'text-primary-600' : 'text-gray-400'
                      }`}
                      title="Pin/Unpin"
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleArchiveNotification(notification._id)}
                      className="p-1 text-gray-400 hover:text-orange-600"
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {/* View notification details */}}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
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
                Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalItems)} of {pagination.totalItems} notifications
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
