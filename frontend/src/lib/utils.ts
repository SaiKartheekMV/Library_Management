import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  return formatDate(d)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidISBN(isbn: string): boolean {
  // Remove hyphens and spaces
  const cleanISBN = isbn.replace(/[-\s]/g, '')
  
  // Check if it's 10 or 13 digits
  if (cleanISBN.length === 10) {
    return /^\d{9}[\dX]$/.test(cleanISBN)
  } else if (cleanISBN.length === 13) {
    return /^\d{13}$/.test(cleanISBN)
  }
  
  return false
}

export function formatISBN(isbn: string): string {
  const cleanISBN = isbn.replace(/[-\s]/g, '')
  
  if (cleanISBN.length === 10) {
    return cleanISBN.replace(/(\d{1})(\d{3})(\d{5})(\d{1})/, '$1-$2-$3-$4')
  } else if (cleanISBN.length === 13) {
    return cleanISBN.replace(/(\d{3})(\d{1})(\d{3})(\d{5})(\d{1})/, '$1-$2-$3-$4-$5')
  }
  
  return isbn
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const words = text.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    active: 'text-green-600 bg-green-100',
    pending: 'text-yellow-600 bg-yellow-100',
    completed: 'text-blue-600 bg-blue-100',
    overdue: 'text-red-600 bg-red-100',
    cancelled: 'text-gray-600 bg-gray-100',
    available: 'text-green-600 bg-green-100',
    unavailable: 'text-red-600 bg-red-100',
    out_of_stock: 'text-red-600 bg-red-100',
    low_stock: 'text-yellow-600 bg-yellow-100',
  }
  
  return statusColors[status] || 'text-gray-600 bg-gray-100'
}

export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    low: 'text-gray-600 bg-gray-100',
    medium: 'text-blue-600 bg-blue-100',
    high: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100',
  }
  
  return priorityColors[priority] || 'text-gray-600 bg-gray-100'
}

export function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    admin: 'text-purple-600 bg-purple-100',
    librarian: 'text-blue-600 bg-blue-100',
    member: 'text-green-600 bg-green-100',
  }
  
  return roleColors[role] || 'text-gray-600 bg-gray-100'
}

export function getMembershipTypeColor(type: string): string {
  const typeColors: Record<string, string> = {
    basic: 'text-gray-600 bg-gray-100',
    premium: 'text-yellow-600 bg-yellow-100',
    student: 'text-blue-600 bg-blue-100',
    faculty: 'text-purple-600 bg-purple-100',
  }
  
  return typeColors[type] || 'text-gray-600 bg-gray-100'
}
