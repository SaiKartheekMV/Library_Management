'use client'

import { useEffect, useState } from 'react'
import { useBooksStore } from '@/store/booksStore'
import { useAuthStore } from '@/store/authStore'
import { booksAPI } from '@/lib/api'
import { GoogleBook } from '@/types'
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  BookMarked,
  Star,
  Users,
  Download,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function BooksPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { 
    books, 
    pagination, 
    isLoading, 
    error, 
    fetchBooks, 
    deleteBook,
    clearFilters 
  } = useBooksStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'author' | 'rating' | 'popularity' | 'trending'>('newest')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGoogleSearch, setShowGoogleSearch] = useState(false)
  const [googleBooks, setGoogleBooks] = useState<GoogleBook[]>([])
  const [googleSearchTerm, setGoogleSearchTerm] = useState('')
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false)

  const genres = [
    'Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 
    'Mystery', 'Romance', 'Fantasy', 'Sci-Fi', 'Thriller', 
    'Self-Help', 'Business', 'Technology', 'Art', 'Philosophy'
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'author', label: 'Author A-Z' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'trending', label: 'Trending' }
  ]

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated && user) {
      fetchBooks({
        search: searchTerm,
        genre: selectedGenre,
        author: selectedAuthor,
        available: showAvailableOnly,
        sort: sortBy,
        page: 1,
        limit: 12
      })
    }
  }, [isAuthenticated, user, searchTerm, selectedGenre, selectedAuthor, showAvailableOnly, sortBy, fetchBooks])

  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await deleteBook(bookId)
        toast.success('Book deleted successfully')
    } catch {
      toast.error('Failed to delete book')
    }
    }
  }

  const handlePageChange = (page: number) => {
    fetchBooks({
      search: searchTerm,
      genre: selectedGenre,
      author: selectedAuthor,
      available: showAvailableOnly,
      sort: sortBy,
      page,
      limit: 12
    })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedGenre('')
    setSelectedAuthor('')
    setShowAvailableOnly(false)
    setSortBy('newest')
    clearFilters()
  }

  const searchGoogleBooks = async () => {
    if (!googleSearchTerm.trim()) return
    
    setIsSearchingGoogle(true)
    try {
      const response = await booksAPI.searchGoogleBooks(googleSearchTerm, 20)
      setGoogleBooks(response.data.books)
    } catch {
      toast.error('Failed to search Google Books')
    } finally {
      setIsSearchingGoogle(false)
    }
  }

  const importGoogleBook = async (googleBook: GoogleBook) => {
    try {
      await booksAPI.importFromGoogle({
        googleId: googleBook.googleId,
        totalCopies: 1,
        location: {
          shelf: 'A1',
          section: 'General',
          floor: 1,
          room: 'Main Library'
        }
      })
      toast.success('Book imported successfully!')
      setShowGoogleSearch(false)
      // Refresh the books list
      fetchBooks({
        search: searchTerm,
        genre: selectedGenre,
        author: selectedAuthor,
        available: showAvailableOnly,
        sort: sortBy,
        page: 1,
        limit: 12
      })
    } catch {
      toast.error('Failed to import book')
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => fetchBooks()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Books Management</h1>
          <p className="text-gray-600">Manage your library&apos;s book collection</p>
        </div>
        <div className="flex space-x-3">
          {(user?.role === 'admin' || user?.role === 'librarian') && (
            <>
              <button
                onClick={() => setShowGoogleSearch(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Import from Google
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or ISBN..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Genre Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genre
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Author Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author
            </label>
            <input
              type="text"
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              placeholder="Filter by author..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Available only</span>
            </label>
          </div>
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <div key={book._id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* Book Cover */}
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {book.coverImage ? (
                    <img 
                      src={book.coverImage} 
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  )}
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate" title={book.title}>
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600 truncate" title={book.author}>
                    by {book.author}
                  </p>
                  
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      {book.averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {book.totalReviews}
                    </div>
                    <div className="flex items-center">
                      <BookMarked className="h-3 w-3 mr-1" />
                      {book.availableCopies}/{book.totalCopies}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      book.availableCopies > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {book.availableCopies > 0 ? 'Available' : 'Out of Stock'}
                    </span>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {/* View book details */}}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {user?.role === 'admin' || user?.role === 'librarian' ? (
                        <>
                          <button
                            onClick={() => {/* Edit book */}}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Edit Book"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book._id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete Book"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * 12) + 1} to {Math.min(pagination.currentPage * 12, pagination.totalItems)} of {pagination.totalItems} books
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Google Books Search Modal */}
      {showGoogleSearch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Import Books from Google Books</h3>
                <button
                  onClick={() => setShowGoogleSearch(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Input */}
              <div className="flex space-x-2 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    value={googleSearchTerm}
                    onChange={(e) => setGoogleSearchTerm(e.target.value)}
                    placeholder="Search for books on Google Books..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && searchGoogleBooks()}
                  />
                </div>
                <button
                  onClick={searchGoogleBooks}
                  disabled={isSearchingGoogle || !googleSearchTerm.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-md hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearchingGoogle ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Google Books Results */}
              {googleBooks.length > 0 && (
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {googleBooks.map((book: GoogleBook) => (
                      <div key={book.googleId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex space-x-4">
                          {/* Book Cover */}
                          <div className="flex-shrink-0">
                            {book.coverImage ? (
                              <img
                                src={book.coverImage}
                                alt={book.title}
                                className="h-24 w-16 object-cover rounded"
                              />
                            ) : (
                              <div className="h-24 w-16 bg-gray-200 rounded flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Book Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate" title={book.title}>
                              {book.title}
                            </h4>
                            <p className="text-sm text-gray-600 truncate" title={book.author}>
                              by {book.author}
                            </p>
                            {book.publisher && (
                              <p className="text-xs text-gray-500 truncate">
                                {book.publisher} • {book.publicationYear}
                              </p>
                            )}
                            {book.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {book.description.substring(0, 100)}...
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              {book.averageRating > 0 && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                  {book.averageRating.toFixed(1)}
                                </div>
                              )}
                              {book.previewLink && (
                                <a
                                  href={book.previewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Preview
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Import Button */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => importGoogleBook(book)}
                              className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs rounded-md hover:from-emerald-600 hover:to-emerald-700"
                            >
                              Import
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {googleBooks.length === 0 && googleSearchTerm && !isSearchingGoogle && (
                <div className="text-center py-8 text-gray-500">
                  No books found. Try a different search term.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
