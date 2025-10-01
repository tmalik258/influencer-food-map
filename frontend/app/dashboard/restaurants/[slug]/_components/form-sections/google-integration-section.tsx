"use client";

import { Control, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RestaurantEditFormData } from "@/lib/validations/restaurant-edit";

interface GoogleIntegrationSectionProps {
  control: Control<RestaurantEditFormData>;
  errors: FieldErrors<RestaurantEditFormData>;
}

export function GoogleIntegrationSection({
  control,
  errors,
}: GoogleIntegrationSectionProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-medium mb-4">Google Integration</legend>
      <div className="space-y-4">
        <FormField
          control={control}
          name="google_place_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Google Place ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter Google Place ID"
                  {...field}
                  value={field.value || ""}
                  aria-describedby={
                    errors.google_place_id
                      ? "google-place-id-error"
                      : "google-place-id-help"
                  }
                />
              </FormControl>
              <div
                id="google-place-id-help"
                className="text-sm text-muted-foreground"
              >
                Unique identifier from Google Places API
              </div>
              <FormMessage id="google-place-id-error" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="google_rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google Rating</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="Enter rating (0-5)"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : parseFloat(value));
                    }}
                    value={field.value === undefined ? "" : field.value}
                    aria-describedby={
                      errors.google_rating
                        ? "google-rating-error"
                        : "google-rating-help"
                    }
                  />
                </FormControl>
                <div
                  id="google-rating-help"
                  className="text-sm text-muted-foreground"
                >
                  Rating from Google (0.0 to 5.0)
                </div>
                <FormMessage id="google-rating-error" />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="business_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Status</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., OPERATIONAL, CLOSED_TEMPORARILY"
                    {...field}
                    value={field.value || ""}
                    aria-describedby={
                      errors.business_status
                        ? "business-status-error"
                        : "business-status-help"
                    }
                  />
                </FormControl>
                <div
                  id="business-status-help"
                  className="text-sm text-muted-foreground"
                >
                  Current operational status from Google
                </div>
                <FormMessage id="business-status-error" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="photo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photo URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  {...field}
                  value={field.value || ""}
                  aria-describedby={
                    errors.photo_url ? "photo-url-error" : "photo-url-help"
                  }
                />
              </FormControl>
              <div id="photo-url-help" className="text-sm text-muted-foreground">
                URL to restaurant photo
              </div>
              <FormMessage id="photo-url-error" />
            </FormItem>
          )}
        />
      </div>
    </fieldset>
  );
}