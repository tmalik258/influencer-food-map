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

interface LocationCoordinatesSectionProps {
  control: Control<RestaurantEditFormData>;
  errors: FieldErrors<RestaurantEditFormData>;
}

export function LocationCoordinatesSection({
  control,
  errors,
}: LocationCoordinatesSectionProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-medium mb-4">Location Coordinates</legend>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="Enter latitude (-90 to 90)"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? "" : parseFloat(value));
                  }}
                  value={field.value === undefined ? "" : field.value}
                  aria-required="true"
                  aria-describedby={
                    errors.latitude ? "latitude-error" : "latitude-help"
                  }
                />
              </FormControl>
              <div id="latitude-help" className="text-sm text-muted-foreground">
                Range: -90 to 90
              </div>
              <FormMessage id="latitude-error" />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="Enter longitude (-180 to 180)"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? "" : parseFloat(value));
                  }}
                  value={field.value === undefined ? "" : field.value}
                  aria-required="true"
                  aria-describedby={
                    errors.longitude ? "longitude-error" : "longitude-help"
                  }
                />
              </FormControl>
              <div id="longitude-help" className="text-sm text-muted-foreground">
                Range: -180 to 180
              </div>
              <FormMessage id="longitude-error" />
            </FormItem>
          )}
        />
      </div>
    </fieldset>
  );
}