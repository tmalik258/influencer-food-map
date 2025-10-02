import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface ActiveJob {
  id: string;
  title: string;
  status: string;
  description: string;
  total_items: number;
  processed_items: number;
  processing_rate?: number;
  estimated_completion_time?: string;
}

export function ActiveJobsTable({ jobs }: { jobs: ActiveJob[] }) {
  if (jobs.length === 0) {
    return (
      <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
        <CardContent className="pt-6 text-center text-gray-600 dark:text-gray-400">
          No active jobs currently running
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">Active Jobs</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Currently running job processes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => {
            const progress = job.total_items > 0 ? (job.processed_items / job.total_items) * 100 : 0;
            
            return (
              <div key={job.id} className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-200/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4 text-orange-600 animate-spin" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{job.title}</span>
                    <Badge className="bg-orange-100 text-orange-800">{job.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {job.description}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Progress: {job.processed_items}/{job.total_items} ({progress.toFixed(1)}%)</span>
                    {job.processing_rate && (
                      <span>Rate: {job.processing_rate.toFixed(1)}/min</span>
                    )}
                    {job.estimated_completion_time && (
                      <span>ETA: {new Date(job.estimated_completion_time).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}