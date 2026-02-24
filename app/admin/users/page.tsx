'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Search, Shield, Trash2, User as UserIcon } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

type AdminUser = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: 'user' | 'admin'
  createdAt?: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/auth/login?redirect=/admin/users')
      return
    }
    fetchUsers()
  }, [isAuthenticated, user, router])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/users')
      setUsers(response.data || [])
    } catch (error) {
      toast.error('Failed to load users')
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (targetUser: AdminUser, newRole: 'user' | 'admin') => {
    if (targetUser.role === newRole) return
    setUpdatingUserId(targetUser.id)
    try {
      await api.patch(`/users/${targetUser.id}`, { role: newRole })
      toast.success('User role updated')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update role')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDelete = async (targetUser: AdminUser) => {
    if (targetUser.id === user?.id) {
      toast.error('You cannot delete your own admin account')
      return
    }
    if (!confirm(`Delete user ${targetUser.email}?`)) return

    setUpdatingUserId(targetUser.id)
    try {
      await api.delete(`/users/${targetUser.id}`)
      toast.success('User deleted')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to delete user')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase()
    const term = searchTerm.toLowerCase()
    return u.email.toLowerCase().includes(term) || fullName.includes(term)
  })

  if (!isAuthenticated || user?.role !== 'admin' || isLoading) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Manage Users</h1>
          <p className="text-gray-600">Total: {filteredUsers.length}</p>
        </div>

        <div className="mb-6">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="card p-4 md:p-6">
          {filteredUsers.length === 0 ? (
            <p className="text-gray-600">No users found.</p>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((u) => {
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No name'
                return (
                  <div
                    key={u.id}
                    className="border rounded-lg p-4 flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{fullName}</p>
                      <p className="text-sm text-gray-600 truncate">{u.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined:{' '}
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <div className="flex items-center gap-2">
                        {u.role === 'admin' ? (
                          <Shield className="w-4 h-4 text-blue-600" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-gray-500" />
                        )}
                        <select
                          value={u.role || 'user'}
                          onChange={(e) =>
                            handleRoleChange(u, e.target.value as 'user' | 'admin')
                          }
                          disabled={updatingUserId === u.id}
                          className="input-field py-2 min-w-32"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleDelete(u)}
                        disabled={updatingUserId === u.id || u.id === user?.id}
                        className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
