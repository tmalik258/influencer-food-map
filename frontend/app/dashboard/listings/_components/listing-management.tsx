"use client";

import { useState, useEffect } from 'react';
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
import { useRouter } from 'next/navigation';
import { ListingFilters } from './listing-filters';
import { ListingTable } from './listing-table';
import { toast } from 'sonner';

export function ListingManagement() {
  const { listings, loading, error, fetchListings } = useListings();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const router = useRouter();

  const refreshListings = () => {
    fetchListings();
    setIsCreateFormOpen(false);
    setIsEditFormOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedListing(null);
  };

  useEffect(() => {
    if (listings.length === 0) {
      fetchListings();
    }
  }, [statusFilter, sortBy, listings.length, fetchListings]);

  // Handle approve listing
  const handleApprove = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      // Note: This would need to be implemented in listing-actions.ts
      // await listingActions.approveListing(listingId);
      console.log('Approve listing:', listingId);
      await fetchListings(); // Refresh the list
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
      await fetchListings(); // Refresh the list
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

  // Filter listings based on search (client-side filtering as backup)
  const filteredListings = transformedListings.filter(listing => {
    const matchesSearch = !searchTerm || 
      (listing.restaurant?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.influencer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.video?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && listing.status === 'approved') ||
      (statusFilter === 'rejected' && listing.status === 'rejected') ||
      (statusFilter === 'pending' && listing.status === 'pending');
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card className="not-dark:glass-effect not-dark:backdrop-blur-xl bg-white/10 dark:bg-black border border-white/20 dark:border-gray-700/30">
        <ListingHeader listingCount={listings.length} onCreateClick={() => setIsCreateFormOpen(true)} />
        <CardContent>
          {error && (
            <Alert className="mb-4 glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-orange-500/50">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-gray-900 dark:text-white">{error}</AlertDescription>
            </Alert>
          )}
          
          <ListingFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          <ListingTable
            listings={filteredListings}
            loading={loading}
            actionLoading={actionLoading}
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

      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="sm:max-w-[600px] glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Edit Listing</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <ListingForm 
              mode="edit" 
              listingData={selectedListing}
              onSuccess={refreshListings} 
            />
          )}
        </DialogContent>
      </Dialog>



      {selectedListing && (
        <ListingDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          listingId={selectedListing.id}
          onSuccess={refreshListings}
        />
      )}
    </div>
  );
}