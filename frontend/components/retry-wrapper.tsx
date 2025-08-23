"use client";

import React, { useState, useCallback } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RetryWrapperProps {
  children: React.ReactNode;
  onRetry: () => Promise<void> | void;
  maxRetries?: number;
  retryDelay?: number;
  fallback?: React.ReactNode;
  className?: string;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError?: Error;
}

export default function RetryWrapper({
  children,
  onRetry,
  maxRetries = 3,
  retryDelay = 1000,
  fallback,
  className = ""
}: RetryWrapperProps) {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0
  });
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = useCallback(async () => {
    if (retryState.retryCount >= maxRetries) {
      return;
    }

    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1
    }));

    try {
      // Add delay before retry
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      await onRetry();
      
      // Reset retry state on success
      setRetryState({
        isRetrying: false,
        retryCount: 0
      });
    } catch (error) {
      console.error('Retry failed:', error);
      setRetryState(prev => ({
        ...prev,
        isRetrying: false,
        lastError: error as Error
      }));
    }
  }, [onRetry, retryState.retryCount, maxRetries, retryDelay]);

  const resetRetries = useCallback(() => {
    setRetryState({
      isRetrying: false,
      retryCount: 0
    });
  }, []);

  // Show network status if offline
  if (!isOnline) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <WifiOff className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              No Internet Connection
            </h3>
            <p className="text-yellow-700 mb-4">
              Please check your internet connection and try again.
            </p>
            <Button 
              onClick={handleRetry}
              variant="outline"
              className="cursor-pointer border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              disabled={retryState.isRetrying}
            >
              <Wifi className="w-4 h-4 mr-2" />
              {retryState.isRetrying ? 'Checking...' : 'Check Connection'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show retry UI if max retries exceeded
  if (retryState.retryCount >= maxRetries) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        {fallback || (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <RefreshCw className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Unable to Load Content
              </h3>
              <p className="text-red-700 mb-4">
                We&apos;ve tried {maxRetries} times but couldn&apos;t load the content. 
                Please try again later or contact support if the problem persists.
              </p>
              {retryState.lastError && (
                <p className="text-sm text-red-600 bg-red-100 p-2 rounded mb-4">
                  Error: {retryState.lastError.message}
                </p>
              )}
              <Button 
                onClick={resetRetries}
                variant="outline"
                className="cursor-pointer border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset & Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {children}
      {retryState.isRetrying && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-700">
                Retrying... ({retryState.retryCount}/{maxRetries})
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Hook for using retry logic in components
export function useRetry<T_Result>(maxRetries = 3, retryDelay = 1000) {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0
  });

  const executeWithRetry = useCallback(async (fn: () => Promise<T_Result>) => {
    let currentRetry = 0;
    
    while (currentRetry <= maxRetries) {
      try {
        setRetryState({
          isRetrying: currentRetry > 0,
          retryCount: currentRetry
        });
        
        const result = await fn();
        
        // Success - reset state
        setRetryState({
          isRetrying: false,
          retryCount: 0
        });
        return result;
      } catch (error) {
        currentRetry++;
        
        if (currentRetry > maxRetries) {
          setRetryState({
            isRetrying: false,
            retryCount: currentRetry - 1,
            lastError: error as Error
          });
          throw error;
        }
        
        // Wait before retry
        if (retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }, [maxRetries, retryDelay]);

  return {
    executeWithRetry,
    retryState,
    resetRetries: () => setRetryState({ isRetrying: false, retryCount: 0 })
  };
}