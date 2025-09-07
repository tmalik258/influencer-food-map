'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminActions, Job, JobsSummary, JobCreateRequest, JobUpdateRequest } from '@/lib/actions/admin-actions';

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminActions.getJobs();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    data: jobs,
    isLoading: loading,
    error,
    refetch: fetchJobs
  };
};

export const useJob = (jobId: string) => {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await adminActions.getJob(jobId);
      setJob(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return {
    job,
    loading,
    error,
    refetch: fetchJob
  };
};

export const useJobsSummary = () => {
  const [summary, setSummary] = useState<JobsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminActions.getJobsSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  };
};

export const useJobActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJob = useCallback(async (jobData: JobCreateRequest): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.createJob(jobData);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateJob = useCallback(async (jobId: string, jobData: JobUpdateRequest): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.updateJob(jobId, jobData);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const startJob = useCallback(async (jobId: string): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.startJob(jobId);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeJob = useCallback(async (jobId: string): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.completeJob(jobId);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const failJob = useCallback(async (jobId: string, errorMessage: string): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.failJob(jobId, errorMessage);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fail job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateJobProgress = useCallback(async (jobId: string, progress: number, processedItems?: number): Promise<Job | null> => {
    setLoading(true);
    setError(null);
    try {
      const job = await adminActions.updateJobProgress(jobId, progress, processedItems);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job progress');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createJob,
    updateJob,
    startJob,
    completeJob,
    failJob,
    updateJobProgress
  };
};

export const useDataSync = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerYouTubeScraping = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminActions.triggerYouTubeScraping();
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger YouTube scraping');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerNLPProcessing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminActions.triggerNLPProcessing();
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger NLP processing');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    triggerYouTubeScraping,
    triggerNLPProcessing
  };
};

export const useSystemStats = () => {
  const [stats, setStats] = useState<{
    total_listings: number;
    total_restaurants: number;
    total_influencers: number;
    total_videos: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminActions.getSystemStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data: stats,
    isLoading: loading,
    error,
    refetch: fetchStats
  };
};