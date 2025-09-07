import { create } from 'zustand'
import { Review, PaginationInfo, ReviewState } from '@/types'
import { reviewsAPI } from '@/lib/api'

interface ReviewsStore extends ReviewState {
  // Actions
  fetchReviews: (params?: {
    page?: number
    limit?: number
    book?: string
    user?: string
    rating?: number
    sort?: string
  }) => Promise<void>
  fetchReview: (id: string) => Promise<void>
  createReview: (reviewData: any) => Promise<void>
  updateReview: (id: string, reviewData: any) => Promise<void>
  deleteReview: (id: string) => Promise<void>
  voteReview: (id: string, data: { helpful: boolean }) => Promise<void>
  commentReview: (id: string, data: { content: string }) => Promise<void>
  likeReview: (id: string) => Promise<void>
  unlikeReview: (id: string) => Promise<void>
  reportReview: (id: string, data: { reason: string }) => Promise<void>
  getTopReviews: (limit?: number) => Promise<void>
  setCurrentReview: (review: Review | null) => void
  clearError: () => void
}

export const useReviewsStore = create<ReviewsStore>((set, get) => ({
  // Initial state
  reviews: [],
  currentReview: null,
  pagination: null,
  isLoading: false,
  error: null,

  // Actions
  fetchReviews: async (params = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await reviewsAPI.getReviews(params)
      const { reviews, pagination } = response.data.data
      
      set({
        reviews,
        pagination,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch reviews'
      })
      throw error
    }
  },

  fetchReview: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await reviewsAPI.getReview(id)
      const { review } = response.data.data
      
      set({
        currentReview: review,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch review'
      })
      throw error
    }
  },

  createReview: async (reviewData) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await reviewsAPI.createReview(reviewData)
      const newReview = response.data.data.review
      
      set((state) => ({
        reviews: [newReview, ...state.reviews],
        isLoading: false,
        error: null
      }))
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to create review'
      })
      throw error
    }
  },

  updateReview: async (id: string, reviewData) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await reviewsAPI.updateReview(id, reviewData)
      const updatedReview = response.data.data.review
      
      set((state) => ({
        reviews: state.reviews.map(review => 
          review._id === id ? updatedReview : review
        ),
        currentReview: state.currentReview?._id === id ? updatedReview : state.currentReview,
        isLoading: false,
        error: null
      }))
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update review'
      })
      throw error
    }
  },

  deleteReview: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      await reviewsAPI.deleteReview(id)
      
      set((state) => ({
        reviews: state.reviews.filter(review => review._id !== id),
        currentReview: state.currentReview?._id === id ? null : state.currentReview,
        isLoading: false,
        error: null
      }))
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to delete review'
      })
      throw error
    }
  },

  voteReview: async (id: string, data) => {
    try {
      const response = await reviewsAPI.voteReview(id, data)
      const { review } = response.data.data
      
      set((state) => ({
        reviews: state.reviews.map(r => 
          r._id === id ? review : r
        ),
        currentReview: state.currentReview?._id === id ? review : state.currentReview
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to vote on review'
      })
      throw error
    }
  },

  commentReview: async (id: string, data) => {
    try {
      const response = await reviewsAPI.commentReview(id, data)
      const { review } = response.data.data
      
      set((state) => ({
        reviews: state.reviews.map(r => 
          r._id === id ? review : r
        ),
        currentReview: state.currentReview?._id === id ? review : state.currentReview
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to comment on review'
      })
      throw error
    }
  },

  likeReview: async (id: string) => {
    try {
      const response = await reviewsAPI.likeReview(id)
      const { review } = response.data.data
      
      set((state) => ({
        reviews: state.reviews.map(r => 
          r._id === id ? review : r
        ),
        currentReview: state.currentReview?._id === id ? review : state.currentReview
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to like review'
      })
      throw error
    }
  },

  unlikeReview: async (id: string) => {
    try {
      const response = await reviewsAPI.unlikeReview(id)
      const { review } = response.data.data
      
      set((state) => ({
        reviews: state.reviews.map(r => 
          r._id === id ? review : r
        ),
        currentReview: state.currentReview?._id === id ? review : state.currentReview
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to unlike review'
      })
      throw error
    }
  },

  reportReview: async (id: string, data) => {
    try {
      await reviewsAPI.reportReview(id, data)
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to report review'
      })
      throw error
    }
  },

  getTopReviews: async (limit = 10) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await reviewsAPI.getTopReviews(limit)
      const { reviews } = response.data.data
      
      set({
        reviews,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch top reviews'
      })
      throw error
    }
  },

  setCurrentReview: (review) => {
    set({ currentReview: review })
  },

  clearError: () => {
    set({ error: null })
  }
}))
