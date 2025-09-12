"use client";

import { Suspense, useEffect } from "react";
import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { MetricCard } from "./metric-card";
import { QuickActionsCard } from "./quick-actions-card";
import { RealTimeJobsCard } from "./real-time-jobs-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

const DashboardContent = () => {
  const { data, isLoading, error, refresh } = useDashboardData();

  // Fetch data on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  if (isLoading && !data.stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const fallbackStats = {
    total_listings: 0,
    total_restaurants: 0,
    total_influencers: 0,
    total_videos: 0,
    ...data.stats,
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-effect backdrop-blur-sm bg-white/70 border border-orange-200/50 rounded-lg p-4">
        <div className="flex items-center gap-2">
          {data.lastUpdated && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {data.lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="cursor-pointer bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white border-orange-600"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 text-white ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="glass-effect backdrop-blur-sm bg-red-50/80 border border-red-200/50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-red-800 dark:text-red-200">Connection issue: {error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="cursor-pointer ml-4 bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white border-orange-600"
            >
              {isLoading ? "Retrying..." : "Retry"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Listings"
          value={fallbackStats.total_listings}
          description="Active food listings"
          isLoading={isLoading}
        />
        <MetricCard
          title="Restaurants"
          value={fallbackStats.total_restaurants}
          description="Registered restaurants"
          isLoading={isLoading}
        />
        <MetricCard
          title="Influencers"
          value={fallbackStats.total_influencers}
          description="Active influencers"
          isLoading={isLoading}
        />
        <MetricCard
          title="Videos"
          value={fallbackStats.total_videos}
          description="Total video content"
          isLoading={isLoading}
        />
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActionsCard />
        <RealTimeJobsCard jobs={data.jobs} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default DashboardContent