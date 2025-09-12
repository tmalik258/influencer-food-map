import { z } from "zod";

// Base schema for common influencer fields
const baseInfluencerSchema = {
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar_url: z.url("Invalid avatar URL").optional().or(z.literal("")),
  banner_url: z.url("Invalid banner URL").optional().or(z.literal("")),
  youtube_channel_id: z.string().min(1, "YouTube Channel ID is required"),
  youtube_channel_url: z
    .string()
    .url("Invalid YouTube channel URL")
    .optional()
    .or(z.literal("")),
  subscriber_count: z
    .number()
    .min(0, "Subscriber count must be positive")
    .optional(),
  region: z
    .string()
    .max(50, "Region must be less than 50 characters")
    .optional(),
  country: z
    .string()
    .max(50, "Country must be less than 50 characters")
    .optional(),
};

// Schema for creating a new influencer
export const createInfluencerSchema = z.object({
  ...baseInfluencerSchema,
  name: baseInfluencerSchema.name,
  youtube_channel_id: baseInfluencerSchema.youtube_channel_id,
});

// Schema for updating an existing influencer
export const updateInfluencerSchema = z.object({
  ...baseInfluencerSchema,
  name: baseInfluencerSchema.name.optional(),
  youtube_channel_id: baseInfluencerSchema.youtube_channel_id.optional(),
});

// Type exports
export type CreateInfluencerFormData = z.infer<typeof createInfluencerSchema>;
export type UpdateInfluencerFormData = z.infer<typeof updateInfluencerSchema>;
