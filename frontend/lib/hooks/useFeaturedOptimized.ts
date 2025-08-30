'use client';

import { useState, useEffect, useCallback } from 'react';
import { OptimizedFeaturedResponse } from '@/lib/types';
import { restaurantActions } from '@/lib/actions';

export const useFeaturedOptimized = () => {
  const [data, setData] = useState<OptimizedFeaturedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await restaurantActions.getFeaturedOptimized();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch featured data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedData();
  }, [fetchFeaturedData]);

  return {
    data,
    loading,
    error,
    refetch: fetchFeaturedData
  };
};