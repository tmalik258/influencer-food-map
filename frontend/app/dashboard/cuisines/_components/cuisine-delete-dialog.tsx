"use client";

import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cuisineActions } from '@/lib/actions/cuisine-actions';
import { Cuisine } from '@/lib/types';

interface CuisineDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cuisine: Cuisine | null;
  onSuccess: () => void;
}

export default function CuisineDeleteDialog({
  open, onOpenChange, cuisine, onSuccess
}: CuisineDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!cuisine) return;
    
    setIsLoading(true);
    try {
      await cuisineActions.deleteCuisine(cuisine.id);
      toast.success(`Cuisine '${cuisine.name}' deleted successfully!`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete cuisine:', error);
      toast.error(`Failed to delete cuisine '${cuisine.name}'. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!cuisine) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the cuisine &quot;{cuisine.name}&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </AlertDialogCancel>
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