'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  FileText,
  Star,
  Calendar,
  DollarSign,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import toast from 'react-hot-toast'

interface DashboardAnalytics {
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

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ]

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // This would be replaced with actual API call
      // const response = await analyticsAPI.getDashboardAnalytics({ period: selectedPeriod })
      // setAnalytics(response.data.data)
      
      // Mock data for demonstration
      const mockAnalytics: DashboardAnalytics = {
        overview: {
          totalBooks: 1250,
          totalUsers: 450,
          totalTransactions: 3200,
          totalReviews: 890,
          activeTransactions: 180,
          overdueTransactions: 12
        },
        recentActivity: {
          recentBorrows: 45,
          recentReturns: 38,
          recentUsers: 8,
          recentReviews: 23
        },
        popularGenres: [
          { _id: 'Fiction', count: 320 },
          { _id: 'Non-Fiction', count: 280 },
          { _id: 'Science', count: 150 },
          { _id: 'History', count: 120 },
          { _id: 'Biography', count: 100 },
          { _id: 'Technology', count: 80 }
        ],
        monthlyTrends: [
          { _id: { year: 2024, month: 1 }, borrows: 120, returns: 115 },
          { _id: { year: 2024, month: 2 }, borrows: 135, returns: 130 },
          { _id: { year: 2024, month: 3 }, borrows: 150, returns: 145 },
          { _id: { year: 2024, month: 4 }, borrows: 140, returns: 135 },
          { _id: { year: 2024, month: 5 }, borrows: 160, returns: 155 },
          { _id: { year: 2024, month: 6 }, borrows: 170, returns: 165 }
        ]
      }
      
      setAnalytics(mockAnalytics)
    } catch (error: any) {
      setError(error.message || 'Failed to fetch analytics')
      toast.error('Failed to fetch analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  const formatMonth = (monthData: any) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[monthData.month - 1]} ${monthData.year}`
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 text-lg font-semibold mb-2">No Data</div>
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Library performance and usage insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => {/* Export analytics */}}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Books</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.overview.totalBooks.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.overview.totalUsers.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Transactions</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.overview.activeTransactions.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Reviews</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.overview.totalReviews.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Monthly Trends</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="_id" 
                  tickFormatter={formatMonth}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => formatMonth(value)}
                  formatter={(value, name) => [value, name === 'borrows' ? 'Borrows' : 'Returns']}
                />
                <Area 
                  type="monotone" 
                  dataKey="borrows" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="returns" 
                  stackId="1" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Genres */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Popular Genres</h3>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.popularGenres} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="_id" 
                  type="category" 
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <Calendar className="h-5 w-5 text-gray-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.recentActivity.recentBorrows}</div>
            <div className="text-sm text-gray-500">Recent Borrows</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.recentActivity.recentReturns}</div>
            <div className="text-sm text-gray-500">Recent Returns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{analytics.recentActivity.recentUsers}</div>
            <div className="text-sm text-gray-500">New Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{analytics.recentActivity.recentReviews}</div>
            <div className="text-sm text-gray-500">New Reviews</div>
          </div>
        </div>
      </div>

      {/* Overdue Transactions Alert */}
      {analytics.overview.overdueTransactions > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Overdue Transactions Alert
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  There are {analytics.overview.overdueTransactions} overdue transactions that require attention.
                </p>
              </div>
              <div className="mt-4">
                <button className="text-sm font-medium text-red-800 hover:text-red-900">
                  View overdue transactions →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
