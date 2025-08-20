"use client";

import { useState, useCallback, useRef } from 'react';
import { useRetry } from '@/components/retry-wrapper';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

interface UseApiWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useApiWithRetry<T>(
  apiFunction: () => Promise<T>,
  options: UseApiWithRetryOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  });

  const { executeWithRetry, retryState, resetRetries } = useRetry(maxRetries, retryDelay);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      await executeWithRetry(async () => {
        const result = await apiFunction();
        
        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Request was cancelled');
        }

        setState({
          data: result,
          loading: false,
          error: null,
          retryCount: 0
        });

        onSuccess?.();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        retryCount: retryState.retryCount
      }));

      onError?.(error as Error);
    }
  }, [apiFunction, executeWithRetry, retryState.retryCount, onSuccess, onError]);

  const reset = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0
    });
    
    resetRetries();
  }, [resetRetries]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState(prev => ({
      ...prev,
      loading: false
    }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    cancel,
    isRetrying: retryState.isRetrying,
    canRetry: retryState.retryCount < maxRetries
  };
}

// Specialized hook for paginated data
export function usePaginatedApiWithRetry<T>(
  apiFunction: (page: number, limit: number) => Promise<{ data: T[]; total: number; page: number; limit: number }>,
  options: UseApiWithRetryOptions & { initialPage?: number; initialLimit?: number } = {}
) {
  const { initialPage = 1, initialLimit = 10, ...retryOptions } = options;
  
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    hasMore: false
  });

  const apiWithRetry = useApiWithRetry(
    () => apiFunction(pagination.page, pagination.limit),
    retryOptions
  );

  const loadPage = useCallback(async (page: number, limit?: number) => {
    const newLimit = limit || pagination.limit;
    setPagination(prev => ({ ...prev, page, limit: newLimit }));
    
    const result = await apiWithRetry.execute();
    if (result && 'data' in result) {
      setPagination(prev => ({
        ...prev,
        total: result.total,
        hasMore: (result.page * result.limit) < result.total
      }));
    }
  }, [apiWithRetry, pagination.limit]);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !apiWithRetry.loading) {
      loadPage(pagination.page + 1);
    }
  }, [loadPage, pagination.hasMore, pagination.page, apiWithRetry.loading]);

  const refresh = useCallback(() => {
    loadPage(1, pagination.limit);
  }, [loadPage, pagination.limit]);

  return {
    ...apiWithRetry,
    pagination,
    loadPage,
    loadMore,
    refresh,
    items: apiWithRetry.data?.data || []
  };
}