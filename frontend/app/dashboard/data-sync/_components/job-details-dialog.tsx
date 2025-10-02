import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Job } from "@/lib/types";
import { ReactNode } from "react";

interface JobDetailsDialogProps {
  selectedJob: Job | null;
  onClose: () => void;
  getStatusBadge: (status: Job["status"]) => ReactNode;
  formatDate: (date?: string) => string;
  formatDuration: (startTime?: string, endTime?: string) => string;
}

export default function JobDetailsDialog({
  selectedJob,
  onClose,
  getStatusBadge,
  formatDate,
  formatDuration,
}: JobDetailsDialogProps) {
  return (
    <Dialog open={!!selectedJob} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-effect backdrop-blur-xl bg-white/95 border border-orange-200/50 shadow-2xl max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-gray-900">Job Details</DialogTitle>
          </div>
        </DialogHeader>

        {selectedJob && (
          <div className="space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Job ID
                </label>
                <p className="font-mono text-sm">{selectedJob.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Type
                </label>
                <p>{selectedJob.job_type.replace("_", " ").toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Status
                </label>
                <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Progress
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Progress
                    value={selectedJob.progress}
                    className="flex-1 h-2"
                  />
                  <span className="text-sm">{selectedJob.progress}%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Title</label>
              <p>{selectedJob.title}</p>
            </div>

            {selectedJob.description && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Description
                </label>
                <p className="text-sm text-gray-700">
                  {selectedJob.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Total Items
                </label>
                <p>{selectedJob.total_items || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Processed Items
                </label>
                <p>{selectedJob.processed_items}</p>
              </div>
            </div>

            {selectedJob.error_message && (
              <div>
                <label className="text-sm font-medium text-red-600">
                  Error Message
                </label>
                <p className="text-sm text-red-700 bg-red-50 p-2 rounded border">
                  {selectedJob.error_message}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedJob.started_at && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Started At
                  </label>
                  <p className="text-sm">
                    {formatDate(selectedJob.started_at)}
                  </p>
                </div>
              )}
              {selectedJob.completed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Completed At
                  </label>
                  <p className="text-sm">
                    {formatDate(selectedJob.completed_at)}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Duration
                </label>
                <p className="text-sm">
                  {formatDuration(
                    selectedJob.started_at,
                    selectedJob.completed_at
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
