'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Home, 
  UserPlus, 
  HomeIcon, 
  MessageSquare, 
  Heart, 
  Star,
  TrendingUp 
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { AnalyticsData } from '@/types/analytics'

// Status colors matching design system
const STATUS_COLORS: Record<string, string> = {
  draft: 'hsl(var(--muted))',
  pending_review: 'hsl(38 48% 48%)', // accent color
  published: 'hsl(158 32% 24%)', // primary color
  rejected: 'hsl(0 62% 42%)', // destructive color
  rented: 'hsl(158 28% 45%)', // lighter primary
  sold: 'hsl(15 45% 40%)', // sale color
  archived: 'hsl(30 6% 42%)', // muted-foreground
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  rejected: 'Rejected',
  rented: 'Rented',
  sold: 'Sold',
  archived: 'Archived',
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/analytics')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch analytics')
        }

        setData(result.data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    // Re-trigger the useEffect by changing a dependency
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Platform insights and metrics</p>
        </div>

        {/* Loading skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="font-display text-2xl font-semibold mb-2">
                Failed to Load Analytics
              </h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { overview, propertyStatusBreakdown } = data

  // Format data for pie chart
  const chartData = propertyStatusBreakdown.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    status: item.status,
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold mb-2">Analytics</h1>
        <p className="text-muted-foreground">Platform insights and metrics</p>
      </div>

      {/* Overview Stats - Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-data tabular-nums font-semibold">
              {overview.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-data tabular-nums font-semibold">
              {overview.totalProperties.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-data tabular-nums font-semibold">
              {overview.newUsersThisMonth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Properties</CardTitle>
            <HomeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-data tabular-nums font-semibold">
              {overview.newPropertiesThisMonth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Published this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Stats - Row 2 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-data tabular-nums font-semibold">
              {overview.totalMessages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Platform engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-data tabular-nums font-semibold">
              {overview.totalFavorites.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Platform engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-data tabular-nums font-semibold">
              {overview.totalReviews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Platform engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Property Status Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Property Status Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">
            Breakdown of properties by current status
          </p>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || '#999'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString()} properties`,
                    'Count',
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No property data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
