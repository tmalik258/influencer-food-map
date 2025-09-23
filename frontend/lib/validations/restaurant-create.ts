import * as z from "zod";

// Restaurant creation validation schema - simplified to only include name
export const createRestaurantSchema = z.object({
  name: z
    .string()
    .min(1, "Restaurant name is required")
    .max(255, "Name must be less than 255 characters")
    .trim(),
});

// Type inference
export type CreateRestaurantFormData = z.infer<typeof createRestaurantSchema>;

// Default form values
export const defaultRestaurantFormValues: CreateRestaurantFormData = {
  name: "",
};
