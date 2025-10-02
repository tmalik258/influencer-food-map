"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Activity, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Trash2 } from "lucide-react";
import { useJobAnalytics, useActiveJobs, useJobManagement } from "@/lib/hooks";
import DashboardLoadingSkeleton from "@/app/dashboard/_components/dashboard-loading-skeleton";
import { ActiveJobsTable } from "./active-jobs-table";
import { AnalyticsCard } from "./analytics-card";

export function JobAnalyticsDashboard() {
  const { analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useJobAnalytics();
  const { activeJobs, loading: activeJobsLoading, error: activeJobsError, refetch: refetchActiveJobs } = useActiveJobs();
  const { cleanupStaleJobs } = useJobManagement();
  const [cleaningUp, setCleaningUp] = useState(false);

  const handleCleanupStaleJobs = async () => {
    setCleaningUp(true);
    try {
      await cleanupStaleJobs();
      // Refetch data after cleanup
      setTimeout(() => {
        refetchAnalytics();
        refetchActiveJobs();
      }, 1000);
    } catch (error) {
      console.error('Failed to cleanup stale jobs:', error);
    } finally {
      setCleaningUp(false);
    }
  };

  const handleRefresh = () => {
    refetchAnalytics();
    refetchActiveJobs();
  };

  if (analyticsLoading || activeJobsLoading) {
    return <DashboardLoadingSkeleton variant="analytics" />;
  }

  if (analyticsError || activeJobsError) {
    return (
      <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center text-orange-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load analytics: {analyticsError || activeJobsError}</p>
            <Button onClick={handleRefresh} className="mt-4 bg-orange-600 hover:bg-orange-700 text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Job Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor job performance and system health</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleCleanupStaleJobs}
            disabled={cleaningUp}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            {cleaningUp ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {cleaningUp ? 'Cleaning...' : 'Cleanup Stale Jobs'}
          </Button>
        </div>
      </div>

      {/* Analytics Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnalyticsCard
            title="Total Jobs"
            value={analytics.total_jobs}
            description="All jobs in the system"
            icon={BarChart3}
          />
          <AnalyticsCard
            title="Completed Jobs"
            value={analytics.jobs_by_status.completed}
            description="Successfully completed jobs"
            icon={CheckCircle}
          />
          <AnalyticsCard
            title="Running Jobs"
            value={analytics.jobs_by_status.running}
            description="Currently running jobs"
            icon={Activity}
          />
          <AnalyticsCard
            title="Failed Jobs"
            value={analytics.jobs_by_status.failed}
            description="Jobs that failed to complete"
            icon={AlertTriangle}
          />
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 glass-effect backdrop-blur-sm bg-white/70 border border-orange-200/50">
          <TabsTrigger value="active" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <Activity className="h-4 w-4" />
            Active Jobs ({activeJobs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4" />
            Performance Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <ActiveJobsTable jobs={activeJobs || []} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Job Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completed</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(analytics.completed_jobs / analytics.total_jobs) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analytics.completed_jobs}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Failed</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${(analytics.failed_jobs / analytics.total_jobs) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analytics.failed_jobs}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Running</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${(analytics.running_jobs / analytics.total_jobs) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analytics.running_jobs}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Job Types Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>YouTube Scraping</span>
                      <span className="font-semibold">{analytics.jobs_by_type?.scrape_youtube || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>NLP Processing</span>
                      <span className="font-semibold">{analytics.jobs_by_type?.transcription_nlp || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                      <span className="font-semibold text-green-600">{analytics.success_rate?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Failure Rate</span>
                      <span className="font-semibold text-red-600">{analytics.failure_rate?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cancellation Rate</span>
                      <span className="font-semibold text-yellow-600">{analytics.cancellation_rate?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Avg Completion Time</span>
                      <span className="font-semibold">{Math.round(analytics.average_completion_time / 60)}m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}