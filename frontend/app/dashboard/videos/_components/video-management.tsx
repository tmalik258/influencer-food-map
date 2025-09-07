'use client';

import { useState, useEffect } from 'react';
import { Video } from '@/lib/types';
import { useVideos } from '@/lib/hooks/useVideos';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { VideoHeader } from './video-header';
import { VideoFilters } from './video-filters';
import { VideoTable } from './video-table';

export default function VideoManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedInfluencer, setSelectedInfluencer] = useState<string>('');
  const [hasListings, setHasListings] = useState<boolean | undefined>(undefined);

  const { videos, loading, error, fetchVideos } = useVideos({
    title: searchTerm || undefined,
    influencer_name: selectedInfluencer || undefined,
    has_listings: hasListings,
    limit: 50
  });

  useEffect(() => {
    if (videos.length === 0) {
      fetchVideos();
    }
  }, [fetchVideos, videos.length]);

  // Filter and sort videos
  const filteredAndSortedVideos = videos
    .filter(video => {
      const matchesSearch = !searchTerm || 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'published_at':
          aValue = new Date(a.published_at || 0);
          bValue = new Date(b.published_at || 0);
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get unique influencer names for filtering
  const uniqueInfluencers = Array.from(
    new Set(videos.map(video => video.influencer_id).filter(Boolean))
  );

  const handleViewVideo = (video: Video) => {
    window.open(video.video_url, '_blank');
  };

  const handleEditVideo = (video: Video) => {
    // TODO: Implement edit functionality
    console.log('Edit video:', video.id);
  };

  const handleDeleteVideo = (video: Video) => {
    // TODO: Implement delete functionality
    console.log('Delete video:', video.id);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-orange-600 mb-4">
          <Play className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">Error loading videos</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={() => fetchVideos()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedInfluencer('');
    setHasListings(undefined);
  };

  return (
    <div className="space-y-6">
      <VideoHeader videoCount={filteredAndSortedVideos.length} />
      
      <VideoFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        hasListings={hasListings}
        setHasListings={setHasListings}
      />
      
      <VideoTable
        videos={filteredAndSortedVideos}
        searchTerm={searchTerm}
        selectedInfluencer={selectedInfluencer}
        hasListings={hasListings}
        onViewVideo={handleViewVideo}
        onEditVideo={handleEditVideo}
        onDeleteVideo={handleDeleteVideo}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
}