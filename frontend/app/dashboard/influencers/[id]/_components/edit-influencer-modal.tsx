"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Influencer } from "@/lib/types";
import { useAdminInfluencer } from "@/lib/hooks/useAdminInfluencer";

const editInfluencerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  bio: z.string().optional(),
  youtube_channel_id: z.string().optional(),
  youtube_channel_name: z.string().optional(),
  youtube_subscriber_count: z.number().min(0, "Subscriber count must be non-negative").optional(),
});

type EditInfluencerFormData = z.infer<typeof editInfluencerSchema>;

interface EditInfluencerModalProps {
  isOpen: boolean;
  onClose: () => void;
  influencer: Partial<Influencer>;
  onSuccess: () => void;
}

export function EditInfluencerModal({
  isOpen,
  onClose,
  influencer,
  onSuccess,
}: EditInfluencerModalProps) {
  const { updateInfluencer, loading } = useAdminInfluencer();

  const form = useForm<EditInfluencerFormData>({
    resolver: zodResolver(editInfluencerSchema),
    defaultValues: {
      name: influencer.name,
      bio: influencer.bio || "",
      youtube_channel_id: influencer.youtube_channel_id || "",
    },
  });

  const onSubmit = async (data: EditInfluencerFormData) => {
    if (!influencer?.id) {
      return;
    }

    // Convert empty strings to undefined for optional fields
    const updateData = {
      name: data.name,
      bio: data.bio?.trim() || undefined,
      youtube_channel_id: data.youtube_channel_id?.trim() || undefined,
      subscriber_count: data.youtube_subscriber_count || undefined,
    };

    const result = await updateInfluencer(influencer.id, updateData);
    if (result) {
      onSuccess();
      onClose();
      form.reset();
    }
  };

  const handleClose = () => {
    if (!loading) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] glass-effect backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-orange-500/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">Edit Influencer</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Update the influencer&apos;s information. All fields except name are optional.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter influencer name"
                      {...field}
                      disabled={loading}
                      className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      disabled={loading}
                    />
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
                  <FormLabel>YouTube Channel ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter YouTube channel ID"
                      {...field}
                      disabled={loading}
                      className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="youtube_channel_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Channel Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter YouTube channel name"
                      {...field}
                      disabled={loading}
                      className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="youtube_subscriber_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Subscriber Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter subscriber count"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={loading}
                      className="glass-input border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Influencer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}