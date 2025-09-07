'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
// ScrollArea component not available, using div with overflow styling
import { Clock, CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';
import type { Job } from '@/lib/types/api';

interface RealTimeJobsCardProps {
  jobs: Job[];
  isLoading: boolean;
}

function getJobStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'running':
    case 'in_progress':
      return <Play className="h-4 w-4 text-blue-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
}

function getJobStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'running':
    case 'in_progress':
      return 'secondary';
    case 'pending':
      return 'outline';
    default:
      return 'outline';
  }
}

function formatJobDuration(startedAt?: string, completedAt?: string) {
  if (!startedAt) return 'Not started';
  
  const start = new Date(startedAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
  
  if (duration < 60) return `${duration}s`;
  if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
  return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
}

export function RealTimeJobsCard({ jobs, isLoading }: RealTimeJobsCardProps) {
  if (isLoading && jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            System Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentJobs = jobs.slice(0, 5); // Show only the 5 most recent jobs
  const runningJobs = jobs.filter(job => 
    job.status?.toLowerCase() === 'running' || job.status?.toLowerCase() === 'in_progress'
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            System Jobs
          </div>
          {runningJobs > 0 && (
            <Badge variant="secondary" className="animate-pulse">
              {runningJobs} running
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent jobs found</p>
          </div>
        ) : (
          <div className="h-64 overflow-y-auto">
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getJobStatusIcon(job.status || 'unknown')}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {job.title || job.job_type || 'Unknown Job'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatJobDuration(job.started_at, job.completed_at)}
                        </span>
                        {job.started_by && (
                          <span className="text-xs text-muted-foreground">
                            • by {job.started_by}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={getJobStatusVariant(job.status || 'unknown')}
                    className="ml-2 shrink-0"
                  >
                    {job.status || 'Unknown'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {jobs.length > 5 && (
          <div className="text-center mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Showing 5 of {jobs.length} jobs
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}