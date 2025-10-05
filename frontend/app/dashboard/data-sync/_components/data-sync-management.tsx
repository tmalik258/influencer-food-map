"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Play, AlertCircle, CheckCircle, Activity } from "lucide-react";
import { useJobs, useDataSync, useJobActions } from "@/lib/hooks";
import DashboardLoadingSkeleton from "@/app/dashboard/_components/dashboard-loading-skeleton";
import JobsTable from "./jobs-table";

import { JobCard } from "./job-card";
import { useDashboardRealtime } from "@/lib/contexts/dashboard-realtime-context";

export function DataSyncManagement() {
  const { data: jobs, isLoading, error, refetch } = useJobs();
  const { triggerYouTubeScraping, triggerNLPProcessing } = useDataSync();
  const { cancelJob } = useJobActions();
  const [triggering, setTriggering] = useState<string | null>(null);
  const { version } = useDashboardRealtime();

  // Refresh jobs when any realtime job event occurs
  useEffect(() => {
    refetch();
  }, [version, refetch]);

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
        <TabsList className="grid w-full grid-cols-4 glass-effect backdrop-blur-sm bg-white/70 border border-orange-200/50">
          <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <Activity className="h-4 w-4 text-orange-600 data-[state=active]:text-white" />
            All Jobs ({jobs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="running" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <RefreshCw className="h-4 w-4 text-orange-600 data-[state=active]:text-white" />
            Running ({runningJobs.length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <CheckCircle className="h-4 w-4 text-orange-600 data-[state=active]:text-white" />
            Completed ({completedJobs.length || 0})
          </TabsTrigger>
          <TabsTrigger value="failed" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <AlertCircle className="h-4 w-4 text-orange-600 data-[state=active]:text-white" />
            Failed ({failedJobs.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <JobsTable jobs={jobs} onRefresh={refetch} />
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
      </Tabs>
    </div>
  );
}