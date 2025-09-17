'use client';

import { useState, useCallback } from 'react';
import api, { adminApi } from '@/lib/api';
import type { Job } from '@/lib/types/api';

interface SystemStats {
  total_listings: number;
  total_restaurants: number;
  total_influencers: number;
  total_videos: number;
}

interface RealTimeData {
  stats: SystemStats | null;
  jobs: Job[];
  lastUpdated: Date | null;
}

interface UseRealTimeDataReturn {
  data: RealTimeData;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRealTimeData(): UseRealTimeDataReturn {
  const [data, setData] = useState<RealTimeData>({
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

      // Fetch system stats and jobs in parallel
      const [statsData, jobsResponse] = await Promise.all([
        // System stats from multiple endpoints
        Promise.all([
          api.get('/restaurants/').then(res => res.data?.restaurants?.length || res.data?.length || 0),
          api.get('/influencers/').then(res => res.data?.influencers?.length || res.data?.length || 0),
          api.get('/listings/').then(res => res.data?.length || 0)
        ]).then(([restaurants, influencers, listings]) => ({
          total_restaurants: restaurants,
          total_influencers: influencers,
          total_listings: listings,
          total_videos: 0 // Placeholder - add when video endpoint is available
        })),
        // Jobs endpoint
        adminApi.get('/jobs/')
      ]);

      setData({
        stats: statsData,
        jobs: jobsResponse.data || [],
        lastUpdated: new Date()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Data fetch error:', err);
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