'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Video } from '@/lib/types';

interface VideoDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
  onSuccess: () => void;
}

export function VideoDeleteDialog({ isOpen, onClose, video, onSuccess }: VideoDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!video) return;
    setIsLoading(true);
    try {
      await axios.delete(`/api/admin/videos/${video.id}`);
      toast.success('Video deleted successfully!');
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Failed to delete video:', error);
      toast.error('Failed to delete video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/30">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Confirm Deletion</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete the video "{video?.title}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 transition-all duration-200">
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}