"use client";

import { Control, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RestaurantEditFormData } from "@/lib/validations/restaurant-edit";

interface AddressSectionProps {
  control: Control<RestaurantEditFormData>;
  errors: FieldErrors<RestaurantEditFormData>;
}

export function AddressSection({ control, errors }: AddressSectionProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-medium mb-4">Address Information</legend>
      <div className="space-y-4">
        <FormField
          control={control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter full address"
                  className="resize-none"
                  rows={3}
                  {...field}
                  aria-required="true"
                  aria-describedby={errors.address ? "address-error" : undefined}
                />
              </FormControl>
              <FormMessage id="address-error" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter city"
                    {...field}
                    value={field.value || ""}
                    aria-describedby={errors.city ? "city-error" : undefined}
                  />
                </FormControl>
                <FormMessage id="city-error" />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter country"
                    {...field}
                    value={field.value || ""}
                    aria-describedby={errors.country ? "country-error" : undefined}
                  />
                </FormControl>
                <FormMessage id="country-error" />
              </FormItem>
            )}
          />
        </div>
      </div>
    </fieldset>
  );
}