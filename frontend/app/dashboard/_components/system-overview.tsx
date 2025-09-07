'use client';

import { useSystemStats, useJobs } from '@/lib/hooks';
import { SystemMetricCards } from './system-metric-cards';
import { SystemApprovalRate } from './system-approval-rate';
import { SystemRecentJobs } from './system-recent-jobs';
import { SystemLoadingSkeleton } from './system-loading-skeleton';

export function SystemOverview() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useSystemStats();
  const { data: jobs, isLoading: jobsLoading } = useJobs();

  // Fallback to mock data if hooks return no data
  // const defaultStats = {
  //   totalListings: 1247,
  //   approvedListings: 892,
  //   pendingListings: 355,
  //   totalRestaurants: 324,
  //   totalInfluencers: 89,
  //   totalVideos: 1156
  // };

  // const currentStats = stats || defaultStats;
  const recentJobs = jobs || [
    { id: '1', type: 'YouTube Scraping', status: 'completed', progress: 100 },
    { id: '2', type: 'NLP Processing', status: 'running', progress: 67 },
    { id: '3', type: 'Data Sync', status: 'pending', progress: 0 }
  ];

  // const approvalRate = Math.round((currentStats.approvedListings / currentStats.totalListings) * 100);

  if (statsLoading) {
    return <SystemLoadingSkeleton />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* <SystemMetricCards stats={currentStats} />
      
      <SystemApprovalRate 
        approvedListings={currentStats.approvedListings}
        totalListings={currentStats.totalListings}
        pendingListings={currentStats.pendingListings}
      /> */}
      
      <SystemRecentJobs jobs={recentJobs} />
    </div>
  );
}