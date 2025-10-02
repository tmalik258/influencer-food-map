"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useListings } from '@/lib/hooks/useListings';
import { ListingHeader } from './listing-header';
import { ListingForm } from './listing-form';
import type { Listing } from '@/lib/types';
import type { Listing as ListingDashboard } from '@/lib/types/dashboard';

import { ListingDeleteDialog } from './listing-delete-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ListingFilters } from './listing-filters';
import { ListingTable } from './listing-table';
import { toast } from 'sonner';
import { listingActions } from '@/lib/actions';
import { CreateListingFormData, EditListingFormData } from '@/lib/validations/listing-create';

export function ListingManagement() {
  const {
    listings,
    totalCount,
    loading,
    error,
    params,
    setPage,
    setLimit,
    setSearchTerm,
    setStatusFilter,
    setSortBy,
    refetch,
  } = useListings({
    page: 1,
    limit: 10,
    status: 'all',
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      const listing = listings.find((listing) => listing.id === id);
      if (listing) {
        setSelectedListing(listing);
        setIsEditFormOpen(true);
      }
    }
  }, [listings, searchParams]);

  const refreshListings = () => {
    refetch();
    setIsCreateFormOpen(false);
    setIsEditFormOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedListing(null);
  };

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setLimit(newItemsPerPage);
  };

  // Handle filter changes
  const handleSearchChange = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const handleStatusChange = (status: 'approved' | 'rejected' | 'pending' | 'all') => {
    setStatusFilter(status);
  };

  const handleSortByChange = (sortBy: string) => {
    setSortBy(sortBy);
  };

  // Handle approve listing
  const handleApprove = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      // Note: This would need to be implemented in listing-actions.ts
      // await listingActions.approveListing(listingId);
      console.log('Approve listing:', listingId);
      await refetch(); // Refresh the list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve listing');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject listing
  const handleReject = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      // Note: This would need to be implemented in listing-actions.ts
      // await listingActions.rejectListing(listingId);
      console.log('Reject listing:', listingId);
      await refetch(); // Refresh the list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject listing');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle view listing details
  // Remove handleView function since eye icon is removed

  // Handle edit listing
  const handleEdit = (listingId: string) => {
    // Open modal instead of navigation
    const foundListing = listings.find(listing => listing.id === listingId);
    setSelectedListing(foundListing || null);
    setIsEditFormOpen(true);

    if (foundListing) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('id', foundListing.id);
      router.replace(`${window.location.pathname}?${newSearchParams.toString()}`);
    }
  };

  const handleCloseEditForm = () => {
    setIsEditFormOpen(false);
    setSelectedListing(null);

    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('id');
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`);
  };

  // Handle edit submit
  const handleEditSubmit = async (listingId: string, data: CreateListingFormData) => {
    setActionLoading(listingId);
    try {
      await listingActions.updateListing(listingId, data);
      toast.success('Listing updated successfully');
      await refetch(); // Refresh the list
      setIsEditFormOpen(false);
      setSelectedListing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update listing');
    } finally {
      setActionLoading(null);
    }
  };

  // Transform listings to dashboard format and filter
  const transformedListings: ListingDashboard[] = listings.map(listing => ({
    id: listing.id,
    restaurant_id: listing.restaurant?.id,
    restaurant: {
      name: listing.restaurant?.name || 'Unknown Restaurant',
      city: listing.restaurant?.city || 'Unknown City'
    },
    influencer_id: listing.influencer?.id,
    influencer: {
      name: listing.influencer?.name || 'Unknown Influencer'
    },
    video_id: listing.video?.id,
    video: {
      title: listing.video?.title || 'Unknown Video'
    },
    quotes: Array.isArray(listing.quotes) ? listing.quotes : (listing.quotes ? [listing.quotes] : []),
    confidence_score: listing.confidence_score || 0,
    approved: listing.approved,
    visit_date: listing.visit_date,
    status: listing.approved === true ? 'approved' : listing.approved === false ? 'rejected' : 'pending',
    created_at: listing.created_at,
    updated_at: listing.updated_at
  }));

  // Handle delete listing
  const handleDelete = (listingId: string) => {
    const foundListing = listings.find(listing => listing.id === listingId);
    setSelectedListing(foundListing || null);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      await listingActions.deleteListing(listingId);
      toast.success('Listing deleted successfully');
      await refetch(); // Refresh the list
      setIsDeleteDialogOpen(false);
      setSelectedListing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete listing');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none p-0">
        <ListingHeader listingCount={totalCount} onCreateClick={() => setIsCreateFormOpen(true)} />
        <CardContent className='p-0'>
          {error && (
            <Alert className="mb-4 glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-orange-500/50">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-gray-900 dark:text-white">{error}</AlertDescription>
            </Alert>
          )}
          
          <ListingFilters
            searchTerm={params.search || ''}
            setSearchTerm={handleSearchChange}
            statusFilter={params.status || 'all'}
            setStatusFilter={handleStatusChange}
            sortBy={params.sort_by || 'created_at'}
            setSortBy={handleSortByChange}
          />

          <ListingTable
            listings={transformedListings}
            loading={loading}
            actionLoading={actionLoading}
            currentPage={params.page || 1}
            totalItems={totalCount}
            itemsPerPage={params.limit || 10}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="sm:max-w-[600px] glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Create New Listing</DialogTitle>
          </DialogHeader>
          <ListingForm mode="create" onSuccess={refreshListings} />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditFormOpen} onOpenChange={(open) => {
            if (!open) {
              handleCloseEditForm();
            }
          }}>
        <DialogContent className="sm:max-w-[600px] glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Edit Listing</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <ListingForm 
              mode="edit" 
              listingData={selectedListing}
              onSuccess={async (data: CreateListingFormData | EditListingFormData) => {
                await handleEditSubmit(selectedListing.id, data);
                handleCloseEditForm();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>



      {selectedListing && (
        <ListingDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          listingId={selectedListing.id}
          onSuccess={() => handleDeleteConfirm(selectedListing.id)}
        />
      )}
    </div>
  );
}