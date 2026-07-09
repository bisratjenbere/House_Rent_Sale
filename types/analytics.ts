/**
 * Analytics data types for admin dashboard
 */

export interface OverviewStats {
  totalUsers: number;
  totalProperties: number;
  newUsersThisMonth: number;
  newPropertiesThisMonth: number;
  totalMessages: number;
  totalFavorites: number;
  totalReviews: number;
}

export interface PropertyStatusData {
  status: string;
  count: number;
}

export interface AnalyticsData {
  overview: OverviewStats;
  propertyStatusBreakdown: PropertyStatusData[];
}

export interface AnalyticsResponse {
  success: boolean;
  data?: AnalyticsData;
  error?: string;
}
