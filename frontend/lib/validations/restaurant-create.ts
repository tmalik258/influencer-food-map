import * as z from "zod";

// Restaurant creation validation schema
export const createRestaurantSchema = z.object({
  name: z
    .string()
    .min(1, "Restaurant name is required")
    .max(255, "Name must be less than 255 characters")
    .trim(),

  address: z
    .string()
    .min(1, "Address is required")
    .max(500, "Address must be less than 500 characters")
    .trim(),

  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),

  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),

  city: z
    .string()
    .trim()
    .max(100, "City must be less than 100 characters")
    .optional(),

  country: z
    .string()
    .trim()
    .max(100, "Country must be less than 100 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),

  business_status: z.enum([
    "business_status_unspecified",
    "operational",
    "closed_temporarily",
    "closed_permanently",
  ]),

  google_place_id: z.string().trim().optional(),

  google_rating: z
    .number()
    .min(0, "Rating must be between 0 and 5")
    .max(5, "Rating must be between 0 and 5")
    .optional(),

  google_user_ratings_total: z
    .number()
    .min(0, "Total ratings must be non-negative")
    .optional(),

  photo_url: z.url("Please enter a valid URL").trim().optional(),

  is_active: z.boolean(),
});

// Type inference
export type CreateRestaurantFormData = z.infer<typeof createRestaurantSchema>;

// Business status options for UI
export const businessStatusOptions = [
  { value: "operational", label: "Operational" },
  { value: "closed_temporarily", label: "Temporarily Closed" },
  { value: "closed_permanently", label: "Permanently Closed" },
  { value: "business_status_unspecified", label: "Unspecified" },
] as const;

// Default form values
export const defaultRestaurantFormValues: CreateRestaurantFormData = {
  name: "",
  address: "",
  city: "",
  country: "",
  description: "",
  business_status: "operational",
  google_place_id: "",
  photo_url: "",
  is_active: true,
};
