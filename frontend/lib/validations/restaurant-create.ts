import * as z from "zod";

// Restaurant creation validation schema - includes name, city, and country
export const createRestaurantSchema = z.object({
  name: z
    .string()
    .min(1, "Restaurant name is required")
    .min(2, "Restaurant name must be at least 2 characters")
    .max(255, "Name must be less than 255 characters")
    .trim()
    .refine(
      (name) => {
        // Prevent names with only special characters or numbers
        const hasLetters = /[a-zA-Z]/.test(name);
        return hasLetters;
      },
      {
        message: "Restaurant name must contain at least some letters.",
      }
    ),
  city: z
    .string()
    .max(100, "City must be less than 100 characters")
    .trim()
    .refine(
      (city) => {
        // Allow empty or valid city names
        if (!city) return true;
        const validCityPattern = /^[a-zA-Z\s\-'.,()]+$/;
        return validCityPattern.test(city);
      },
      {
        message: "City name contains invalid characters. Only letters, spaces, and common punctuation are allowed.",
      }
    )
    .optional(),
  country: z
    .string()
    .max(100, "Country must be less than 100 characters")
    .trim()
    .refine(
      (country) => {
        const validCountryPattern = /^[a-zA-Z\s\-'.,()]+$/;
        return validCountryPattern.test(country);
      },
      {
        message: "Country name contains invalid characters. Only letters, spaces, and common punctuation are allowed.",
      }
    )
    .default("USA"),
});

// Type inference
export type CreateRestaurantFormData = z.infer<typeof createRestaurantSchema>;

// Default form values
export const defaultRestaurantFormValues: CreateRestaurantFormData = {
  name: "",
  city: "",
  country: "USA",
};
