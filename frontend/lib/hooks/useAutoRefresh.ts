"use client";

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoRefreshOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
  onRefresh?: () => Promise<void> | void;
  pauseOnError?: boolean;
  pauseOnHidden?: boolean; // pause when tab is not visible
  maxRetries?: number;
}

interface AutoRefreshState {
  isActive: boolean;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
  errorCount: number;
  isPaused: boolean;
}

export function useAutoRefresh({
  interval = 30000, // 30 seconds default
  enabled = true,
  onRefresh,
  pauseOnError = true,
  pauseOnHidden = true,
  maxRetries = 3
}: UseAutoRefreshOptions = {}) {
  const [state, setState] = useState<AutoRefreshState>({
    isActive: false,
    lastRefresh: null,
    nextRefresh: null,
    errorCount: 0,
    isPaused: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Handle visibility change
  useEffect(() => {
    if (!pauseOnHidden) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      setState(prev => ({
        ...prev,
        isPaused: document.hidden
      }));

      if (!document.hidden && enabled) {
        // Resume refresh when tab becomes visible
        startAutoRefresh();
      } else if (document.hidden) {
        // Pause refresh when tab is hidden
        stopAutoRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, pauseOnHidden]);

  const executeRefresh = useCallback(async () => {
    if (!onRefresh) return;

    try {
      await onRefresh();
      
      setState(prev => ({
        ...prev,
        lastRefresh: new Date(),
        nextRefresh: new Date(Date.now() + interval),
        errorCount: 0
      }));
    } catch (error) {
      console.error('Auto refresh failed:', error);
      
      setState(prev => {
        const newErrorCount = prev.errorCount + 1;
        const shouldPause = pauseOnError && newErrorCount >= maxRetries;
        
        return {
          ...prev,
          errorCount: newErrorCount,
          isPaused: shouldPause,
          isActive: !shouldPause
        };
      });

      // Stop auto refresh if max retries exceeded
      if (pauseOnError && state.errorCount + 1 >= maxRetries) {
        stopAutoRefresh();
      }
    }
  }, [onRefresh, interval, pauseOnError, maxRetries, state.errorCount]);

  const startAutoRefresh = useCallback(() => {
    if (!enabled || !onRefresh || (pauseOnHidden && !isVisibleRef.current)) {
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      nextRefresh: new Date(Date.now() + interval)
    }));

    intervalRef.current = setInterval(executeRefresh, interval);
  }, [enabled, onRefresh, pauseOnHidden, interval, executeRefresh]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      nextRefresh: null
    }));
  }, []);

  const pauseAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      isPaused: true,
      nextRefresh: null
    }));
  }, []);

  const resumeAutoRefresh = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false, errorCount: 0 }));
    startAutoRefresh();
  }, [startAutoRefresh]);

  const refreshNow = useCallback(async () => {
    await executeRefresh();
    
    // Restart the interval
    if (state.isActive) {
      startAutoRefresh();
    }
  }, [executeRefresh, state.isActive, startAutoRefresh]);

  // Start/stop based on enabled state
  useEffect(() => {
    if (enabled && !state.isPaused) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [enabled, state.isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startAutoRefresh,
    stopAutoRefresh,
    pauseAutoRefresh,
    resumeAutoRefresh,
    refreshNow,
    timeUntilNextRefresh: state.nextRefresh 
      ? Math.max(0, state.nextRefresh.getTime() - Date.now())
      : 0
  };
}

// Hook for managing multiple auto-refresh instances
export function useMultipleAutoRefresh(configs: Array<{
  key: string;
  onRefresh: () => Promise<void> | void;
  interval?: number;
  enabled?: boolean;
}>) {
  const refreshStates = configs.map(config => 
    useAutoRefresh({
      interval: config.interval,
      enabled: config.enabled,
      onRefresh: config.onRefresh
    })
  );

  const startAll = useCallback(() => {
    refreshStates.forEach(state => state.startAutoRefresh());
  }, [refreshStates]);

  const stopAll = useCallback(() => {
    refreshStates.forEach(state => state.stopAutoRefresh());
  }, [refreshStates]);

  const pauseAll = useCallback(() => {
    refreshStates.forEach(state => state.pauseAutoRefresh());
  }, [refreshStates]);

  const resumeAll = useCallback(() => {
    refreshStates.forEach(state => state.resumeAutoRefresh());
  }, [refreshStates]);

  const refreshAll = useCallback(async () => {
    await Promise.all(refreshStates.map(state => state.refreshNow()));
  }, [refreshStates]);

  return {
    states: refreshStates.reduce((acc, state, index) => {
      acc[configs[index].key] = state;
      return acc;
    }, {} as Record<string, typeof refreshStates[0]>),
    startAll,
    stopAll,
    pauseAll,
    resumeAll,
    refreshAll,
    isAnyActive: refreshStates.some(state => state.isActive),
    areAllPaused: refreshStates.every(state => state.isPaused)
  };
}