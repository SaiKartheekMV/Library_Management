import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthState } from '@/types'
import { authAPI } from '@/lib/api'

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone?: string
    membershipType: string
  }) => Promise<void>
  logout: () => void
  updateProfile: (userData: Partial<User>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  refreshToken: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.login({ email, password })
          const { user, token } = response.data.data
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          // Store token in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Login failed'
          })
          throw error
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.register(userData)
          const { user, token } = response.data.data
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          // Store token in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Registration failed'
          })
          throw error
        }
      },

      logout: () => {
        // Call logout API
        authAPI.logout().catch(() => {
          // Ignore errors on logout
        })
        
        // Clear state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
        
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.updateProfile(userData)
          const updatedUser = response.data.data.user
          
          set({
            user: updatedUser,
            isLoading: false,
            error: null
          })
          
          // Update localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(updatedUser))
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Profile update failed'
          })
          throw error
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null })
        
        try {
          await authAPI.changePassword({ currentPassword, newPassword })
          set({ isLoading: false, error: null })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Password change failed'
          })
          throw error
        }
      },

      refreshToken: async () => {
        try {
          const response = await authAPI.refreshToken()
          const { token } = response.data.data
          
          set({ token })
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', token)
          }
        } catch (error) {
          // If refresh fails, logout user
          get().logout()
          throw error
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
        if (typeof window !== 'undefined') {
          if (user) {
            localStorage.setItem('user', JSON.stringify(user))
          } else {
            localStorage.removeItem('user')
          }
        }
      },

      setToken: (token) => {
        set({ token, isAuthenticated: !!token })
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('token', token)
          } else {
            localStorage.removeItem('token')
          }
        }
      },

      // Validate token and fetch user profile
      validateToken: async () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return false
        }

        try {
          const response = await authAPI.getProfile()
          const { user } = response.data.data
          set({ user, isAuthenticated: true })
          return true
        } catch (error) {
          // Token is invalid, clear auth state
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false 
          })
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
          return false
        }
      },

      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
