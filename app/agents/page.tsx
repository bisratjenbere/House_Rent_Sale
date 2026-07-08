import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { connectDB } from '@/lib/db'
import { Property } from '@/models'

interface Agent {
  userId: string
  name: string
  avatar?: string
  phone?: string
  bio?: string
  propertyCount: number
}

interface AgentsResponse {
  success: boolean
  data: {
    agents: Agent[]
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function getAgents(page: number = 1): Promise<AgentsResponse> {
  try {
    await connectDB()
    const limit = 20
    const skip = (page - 1) * limit

    const [result] = await Property.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$owner', propertyCount: { $sum: 1 } } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          agents: [
            { $sort: { propertyCount: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { _id: 0, userId: '$_id', name: '$user.name', avatar: '$user.avatar', phone: '$user.phone', bio: '$user.bio', propertyCount: 1 } },
          ],
        },
      },
    ])

    const total = result.total[0]?.count ?? 0
    return {
      success: true,
      data: { agents: result.agents, page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return { success: false, data: { agents: [], page: 1, limit: 20, total: 0, totalPages: 0 } }
  }
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const currentPage = parseInt(params.page || '1', 10)
  const response = await getAgents(currentPage)
  const { agents, page, totalPages, total } = response.data

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-4xl font-semibold">Agents</h1>
        <p className="text-muted-foreground">
          Find experienced agents with active property listings
        </p>
        {total > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-data tabular-nums">{total}</span> agents found
          </p>
        )}
      </div>

      {agents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">No agents found</h3>
            <p className="text-sm text-muted-foreground">
              Check back later for active property agents
            </p>
            <Button asChild variant="outline">
              <Link href="/properties">Browse Properties</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Agents Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.userId} className="overflow-hidden">
                <div className="p-6">
                  {/* Avatar */}
                  <div className="mb-4 flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
                      {agent.avatar ? (
                        <Image
                          src={agent.avatar}
                          alt={agent.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-data tabular-nums">
                          {agent.propertyCount}
                        </span>{' '}
                        {agent.propertyCount === 1 ? 'property' : 'properties'}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {agent.bio && (
                    <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                      {agent.bio}
                    </p>
                  )}

                  {/* Phone */}
                  {agent.phone && (
                    <p className="mb-4 text-sm">
                      <a
                        href={`tel:${agent.phone}`}
                        className="font-data tabular-nums text-primary hover:underline"
                      >
                        {agent.phone}
                      </a>
                    </p>
                  )}

                  {/* View Listings Button */}
                  <Button asChild className="w-full">
                    <Link href={`/agents/${agent.userId}`}>View Listings</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {/* Previous Button */}
              {page > 1 && (
                <Button asChild variant="outline">
                  <Link href={`/agents?page=${page - 1}`}>Previous</Link>
                </Button>
              )}

              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)

                  if (!showPage) {
                    // Show ellipsis
                    if (pageNum === page - 2 || pageNum === page + 2) {
                      return (
                        <span
                          key={pageNum}
                          className="flex h-10 w-10 items-center justify-center"
                        >
                          …
                        </span>
                      )
                    }
                    return null
                  }

                  return (
                    <Button
                      key={pageNum}
                      asChild
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="icon"
                    >
                      <Link href={`/agents?page=${pageNum}`}>{pageNum}</Link>
                    </Button>
                  )
                })}
              </div>

              {/* Next Button */}
              {page < totalPages && (
                <Button asChild variant="outline">
                  <Link href={`/agents?page=${page + 1}`}>Next</Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
