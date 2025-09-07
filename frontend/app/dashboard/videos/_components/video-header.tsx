'use client';

import { Badge } from '@/components/ui/badge';

import type { VideoHeaderProps } from '@/lib/types';

export function VideoHeader({ videoCount }: VideoHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Video Management</h1>
        <p className="text-muted-foreground">
          Manage and organize video content from influencers
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {videoCount} videos
        </Badge>
      </div>
    </div>
  );
}