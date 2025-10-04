'use client';

import { useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import type { Job } from '@/lib/types/api';

interface DashboardStats {
  total_restaurants: number;
  total_influencers: number;
  total_listings: number;
  total_videos: number;
  approved_listings: number;
  pending_listings: number;
  active_restaurants_with_listings: number;
  influencers_with_videos: number;
  listings_this_month: number;
  videos_this_month: number;
  restaurants_this_month: number;
  total_cities: number;
  total_countries: number;
  last_updated: string;
}

interface DashboardData {
  stats: DashboardStats | null;
  jobs: Job[];
  lastUpdated: Date | null;
}

interface UseDashboardDataReturn {
  data: DashboardData;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    jobs: [],
    lastUpdated: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch dashboard stats and jobs in parallel using the optimized endpoint
      const [statsResponse, jobsResponse] = await Promise.all([
        adminApi.get('/dashboard/overview/'),
        adminApi.get('/jobs/')
      ]);

      setData({
        stats: statsResponse.data,
        jobs: jobsResponse.data || [],
        lastUpdated: new Date()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}