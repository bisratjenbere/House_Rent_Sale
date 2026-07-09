'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

export function FavoriteButton({ propertyId }: { propertyId: string }) {
  const { data: session } = useSession()
  const [favorited, setFavorited] = useState(false)
  const [favoriteId, setFavoriteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return
    fetch(`/api/favorites/check/${propertyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setFavorited(data.data.isFavorited)
          setFavoriteId(data.data.favoriteId)
        }
      })
      .catch(() => {})
  }, [propertyId, session])

  const toggle = async () => {
    if (!session) {
      toast.error('Please login to save favorites')
      return
    }
    setLoading(true)
    try {
      if (favorited && favoriteId) {
        await fetch(`/api/favorites/${favoriteId}`, { method: 'DELETE' })
        setFavorited(false)
        setFavoriteId(null)
        toast.success('Removed from favorites')
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        setFavorited(true)
        setFavoriteId(data.data._id)
        toast.success('Added to favorites')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={loading}>
      <Heart className={cn('h-4 w-4 mr-2', favorited && 'fill-primary text-primary')} />
      {favorited ? 'Saved' : 'Save'}
    </Button>
  )
}
