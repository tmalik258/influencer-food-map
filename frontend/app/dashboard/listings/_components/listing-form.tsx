"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { AsyncSearchableSelect } from "./async-searchable-select";
import { Switch } from "@/components/ui/switch";
import { QuotesContextList } from "./quotes-context-list";
import {
  fetchFunctions,
  EntityType,
} from "@/lib/utils/fetch-functions";
import { useListingForm } from "@/lib/hooks/useListingForm";
import { Listing } from "@/lib/types/dashboard";

interface ListingFormProps {
  mode: 'create' | 'edit';
  listingData?: Listing;
  onSuccess?: () => void;
}

/**
 * Listing form component that supports both creation and editing of listings.
 * 
 * @param mode - Determines the operation mode ('create' or 'edit')
 * @param listingData - Existing listing data for edit mode (required when mode is 'edit')
 * @param onSuccess - Optional callback function called after successful form submission
 */
export function ListingForm({ mode, listingData, onSuccess }: ListingFormProps) {
  const { form, isLoading, handleSubmit, handleReset } = useListingForm({
    mode,
    listingData,
    onSuccess,
  });

  return (
    <div className="max-h-[80vh] overflow-y-auto pr-2">
      <div className="mb-6">
        <p className="text-muted-foreground">
          {mode === 'create' 
            ? 'Fill in the details below to create a new listing.' 
            : 'Update the listing information below.'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="restaurant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant</FormLabel>
                  <FormControl>
                    <AsyncSearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      fetchOptions={fetchFunctions[EntityType.RESTAURANT]}
                      placeholder="Search restaurants..."
                      emptyMessage="No restaurants found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="video_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video</FormLabel>
                  <FormControl>
                    <AsyncSearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      fetchOptions={fetchFunctions[EntityType.VIDEO]}
                      placeholder="Search videos..."
                      emptyMessage="No videos found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="influencer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Influencer</FormLabel>
                  <FormControl>
                    <AsyncSearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      fetchOptions={fetchFunctions[EntityType.INFLUENCER]}
                      placeholder="Search influencers..."
                      emptyMessage="No influencers found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="visit_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        placeholder="Select published date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="quotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quotes</FormLabel>
                <FormControl>
                  <QuotesContextList
                    items={field.value}
                    onItemsChange={field.onChange}
                    placeholder="Add a quote..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="context"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Context</FormLabel>
                <FormControl>
                  <QuotesContextList
                    items={field.value}
                    onItemsChange={field.onChange}
                    placeholder="Add context..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confidence_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confidence Score (0-100)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full bg-white shadow-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timestamp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video Timestamp (seconds)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Enter timestamp in seconds (optional)"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-white shadow-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="approved"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Approved</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Mark this listing as approved
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-gray-300"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (mode === 'create' ? "Creating..." : "Updating...") 
                : (mode === 'create' ? "Create Listing" : "Update Listing")
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}