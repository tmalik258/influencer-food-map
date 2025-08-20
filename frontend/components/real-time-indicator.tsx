"use client";

import { useState, useEffect } from 'react';
import { Clock, Wifi, WifiOff, RefreshCw, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RealTimeIndicatorProps {
  isActive: boolean;
  isPaused: boolean;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
  errorCount: number;
  timeUntilNextRefresh: number;
  onPause: () => void;
  onResume: () => void;
  onRefreshNow: () => void;
  className?: string;
}

export function RealTimeIndicator({
  isActive,
  isPaused,
  lastRefresh,
  nextRefresh,
  errorCount,
  timeUntilNextRefresh,
  onPause,
  onResume,
  onRefreshNow,
  className = ""
}: RealTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeUntilNext = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatLastRefresh = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    }
    return `${diffSeconds}s ago`;
  };

  const getStatusColor = () => {
    if (errorCount > 0) return 'destructive';
    if (isPaused) return 'secondary';
    if (isActive) return 'default';
    return 'outline';
  };

  const getStatusIcon = () => {
    if (errorCount > 0) return <WifiOff className="h-3 w-3" />;
    if (isPaused) return <Pause className="h-3 w-3" />;
    if (isActive) return <Wifi className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (errorCount > 0) return `Error (${errorCount})`;
    if (isPaused) return 'Paused';
    if (isActive) return 'Live';
    return 'Offline';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Badge */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            <span className="text-xs">{getStatusText()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p><strong>Status:</strong> {getStatusText()}</p>
            {lastRefresh && (
              <p><strong>Last update:</strong> {formatLastRefresh(lastRefresh)}</p>
            )}
            {isActive && nextRefresh && (
              <p><strong>Next update:</strong> {formatTimeUntilNext(timeUntilNextRefresh)}</p>
            )}
            {errorCount > 0 && (
              <p className="text-red-500"><strong>Errors:</strong> {errorCount}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

        {/* Countdown */}
        {isActive && !isPaused && timeUntilNextRefresh > 0 && (
          <span className="text-xs text-muted-foreground font-mono">
            {formatTimeUntilNext(timeUntilNextRefresh)}
          </span>
        )}

        {/* Control Buttons */}
        <div className="flex items-center gap-1">
          {/* Pause/Resume Button */}
          {isActive && !isPaused ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPause}
                  className="h-6 w-6 p-0"
                >
                  <Pause className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pause auto-refresh</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResume}
                  className="h-6 w-6 p-0"
                >
                  <Play className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Resume auto-refresh</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Refresh Now Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefreshNow}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh now</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
  );
}

// Compact version for mobile/small spaces
export function CompactRealTimeIndicator({
  isActive,
  isPaused,
  errorCount,
  timeUntilNextRefresh,
  onRefreshNow,
  className = ""
}: Pick<RealTimeIndicatorProps, 'isActive' | 'isPaused' | 'errorCount' | 'timeUntilNextRefresh' | 'onRefreshNow' | 'className'>) {
  const getStatusColor = () => {
    if (errorCount > 0) return 'text-red-500';
    if (isPaused) return 'text-yellow-500';
    if (isActive) return 'text-green-500';
    return 'text-gray-400';
  };

  const formatTimeUntilNext = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `0:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefreshNow}
          className={`flex items-center gap-1 h-6 px-2 ${className}`}
        >
          <div className={`h-2 w-2 rounded-full ${getStatusColor()} ${isActive && !isPaused ? 'animate-pulse' : ''}`} />
          {isActive && !isPaused && timeUntilNextRefresh > 0 && (
            <span className="text-xs font-mono">
              {formatTimeUntilNext(timeUntilNextRefresh)}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Auto-refresh {isActive ? (isPaused ? 'paused' : 'active') : 'inactive'}</p>
        {errorCount > 0 && <p className="text-red-500">Errors: {errorCount}</p>}
        <p>Click to refresh now</p>
      </TooltipContent>
    </Tooltip>
  );
}