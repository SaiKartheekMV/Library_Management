'use client'

import { useEffect, useState } from 'react'
import { useUsersStore } from '@/store/usersStore'
import { useAuthStore } from '@/store/authStore'
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  BookOpen
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { 
    users, 
    pagination, 
    isLoading, 
    error, 
    fetchUsers, 
    deleteUser,
    setFilters,
    clearFilters 
  } = useUsersStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedMembership, setSelectedMembership] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [showAddModal, setShowAddModal] = useState(false)

  const roles = [
    { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800' },
    { value: 'librarian', label: 'Librarian', color: 'bg-blue-100 text-blue-800' },
    { value: 'member', label: 'Member', color: 'bg-green-100 text-green-800' }
  ]

  const membershipTypes = [
    { value: 'basic', label: 'Basic' },
    { value: 'premium', label: 'Premium' },
    { value: 'student', label: 'Student' },
    { value: 'faculty', label: 'Faculty' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'firstName', label: 'Name A-Z' },
    { value: 'lastLogin', label: 'Last Login' },
    { value: 'totalBooksBorrowed', label: 'Most Active' }
  ]

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated && user) {
      fetchUsers({
        search: searchTerm,
        role: selectedRole,
        membershipType: selectedMembership,
        isActive: showActiveOnly,
        page: 1,
        limit: 12
      })
    }
  }, [isAuthenticated, user, searchTerm, selectedRole, selectedMembership, showActiveOnly, sortBy, fetchUsers])

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId)
        toast.success('User deleted successfully')
      } catch (error) {
        toast.error('Failed to delete user')
      }
    }
  }

  const handlePageChange = (page: number) => {
    fetchUsers({
      search: searchTerm,
      role: selectedRole,
      membershipType: selectedMembership,
      isActive: showActiveOnly,
      page,
      limit: 12
    })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedRole('')
    setSelectedMembership('')
    setShowActiveOnly(true)
    setSortBy('newest')
    clearFilters()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getRoleColor = (role: string) => {
    const roleObj = roles.find(r => r.value === role)
    return roleObj?.color || 'bg-gray-100 text-gray-800'
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => fetchUsers()}
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
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Manage library users and their accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
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
                placeholder="Search by name, email, or library card..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          {/* Membership Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Membership
            </label>
            <select
              value={selectedMembership}
              onChange={(e) => setSelectedMembership(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {membershipTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active users only</span>
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

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((userItem) => (
              <div key={userItem._id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* User Avatar */}
                <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                  {userItem.profilePicture ? (
                    <img 
                      src={userItem.profilePicture} 
                      alt={`${userItem.firstName} ${userItem.lastName}`}
                      className="h-20 w-20 rounded-full object-cover border-4 border-white"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {userItem.firstName} {userItem.lastName}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userItem.role)}`}>
                      {userItem.role}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {userItem.email}
                    </div>
                    {userItem.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {userItem.phone}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      {userItem.membershipType}
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {userItem.totalBooksBorrowed} books borrowed
                    </div>
                    {userItem.lastLogin && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Last login: {formatDate(userItem.lastLogin)}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userItem.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {userItem.isActive ? (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {/* View user details */}}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {(user?.role === 'admin' || (user?.role === 'librarian' && userItem.role !== 'admin')) && (
                        <>
                          <button
                            onClick={() => {/* Edit user */}}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(userItem._id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
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
                Showing {((pagination.currentPage - 1) * 12) + 1} to {Math.min(pagination.currentPage * 12, pagination.totalItems)} of {pagination.totalItems} users
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
    </div>
  )
}
