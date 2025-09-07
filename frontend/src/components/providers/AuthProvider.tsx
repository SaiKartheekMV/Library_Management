'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, user, token, setUser, setToken, validateToken, isLoading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isValidating, setIsValidating] = useState(false)

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/books', '/transactions', '/reviews', '/notifications', '/analytics']
  
  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/']

  useEffect(() => {
    // Check if user is stored in localStorage on app load
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          // Validate token format (basic check)
          if (storedToken.split('.').length === 3) {
            setToken(storedToken)
            setUser(userData)
            // Validate token with backend
            setIsValidating(true)
            validateToken().finally(() => {
              setIsValidating(false)
            })
          } else {
            // Invalid token format, clear it
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        } catch (error) {
          // Invalid stored data, clear it
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
    }
  }, [setToken, setUser, validateToken])

  useEffect(() => {
    // Don't redirect while validating token or loading
    if (isValidating || isLoading) return

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isPublicRoute = publicRoutes.includes(pathname)

    if (isProtectedRoute && !isAuthenticated) {
      // Redirect to login if trying to access protected route without authentication
      router.push('/auth/login')
    } else if (isAuthenticated && pathname === '/auth/login') {
      // Redirect to dashboard if already logged in and trying to access login page
      router.push('/dashboard')
    } else if (isAuthenticated && pathname === '/auth/register') {
      // Redirect to dashboard if already logged in and trying to access register page
      router.push('/dashboard')
    } else if (!isAuthenticated && pathname === '/') {
      // Redirect to login if not authenticated and on home page
      router.push('/auth/login')
    }
  }, [isAuthenticated, pathname, router, isValidating, isLoading])

  // Show loading screen while validating token
  if (isValidating || (isLoading && !isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
