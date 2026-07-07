'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Amenity {
  _id: string
  name: string
  icon?: string
  createdAt: string
}

export default function AdminAmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addIcon, setAddIcon] = useState('')

  // Edit form state
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')

  const fetchAmenities = async () => {
    try {
      const res = await fetch('/api/admin/amenities')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch amenities')
      }

      setAmenities(data.data.amenities)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch amenities')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAmenities()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!addName || addName.length < 2) {
      toast.error('Amenity name must be at least 2 characters')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/amenities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          icon: addIcon || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create amenity')
      }

      toast.success('Amenity created successfully')
      setAddName('')
      setAddIcon('')
      setShowAddForm(false)
      fetchAmenities()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create amenity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingAmenity) return

    if (!editName || editName.length < 2) {
      toast.error('Amenity name must be at least 2 characters')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/amenities/${editingAmenity._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          icon: editIcon || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update amenity')
      }

      toast.success('Amenity updated successfully')
      setEditingAmenity(null)
      setEditName('')
      setEditIcon('')
      fetchAmenities()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update amenity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (amenity: Amenity) => {
    if (!confirm(`Are you sure you want to delete "${amenity.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/amenities/${amenity._id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete amenity')
      }

      toast.success('Amenity deleted successfully')
      fetchAmenities()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete amenity')
    }
  }

  const openEditDialog = (amenity: Amenity) => {
    setEditingAmenity(amenity)
    setEditName(amenity.name)
    setEditIcon(amenity.icon || '')
  }

  const closeEditDialog = () => {
    setEditingAmenity(null)
    setEditName('')
    setEditIcon('')
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Amenities</h1>
          <p className="text-muted-foreground mt-1">
            Manage property amenities
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Amenity
        </Button>
      </div>

      {/* Amenities Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Amenities ({amenities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {amenities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No amenities yet. Create your first amenity to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amenities.map((amenity) => (
                  <TableRow key={amenity._id}>
                    <TableCell className="font-medium">{amenity.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {amenity.icon || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(amenity)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(amenity)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Amenity Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Amenity</DialogTitle>
            <DialogDescription>
              Create a new amenity that properties can be associated with.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdd}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-name">Amenity Name *</Label>
                <Input
                  id="add-name"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g., Swimming Pool"
                  required
                  minLength={2}
                  maxLength={50}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="add-icon">Icon (optional)</Label>
                <Input
                  id="add-icon"
                  value={addIcon}
                  onChange={(e) => setAddIcon(e.target.value)}
                  placeholder="e.g., 🏊 or icon name"
                  maxLength={50}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter an emoji or icon identifier
                </p>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setAddName('')
                  setAddIcon('')
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Amenity'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Amenity Dialog */}
      <Dialog open={!!editingAmenity} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Amenity</DialogTitle>
            <DialogDescription>Update the amenity details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Amenity Name *</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g., Swimming Pool"
                  required
                  minLength={2}
                  maxLength={50}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-icon">Icon (optional)</Label>
                <Input
                  id="edit-icon"
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  placeholder="e.g., 🏊 or icon name"
                  maxLength={50}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter an emoji or icon identifier
                </p>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Amenity'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
