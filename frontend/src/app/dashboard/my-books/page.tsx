'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useTransactionsStore } from '@/store/transactionsStore'
import { booksAPI } from '@/lib/api'
import {
  BookOpen,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Star,
  Eye,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function MyBooksPage() {
  const { user } = useAuthStore()
  const { 
    transactions, 
    isLoading, 
    error, 
    fetchUserTransactions,
    returnBook,
    renewBook
  } = useTransactionsStore()
  
  const [activeTab, setActiveTab] = useState<'borrowed' | 'history'>('borrowed')

  useEffect(() => {
    if (user) {
      fetchUserTransactions(user._id, { status: 'active' })
    }
  }, [user, fetchUserTransactions])

  const handleReturnBook = async (transactionId: string) => {
    try {
      await returnBook(transactionId, { condition: 'good' })
      toast.success('Book returned successfully!')
      // Refresh the transactions
      fetchUserTransactions(user?._id, { status: 'active' })
    } catch (error) {
      toast.error('Failed to return book')
    }
  }

  const handleRenewBook = async (transactionId: string) => {
    try {
      await renewBook(transactionId)
      toast.success('Book renewed successfully!')
      // Refresh the transactions
      fetchUserTransactions(user?._id, { status: 'active' })
    } catch (error) {
      toast.error('Failed to renew book')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'returned':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />
      case 'returned':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => fetchUserTransactions(user?._id, { status: 'active' })}
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
            <p className="text-gray-600">Manage your borrowed books and reading history</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('borrowed')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'borrowed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Currently Borrowed
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reading History
          </button>
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'borrowed' && (
            <>
              {/* Overdue Books Alert */}
              {transactions.some(t => isOverdue(t.dueDate)) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Overdue Books
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          You have {transactions.filter(t => isOverdue(t.dueDate)).length} overdue book(s). 
                          Please return them as soon as possible to avoid additional fees.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Currently Borrowed Books */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div key={transaction._id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Book Cover */}
                      <div className="h-48 bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                        {transaction.book?.coverImage ? (
                          <img 
                            src={transaction.book.coverImage} 
                            alt={transaction.book.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-12 w-12 text-primary-400" />
                        )}
                      </div>

                      {/* Book Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 truncate" title={transaction.book?.title}>
                          {transaction.book?.title}
                        </h3>
                        <p className="text-sm text-gray-600 truncate" title={transaction.book?.author}>
                          by {transaction.book?.author}
                        </p>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Borrowed:</span>
                            <span className="font-medium">{formatDate(transaction.borrowedDate)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Due:</span>
                            <span className={`font-medium ${
                              isOverdue(transaction.dueDate) ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {formatDate(transaction.dueDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Status:</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {getStatusIcon(transaction.status)}
                              <span className="ml-1 capitalize">{transaction.status}</span>
                            </span>
                          </div>
                          {!isOverdue(transaction.dueDate) && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Days left:</span>
                              <span className="font-medium text-emerald-600">
                                {getDaysUntilDue(transaction.dueDate)} days
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => handleReturnBook(transaction._id)}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          >
                            Return Book
                          </button>
                          <button
                            onClick={() => handleRenewBook(transaction._id)}
                            className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <RefreshCw className="h-4 w-4 mx-auto" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No borrowed books</h3>
                    <p className="text-gray-500 mb-4">You haven't borrowed any books yet.</p>
                    <Link
                      href="/dashboard/books"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                    >
                      Browse Books
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reading History</h3>
              <p className="text-gray-500">Your reading history will appear here once you return books.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
