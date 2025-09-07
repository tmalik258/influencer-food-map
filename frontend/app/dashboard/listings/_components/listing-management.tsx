"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useListings } from '@/lib/hooks/useListings';
import { ListingHeader } from './listing-header';
import { ListingFilters } from './listing-filters';
import { ListingTable } from './listing-table';
import { toast } from 'sonner';

export function ListingManagement() {
  const { listings, loading, error, fetchListings } = useListings();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
  const handleView = (listingId: string) => {
    console.log('View listing:', listingId);
    // Navigate to listing detail page or open modal
  };

  // Handle edit listing
  const handleEdit = (listingId: string) => {
    console.log('Edit listing:', listingId);
    // Navigate to listing edit page or open modal
  };

  // Handle delete listing
  const handleDelete = (listingId: string) => {
    console.log('Delete listing:', listingId);
    // Show confirmation dialog and delete
  };

  const handleSearch = () => {
    fetchListings();
  };

  // Filter listings based on search (client-side filtering as backup)
  const filteredListings = listings.filter(listing => {
    const matchesSearch = !searchTerm || 
      listing.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.influencer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.video?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <Card>
        <ListingHeader />
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <ListingFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onSearch={handleSearch}
          />

          <ListingTable
            listings={filteredListings}
            loading={loading}
            actionLoading={actionLoading}
            onApprove={handleApprove}
            onReject={handleReject}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}