'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Users, MapPin, Video, FileText, AlertCircle } from 'lucide-react';
import { useSystemStats } from '@/lib/hooks';
import { MetricCard } from './metric-card';
import { RecentActivityCard } from './recent-activity-card';
import { QuickActionsCard } from './quick-actions-card';
import { DashboardStatusBar } from './dashboard-status-bar';



export function DashboardOverview() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useSystemStats();

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-300 rounded animate-pulse w-20" />
                <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-300 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const defaultStats = {
    total_restaurants: 0,
    total_influencers: 0,
    total_videos: 0,
    total_listings: 0,
    ...stats
  };

  return (
    <div className="space-y-6">
      {/* Time and Status Bar */}
      <DashboardStatusBar />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Restaurants"
          value={defaultStats.total_restaurants.toLocaleString()}
          description="Registered restaurants"
          icon={MapPin}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Total Influencers"
          value={defaultStats.total_influencers.toLocaleString()}
          description="Active influencers"
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Total Videos"
          value={defaultStats.total_videos.toLocaleString()}
          description="Processed videos"
          icon={Video}
          trend={{ value: 23, isPositive: true }}
        />
        <MetricCard
          title="Total Listings"
          value={defaultStats.total_listings.toLocaleString()}
          description="Restaurant listings"
          icon={FileText}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Dashboard Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivityCard />
        </div>
        <QuickActionsCard />
      </div>
    </div>
  );
}