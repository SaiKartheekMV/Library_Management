'use client'

import { useEffect, useState } from 'react'
import { useTransactionsStore } from '@/store/transactionsStore'
import { useAuthStore } from '@/store/authStore'
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BookOpen,
  User,
  Calendar,
  DollarSign,
  Eye,
  RotateCcw,
  ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function TransactionsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { 
    transactions, 
    pagination, 
    isLoading, 
    error, 
    fetchTransactions,
    renewTransaction,
    returnTransaction,
    updateFine,
    setFilters,
    clearFilters 
  } = useTransactionsStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)

  const statuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'active', label: 'Active', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
    { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-800' },
    { value: 'damaged', label: 'Damaged', color: 'bg-orange-100 text-orange-800' }
  ]

  const types = [
    { value: 'borrow', label: 'Borrow' },
    { value: 'return', label: 'Return' },
    { value: 'renew', label: 'Renew' },
    { value: 'reserve', label: 'Reserve' },
    { value: 'cancel_reservation', label: 'Cancel Reservation' },
    { value: 'late_return', label: 'Late Return' },
    { value: 'lost_book', label: 'Lost Book' },
    { value: 'damaged_book', label: 'Damaged Book' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'user', label: 'User Name' },
    { value: 'book', label: 'Book Title' }
  ]

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated && user) {
      fetchTransactions({
        status: selectedStatus,
        type: selectedType,
        page: 1,
        limit: 12
      })
    }
  }, [isAuthenticated, user, selectedStatus, selectedType, sortBy, showOverdueOnly, fetchTransactions])

  const handleRenewTransaction = async (transactionId: string) => {
    try {
      await renewTransaction(transactionId)
      toast.success('Transaction renewed successfully')
    } catch (error) {
      toast.error('Failed to renew transaction')
    }
  }

  const handleReturnTransaction = async (transactionId: string) => {
    try {
      await returnTransaction(transactionId, {
        condition: 'good',
        notes: 'Returned in good condition'
      })
      toast.success('Book returned successfully')
    } catch (error) {
      toast.error('Failed to return book')
    }
  }

  const handlePageChange = (page: number) => {
    fetchTransactions({
      status: selectedStatus,
      type: selectedType,
      page,
      limit: 12
    })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedStatus('')
    setSelectedType('')
    setShowOverdueOnly(false)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => fetchTransactions()}
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
          <h1 className="text-2xl font-bold text-gray-900">Transactions Management</h1>
          <p className="text-gray-600">Manage book borrowings, returns, and renewals</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchTransactions()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
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
                checked={showOverdueOnly}
                onChange={(e) => setShowOverdueOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Overdue only</span>
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

      {/* Transactions List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <li key={transaction._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {transaction.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="truncate">
                                {typeof transaction.book === 'object' ? transaction.book.title : 'Book'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="truncate">
                                {typeof transaction.user === 'object' 
                                  ? `${transaction.user.firstName} ${transaction.user.lastName}`
                                  : 'User'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Borrowed: {formatDate(transaction.borrowDate)}
                          </div>
                          {transaction.dueDate && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due: {formatDate(transaction.dueDate)}
                              {isOverdue(transaction.dueDate) && transaction.status === 'active' && (
                                <span className="ml-1 text-red-500 font-medium">(Overdue)</span>
                              )}
                            </div>
                          )}
                          {transaction.fineAmount > 0 && (
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Fine: ${transaction.fineAmount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {/* View transaction details */}}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {transaction.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleRenewTransaction(transaction._id)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Renew"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReturnTransaction(transaction._id)}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Return"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * 12) + 1} to {Math.min(pagination.currentPage * 12, pagination.totalItems)} of {pagination.totalItems} transactions
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
