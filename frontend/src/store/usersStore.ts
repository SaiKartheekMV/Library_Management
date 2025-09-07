import { create } from 'zustand'
import { User, UserFilters, PaginationInfo, UserState } from '@/types'
import { usersAPI } from '@/lib/api'

interface UsersStore extends UserState {
  // Actions
  fetchUsers: (filters?: UserFilters) => Promise<void>
  fetchUser: (id: string) => Promise<void>
  updateUser: (id: string, userData: any) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  getUserTransactions: (id: string, params?: {
    page?: number
    limit?: number
    status?: string
  }) => Promise<void>
  getUserStatistics: (id: string) => Promise<void>
  setFilters: (filters: Partial<UserFilters>) => void
  clearFilters: () => void
  setCurrentUser: (user: User | null) => void
  clearError: () => void
}

const defaultFilters: UserFilters = {
  page: 1,
  limit: 12
}

export const useUsersStore = create<UsersStore>((set, get) => ({
  // Initial state
  users: [],
  currentUser: null,
  filters: defaultFilters,
  pagination: null,
  isLoading: false,
  error: null,

  // Actions
  fetchUsers: async (filters = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      const currentFilters = { ...get().filters, ...filters }
      const response = await usersAPI.getUsers(currentFilters)
      const { users, pagination } = response.data.data
      
      set({
        users,
        pagination,
        filters: currentFilters,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch users'
      })
      throw error
    }
  },

  fetchUser: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await usersAPI.getUser(id)
      const { user } = response.data.data
      
      set({
        currentUser: user,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch user'
      })
      throw error
    }
  },

  updateUser: async (id: string, userData) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await usersAPI.updateUser(id, userData)
      const updatedUser = response.data.data.user
      
      set((state) => ({
        users: state.users.map(user => 
          user._id === id ? updatedUser : user
        ),
        currentUser: state.currentUser?._id === id ? updatedUser : state.currentUser,
        isLoading: false,
        error: null
      }))
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update user'
      })
      throw error
    }
  },

  deleteUser: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      await usersAPI.deleteUser(id)
      
      set((state) => ({
        users: state.users.filter(user => user._id !== id),
        currentUser: state.currentUser?._id === id ? null : state.currentUser,
        isLoading: false,
        error: null
      }))
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to delete user'
      })
      throw error
    }
  },

  getUserTransactions: async (id: string, params = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await usersAPI.getUserTransactions(id, params)
      const { transactions } = response.data.data
      
      set({
        isLoading: false,
        error: null
      })
      return transactions
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch user transactions'
      })
      throw error
    }
  },

  getUserStatistics: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await usersAPI.getUserStatistics(id)
      const { statistics } = response.data.data
      
      set({
        isLoading: false,
        error: null
      })
      return statistics
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch user statistics'
      })
      throw error
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }))
  },

  clearFilters: () => {
    set({ filters: defaultFilters })
  },

  setCurrentUser: (user) => {
    set({ currentUser: user })
  },

  clearError: () => {
    set({ error: null })
  }
}))
