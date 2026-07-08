'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PropertyGrid } from '@/components/property/PropertyGrid'
import { Phone } from 'lucide-react'

interface Agent {
  _id: string
  name: string
  avatar?: string
  phone?: string
  bio?: string
}

interface Property {
  _id: string
  title: string
  price: number
  listingType: 'rent' | 'sale'
  bedrooms: number
  bathrooms: number
  area: number
  city: string
  images: { url: string }[]
  featured?: boolean
}

interface AgentProfileResponse {
  success: boolean
  data?: {
    agent: Agent
    properties: Property[]
    nextCursor: string | null
    hasMore: boolean
  }
  error?: string
}

export default function AgentProfilePage() {
  const params = useParams()
  const agentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Fetch agent profile and initial listings
  useEffect(() => {
    async function fetchAgentProfile() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/agents/${agentId}`)
        const data: AgentProfileResponse = await res.json()

        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to load agent profile')
          return
        }

        if (data.data) {
          setAgent(data.data.agent)
          setProperties(data.data.properties)
          setNextCursor(data.data.nextCursor)
          setHasMore(data.data.hasMore)
        }
      } catch (err) {
        console.error('Failed to fetch agent profile:', err)
        setError('Failed to load agent profile')
      } finally {
        setLoading(false)
      }
    }

    if (agentId) {
      fetchAgentProfile()
    }
  }, [agentId])

  // Load more listings (cursor pagination)
  async function loadMore() {
    if (!nextCursor || loadingMore) return

    try {
      setLoadingMore(true)

      const res = await fetch(`/api/agents/${agentId}?cursor=${nextCursor}`)
      const data: AgentProfileResponse = await res.json()

      if (data.success && data.data) {
        setProperties((prev) => [...prev, ...data.data!.properties])
        setNextCursor(data.data!.nextCursor)
        setHasMore(data.data!.hasMore)
      }
    } catch (err) {
      console.error('Failed to load more properties:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 animate-pulse">
          <div className="mb-4 h-24 w-24 rounded-full bg-muted" />
          <div className="mb-2 h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
        <PropertyGrid properties={[]} loading={true} />
      </div>
    )
  }

  // Error state
  if (error || !agent) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {error || 'Agent not found'}
            </h3>
            <p className="text-sm text-muted-foreground">
              This agent may not exist or has no published properties
            </p>
            <Button asChild variant="outline">
              <a href="/agents">View All Agents</a>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Agent Profile Header */}
      <Card className="mb-8 p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Avatar */}
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-muted">
            {agent.avatar ? (
              <Image
                src={agent.avatar}
                alt={agent.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-muted-foreground">
                {agent.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Agent Info */}
          <div className="flex-1">
            <h1 className="font-display mb-2 text-3xl font-semibold">
              {agent.name}
            </h1>

            {agent.bio && (
              <p className="mb-4 text-muted-foreground">{agent.bio}</p>
            )}

            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Phone className="h-4 w-4" />
                <span className="font-data tabular-nums">{agent.phone}</span>
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* Listings Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">
          Listings{' '}
          <span className="font-data tabular-nums text-muted-foreground">
            ({properties.length})
          </span>
        </h2>
      </div>

      <PropertyGrid
        properties={properties}
        loading={false}
        emptyMessage="This agent has no active listings"
        emptyAction={{
          label: 'View All Agents',
          onClick: () => (window.location.href = '/agents'),
        }}
      />

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={loadMore}
            disabled={loadingMore}
            variant="outline"
            size="lg"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}
