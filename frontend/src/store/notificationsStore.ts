import { create } from 'zustand'
import { Notification, NotificationState } from '@/types'
import { notificationsAPI } from '@/lib/api'

interface NotificationsStore extends NotificationState {
  // Actions
  fetchNotifications: (params?: {
    page?: number
    limit?: number
    type?: string
    isRead?: boolean
    isArchived?: boolean
  }) => Promise<void>
  fetchNotification: (id: string) => Promise<Notification | null>
  markAsRead: (id: string) => Promise<void>
  markAsClicked: (id: string) => Promise<void>
  archiveNotification: (id: string) => Promise<void>
  pinNotification: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  createNotification: (notificationData: any) => Promise<void>
  sendBulkNotifications: (data: {
    users: string[]
    title: string
    message: string
    type: string
    deliveryMethod: string
  }) => Promise<void>
  clearError: () => void
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  // Actions
  fetchNotifications: async (params = {}) => {
    // Check if user is authenticated before making API call
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        set({ isLoading: false, error: 'Not authenticated' })
        return
      }
    }

    set({ isLoading: true, error: null })
    
    try {
      const response = await notificationsAPI.getNotifications(params)
      const { notifications } = response.data.data
      
      set({
        notifications,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch notifications'
      })
      throw error
    }
  },

  fetchNotification: async (id: string) => {
    try {
      const response = await notificationsAPI.getNotification(id)
      return response.data.data.notification
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch notification'
      })
      throw error
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id)
      
      set((state) => ({
        notifications: state.notifications.map(notification =>
          notification._id === id
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to mark notification as read'
      })
      throw error
    }
  },

  markAsClicked: async (id: string) => {
    try {
      await notificationsAPI.markAsClicked(id)
      
      set((state) => ({
        notifications: state.notifications.map(notification =>
          notification._id === id
            ? { 
                ...notification, 
                clickedAt: new Date().toISOString(),
                clickCount: notification.clickCount + 1
              }
            : notification
        )
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to mark notification as clicked'
      })
      throw error
    }
  },

  archiveNotification: async (id: string) => {
    try {
      await notificationsAPI.archiveNotification(id)
      
      set((state) => ({
        notifications: state.notifications.map(notification =>
          notification._id === id
            ? { ...notification, isArchived: true }
            : notification
        )
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to archive notification'
      })
      throw error
    }
  },

  pinNotification: async (id: string) => {
    try {
      const response = await notificationsAPI.pinNotification(id)
      const { isPinned } = response.data.data
      
      set((state) => ({
        notifications: state.notifications.map(notification =>
          notification._id === id
            ? { ...notification, isPinned }
            : notification
        )
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to pin notification'
      })
      throw error
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllAsRead()
      
      set((state) => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        })),
        unreadCount: 0
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to mark all notifications as read'
      })
      throw error
    }
  },

  fetchUnreadCount: async () => {
    // Check if user is authenticated before making API call
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        set({ unreadCount: 0 })
        return
      }
    }

    try {
      const response = await notificationsAPI.getUnreadCount()
      const { unreadCount } = response.data.data
      
      set({ unreadCount })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch unread count'
      })
      throw error
    }
  },

  createNotification: async (notificationData) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await notificationsAPI.createNotification(notificationData)
      const newNotification = response.data.data.notification
      
      set((state) => ({
        notifications: [newNotification, ...state.notifications],
        isLoading: false,
        error: null
      }))
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to create notification'
      })
      throw error
    }
  },

  sendBulkNotifications: async (data) => {
    set({ isLoading: true, error: null })
    
    try {
      await notificationsAPI.sendBulkNotifications(data)
      set({ isLoading: false, error: null })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to send bulk notifications'
      })
      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  }
}))
