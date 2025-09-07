import { create } from 'zustand'
import { Transaction, TransactionFilters, PaginationInfo, TransactionState } from '@/types'
import { transactionsAPI } from '@/lib/api'

interface TransactionsStore extends TransactionState {
  // Actions
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>
  fetchTransaction: (id: string) => Promise<void>
  renewTransaction: (id: string, data?: { days?: number }) => Promise<void>
  returnTransaction: (id: string, data?: {
    condition?: string
    notes?: string
    waiveFine?: boolean
  }) => Promise<void>
  getOverdueTransactions: () => Promise<void>
  getDueSoonTransactions: (days?: number) => Promise<void>
  updateFine: (id: string, data: {
    amount?: number
    reason?: string
    status?: string
  }) => Promise<void>
  setFilters: (filters: Partial<TransactionFilters>) => void
  clearFilters: () => void
  setCurrentTransaction: (transaction: Transaction | null) => void
  clearError: () => void
}

const defaultFilters: TransactionFilters = {
  page: 1,
  limit: 12
}

export const useTransactionsStore = create<TransactionsStore>((set, get) => ({
  // Initial state
  transactions: [],
  currentTransaction: null,
  filters: defaultFilters,
  pagination: null,
  isLoading: false,
  error: null,

  // Actions
  fetchTransactions: async (filters = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      const currentFilters = { ...get().filters, ...filters }
      const response = await transactionsAPI.getTransactions(currentFilters)
      const { transactions, pagination } = response.data.data
      
      set({
        transactions,
        pagination,
        filters: currentFilters,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch transactions'
      })
      throw error
    }
  },

  fetchTransaction: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await transactionsAPI.getTransaction(id)
      const { transaction } = response.data.data
      
      set({
        currentTransaction: transaction,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch transaction'
      })
      throw error
    }
  },

  renewTransaction: async (id: string, data) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await transactionsAPI.renewTransaction(id, data)
      const { transaction } = response.data.data
      
      set((state) => ({
        transactions: state.transactions.map(t => 
          t._id === id ? transaction : t
        ),
        currentTransaction: state.currentTransaction?._id === id ? transaction : state.currentTransaction,
        isLoading: false,
        error: null
      }))
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to renew transaction'
      })
      throw error
    }
  },

  returnTransaction: async (id: string, data) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await transactionsAPI.returnTransaction(id, data)
      const { transaction } = response.data.data
      
      set((state) => ({
        transactions: state.transactions.map(t => 
          t._id === id ? transaction : t
        ),
        currentTransaction: state.currentTransaction?._id === id ? transaction : state.currentTransaction,
        isLoading: false,
        error: null
      }))
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to return transaction'
      })
      throw error
    }
  },

  getOverdueTransactions: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await transactionsAPI.getOverdueTransactions()
      const { transactions } = response.data.data
      
      set({
        transactions,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch overdue transactions'
      })
      throw error
    }
  },

  getDueSoonTransactions: async (days = 3) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await transactionsAPI.getDueSoonTransactions(days)
      const { transactions } = response.data.data
      
      set({
        transactions,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch due soon transactions'
      })
      throw error
    }
  },

  updateFine: async (id: string, data) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await transactionsAPI.updateFine(id, data)
      const { transaction } = response.data.data
      
      set((state) => ({
        transactions: state.transactions.map(t => 
          t._id === id ? transaction : t
        ),
        currentTransaction: state.currentTransaction?._id === id ? transaction : state.currentTransaction,
        isLoading: false,
        error: null
      }))
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update fine'
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

  setCurrentTransaction: (transaction) => {
    set({ currentTransaction: transaction })
  },

  clearError: () => {
    set({ error: null })
  }
}))
