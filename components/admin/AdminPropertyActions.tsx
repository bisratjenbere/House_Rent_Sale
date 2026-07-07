'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Check, X, Archive, Star, StarOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface PropertyDetail {
  _id: string
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'rented' | 'sold' | 'archived'
  isFeatured: boolean
}

interface AdminPropertyActionsProps {
  property: PropertyDetail
}

export function AdminPropertyActions({ property }: AdminPropertyActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const canApprove = ['pending_review', 'rejected'].includes(property.status)
  const canReject = ['pending_review', 'published'].includes(property.status)
  const canArchive = !['archived'].includes(property.status)

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/properties/${property._id}/approve`, {
        method: 'PATCH',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve property')
      }

      toast.success('Property approved successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve property')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.length < 10) {
      toast.error('Please provide a rejection reason (at least 10 characters)')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/properties/${property._id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject property')
      }

      toast.success('Property rejected successfully')
      setShowRejectDialog(false)
      setRejectionReason('')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject property')
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchive = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/properties/${property._id}/archive`, {
        method: 'PATCH',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to archive property')
      }

      toast.success('Property archived successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to archive property')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFeatured = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/properties/${property._id}/featured`, {
        method: 'PATCH',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle featured status')
      }

      toast.success(
        property.isFeatured
          ? 'Property removed from featured'
          : 'Property marked as featured'
      )
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to toggle featured status'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this property? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/properties/${property._id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete property')
      }

      toast.success('Property deleted successfully')
      router.push('/admin/properties')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete property')
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {canApprove && (
          <Button
            onClick={handleApprove}
            disabled={isLoading}
            size="sm"
            className="bg-primary"
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
        )}

        {canReject && (
          <Button
            onClick={() => setShowRejectDialog(true)}
            disabled={isLoading}
            size="sm"
            variant="destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        )}

        {canArchive && (
          <Button
            onClick={handleArchive}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </Button>
        )}

        <Button
          onClick={handleToggleFeatured}
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          {property.isFeatured ? (
            <>
              <StarOff className="h-4 w-4 mr-1" />
              Unfeature
            </>
          ) : (
            <>
              <Star className="h-4 w-4 mr-1" />
              Feature
            </>
          )}
        </Button>

        <Button
          onClick={handleDelete}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Property</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this property. This will be visible to
              the owner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explain why this property is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 10 characters required
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionReason('')
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading || rejectionReason.length < 10}
            >
              {isLoading ? 'Rejecting...' : 'Reject Property'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
