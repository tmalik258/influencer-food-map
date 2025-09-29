"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Play, AlertCircle, CheckCircle, Clock, X, Activity, Timer, TrendingUp, BarChart3 } from "lucide-react";
import { useJobs, useDataSync, useJobActions } from "@/lib/hooks";
import DashboardLoadingSkeleton from "@/app/dashboard/_components/dashboard-loading-skeleton";
import { JobAnalyticsDashboard } from "./job-analytics-dashboard";
import JobsTable from "./jobs-table";

import type { JobCardProps } from '@/lib/types';

function JobCard({ job, onTrigger, cancelJob }: JobCardProps & { cancelJob: (jobId: string, reason?: string) => Promise<void> }) {
  const [cancelling, setCancelling] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-orange-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-orange-100 text-orange-800";
      case "running":
        return "bg-orange-100 text-orange-800";
      case "failed":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const progress = job.total_items > 0 ? (job.processed_items / job.total_items) * 100 : 0;

  const handleCancelJob = async () => {
    setCancelling(true);
    try {
      await cancelJob(job.id, 'Cancelled by user from dashboard');
      // Optionally trigger a refetch of jobs to update the UI
    } catch (error) {
      console.error('Failed to cancel job:', error);
    } finally {
      setCancelling(false);
    }
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return 'Not started';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatEstimatedTime = (estimatedTime?: string) => {
    if (!estimatedTime) return 'Unknown';
    const estimated = new Date(estimatedTime);
    const now = new Date();
    const remaining = Math.max(0, Math.floor((estimated.getTime() - now.getTime()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return remaining > 0 ? `${minutes}m ${seconds}s remaining` : 'Completing...';
  };

  return (
    <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(job.status)}
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{job.title}</CardTitle>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {job.status}
          </Badge>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">{job.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {job.status === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{job.processed_items} / {job.total_items}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {/* Enhanced Job Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Started:</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {job.started_at ? new Date(job.started_at).toLocaleString() : "Not started"}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatDuration(job.started_at, job.completed_at)}
              </p>
            </div>
          </div>

          {/* Advanced Tracking Info for Running Jobs */}
          {job.status === "running" && (
            <div className="space-y-3 p-3 bg-orange-50/50 border border-orange-200/50 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {job.queue_size !== undefined && (
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <span className="text-gray-600">Queue:</span>
                    <span className="font-medium text-gray-900">{job.queue_size}</span>
                  </div>
                )}
                {job.items_in_progress !== undefined && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-orange-600" />
                    <span className="text-gray-600">In Progress:</span>
                    <span className="font-medium text-gray-900">{job.items_in_progress}</span>
                  </div>
                )}
                {job.failed_items !== undefined && job.failed_items > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-gray-600">Failed:</span>
                    <span className="font-medium text-red-600">{job.failed_items}</span>
                  </div>
                )}
                {job.processing_rate !== undefined && job.processing_rate !== null && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-medium text-green-600">{typeof job.processing_rate === 'number' ? job.processing_rate.toFixed(1) : '0.0'}/min</span>
                  </div>
                )}
              </div>
              
              {job.estimated_completion_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">ETA:</span>
                  <span className="font-medium text-blue-600">{formatEstimatedTime(job.estimated_completion_time)}</span>
                </div>
              )}
              
              {job.retry_count !== undefined && job.retry_count > 0 && (
                <div className="text-sm text-amber-600">
                  Retries: {job.retry_count}{job.max_retries ? `/${job.max_retries}` : ''}
                </div>
              )}
            </div>
          )}

          {/* Cancellation Status */}
          {job.cancellation_requested && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <X className="h-4 w-4" />
                <span>Cancellation requested</span>
                {job.cancelled_by && <span>by {job.cancelled_by}</span>}
              </div>
              {job.cancelled_at && (
                <p className="text-xs text-red-600 mt-1">
                  {new Date(job.cancelled_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {job.error_message && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-800">{job.error_message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {job.status === "running" && !job.cancellation_requested && (
              <Button 
                onClick={handleCancelJob}
                disabled={cancelling}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                {cancelling ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                {cancelling ? 'Cancelling...' : 'Cancel Job'}
              </Button>
            )}
            
            {job.status !== "running" && (
              <Button 
                onClick={() => onTrigger(job.job_type)}
                className="flex-1 bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white"
              >
                <Play className="h-4 w-4 mr-2 text-white" />
                Restart Job
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DataSyncManagement() {
  const { data: jobs, isLoading, error, refetch } = useJobs();
  const { triggerYouTubeScraping, triggerNLPProcessing } = useDataSync();
  const { cancelJob } = useJobActions();
  const [triggering, setTriggering] = useState<string | null>(null);

  const handleTriggerJob = async (type: string) => {
    setTriggering(type);
    try {
      if (type === "youtube_scraping") {
        await triggerYouTubeScraping();
      } else if (type === "nlp_processing") {
        await triggerNLPProcessing();
      }
      // Refetch jobs after triggering
      setTimeout(() => refetch(), 1000);
    } catch (error) {
      console.error("Failed to trigger job:", error);
    } finally {
      setTriggering(null);
    }
  };

  if (isLoading) {
    return <DashboardLoadingSkeleton variant="management" />;
  }

  if (error) {
    return (
      <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center text-orange-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load jobs: {error}</p>
            <Button onClick={() => refetch()} className="mt-4 bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white">
              <RefreshCw className="h-4 w-4 mr-2 text-white" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const runningJobs = jobs?.filter(job => job.status === "running") || [];
  const completedJobs = jobs?.filter(job => job.status === "completed") || [];
  const failedJobs = jobs?.filter(job => job.status === "failed") || [];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Quick Actions</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Trigger data synchronization processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => handleTriggerJob("youtube_scraping")}
              disabled={triggering === "youtube_scraping"}
              className="h-auto p-4 flex flex-col items-start bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white"
            >
              <div className="flex items-center gap-2 mb-2">
                {triggering === "youtube_scraping" ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
                <span className="font-semibold">YouTube Scraping</span>
              </div>
              <span className="text-sm text-orange-100 text-left">
                Scrape new videos and update existing data
              </span>
            </Button>
            
            <Button 
              onClick={() => handleTriggerJob("nlp_processing")}
              disabled={triggering === "nlp_processing"}
              className="h-auto p-4 flex flex-col items-start shadow-lg bg-white/70 border-orange-200/50 hover:bg-orange-600 cursor-pointer focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-gray-900 hover:text-white dark:text-gray-100 group"
            >
              <div className="flex items-center gap-2 mb-2">
                {triggering === "nlp_processing" ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 text-orange-600 group-hover:text-white" />
                )}
                <span className="font-semibold">NLP Processing</span>
              </div>
              <span className="text-sm text-gray-600 group-hover:text-orange-100 dark:text-gray-400 text-left">
                Process video content and extract insights
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Status and Analytics Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 glass-effect backdrop-blur-sm bg-white/70 border border-orange-200/50">
          <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <Activity className="h-4 w-4 text-orange-600 data-[state=active]:text-white" />
            All Jobs ({jobs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="running" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <RefreshCw className="h-4 w-4 text-orange-600 data-[state=active]:text-white" />
            Running ({runningJobs.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <CheckCircle className="h-4 w-4 text-orange-600 data-[state=active]:text-white" />
            Completed ({completedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="failed" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <AlertCircle className="h-4 w-4 text-orange-600 data-[state=active]:text-white" />
            Failed ({failedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 text-orange-600 data-[state=active]:text-white" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <JobsTable jobs={jobs || []} onRefresh={refetch} />
        </TabsContent>

        <TabsContent value="running" className="space-y-4">
          {runningJobs.length === 0 ? (
            <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
              <CardContent className="pt-6 text-center text-gray-600 dark:text-gray-400">
                No running jobs
              </CardContent>
            </Card>
          ) : (
            runningJobs.map(job => (
              <JobCard key={job.id} job={job} onTrigger={handleTriggerJob} cancelJob={async (jobId, reason) => { await cancelJob(jobId, reason); }} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedJobs.length === 0 ? (
            <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
              <CardContent className="pt-6 text-center text-gray-600 dark:text-gray-400">
                No completed jobs
              </CardContent>
            </Card>
          ) : (
            completedJobs.map(job => (
              <JobCard key={job.id} job={job} onTrigger={handleTriggerJob} cancelJob={async (jobId, reason) => { await cancelJob(jobId, reason); }} />
            ))
          )}
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          {failedJobs.length === 0 ? (
            <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
              <CardContent className="pt-6 text-center text-gray-600 dark:text-gray-400">
                No failed jobs
              </CardContent>
            </Card>
          ) : (
            failedJobs.map(job => (
              <JobCard key={job.id} job={job} onTrigger={handleTriggerJob} cancelJob={async (jobId, reason) => { await cancelJob(jobId, reason); }} />
            ))
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <JobAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}