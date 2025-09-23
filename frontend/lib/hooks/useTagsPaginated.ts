'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tag } from '@/lib/types';
import { tagActions } from '@/lib/actions/tag-actions';

interface PaginatedTagsParams {
  name?: string;
  id?: string;
  city?: string;
  page?: number;
  limit?: number;
}

interface PaginatedTagsResponse {
  tags: Tag[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useTagsPaginated = (initialParams?: PaginatedTagsParams) => {
  const [data, setData] = useState<PaginatedTagsResponse>({
    tags: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PaginatedTagsParams>({
    page: 1,
    limit: 20,
    ...initialParams
  });

  const fetchTags = useCallback(async (searchParams?: PaginatedTagsParams) => {
    const currentParams = searchParams || params;
    const { page = 1, limit = 20, ...otherParams } = currentParams;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await tagActions.getTagsPaginated({
        ...otherParams,
        skip: (page - 1) * limit,
        limit
      });
      
      const tags = response.tags || [];
      const total = response.total || 0;
      const totalPages = Math.ceil(total / limit);
      
      setData({
        tags,
        total,
        page,
        limit,
        totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateParams = useCallback((newParams: Partial<PaginatedTagsParams>) => {
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
    fetchTags(params);
  }, [params, fetchTags]);

  return {
    ...data,
    loading,
    error,
    params,
    fetchTags,
    updateParams,
    goToPage,
    setSearchQuery,
    setCityFilter,
    setLimit,
    refetch: () => fetchTags(params)
  };
};