import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Calendar, Home, MessageSquare, Star, Heart } from 'lucide-react'
import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { User } from '@/models'
import { getUserDetailStats } from '@/services/admin.service'

interface UserDetail {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  emailVerified: boolean
  createdAt: string
  propertiesCount: number
  messagesCount: number
  reviewsCount: number
  favoritesCount: number
}

async function getUserDetail(id: string): Promise<UserDetail | null> {
  try {
    await connectDB()
    const user = await User.findById(id)
      .select('-password -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires')
      .lean()
    if (!user) return null
    const stats = await getUserDetailStats(id)
    return { ...user, ...stats } as UserDetail
  } catch {
    return null
  }
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUserDetail(id)

  if (!user) {
    notFound()
  }

  const stats = [
    {
      title: 'Properties',
      value: user.propertiesCount,
      icon: Home,
      description: 'Total listings created',
    },
    {
      title: 'Messages',
      value: user.messagesCount,
      icon: MessageSquare,
      description: 'Messages sent',
    },
    {
      title: 'Reviews',
      value: user.reviewsCount,
      icon: Star,
      description: 'Reviews written',
    },
    {
      title: 'Favorites',
      value: user.favoritesCount,
      icon: Heart,
      description: 'Properties favorited',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <Link href="/admin/users">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-semibold">{user.name}</h1>
          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
            {user.role}
          </Badge>
          {user.emailVerified && (
            <Badge variant="outline" className="text-primary border-primary">
              Verified
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{user.email}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
          <Calendar className="h-4 w-4" />
          <span>Joined {format(new Date(user.createdAt), 'MMMM d, yyyy')}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-data tabular-nums text-2xl">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-data text-sm">{user._id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Status</p>
              <p className="text-sm">
                {user.emailVerified ? 'Verified' : 'Unverified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="text-sm capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-sm">
                {format(new Date(user.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This user has created{' '}
            <span className="font-data tabular-nums text-foreground">
              {user.propertiesCount}
            </span>{' '}
            {user.propertiesCount === 1 ? 'property' : 'properties'}, sent{' '}
            <span className="font-data tabular-nums text-foreground">
              {user.messagesCount}
            </span>{' '}
            {user.messagesCount === 1 ? 'message' : 'messages'}, written{' '}
            <span className="font-data tabular-nums text-foreground">
              {user.reviewsCount}
            </span>{' '}
            {user.reviewsCount === 1 ? 'review' : 'reviews'}, and favorited{' '}
            <span className="font-data tabular-nums text-foreground">
              {user.favoritesCount}
            </span>{' '}
            {user.favoritesCount === 1 ? 'property' : 'properties'}.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
