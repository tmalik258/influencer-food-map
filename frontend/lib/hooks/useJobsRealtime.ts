import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Job } from '../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';

interface UseJobsRealtimeProps {
  onJobUpdate?: (job: Job) => void;
  onJobCreate?: (job: Job) => void;
  onJobDelete?: (jobId: string) => void;
}

export const useJobsRealtime = ({ onJobUpdate, onJobCreate, onJobDelete }: UseJobsRealtimeProps = {}) => {
  const supabase = createClient();

  const handleJobUpdate = useCallback((payload: RealtimePostgresChangesPayload<Job>) => {
    const job = payload.new as Job;
    const oldJob = payload.old as Job;
    
    console.log('Job update received:', { jobId: job.id, oldStatus: oldJob?.status, newStatus: job.status });
    
    if (onJobUpdate) {
      onJobUpdate(job);
    }

    // Show toast notification for status changes
    if (oldJob && oldJob.status !== job.status) {
      const statusMessage = getStatusChangeMessage(oldJob.status, job.status);
      if (statusMessage) {
        console.log('Showing status change toast:', statusMessage);
        toast.success(statusMessage, {
          description: `Job "${job.title}" status changed from ${oldJob.status} to ${job.status}`,
        });
      }
    }
  }, [onJobUpdate]);

  const handleJobCreate = useCallback((payload: RealtimePostgresChangesPayload<Job>) => {
    const job = payload.new as Job;
    
    console.log('Job create received:', { jobId: job.id, title: job.title });
    
    if (onJobCreate) {
      onJobCreate(job);
    }

    toast.success('New job created', {
      description: `Job "${job.title}" has been created`,
    });
  }, [onJobCreate]);

  const handleJobDelete = useCallback((payload: RealtimePostgresChangesPayload<Job>) => {
    const job = payload.old as Job;
    
    console.log('Job delete received:', { jobId: job.id, title: job.title });
    
    if (onJobDelete) {
      onJobDelete(job.id);
    }

    toast.info('Job deleted', {
      description: `Job "${job.title}" has been deleted`,
    });
  }, [onJobDelete]);

  useEffect(() => {
    console.log('Setting up Supabase realtime subscription...');
    
    const subscription = supabase
      .channel('jobs-realtime')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'jobs' },
        handleJobUpdate
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        handleJobCreate
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'jobs' },
        handleJobDelete
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from jobs realtime...');
      subscription.unsubscribe();
    };
  }, [handleJobUpdate, handleJobCreate, handleJobDelete]);
};

function getStatusChangeMessage(oldStatus: string, newStatus: string): string | null {
  const statusMessages: Record<string, Record<string, string>> = {
    'pending': {
      'running': 'Job started processing',
      'failed': 'Job failed to start',
    },
    'running': {
      'completed': 'Job completed successfully',
      'failed': 'Job failed',
      'cancelled': 'Job was cancelled',
    },
    'completed': {
      'running': 'Job restarted',
    },
    'failed': {
      'running': 'Job restarted',
      'pending': 'Job reset to pending',
    },
    'cancelled': {
      'running': 'Job restarted',
      'pending': 'Job reset to pending',
    },
  };

  return statusMessages[oldStatus]?.[newStatus] || null;
}