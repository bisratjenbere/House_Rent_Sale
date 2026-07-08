import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Home, Clock, FolderTree, Star } from 'lucide-react'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Property from '@/models/Property'
import Category from '@/models/Category'
import Amenity from '@/models/Amenity'

interface DashboardStats {
  totalUsers: number
  totalProperties: number
  pendingApprovals: number
  totalCategories: number
  totalAmenities: number
}

async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB()

  const [totalUsers, totalProperties, pendingApprovals, totalCategories, totalAmenities] =
    await Promise.all([
      User.countDocuments({}),
      Property.countDocuments({}),
      Property.countDocuments({ status: 'pending_review' }),
      Category.countDocuments({}),
      Amenity.countDocuments({}),
    ])

  return {
    totalUsers,
    totalProperties,
    pendingApprovals,
    totalCategories,
    totalAmenities,
  }
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      href: '/admin/users',
    },
    {
      title: 'Total Properties',
      value: stats.totalProperties,
      icon: Home,
      href: '/admin/properties',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      href: '/admin/properties?status=pending_review',
      highlight: stats.pendingApprovals > 0,
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: FolderTree,
      href: '/admin/categories',
    },
    {
      title: 'Amenities',
      value: stats.totalAmenities,
      icon: Star,
      href: '/admin/amenities',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Platform overview and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const CardWrapper = stat.href
            ? ({ children }: { children: React.ReactNode }) => (
                <Link href={stat.href}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    {children}
                  </Card>
                </Link>
              )
            : ({ children }: { children: React.ReactNode }) => (
                <Card>{children}</Card>
              )

          return (
            <CardWrapper key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`font-data tabular-nums text-2xl ${
                    stat.highlight ? 'text-accent' : ''
                  }`}
                >
                  {stat.value}
                </div>
              </CardContent>
            </CardWrapper>
          )
        })}
      </div>

      {/* Quick Actions */}
      {stats.pendingApprovals > 0 && (
        <Card className="border-accent/50">
          <CardHeader>
            <CardTitle className="text-lg">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You have{' '}
              <span className="font-data tabular-nums text-foreground">
                {stats.pendingApprovals}
              </span>{' '}
              {stats.pendingApprovals === 1 ? 'property' : 'properties'}{' '}
              waiting for approval.
            </p>
            <Link
              href="/admin/properties?status=pending_review"
              className="inline-flex items-center px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Review Pending Properties
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
