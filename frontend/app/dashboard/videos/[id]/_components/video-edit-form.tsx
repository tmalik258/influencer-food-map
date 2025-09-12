'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const videoEditSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  url: z.url('Please enter a valid URL'),
  thumbnail_url: z.url('Please enter a valid thumbnail URL').optional().or(z.literal('')),
  channel_name: z.string().optional(),
  tags: z.string().optional(),
});

type VideoEditFormData = z.infer<typeof videoEditSchema>;

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

interface VideoEditFormProps {
  video: Video;
  onSuccess: (updatedVideo: Video) => void;
  onCancel: () => void;
}

export function VideoEditForm({ video, onSuccess, onCancel }: VideoEditFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VideoEditFormData>({
    resolver: zodResolver(videoEditSchema),
    defaultValues: {
      title: video.title,
      description: video.description || '',
      url: video.url,
      thumbnail_url: video.thumbnail_url || '',
      channel_name: video.channel_name || '',
      tags: video.tags?.join(', ') || '',
    },
  });

  const onSubmit = async (data: VideoEditFormData) => {
    try {
      setLoading(true);
      
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        thumbnail_url: data.thumbnail_url || undefined,
      };

      const response = await axios.put(`/api/videos/${video.id}`, payload);
      onSuccess(response.data);
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('Failed to update video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Edit Video</CardTitle>
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter video title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter video description"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Video URL *</Label>
            <Input
              id="url"
              {...register('url')}
              placeholder="https://youtube.com/watch?v=..."
            />
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            )}
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
            <Input
              id="thumbnail_url"
              {...register('thumbnail_url')}
              placeholder="https://example.com/thumbnail.jpg"
            />
            {errors.thumbnail_url && (
              <p className="text-sm text-destructive">{errors.thumbnail_url.message}</p>
            )}
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="channel_name">Channel Name</Label>
            <Input
              id="channel_name"
              {...register('channel_name')}
              placeholder="Enter channel name"
            />
            {errors.channel_name && (
              <p className="text-sm text-destructive">{errors.channel_name.message}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="tag1, tag2, tag3"
            />
            <p className="text-sm text-muted-foreground">
              Separate tags with commas
            </p>
            {errors.tags && (
              <p className="text-sm text-destructive">{errors.tags.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}