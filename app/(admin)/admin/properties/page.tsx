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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Search, Eye, Check, X, Archive, Trash2 } from 'lucide-react'
import { PropertyTypeBadge } from '@/components/property/PropertyTypeBadge'

interface Property {
  _id: string
  title: string
  city: string
  price: number
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
  featured: boolean
  owner: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
}

interface PropertiesResponse {
  success: boolean
  data: {
    properties: Property[]
    total: number
    page: number
    pages: number
  }
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_review: 'bg-accent text-accent-foreground',
  published: 'bg-primary text-primary-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
  archived: 'bg-muted text-muted-foreground',
}

function AdminPropertiesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const statusFilter = searchParams.get('status') || 'all'
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    propertyId: string | null
    propertyTitle: string
  }>({ open: false, propertyId: null, propertyTitle: '' })
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/properties?${params.toString()}`)
      const json: PropertiesResponse = await res.json()

      if (json.success) {
        setProperties(json.data.properties)
        setTotal(json.data.total)
        setPages(json.data.pages)
      } else {
        showNotification('error', 'Failed to fetch properties')
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      showNotification('error', 'An error occurred while fetching properties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
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
    router.push(`/admin/properties?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateQueryParams({ search })
  }

  const handleStatusTab = (status: string) => {
    updateQueryParams({ status: status === 'all' ? '' : status })
  }

  const handleApprove = async (propertyId: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/approve`, {
        method: 'PATCH',
      })

      const json = await res.json()

      if (res.ok && json.success) {
        showNotification('success', 'Property approved successfully')
        fetchProperties()
      } else {
        showNotification('error', json.error || 'Failed to approve property')
      }
    } catch (error) {
      console.error('Error approving property:', error)
      showNotification('error', 'An error occurred while approving property')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectDialog.propertyId || !rejectionReason.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(
        `/api/admin/properties/${rejectDialog.propertyId}/reject`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejectionReason }),
        }
      )

      const json = await res.json()

      if (res.ok && json.success) {
        showNotification('success', 'Property rejected successfully')
        setRejectDialog({ open: false, propertyId: null, propertyTitle: '' })
        setRejectionReason('')
        fetchProperties()
      } else {
        showNotification('error', json.error || 'Failed to reject property')
      }
    } catch (error) {
      console.error('Error rejecting property:', error)
      showNotification('error', 'An error occurred while rejecting property')
    } finally {
      setSubmitting(false)
    }
  }

  const handleArchive = async (propertyId: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/archive`, {
        method: 'PATCH',
      })

      const json = await res.json()

      if (res.ok && json.success) {
        showNotification('success', 'Property archived successfully')
        fetchProperties()
      } else {
        showNotification('error', json.error || 'Failed to archive property')
      }
    } catch (error) {
      console.error('Error archiving property:', error)
      showNotification('error', 'An error occurred while archiving property')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'DELETE',
      })

      const json = await res.json()

      if (res.ok && json.success) {
        showNotification('success', 'Property deleted successfully')
        fetchProperties()
      } else {
        showNotification('error', json.error || 'Failed to delete property')
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      showNotification('error', 'An error occurred while deleting property')
    } finally {
      setSubmitting(false)
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
        <h1 className="font-display text-3xl font-semibold">Properties</h1>
        <p className="text-muted-foreground mt-1">
          Manage and review property listings
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-data tabular-nums">{properties.length}</span>{' '}
        of <span className="font-data tabular-nums">{total}</span> properties
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No properties found
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property._id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{property.title}</span>
                      {property.featured && (
                        <Badge variant="outline" className="w-fit text-xs">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm">{property.owner.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {property.owner.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={STATUS_COLORS[property.status] || ''}
                      variant="secondary"
                    >
                      {property.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{property.city}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(property.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/properties/${property._id}`}>
                        <Button variant="ghost" size="sm" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      {property.status === 'pending_review' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(property._id)}
                            disabled={submitting}
                            title="Approve"
                          >
                            <Check className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setRejectDialog({
                                open: true,
                                propertyId: property._id,
                                propertyTitle: property.title,
                              })
                            }
                            disabled={submitting}
                            title="Reject"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}

                      {property.status !== 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(property._id)}
                          disabled={submitting}
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(property._id)}
                        disabled={submitting}
                        title="Delete"
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
              router.push(`/admin/properties?${params.toString()}`)
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
              router.push(`/admin/properties?${params.toString()}`)
            }}
          >
            Next
          </Button>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => {
        if (!open) {
          setRejectDialog({ open: false, propertyId: null, propertyTitle: '' })
          setRejectionReason('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Property</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{rejectDialog.propertyTitle}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason</Label>
            <Textarea
              id="rejectionReason"
              placeholder="Enter reason for rejection (min 10 characters)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, propertyId: null, propertyTitle: '' })
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={submitting || rejectionReason.trim().length < 10}
            >
              Reject Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminPropertiesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AdminPropertiesContent />
    </Suspense>
  )
}
