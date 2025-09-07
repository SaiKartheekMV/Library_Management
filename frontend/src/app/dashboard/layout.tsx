'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import {
  BookOpen,
  Home,
  Book,
  Users,
  FileText,
  Star,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const getNavigationByRole = (role: string) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Books', href: '/dashboard/books', icon: Book },
  ];

  switch (role) {
    case 'admin':
      return [
        ...baseNavigation,
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Transactions', href: '/dashboard/transactions', icon: FileText },
        { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
        { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ];
    case 'librarian':
      return [
        ...baseNavigation,
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Transactions', href: '/dashboard/transactions', icon: FileText },
        { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
        { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ];
    case 'student':
      return [
        ...baseNavigation,
        { name: 'My Books', href: '/dashboard/my-books', icon: Book },
        { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
        { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ];
    case 'member':
    default:
      return [
        ...baseNavigation,
        { name: 'My Books', href: '/dashboard/my-books', icon: Book },
        { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
        { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ];
  }
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  const navigation = getNavigationByRole(user?.role || 'member')

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 flex z-40 md:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Library</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-3 py-3 text-base font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 hover:text-primary-700"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={cn(
                        "mr-4 h-6 w-6 transition-colors duration-200",
                        isActive ? "text-white" : "text-gray-400 group-hover:text-primary-500"
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white shadow-xl">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Library</span>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg"
                          : "text-gray-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 hover:text-primary-700"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 transition-colors duration-200",
                          isActive ? "text-white" : "text-gray-400 group-hover:text-primary-500"
                        )}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm bg-gray-50 rounded-lg"
                    placeholder="Search books, users, or transactions..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Bell className="h-6 w-6" />
              </button>
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-3 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
