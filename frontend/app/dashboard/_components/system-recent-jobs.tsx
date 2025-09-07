'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

import type { Job, SystemRecentJobsProps } from '@/lib/types';

export function SystemRecentJobs({ jobs }: SystemRecentJobsProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Recent Jobs</CardTitle>
        <CardDescription>
          Latest data synchronization and processing jobs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {job.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-orange-500" />
                )}
                {job.status === 'running' && (
                  <Clock className="h-4 w-4 text-orange-500 animate-spin" />
                )}
                {job.status === 'pending' && (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm font-medium">{job.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={job.status === 'completed' ? 'default' : 
                          job.status === 'running' ? 'secondary' : 'outline'}
                >
                  {job.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {job.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}