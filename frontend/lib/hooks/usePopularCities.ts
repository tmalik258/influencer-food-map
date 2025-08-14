'use client';

import { useState, useEffect, useCallback } from 'react';
import { restaurantActions } from '@/lib/actions';

export const usePopularCities = () => {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPopularCities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await restaurantActions.getPopularCities();
      setCities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch popular cities');
      // Fallback to default cities if API fails
      setCities(['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast']);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopularCities();
  }, [fetchPopularCities]);

  return {
    cities,
    loading,
    error,
    refetch: fetchPopularCities
  };
};