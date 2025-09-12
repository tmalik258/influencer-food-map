'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Eye, Youtube, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Influencer } from '@/lib/types';
import { useInfluencersPaginated } from '@/lib/hooks/useInfluencersPaginated';
import { useAdminInfluencer } from '@/lib/hooks/useAdminInfluencer';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';
import { formatNumberAbbreviated } from '@/lib/utils/number-formatter';
import { CreateInfluencerModal } from './create-influencer-modal';
import Image from 'next/image';

export default function InfluencerManagement() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'subscriber_count' | 'total_videos' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const itemsPerPage = 10;

  const { influencers, loading, error, refetch } = useInfluencersPaginated({ limit: 1000 }); // Fetch large number for client-side operations
  const { deleteInfluencer } = useAdminInfluencer();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Client-side filtering and sorting
  const filteredAndSortedInfluencers = useMemo(() => {
    let filtered = [...influencers];

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(influencer => 
        influencer.name.toLowerCase().includes(searchLower) ||
        (influencer.bio && influencer.bio.toLowerCase().includes(searchLower)) ||
        (influencer.youtube_channel_id && influencer.youtube_channel_id.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'subscriber_count':
          aValue = a.subscriber_count || 0;
          bValue = b.subscriber_count || 0;
          break;
        case 'total_videos':
          aValue = a.total_videos || 0;
          bValue = b.total_videos || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [influencers, debouncedSearchTerm, sortBy, sortOrder]);

  // Client-side pagination
  const paginatedInfluencers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedInfluencers.slice(startIndex, endIndex);
  }, [filteredAndSortedInfluencers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedInfluencers.length / itemsPerPage);
  const total = filteredAndSortedInfluencers.length;

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: string) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy as 'name' | 'subscriber_count' | 'total_videos' | 'created_at');
      setSortOrder('asc');
    }
    setCurrentPage(1);
  }, [sortBy, sortOrder]);

  // CRUD operations
  const handleCreateInfluencer = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditInfluencer = (influencer: Influencer) => {
    // TODO: Implement edit influencer modal
    console.log('Edit influencer:', influencer);
  };

  const handleDeleteInfluencer = async (influencer: Influencer) => {
    if (window.confirm(`Are you sure you want to delete ${influencer.name}?`)) {
      try {
        await deleteInfluencer(influencer.id);
        refetch(); // Refresh the data
      } catch (error) {
        console.error('Failed to delete influencer:', error);
      }
    }
  };

  const handleViewInfluencer = (influencer: Influencer) => {
    router.push(`/dashboard/influencers/${influencer.id}`);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refetch(); // Refresh the data
  };

  if (loading) {
    return <DashboardLoadingSkeleton variant="management" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Influencers</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateInfluencer}>
            <Plus className="mr-2 h-4 w-4" /> Add Influencer
          </Button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <Card className="glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/20 border-orange-500/20 shadow-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 h-4 w-4" />
              <Input
                placeholder="Search by name, bio, or channel ID..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-48 glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="glass-effect backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-orange-500/20">
                <SelectItem value="name" className="focus:bg-orange-500/10 focus:text-orange-600 dark:focus:text-orange-400">Name</SelectItem>
                <SelectItem value="subscriber_count" className="focus:bg-orange-500/10 focus:text-orange-600 dark:focus:text-orange-400">Subscribers</SelectItem>
                <SelectItem value="total_videos" className="focus:bg-orange-500/10 focus:text-orange-600 dark:focus:text-orange-400">Videos</SelectItem>
                <SelectItem value="created_at" className="focus:bg-orange-500/10 focus:text-orange-600 dark:focus:text-orange-400">Date Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!error && (
        <>
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Showing <span className="text-orange-600 dark:text-orange-400 font-semibold">{paginatedInfluencers.length}</span> of <span className="text-orange-600 dark:text-orange-400 font-semibold">{total}</span> influencers
              {debouncedSearchTerm && (
                <span className="ml-1 text-orange-500">
                  matching "{debouncedSearchTerm}"
                </span>
              )}
            </p>
          </div>

      {/* Influencers Table */}
      <Card className="glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/20 border-orange-500/20 shadow-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-orange-500/20 hover:bg-orange-500/5">
                <TableHead className="w-16 font-semibold text-gray-700 dark:text-gray-200">Avatar</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
                    <Users className="h-4 w-4 text-orange-500" />
                    Name
                  </div>
                </TableHead>
                <TableHead className="w-32">
                  <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
                    <Users className="h-4 w-4 text-orange-500" />
                    Subscribers
                  </div>
                </TableHead>
                <TableHead className="w-24">
                  <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
                    <Youtube className="h-4 w-4 text-orange-500" />
                    Videos
                  </div>
                </TableHead>
                <TableHead className="w-24 font-semibold text-gray-700 dark:text-gray-200">Channel</TableHead>
                <TableHead className="w-32">
                  <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Added
                  </div>
                </TableHead>
                <TableHead className="w-32 text-right font-semibold text-gray-700 dark:text-gray-200">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInfluencers.map((influencer) => (
                <TableRow key={influencer.id} className="cursor-pointer hover:bg-orange-500/5 transition-all duration-200 border-orange-500/10">
                  <TableCell>
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white border shadow-sm">
                      {influencer.avatar_url ? (
                        <Image
                          src={influencer.avatar_url}
                          alt={influencer.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold text-sm">
                          {influencer.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{influencer.name}</div>
                      {influencer.bio && (
                        <div className="text-sm text-muted-foreground max-w-[300px] truncate">
                          {influencer.bio}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatNumberAbbreviated(influencer.subscriber_count || 0)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatNumberAbbreviated(influencer.total_videos || 0)}
                  </TableCell>
                  <TableCell>
                    {influencer.youtube_channel_url ? (
                      <Badge variant="outline" className="text-xs">
                        <Youtube className="w-3 h-3 mr-1" />
                        YouTube
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(influencer.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInfluencer(influencer)}
                        className="cursor-pointer text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 transition-all duration-200 dark:text-orange-400 dark:hover:text-orange-300"
                        aria-label={`View ${influencer.name}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditInfluencer(influencer)}
                        className="cursor-pointer text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 transition-all duration-200 dark:text-orange-400 dark:hover:text-orange-300"
                        aria-label={`Edit ${influencer.name}`}
                      >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInfluencer(influencer)}
                        className="cursor-pointer text-red-600 hover:bg-red-500/10 hover:text-red-700 transition-all duration-200 dark:text-red-400 dark:hover:text-red-300"
                        aria-label={`Delete ${influencer.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} influencers
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {paginatedInfluencers.length === 0 && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No influencers found
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {debouncedSearchTerm 
                    ? 'Try adjusting your search'
                    : 'Get started by adding your first influencer'}
                </p>
                {!debouncedSearchTerm && (
                   <Button onClick={handleCreateInfluencer}>
                     <Plus className="h-4 w-4 mr-2" />
                     Add First Influencer
                   </Button>
                  )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <CreateInfluencerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}