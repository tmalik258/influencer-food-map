"use client";

import { Control, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RestaurantEditFormData } from "@/lib/validations/restaurant-edit";

interface BasicInformationSectionProps {
  control: Control<RestaurantEditFormData>;
  errors: FieldErrors<RestaurantEditFormData>;
}

export function BasicInformationSection({
  control,
  errors,
}: BasicInformationSectionProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-medium mb-4">Basic Information</legend>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restaurant Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter restaurant name"
                  {...field}
                  aria-required="true"
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
              </FormControl>
              <FormMessage id="name-error" />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable or disable this restaurant
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-describedby="active-status-description"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </fieldset>
  );
}