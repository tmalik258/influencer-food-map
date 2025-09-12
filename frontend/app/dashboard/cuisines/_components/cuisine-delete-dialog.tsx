"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Cuisine } from "@/lib/types";

interface CuisineDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cuisine: Cuisine | null;
  onSuccess: () => void;
}

export function CuisineDeleteDialog({ isOpen, onOpenChange, cuisine, onSuccess }: CuisineDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!cuisine) {
      return;
    }
    setIsLoading(true);
    try {
      await axios.delete(`/api/cuisines/${cuisine?.id}`);
      toast.success("Cuisine deleted successfully.");
      onSuccess();
    } catch (error) {
      console.error("Failed to delete cuisine:", error);
      toast.error("Failed to delete cuisine.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass-effect backdrop-blur-xl bg-white/90 border border-orange-200/50 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-gray-100">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
            This action cannot be undone. This will permanently delete the cuisine "{cuisine?.name}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}