'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Eye, Youtube, Users, MapPin, Calendar, Hash } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Influencer } from '@/lib/types';
import { influencerActions } from '@/lib/actions';
import LoadingSkeleton from '@/components/loading-skeleton';
import { formatNumberAbbreviated } from '@/lib/utils/number-formatter';
import Image from 'next/image';

export function InfluencerManagement() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Get unique regions for filter
  const uniqueRegions = Array.from(new Set(influencers.map(i => i.region).filter(Boolean)));

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await influencerActions.getInfluencers({
        include_listings: true,
        include_video_details: false
      });
      setInfluencers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch influencers');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort influencers
  const filteredInfluencers = influencers
    .filter(influencer => {
      const matchesSearch = influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           influencer.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           influencer.youtube_channel_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = regionFilter === 'all' || influencer.region === regionFilter;
      return matchesSearch && matchesRegion;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'subscribers':
          return (b.subscriber_count || 0) - (a.subscriber_count || 0);
        case 'videos':
          return (b.total_videos || 0) - (a.total_videos || 0);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const handleView = (influencer: Influencer) => {
    // Navigate to influencer detail view
    window.open(`/influencers/${influencer.id}`, '_blank');
  };

  const handleEdit = (influencer: Influencer) => {
    // TODO: Implement edit functionality
    console.log('Edit influencer:', influencer.id);
  };

  const handleDelete = async (influencer: Influencer) => {
    if (window.confirm(`Are you sure you want to delete ${influencer.name}?`)) {
      try {
        // TODO: Implement delete functionality
        console.log('Delete influencer:', influencer.id);
        await fetchInfluencers(); // Refresh list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete influencer');
      }
    }
  };

  const handleCreate = () => {
    // TODO: Implement create functionality
    console.log('Create new influencer');
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find and manage influencers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, bio, or channel ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {uniqueRegions.map(region => (
                  <SelectItem key={region} value={region!}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="subscribers">Subscribers</SelectItem>
                <SelectItem value="videos">Videos</SelectItem>
                <SelectItem value="created_at">Date Added</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Add Influencer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredInfluencers.length} of {influencers.length} influencers
        </p>
      </div>

      {/* Influencers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Avatar</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Name
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Region
                  </div>
                </TableHead>
                <TableHead className="w-32">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Subscribers
                  </div>
                </TableHead>
                <TableHead className="w-24">
                  <div className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    Videos
                  </div>
                </TableHead>
                <TableHead className="w-24">Channel</TableHead>
                <TableHead className="w-32">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Added
                  </div>
                </TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInfluencers.map((influencer) => (
                <TableRow key={influencer.id} className="hover:bg-muted/50">
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
                    {influencer.region || 'N/A'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatNumberAbbreviated(influencer.subscriber_count || 0)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {influencer.total_videos || 0}
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
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(influencer)}
                        className="h-8 w-8 p-0 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(influencer)}
                        className="h-8 w-8 p-0 cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(influencer)}
                        className="h-8 w-8 p-0 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredInfluencers.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No influencers found
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {searchQuery || regionFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first influencer'}
            </p>
            {!searchQuery && regionFilter === 'all' && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Influencer
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}