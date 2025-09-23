'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cuisine } from '@/lib/types';
import { cuisineActions } from '@/lib/actions/cuisine-actions';

interface PaginatedCuisinesParams {
  name?: string;
  id?: string;
  city?: string;
  page?: number;
  limit?: number;
}

interface PaginatedCuisinesResponse {
  cuisines: Cuisine[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useCuisinesPaginated = (initialParams?: PaginatedCuisinesParams) => {
  const [data, setData] = useState<PaginatedCuisinesResponse>({
    cuisines: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PaginatedCuisinesParams>({
    page: 1,
    limit: 20,
    ...initialParams
  });

  const fetchCuisines = useCallback(async (searchParams?: PaginatedCuisinesParams) => {
    const currentParams = searchParams || params;
    const { page = 1, limit = 20, ...otherParams } = currentParams;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await cuisineActions.getCuisinesPaginated({
        ...otherParams,
        skip: (page - 1) * limit,
        limit
      });
      
      const cuisines = response.cuisines || [];
      const total = response.total || 0;
      const totalPages = Math.ceil(total / limit);
      
      setData({
        cuisines,
        total,
        page,
        limit,
        totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cuisines');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateParams = useCallback((newParams: Partial<PaginatedCuisinesParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const goToPage = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  const setSearchQuery = useCallback((name: string) => {
    updateParams({ name, page: 1 }); // Reset to first page when searching
  }, [updateParams]);

  const setCityFilter = useCallback((city: string) => {
    updateParams({ city, page: 1 }); // Reset to first page when filtering by city
  }, [updateParams]);

  const setLimit = useCallback((limit: number) => {
    updateParams({ limit, page: 1 }); // Reset to first page when changing limit
  }, [updateParams]);

  useEffect(() => {
    fetchCuisines(params);
  }, [params, fetchCuisines]);

  return {
    ...data,
    loading,
    error,
    params,
    fetchCuisines,
    updateParams,
    goToPage,
    setSearchQuery,
    setCityFilter,
    setLimit,
    refetch: () => fetchCuisines(params)
  };
};