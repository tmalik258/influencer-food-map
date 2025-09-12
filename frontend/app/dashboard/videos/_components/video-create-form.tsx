'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import axios from 'axios';

const formSchema = z.object({
  influencer_id: z.string().uuid({ message: "Invalid Influencer ID" }),
  youtube_video_id: z.string().min(1, { message: "YouTube Video ID is required." }),
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().optional(),
  video_url: z.url({ message: "Invalid video URL." }),
  published_at: z.string().optional(),
  transcription: z.string().optional(),
});

type VideoFormValues = z.infer<typeof formSchema>;

interface VideoCreateFormProps {
  onSuccess: () => void;
}

export function VideoCreateForm({ onSuccess }: VideoCreateFormProps) {
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      influencer_id: '',
      youtube_video_id: '',
      title: '',
      description: '',
      video_url: '',
      published_at: '',
      transcription: '',
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: VideoFormValues) => {
    setIsLoading(true);
    try {
      await axios.post('/api/admin/videos', values);
      toast.success('Video created successfully!');
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to create video:', error);
      toast.error('Failed to create video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="influencer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Influencer ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000" {...field} className="glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="youtube_video_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube Video ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g., dQw4w9WgXcQ" {...field} className="glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., My Amazing Food Tour" {...field} className="glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional description" {...field} className="glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="video_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video URL</FormLabel>
              <FormControl>
                <Input placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ" {...field} className="glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="published_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Published At (YYYY-MM-DDTHH:MM:SSZ)</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} className="glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="transcription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transcription</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional transcription" {...field} className="glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700 transition-all duration-200">
          {isLoading ? 'Creating...' : 'Create Video'}
        </Button>
      </form>
    </Form>
  );
}