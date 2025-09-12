import { z } from "zod";

export const restaurantEditSchema = z.object({
  name: z
    .string()
    .min(1, "Restaurant name is required")
    .max(255, "Name must be less than 255 characters"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(500, "Address must be less than 500 characters"),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  city: z.string().max(100, "City must be less than 100 characters").optional(),
  country: z
    .string()
    .max(100, "Country must be less than 100 characters")
    .optional(),
  google_place_id: z
    .string()
    .max(255, "Google Place ID must be less than 255 characters")
    .optional(),
  google_rating: z
    .number()
    .min(0, "Rating must be between 0 and 5")
    .max(5, "Rating must be between 0 and 5")
    .optional(),
  business_status: z
    .string()
    .max(50, "Business status must be less than 50 characters")
    .optional(),
  photo_url: z.url("Must be a valid URL").optional().or(z.literal("")),
  is_active: z.boolean(),
});

export type RestaurantEditFormData = z.infer<typeof restaurantEditSchema>;

/**
 * Cleans form data by converting empty strings to undefined for optional fields
 */
export function cleanRestaurantFormData(data: RestaurantEditFormData): RestaurantEditFormData {
  return {
    ...data,
    city: data.city || undefined,
    country: data.country || undefined,
    google_place_id: data.google_place_id || undefined,
    business_status: data.business_status || undefined,
    photo_url: data.photo_url || undefined,
  };
}