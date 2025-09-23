"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, Video, Calendar, FileText, Link, Type } from "lucide-react";
import { toast } from "sonner";
import { Video as VideoType } from "@/lib/types";
import {
  updateVideoSchema,
  UpdateVideoFormData,
  defaultVideoEditFormValues,
} from "@/lib/validations/video";
import { videoActions } from "@/lib/actions/video-actions";
import { adminVideoActions } from "@/lib/actions/admin-video-actions";

interface EditVideoModalProps {
  video: VideoType | null;
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditVideoModal({
  video,
  isOpen,
  onClose,
  onSuccess,
}: EditVideoModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<UpdateVideoFormData>({
    resolver: zodResolver(updateVideoSchema),
    defaultValues: defaultVideoEditFormValues,
  });

  // Pre-populate form when video changes
  useEffect(() => {
    if (video && isOpen) {
      form.reset({
        title: video.title || "",
        description: video.description || "",
        video_url: video.video_url || "",
        published_at: video.published_at ? new Date(video.published_at) : null,
        transcription: video.transcription || "",
      });
    }
  }, [video, isOpen, form]);

  const onSubmit = async (data: UpdateVideoFormData) => {
    try {
      setLoading(true);

      // Prepare the update payload
      const updatePayload = {
        ...data,
        published_at: data.published_at ? data.published_at.toISOString() : undefined,
      };

      // Remove empty strings and convert to undefined for optional fields
      Object.keys(updatePayload).forEach(key => {
        const value = updatePayload[key as keyof typeof updatePayload];
        if (value === "" || value === null || value === undefined) {
          delete updatePayload[key as keyof typeof updatePayload];
        }
      });

      if (!video) {
        toast.error("No video selected");
        return;
      }
      await adminVideoActions.updateVideo(video.id, updatePayload);
      toast.success("Video updated successfully");
      onSuccess();
      onClose(false);
      form.reset();
    } catch (error) {
      console.error("Error updating video:", error);
      toast.error("Failed to update video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onClose(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] glass-effect backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/30">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            Edit Video
          </DialogTitle>
        </DialogHeader>

        {!video ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No video selected
            </p>
          </div>
        ) : (
          <>
            <DialogDescription>
              Update the video information. All fields are optional - only
              modify what you need to change.
            </DialogDescription>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-4">
                  {/* Title Field */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Type className="h-4 w-4" />
                          Title
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="w-full bg-white shadow-md"
                            placeholder="Enter video title"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description Field */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter video description (optional)"
                            className="min-h-[100px] resize-none w-full bg-white shadow-md"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Video URL Field */}
                  <FormField
                    control={form.control}
                    name="video_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          Video URL
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            {...field}
                            className="w-full bg-white shadow-md"
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Published Date Field */}
                  <FormField
                    control={form.control}
                    name="published_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Published Date
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value || undefined}
                            onDateChange={field.onChange}
                            placeholder="Select published date"
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Transcription Field */}
                  <FormField
                    control={form.control}
                    name="transcription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Transcription
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter video transcription (optional)"
                            className="min-h-[120px] resize-none w-full bg-white shadow-md"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Video
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
