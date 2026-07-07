import Link from 'next/link'
import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PropertyCard } from '@/components/property/PropertyCard'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Heart, 
  MessageSquare, 
  PlusCircle,
  Search 
} from 'lucide-react'

interface DashboardStats {
  myListingsCount: number
  favoritesCount: number
  unreadMessagesCount: number
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
  status: string
}

interface Message {
  _id: string
  property: {
    _id: string
    title: string
    images: { url: string }[]
  }
  sender: {
    name: string
  }
  message: string
  createdAt: string
  isRead: boolean
}

async function getDashboardData(): Promise<{
  stats: DashboardStats
  recentListings: Property[]
  recentMessages: Message[]
}> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    // Fetch all data in parallel
    const [myListingsRes, favoritesRes, messagesRes, unreadCountRes] = await Promise.all([
      fetch(`${baseUrl}/api/properties/my?limit=3`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/favorites?limit=1`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/messages?limit=3`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/messages/unread-count`, { cache: 'no-store' }),
    ])

    const myListings = await myListingsRes.json()
    const favorites = await favoritesRes.json()
    const messages = await messagesRes.json()
    const unreadCount = await unreadCountRes.json()

    return {
      stats: {
        myListingsCount: myListings.success ? myListings.data.total : 0,
        favoritesCount: favorites.success ? favorites.data.total : 0,
        unreadMessagesCount: unreadCount.success ? unreadCount.data.count : 0,
      },
      recentListings: myListings.success ? myListings.data.properties.slice(0, 3) : [],
      recentMessages: messages.success ? messages.data.conversations.slice(0, 3) : [],
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    return {
      stats: {
        myListingsCount: 0,
        favoritesCount: 0,
        unreadMessagesCount: 0,
      },
      recentListings: [],
      recentMessages: [],
    }
  }
}

export default async function DashboardPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  const { stats, recentListings, recentMessages } = await getDashboardData()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-2">
          Welcome back, {session.user?.name || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your properties
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Listings</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-data tabular-nums text-2xl font-bold">
              {stats.myListingsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total properties listed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-data tabular-nums text-2xl font-bold">
              {stats.favoritesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saved properties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-data tabular-nums text-2xl font-bold">
              {stats.unreadMessagesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              New inquiries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer">
          <Link href="/dashboard/properties/new">
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <PlusCircle className="h-12 w-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Add New Listing</h3>
                <p className="text-sm text-muted-foreground">
                  List a new property for rent or sale
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer">
          <Link href="/properties">
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Search className="h-12 w-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Browse Properties</h3>
                <p className="text-sm text-muted-foreground">
                  Explore available properties
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-semibold">
              Recent Listings
            </h2>
            <Link
              href="/dashboard/properties"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {recentListings.length > 0 ? (
            <div className="space-y-4">
              {recentListings.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Home className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  You haven't listed any properties yet
                </p>
                <Button asChild>
                  <Link href="/dashboard/properties/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Your First Property
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Messages */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-semibold">
              Recent Messages
            </h2>
            <Link
              href="/dashboard/messages"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {recentMessages.length > 0 ? (
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <Link
                  key={msg._id}
                  href={`/dashboard/messages?property=${msg.property._id}`}
                >
                  <Card className={cn(
                    "hover:bg-muted/50 transition-colors cursor-pointer",
                    !msg.isRead && "border-primary"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Property Thumbnail */}
                        {msg.property.images[0] && (
                          <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden">
                            <Image
                              src={msg.property.images[0].url}
                              alt={msg.property.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-medium text-sm truncate">
                              {msg.property.title}
                            </p>
                            {!msg.isRead && (
                              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            From {msg.sender.name}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {msg.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No messages yet
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
