'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

import type { VideoHeaderProps } from '@/lib/types';

export function VideoHeader({ videoCount, onCreateClick }: VideoHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Video Management</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage and organize video content from influencers
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onCreateClick} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700 transition-all duration-200">
          <PlusCircle className="w-4 h-4" />
          Create New Video
        </Button>
        <Badge variant="secondary" className="glass-effect backdrop-blur-sm bg-orange-100/80 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
          {videoCount} videos
        </Badge>
      </div>
    </div>
  );
}