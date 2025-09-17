'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, ExternalLink } from 'lucide-react';
import { VideoEditForm } from './video-edit-form';
import { VideoDeleteDialog } from './video-delete-dialog';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';
import { toast } from 'sonner';
import axios from 'axios';

interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  duration?: number;
  view_count?: number;
  like_count?: number;
  published_at?: string;
  channel_name?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface VideoDetailViewProps {
  videoId: string;
}

export function VideoDetailView({ videoId }: VideoDetailViewProps) {
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchVideo();
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/videos/${videoId}`);
      setVideo(response.data);
    } catch (error) {
      console.error('Error fetching video:', error);
      toast.error('Failed to load video details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = (updatedVideo: Video) => {
    setVideo(updatedVideo);
    setIsEditMode(false);
    toast.success('Video updated successfully');
  };

  const handleDeleteSuccess = () => {
    toast.success('Video deleted successfully');
    router.push('/dashboard/videos');
  };

  if (loading) {
    return <DashboardLoadingSkeleton variant="detail" />;
  }

  if (!video) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Video not found</p>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/videos')}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Videos
        </Button>
      </div>
    );
  }

  if (isEditMode) {
    return (
      <VideoEditForm
        video={video}
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
          onClick={() => router.push('/dashboard/videos')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Videos
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

      {/* Video Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{video.title}</CardTitle>
              {video.channel_name && (
                <p className="text-muted-foreground">by {video.channel_name}</p>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={video.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Video
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Thumbnail */}
          {video.thumbnail_url && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img 
                src={video.thumbnail_url} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          {video.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {video.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {video.duration && (
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-muted-foreground">
                  {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                </p>
              </div>
            )}
            {video.view_count && (
              <div>
                <p className="text-sm font-medium">Views</p>
                <p className="text-muted-foreground">
                  {video.view_count.toLocaleString()}
                </p>
              </div>
            )}
            {video.like_count && (
              <div>
                <p className="text-sm font-medium">Likes</p>
                <p className="text-muted-foreground">
                  {video.like_count.toLocaleString()}
                </p>
              </div>
            )}
            {video.published_at && (
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-muted-foreground">
                  {new Date(video.published_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Created</p>
              <p className="text-muted-foreground">
                {new Date(video.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-medium">Last Updated</p>
              <p className="text-muted-foreground">
                {new Date(video.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <VideoDeleteDialog
        video={video}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}