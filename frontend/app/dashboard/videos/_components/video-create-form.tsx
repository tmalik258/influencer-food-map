"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useInfluencers } from "@/lib/hooks/useInfluencers";
import { useCreateVideo } from "@/lib/hooks/useVideos";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  influencer_id: z.string().min(1, "Please select an influencer"),
  youtube_url: z
    .string()
    .url("Please enter a valid YouTube URL")
    .refine(
      (url) => {
        const youtubePatterns = [
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([\w-]+)/,
        ];
        return youtubePatterns.some((pattern) => pattern.test(url));
      },
      {
        message: "Please enter a valid YouTube URL",
      }
    ),
});

type VideoFormValues = z.infer<typeof formSchema>;

interface VideoCreateFormModalProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export function VideoCreateFormModal({
  isCreateModalOpen,
  setIsCreateModalOpen,
  onSuccess,
}: VideoCreateFormModalProps) {
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      influencer_id: "",
      youtube_url: "",
    },
  });

  const {
    influencers,
    loading: isLoadingInfluencers,
    error: influencersError,
  } = useInfluencers();
  const {
    createVideoFromUrl,
    loading: isCreating,
    error: createError,
  } = useCreateVideo();

  useEffect(() => {
    if (influencersError) {
      toast.error(influencersError);
    }
  }, [influencersError]);

  useEffect(() => {
    if (createError) {
      toast.error(createError);
    }
  }, [createError]);

  const onSubmit = async (values: VideoFormValues) => {
    try {
      await createVideoFromUrl({
        influencer_id: values.influencer_id,
        youtube_url: values.youtube_url,
      });
      if (!createError) {
        toast.success("Video created successfully from YouTube URL!");
        form.reset();
        onSuccess();
      }
    } catch (error: any) {
      console.error("Failed to create video:", error);
    }
  };

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="sm:max-w-[600px] glass-effect backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/30">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            Create New Video
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="influencer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Influencer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingInfluencers}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white">
                        <SelectValue
                          placeholder={
                            isLoadingInfluencers
                              ? "Loading influencers..."
                              : "Select an influencer"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {influencers.map((influencer) => (
                        <SelectItem key={influencer.id} value={influencer.id}>
                          {influencer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="youtube_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      {...field}
                      className="glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isCreating || isLoadingInfluencers}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700 transition-all duration-200 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCreating ? "Creating..." : "Create Video"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
