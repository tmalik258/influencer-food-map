'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, MapPin, Star, Clock, Phone, Globe } from 'lucide-react';
import { ListingEditForm } from './listing-edit-form';
import { ListingDeleteDialog } from './listing-delete-dialog';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';
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

interface ListingDetailViewProps {
  listingId: string;
}

export function ListingDetailView({ listingId }: ListingDetailViewProps) {
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [listingId]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/listings/${listingId}`);
      setListing(response.data);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = (updatedListing: Listing) => {
    setListing(updatedListing);
    setIsEditMode(false);
    toast.success('Listing updated successfully');
  };

  const handleDeleteSuccess = () => {
    toast.success('Listing deleted successfully');
    router.push('/dashboard/listings');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <DashboardLoadingSkeleton variant="detail" />;
  }

  if (!listing) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Listing not found</p>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/listings')}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Listings
        </Button>
      </div>
    );
  }

  if (isEditMode) {
    return (
      <ListingEditForm
        listing={listing}
        onSuccess={handleEditSuccess}
        onCancel={() => setIsEditMode(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/listings')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Listings
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditMode(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Listing Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{listing.name}</CardTitle>
                <p className="text-muted-foreground">Restaurant Listing</p>
              </div>
            </div>
            <Badge className={getStatusColor(listing.status)}>
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          {listing.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{listing.description}</p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Contact Information</h3>
              <div className="space-y-3">
                {listing.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-muted-foreground text-sm">{listing.address}</p>
                    </div>
                  </div>
                )}
                {listing.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-muted-foreground text-sm">{listing.phone}</p>
                    </div>
                  </div>
                )}
                {listing.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Website</p>
                      <a 
                        href={listing.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        {listing.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Restaurant Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Restaurant Details</h3>
              <div className="space-y-3">
                {listing.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Rating</p>
                      <p className="text-muted-foreground text-sm">{listing.rating}/5</p>
                    </div>
                  </div>
                )}
                {listing.price_range && (
                  <div>
                    <p className="text-sm font-medium">Price Range</p>
                    <p className="text-muted-foreground text-sm">{listing.price_range}</p>
                  </div>
                )}
                {listing.cuisine_type && (
                  <div>
                    <p className="text-sm font-medium">Cuisine Type</p>
                    <Badge variant="outline">{listing.cuisine_type}</Badge>
                  </div>
                )}
                {listing.opening_hours && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Opening Hours</p>
                      <p className="text-muted-foreground text-sm whitespace-pre-line">{listing.opening_hours}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div>
            <h3 className="font-semibold mb-2">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Listing ID</p>
                <p className="text-muted-foreground font-mono text-sm">{listing.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge className={getStatusColor(listing.status)}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-muted-foreground text-sm">
                  {new Date(listing.created_at).toLocaleString()}
                </p>
              </div>
              {listing.updated_at && (
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(listing.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <ListingDeleteDialog
        listing={listing}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}