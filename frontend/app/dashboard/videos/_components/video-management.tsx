'use client';

import { useState, useEffect } from 'react';
import { Video } from '@/lib/types';
import { useVideos } from '@/lib/hooks/useVideos';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { VideoHeader } from './video-header';
import { VideoFilters } from './video-filters';
import { VideoTable } from './video-table';
import { VideoCreateForm } from './video-create-form';

import { VideoDeleteDialog } from './video-delete-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

export default function VideoManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedInfluencer, setSelectedInfluencer] = useState<string>('');
  const [hasListings, setHasListings] = useState<boolean | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const router = useRouter();

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

  const refreshVideos = () => {
    fetchVideos();
  };

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
    router.push(`/dashboard/videos/${video.id}`);
  };

  const handleDeleteVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsDeleteDialogOpen(true);
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
      <div className="text-center py-12 glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 rounded-xl">
        <div className="text-orange-600 mb-4">
          <Play className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Error loading videos</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
        </div>
        <Button onClick={() => fetchVideos()} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200">
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
    <div className="space-y-6 glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 rounded-xl p-6 shadow-xl">
      <VideoHeader videoCount={filteredAndSortedVideos.length} onCreateClick={() => setIsCreateModalOpen(true)} />
      
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

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] glass-effect backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Create New Video</DialogTitle>
          </DialogHeader>
          <VideoCreateForm onSuccess={() => { refreshVideos(); setIsCreateModalOpen(false); }} />
        </DialogContent>
      </Dialog>



      <VideoDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        video={selectedVideo}
        onSuccess={() => { refreshVideos(); setIsDeleteDialogOpen(false); }}
      />
    </div>
  );
}