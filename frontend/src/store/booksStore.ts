import { create } from 'zustand'
import { Book, BookFilters, BookState, BookForm } from '@/types'
import { booksAPI } from '@/lib/api'

interface BooksStore extends BookState {
  // Actions
  fetchBooks: (filters?: BookFilters) => Promise<void>
  fetchBook: (id: string) => Promise<void>
  createBook: (bookData: BookForm) => Promise<void>
  updateBook: (id: string, bookData: Partial<BookForm>) => Promise<void>
  deleteBook: (id: string) => Promise<void>
  borrowBook: (id: string) => Promise<void>
  returnBook: (id: string, data?: { condition?: string; notes?: string }) => Promise<void>
  renewBook: (id: string) => Promise<void>
  reserveBook: (id: string) => Promise<void>
  cancelReservation: (id: string) => Promise<void>
  fetchTrendingBooks: (limit?: number) => Promise<void>
  fetchPopularBooks: (limit?: number) => Promise<void>
  setFilters: (filters: Partial<BookFilters>) => void
  clearFilters: () => void
  setCurrentBook: (book: Book | null) => void
  clearError: () => void
}

const defaultFilters: BookFilters = {
  page: 1,
  limit: 12,
  sort: 'newest'
}

export const useBooksStore = create<BooksStore>((set, get) => ({
  // Initial state
  books: [],
  currentBook: null,
  filters: defaultFilters,
  pagination: null,
  isLoading: false,
  error: null,

  // Actions
  fetchBooks: async (filters = {}) => {
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
      const currentFilters = { ...get().filters, ...filters }
      const response = await booksAPI.getBooks(currentFilters)
      const { books, pagination } = response.data.data
      
      set({
        books,
        pagination,
        filters: currentFilters,
        isLoading: false,
        error: null
      })
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to fetch books'
      })
      throw error
    }
  },

  fetchBook: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await booksAPI.getBook(id)
      const { book } = response.data.data
      
      set({
        currentBook: book,
        isLoading: false,
        error: null
      })
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to fetch book'
      })
      throw error
    }
  },

  createBook: async (bookData) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await booksAPI.createBook(bookData)
      const newBook = response.data.data.book
      
      set((state) => ({
        books: [newBook, ...state.books],
        isLoading: false,
        error: null
      }))
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to create book'
      })
      throw error
    }
  },

  updateBook: async (id: string, bookData) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await booksAPI.updateBook(id, bookData)
      const updatedBook = response.data.data.book
      
      set((state) => ({
        books: state.books.map(book => 
          book._id === id ? updatedBook : book
        ),
        currentBook: state.currentBook?._id === id ? updatedBook : state.currentBook,
        isLoading: false,
        error: null
      }))
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to update book'
      })
      throw error
    }
  },

  deleteBook: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      await booksAPI.deleteBook(id)
      
      set((state) => ({
        books: state.books.filter(book => book._id !== id),
        currentBook: state.currentBook?._id === id ? null : state.currentBook,
        isLoading: false,
        error: null
      }))
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to delete book'
      })
      throw error
    }
  },

  borrowBook: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      await booksAPI.borrowBook(id)
      
      // Update book availability
      set((state) => ({
        books: state.books.map(book => 
          book._id === id 
            ? { ...book, availableCopies: book.availableCopies - 1 }
            : book
        ),
        currentBook: state.currentBook?._id === id 
          ? { ...state.currentBook, availableCopies: state.currentBook.availableCopies - 1 }
          : state.currentBook,
        isLoading: false,
        error: null
      }))
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to borrow book'
      })
      throw error
    }
  },

  returnBook: async (id: string, data) => {
    set({ isLoading: true, error: null })
    
    try {
      await booksAPI.returnBook(id, data)
      
      // Update book availability
      set((state) => ({
        books: state.books.map(book => 
          book._id === id 
            ? { ...book, availableCopies: book.availableCopies + 1 }
            : book
        ),
        currentBook: state.currentBook?._id === id 
          ? { ...state.currentBook, availableCopies: state.currentBook.availableCopies + 1 }
          : state.currentBook,
        isLoading: false,
        error: null
      }))
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to return book'
      })
      throw error
    }
  },

  renewBook: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      await booksAPI.renewBook(id)
      set({ isLoading: false, error: null })
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to renew book'
      })
      throw error
    }
  },

  reserveBook: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      await booksAPI.reserveBook(id)
      set({ isLoading: false, error: null })
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to reserve book'
      })
      throw error
    }
  },

  cancelReservation: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      await booksAPI.cancelReservation(id)
      set({ isLoading: false, error: null })
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to cancel reservation'
      })
      throw error
    }
  },

  fetchTrendingBooks: async (limit = 10) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await booksAPI.getTrendingBooks(limit)
      const { books } = response.data.data
      
      set({
        books,
        isLoading: false,
        error: null
      })
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to fetch trending books'
      })
      throw error
    }
  },

  fetchPopularBooks: async (limit = 10) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await booksAPI.getPopularBooks(limit)
      const { books } = response.data.data
      
      set({
        books,
        isLoading: false,
        error: null
      })
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: (error as any).response?.data?.message || 'Failed to fetch popular books'
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

  setCurrentBook: (book) => {
    set({ currentBook: book })
  },

  clearError: () => {
    set({ error: null })
  }
}))
