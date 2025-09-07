import axios, { AxiosInstance, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            // Only redirect if not already on login/register page to prevent infinite loops
            if (!window.location.pathname.startsWith('/auth/')) {
              window.location.href = '/auth/login'
            }
          }
          // Don't show session expired message for auth routes
          if (!error.config?.url?.includes('/auth/')) {
            toast.error('Session expired. Please login again.')
          }
          break
        case 403:
          toast.error('Access denied. You do not have permission to perform this action.')
          break
        case 404:
          toast.error('Resource not found.')
          break
        case 422:
          // Validation errors
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach((err: any) => {
              toast.error(err.msg || err.message || 'Validation error')
            })
          } else {
            toast.error(data.message || 'Validation error')
          }
          break
        case 500:
          toast.error('Server error. Please try again later.')
          break
        default:
          toast.error(data.message || 'An error occurred')
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.')
    } else {
      toast.error('An unexpected error occurred')
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone?: string
    membershipType: string
  }) => api.post('/auth/register', userData),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (userData: any) => api.put('/auth/profile', userData),
  
  changePassword: (passwordData: {
    currentPassword: string
    newPassword: string
  }) => api.post('/auth/change-password', passwordData),
  
  refreshToken: () => api.post('/auth/refresh'),
  
  logout: () => api.post('/auth/logout'),
}

// Books API
export const booksAPI = {
  getBooks: (params?: {
    page?: number
    limit?: number
    search?: string
    genre?: string
    author?: string
    available?: boolean
    sort?: string
  }) => api.get('/books', { params }),
  
  getBook: (id: string) => api.get(`/books/${id}`),
  
  createBook: (bookData: any) => api.post('/books', bookData),
  
  updateBook: (id: string, bookData: any) => api.put(`/books/${id}`, bookData),
  
  deleteBook: (id: string) => api.delete(`/books/${id}`),
  
  borrowBook: (id: string) => api.post(`/books/${id}/borrow`),
  
  returnBook: (id: string, data?: { condition?: string; notes?: string }) =>
    api.post(`/books/${id}/return`, data),
  
  renewBook: (id: string) => api.post(`/books/${id}/renew`),
  
  reserveBook: (id: string) => api.post(`/books/${id}/reserve`),
  
  cancelReservation: (id: string) => api.post(`/books/${id}/cancel-reservation`),
  
  getTrendingBooks: (limit?: number) => api.get('/books/trending', { params: { limit } }),
  
  getPopularBooks: (limit?: number) => api.get('/books/popular', { params: { limit } }),
}

// Users API
export const usersAPI = {
  getUsers: (params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
  }) => api.get('/users', { params }),
  
  getUser: (id: string) => api.get(`/users/${id}`),
  
  updateUser: (id: string, userData: any) => api.put(`/users/${id}`, userData),
  
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  
  getUserTransactions: (id: string, params?: {
    page?: number
    limit?: number
    status?: string
  }) => api.get(`/users/${id}/transactions`, { params }),
  
  getUserStatistics: (id: string) => api.get(`/users/${id}/statistics`),
}

// Transactions API
export const transactionsAPI = {
  getTransactions: (params?: {
    page?: number
    limit?: number
    status?: string
    type?: string
  }) => api.get('/transactions', { params }),
  
  getTransaction: (id: string) => api.get(`/transactions/${id}`),
  
  renewTransaction: (id: string, data?: { days?: number }) =>
    api.post(`/transactions/${id}/renew`, data),
  
  returnTransaction: (id: string, data?: {
    condition?: string
    notes?: string
    waiveFine?: boolean
  }) => api.post(`/transactions/${id}/return`, data),
  
  getOverdueTransactions: () => api.get('/transactions/overdue'),
  
  getDueSoonTransactions: (days?: number) =>
    api.get('/transactions/due-soon', { params: { days } }),
  
  updateFine: (id: string, data: {
    amount?: number
    reason?: string
    status?: string
  }) => api.post(`/transactions/${id}/fine`, data),
}

// Reviews API
export const reviewsAPI = {
  getReviews: (params?: {
    page?: number
    limit?: number
    book?: string
    user?: string
    rating?: number
    sort?: string
  }) => api.get('/reviews', { params }),
  
  getReview: (id: string) => api.get(`/reviews/${id}`),
  
  createReview: (reviewData: any) => api.post('/reviews', reviewData),
  
  updateReview: (id: string, reviewData: any) => api.put(`/reviews/${id}`, reviewData),
  
  deleteReview: (id: string) => api.delete(`/reviews/${id}`),
  
  voteReview: (id: string, data: { helpful: boolean }) =>
    api.post(`/reviews/${id}/vote`, data),
  
  commentReview: (id: string, data: { content: string }) =>
    api.post(`/reviews/${id}/comment`, data),
  
  likeReview: (id: string) => api.post(`/reviews/${id}/like`),
  
  unlikeReview: (id: string) => api.post(`/reviews/${id}/unlike`),
  
  reportReview: (id: string, data: { reason: string }) =>
    api.post(`/reviews/${id}/report`, data),
  
  getTopReviews: (limit?: number) => api.get('/reviews/top', { params: { limit } }),
}

// Notifications API
export const notificationsAPI = {
  getNotifications: (params?: {
    page?: number
    limit?: number
    type?: string
    isRead?: boolean
    isArchived?: boolean
  }) => api.get('/notifications', { params }),
  
  getNotification: (id: string) => api.get(`/notifications/${id}`),
  
  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  
  markAsClicked: (id: string) => api.post(`/notifications/${id}/click`),
  
  archiveNotification: (id: string) => api.post(`/notifications/${id}/archive`),
  
  pinNotification: (id: string) => api.post(`/notifications/${id}/pin`),
  
  markAllAsRead: () => api.post('/notifications/read-all'),
  
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  createNotification: (notificationData: any) => api.post('/notifications', notificationData),
  
  sendBulkNotifications: (data: {
    users: string[]
    title: string
    message: string
    type: string
    deliveryMethod: string
  }) => api.post('/notifications/bulk', data),
}

// Analytics API
export const analyticsAPI = {
  getDashboardAnalytics: () => api.get('/analytics/dashboard'),
  
  getBookAnalytics: (period?: string) =>
    api.get('/analytics/books', { params: { period } }),
  
  getUserAnalytics: (period?: string) =>
    api.get('/analytics/users', { params: { period } }),
  
  getTransactionAnalytics: (period?: string) =>
    api.get('/analytics/transactions', { params: { period } }),
  
  generateReport: (type: string, format?: string) =>
    api.get('/analytics/reports', { params: { type, format } }),
}

// Recommendations API
export const recommendationsAPI = {
  getPersonalRecommendations: (limit?: number) =>
    api.get('/recommendations/personal', { params: { limit } }),
  
  getSimilarBooks: (bookId: string, limit?: number) =>
    api.get(`/recommendations/similar/${bookId}`, { params: { limit } }),
  
  getTrendingRecommendations: (limit?: number, genre?: string) =>
    api.get('/recommendations/trending', { params: { limit, genre } }),
  
  getPopularRecommendations: (limit?: number, genre?: string) =>
    api.get('/recommendations/popular', { params: { limit, genre } }),
  
  getNewReleases: (limit?: number, days?: number) =>
    api.get('/recommendations/new-releases', { params: { limit, days } }),
}

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
}

export default api
