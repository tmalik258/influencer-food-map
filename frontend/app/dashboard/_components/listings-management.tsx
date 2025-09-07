'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { adminActions } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Eye,
  MapPin,
  RefreshCw,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  restaurant: string;
  influencer: string;
  createdAt: string;
  tags: string[];
  location: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function ListingsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminActions.getAdminListings({
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy,
        search: searchTerm || undefined
      });
      setListings(response.data || []);
    } catch (err) {
      setError('Failed to fetch listings');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, statusFilter]);

  // Fetch listings
  useEffect(() => {
    fetchListings();
  }, [statusFilter, sortBy, fetchListings]);

  const handleApprove = async (listingId: string) => {
    try {
      setActionLoading(listingId);
      await adminActions.approveListing(listingId);
      await fetchListings(); // Refresh the list
    } catch (err) {
      setError('Failed to approve listing');
      console.error('Error approving listing:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (listingId: string) => {
    try {
      setActionLoading(listingId);
      await adminActions.rejectListing(listingId);
      await fetchListings(); // Refresh the list
    } catch (err) {
      setError('Failed to reject listing');
      console.error('Error rejecting listing:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAll = async () => {
    try {
      setActionLoading('approve-all');
      // await adminActions.approveAllPendingListings();
      await fetchListings(); // Refresh the list
    } catch (err) {
      setError('Failed to approve all listings');
      console.error('Error approving all listings:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = () => {
    fetchListings();
  };

  // Filter listings based on search and status (client-side filtering as backup)
  const filteredListings = listings.filter(listing => {
    const matchesSearch = !searchTerm || 
      listing.restaurant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.influencer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Listings Management
          </CardTitle>
          <CardDescription>
            Review and manage restaurant listings from influencer content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search restaurants or influencers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
               <SelectTrigger className="w-40">
                 <SelectValue placeholder="Filter by status" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Status</SelectItem>
                 <SelectItem value="pending">Pending</SelectItem>
                 <SelectItem value="approved">Approved</SelectItem>
                 <SelectItem value="rejected">Rejected</SelectItem>
               </SelectContent>
             </Select>

            <Button 
              onClick={handleApproveAll} 
              className="whitespace-nowrap"
              disabled={actionLoading === 'approve-all'}
            >
              {actionLoading === 'approve-all' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve All Pending
            </Button>
          </div>

          {/* Listings Table */}
          <div className="rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading listings...</span>
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">{listing.title}</TableCell>
                    <TableCell>{listing.restaurant}</TableCell>
                    <TableCell>{listing.influencer}</TableCell>
                    <TableCell>{new Date(listing.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {listing.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{listing.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={listing.status === 'pending' ? 'secondary' : listing.status === 'approved' ? 'default' : 'destructive'}
                      >
                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {listing.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(listing.id)}
                              className="h-8 px-2"
                              disabled={actionLoading === listing.id}
                            >
                              {actionLoading === listing.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(listing.id)}
                              className="h-8 px-2"
                              disabled={actionLoading === listing.id}
                            >
                              {actionLoading === listing.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          // onClick={() => handleDelete(listing.id)}
                          className="h-8 px-2 text-orange-600 hover:text-orange-700"
                          disabled={actionLoading === listing.id}
                        >
                          {actionLoading === listing.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </div>

          {!loading && filteredListings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No listings found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}