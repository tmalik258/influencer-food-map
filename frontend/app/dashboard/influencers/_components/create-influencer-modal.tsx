'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAdminInfluencer } from '@/lib/hooks/useAdminInfluencer';
import { createInfluencerSchema, CreateInfluencerFormData } from '@/lib/validations/influencer';

interface CreateInfluencerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInfluencerModal({ isOpen, onClose, onSuccess }: CreateInfluencerModalProps) {
  const { createInfluencer, loading } = useAdminInfluencer();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateInfluencerFormData>({
    resolver: zodResolver(createInfluencerSchema),
    defaultValues: {
      name: '',
      bio: '',
      avatar_url: '',
      banner_url: '',
      youtube_channel_id: '',
      youtube_channel_url: '',
      subscriber_count: undefined,
      region: '',
      country: '',
    },
  });

  const onSubmit = async (data: CreateInfluencerFormData) => {
    setIsSubmitting(true);
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanedData = {
        ...data,
        bio: data.bio || undefined,
        avatar_url: data.avatar_url || undefined,
        banner_url: data.banner_url || undefined,
        youtube_channel_url: data.youtube_channel_url || undefined,
        region: data.region || undefined,
        country: data.country || undefined,
      };

      const result = await createInfluencer(cleanedData);
      if (result) {
        form.reset();
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error creating influencer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !loading) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto glass-effect backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-orange-500/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">Create New Influencer</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Add a new influencer to the platform. Fill in the required information below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white  p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter influencer name" {...field} className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="youtube_channel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Channel ID *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter YouTube channel ID" {...field} className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter influencer bio"
                      className="resize-none glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.jpg" {...field} className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="banner_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/banner.jpg" {...field} className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="youtube_channel_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Channel URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://youtube.com/@channelname" {...field} className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="subscriber_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscriber Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                        className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter region" {...field} className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter country" {...field} className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting || loading}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || loading}
                className="cursor-pointer"
              >
                {isSubmitting || loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Influencer'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}