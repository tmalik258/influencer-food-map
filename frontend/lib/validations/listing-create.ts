import * as z from "zod";

// Base schema with common fields
const baseListingSchema = z.object({
  restaurant_id: z.string().min(1, "Restaurant is required"),
  video_id: z.string().min(1, "Video is required"),
  influencer_id: z.string().min(1, "Influencer is required"),
  quotes: z.array(z.string()),
  confidence_score: z.number().min(0).max(1),
  approved: z.boolean(),
  timestamp: z.number().min(0, "Timestamp must be a positive number"),
});

// Create mode schema - visit_date is optional (backend will set it)
export const createListingSchema = baseListingSchema.extend({
  visit_date: z.date().optional(),
});

// Edit mode schema - visit_date is required
export const editListingSchema = baseListingSchema.extend({
  visit_date: z.date({
    message: "Visit date is required",
  }),
});

// Type inference for the schemas
export type CreateListingFormData = z.infer<typeof createListingSchema>;
export type EditListingFormData = z.infer<typeof editListingSchema>;