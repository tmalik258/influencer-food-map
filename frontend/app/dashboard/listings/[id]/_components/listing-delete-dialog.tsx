'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface Listing {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  price_range?: string;
  cuisine_type?: string;
  opening_hours?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at?: string;
}

interface ListingDeleteDialogProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ListingDeleteDialog({
  listing,
  open,
  onOpenChange,
  onSuccess,
}: ListingDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/listings/${listing.id}`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Listing</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{listing.name}&quot;? This action cannot be undone and will permanently remove this restaurant listing from the system.
            {listing.address && (
              <span className="block mt-2 text-sm text-muted-foreground">
                Location: {listing.address}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete Listing
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}