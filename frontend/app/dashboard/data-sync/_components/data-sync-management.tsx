"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Play, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useJobs, useDataSync } from "@/lib/hooks";
import LoadingSkeleton from "@/components/loading-skeleton";

import type { JobCardProps } from '@/lib/types';

function JobCard({ job, onTrigger }: JobCardProps) {
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(job.status)}
            <CardTitle className="text-lg">{job.title}</CardTitle>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {job.status}
          </Badge>
        </div>
        <CardDescription>{job.description}</CardDescription>
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
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Started:</span>
              <p className="font-medium">
                {job.started_at ? new Date(job.started_at).toLocaleString() : "Not started"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Completed:</span>
              <p className="font-medium">
                {job.completed_at ? new Date(job.completed_at).toLocaleString() : "Not completed"}
              </p>
            </div>
          </div>

          {job.error_message && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-800">{job.error_message}</p>
            </div>
          )}

          {job.status !== "running" && (
            <Button 
              onClick={() => onTrigger(job.job_type)}
              className="w-full"
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Restart Job
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DataSyncManagement() {
  const { data: jobs, isLoading, error, refetch } = useJobs();
  const { triggerYouTubeScraping, triggerNLPProcessing } = useDataSync();
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
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-orange-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load jobs: {error}</p>
            <Button onClick={() => refetch()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
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
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Trigger data synchronization processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => handleTriggerJob("youtube_scraping")}
              disabled={triggering === "youtube_scraping"}
              className="h-auto p-4 flex flex-col items-start"
            >
              <div className="flex items-center gap-2 mb-2">
                {triggering === "youtube_scraping" ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                <span className="font-semibold">YouTube Scraping</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Scrape new videos and update existing data
              </span>
            </Button>
            
            <Button 
              onClick={() => handleTriggerJob("nlp_processing")}
              disabled={triggering === "nlp_processing"}
              className="h-auto p-4 flex flex-col items-start"
              variant="outline"
            >
              <div className="flex items-center gap-2 mb-2">
                {triggering === "nlp_processing" ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                <span className="font-semibold">NLP Processing</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Process video content and extract insights
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Status Tabs */}
      <Tabs defaultValue="running" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="running" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Running ({runningJobs.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="failed" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Failed ({failedJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="running" className="space-y-4">
          {runningJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No running jobs
              </CardContent>
            </Card>
          ) : (
            runningJobs.map(job => (
              <JobCard key={job.id} job={job} onTrigger={handleTriggerJob} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No completed jobs
              </CardContent>
            </Card>
          ) : (
            completedJobs.map(job => (
              <JobCard key={job.id} job={job} onTrigger={handleTriggerJob} />
            ))
          )}
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          {failedJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No failed jobs
              </CardContent>
            </Card>
          ) : (
            failedJobs.map(job => (
              <JobCard key={job.id} job={job} onTrigger={handleTriggerJob} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}