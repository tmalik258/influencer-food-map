"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import type { Job } from "@/lib/types/api";
import { useJobsRealtime } from "@/lib/hooks/useJobsRealtime";

type JobEventType = "create" | "update" | "delete";

interface JobEvent {
  type: JobEventType;
  job?: Job;
  jobId?: string;
  timestamp: number;
}

interface DashboardRealtimeContextValue {
  version: number;
  lastEvent: JobEvent | null;
}

const DashboardRealtimeContext = createContext<DashboardRealtimeContextValue | undefined>(undefined);

export const DashboardRealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [version, setVersion] = useState(0);
  const [lastEvent, setLastEvent] = useState<JobEvent | null>(null);

  const onJobUpdate = useCallback((job: Job) => {
    setLastEvent({ type: "update", job, timestamp: Date.now() });
    setVersion((v) => v + 1);
  }, []);

  const onJobCreate = useCallback((job: Job) => {
    setLastEvent({ type: "create", job, timestamp: Date.now() });
    setVersion((v) => v + 1);
  }, []);

  const onJobDelete = useCallback((jobId: string) => {
    setLastEvent({ type: "delete", jobId, timestamp: Date.now() });
    setVersion((v) => v + 1);
  }, []);

  useJobsRealtime({ onJobUpdate, onJobCreate, onJobDelete });

  const value = useMemo(() => ({ version, lastEvent }), [version, lastEvent]);

  return (
    <DashboardRealtimeContext.Provider value={value}>
      {children}
    </DashboardRealtimeContext.Provider>
  );
};

export const useDashboardRealtime = (): DashboardRealtimeContextValue => {
  const ctx = useContext(DashboardRealtimeContext);
  if (!ctx) {
    throw new Error("useDashboardRealtime must be used within DashboardRealtimeProvider");
  }
  return ctx;
};