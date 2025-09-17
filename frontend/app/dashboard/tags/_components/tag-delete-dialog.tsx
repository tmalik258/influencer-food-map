"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import axios from 'axios';

interface TagDeleteDialogProps {
  tagId: string;
  tagName: string;
  onSuccess: () => void;
}

export default function TagDeleteDialog({
  tagId, tagName, onSuccess
}: TagDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await axios.delete(`/api/tags/${tagId}`);
      toast.success(`Tag '${tagName}' deleted successfully!`);
      onSuccess();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast.error(`Failed to delete tag '${tagName}'. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" className="cursor-pointer">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
            This action cannot be undone. This will permanently delete the tag &quot;{tagName}&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:border-red-500 cursor-pointer"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}