'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useBooksStore } from '@/store/booksStore'
import { useNotificationsStore } from '@/store/notificationsStore'
import {
  BookOpen,
  Users,
  FileText,
  Star,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { books, fetchBooks } = useBooksStore()
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount } = useNotificationsStore()
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalTransactions: 0,
    totalReviews: 0,
    activeTransactions: 0,
    overdueTransactions: 0
  })

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated && user) {
      fetchBooks({ limit: 5 })
      fetchNotifications({ limit: 5 })
      fetchUnreadCount()
    }
  }, [isAuthenticated, user, fetchBooks, fetchNotifications, fetchUnreadCount])

  const statCards = [
    {
      name: 'Total Books',
      value: stats.totalBooks,
      icon: BookOpen,
      color: 'text-primary-600',
      bgColor: 'bg-gradient-to-br from-primary-100 to-primary-200'
    },
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-200'
    },
    {
      name: 'Active Transactions',
      value: stats.activeTransactions,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-100 to-orange-200'
    },
    {
      name: 'Total Reviews',
      value: stats.totalReviews,
      icon: Star,
      color: 'text-accent-600',
      bgColor: 'bg-gradient-to-br from-accent-100 to-accent-200'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 overflow-hidden shadow-lg rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-primary-100">
            Here's what's happening in your library today.
          </p>
          <div className="mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Account
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {stats.overdueTransactions > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Overdue Books Alert
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  You have {stats.overdueTransactions} overdue books that need attention.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Books */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Books
            </h3>
            <div className="mt-5">
              {books.length > 0 ? (
                <div className="space-y-3">
                  {books.slice(0, 5).map((book) => (
                    <div key={book._id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {book.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          by {book.author}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          book.availableCopies > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {book.availableCopies > 0 ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No books found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="mt-5">
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification._id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          notification.priority === 'high' || notification.priority === 'critical'
                            ? 'bg-red-100'
                            : 'bg-blue-100'
                        }`}>
                          {notification.priority === 'high' || notification.priority === 'critical' ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No notifications.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <BookOpen className="h-4 w-4 mr-2" />
              Add Book
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <Users className="h-4 w-4 mr-2" />
              Add User
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <FileText className="h-4 w-4 mr-2" />
              View Transactions
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
