'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Eye, Search, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  propertyCount: number
  createdAt: string
}

interface UsersResponse {
  success: boolean
  data: {
    users: User[]
    total: number
    page: number
    pages: number
  }
}

function AdminUsersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all')
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (search) params.set('search', search)
      if (roleFilter !== 'all') params.set('role', roleFilter)

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const json: UsersResponse = await res.json()

      if (json.success) {
        setUsers(json.data.users)
        setTotal(json.data.total)
        setPages(json.data.pages)
      } else {
        showNotification('error', 'Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      showNotification('error', 'An error occurred while fetching users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchParams])

  const updateQueryParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.set('page', '1') // Reset to page 1 on filter change
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateQueryParams({ search })
  }

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value)
    updateQueryParams({ role: value === 'all' ? '' : value })
  }

  const handleChangeRole = async (userId: string, newRole: 'user' | 'admin') => {
    if (session?.user?.id === userId && newRole === 'user') {
      showNotification('error', 'You cannot demote yourself')
      return
    }

    setChangingRole(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        showNotification('success', `User role changed to ${newRole}`)
        fetchUsers()
      } else {
        if (res.status === 403) {
          showNotification('error', 'You cannot demote yourself')
        } else {
          showNotification('error', json.error || 'Failed to change user role')
        }
      }
    } catch (error) {
      console.error('Error changing role:', error)
      showNotification('error', 'An error occurred while changing user role')
    } finally {
      setChangingRole(null)
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const json = await res.json()

      if (res.status === 501) {
        showNotification('error', json.error)
      } else if (res.ok && json.success) {
        showNotification('success', 'User deleted successfully')
        fetchUsers()
      } else {
        showNotification('error', json.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showNotification('error', 'An error occurred while deleting user')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded ${
            notification.type === 'success'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage platform users and roles
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-data tabular-nums">{users.length}</span>{' '}
        of <span className="font-data tabular-nums">{total}</span> users
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No users found
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Properties</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) =>
                        handleChangeRole(user._id, value as 'user' | 'admin')
                      }
                      disabled={changingRole === user._id}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue>
                          <Badge
                            variant={
                              user.role === 'admin' ? 'default' : 'secondary'
                            }
                          >
                            {user.role}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-data tabular-nums">
                      {user.propertyCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/users/${user._id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('page', (page - 1).toString())
              router.push(`/admin/users?${params.toString()}`)
            }}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm">
            Page <span className="font-data tabular-nums">{page}</span> of{' '}
            <span className="font-data tabular-nums">{pages}</span>
          </span>
          <Button
            variant="outline"
            disabled={page === pages}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('page', (page + 1).toString())
              router.push(`/admin/users?${params.toString()}`)
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AdminUsersContent />
    </Suspense>
  )
}
