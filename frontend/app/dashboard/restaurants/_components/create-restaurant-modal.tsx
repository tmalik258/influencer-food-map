'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Phone, Globe, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminRestaurant } from '@/lib/hooks/useAdminRestaurant';
import {
  createRestaurantSchema,
  CreateRestaurantFormData,
  businessStatusOptions,
  defaultRestaurantFormValues,
} from '@/lib/validations/restaurant-create';

interface CreateRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateRestaurantModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateRestaurantModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRestaurant } = useAdminRestaurant();

  const form = useForm<CreateRestaurantFormData>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: defaultRestaurantFormValues,
    mode: 'onChange',
  });

  const onSubmit: SubmitHandler<CreateRestaurantFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Clean up empty optional fields
      const cleanedData = {
        ...data,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        city: data.city || "",
        country: data.country || "",
        description: data.description || "",
        google_place_id: data.google_place_id || "",
        google_rating: data.google_rating || 0,
        google_user_ratings_total: data.google_user_ratings_total || 0,
        photo_url: data.photo_url || "",
        is_active: data.is_active || false,
      };

      await createRestaurant(cleanedData);
      
      toast.success('Restaurant created successfully!');
      form.reset();
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating restaurant:', error);
      toast.error(error.response?.data?.detail || 'Failed to create restaurant. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl glass-effect border-orange-500/30 max-h-[90vh] overflow-y-auto backdrop-blur-xl shadow-2xl"
        aria-describedby="create-restaurant-description"
      >
        <DialogHeader className="pb-6 border-b border-border/20">
          <DialogTitle className="flex items-center gap-3 text-2xl font-semibold text-foreground">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <MapPin className="h-6 w-6 text-orange-500" />
            </div>
            Create New Restaurant
          </DialogTitle>
          <DialogDescription id="create-restaurant-description" className="text-muted-foreground mt-2">
            Add a new restaurant to the system. Fill in the required information below to get started.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-6 p-6 rounded-xl bg-card/50 border border-border/30">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <h3 className="text-lg font-semibold text-card-foreground">Basic Information</h3>
              </div>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Restaurant Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter restaurant name" 
                        {...field}
                        disabled={isSubmitting}
                        autoFocus
                        className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the restaurant"
                        className="resize-none focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                        rows={3}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Business Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200">
                          <SelectValue placeholder="Select business status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-effect border-border/30">
                        {businessStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="focus:bg-orange-500/10">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Information */}
            <div className="space-y-6 p-6 rounded-xl bg-card/50 border border-border/30">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <h3 className="text-lg font-semibold text-card-foreground">Location Information</h3>
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      Address *
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter full address"
                        className="resize-none focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                        rows={2}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="any"
                          placeholder="e.g., 40.7128"
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={isSubmitting}
                          className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="any"
                          placeholder="e.g., -74.0060"
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={isSubmitting}
                          className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">City</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., New York"
                          {...field}
                          disabled={isSubmitting}
                          className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Country</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., United States"
                          {...field}
                          disabled={isSubmitting}
                          className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Google Integration (Optional) */}
            <div className="space-y-6 p-6 rounded-xl bg-card/50 border border-border/30">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <h3 className="text-lg font-semibold text-card-foreground">Google Integration (Optional)</h3>
              </div>
              
              <FormField
                control={form.control}
                name="google_place_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4 text-orange-500" />
                      Google Place ID
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Google Place ID if available"
                        {...field}
                        disabled={isSubmitting}
                        className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="google_rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Star className="h-4 w-4 text-orange-500" />
                        Google Rating
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          placeholder="0.0 - 5.0"
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={isSubmitting}
                          className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="google_user_ratings_total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Total Ratings</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="Number of ratings"
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          disabled={isSubmitting}
                          className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-6 p-6 rounded-xl bg-card/50 border border-border/30">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <h3 className="text-lg font-semibold text-card-foreground">Additional Information</h3>
              </div>
              
              <FormField
                control={form.control}
                name="photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Photo URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/photo.jpg"
                        {...field}
                        disabled={isSubmitting}
                        className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Status</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === 'true')} defaultValue={field.value ? 'true' : 'false'} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-effect border-border/30">
                        <SelectItem value="true" className="focus:bg-orange-500/10">Active</SelectItem>
                        <SelectItem value="false" className="focus:bg-orange-500/10">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 pt-6 border-t border-border/20">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto border-border/40 hover:bg-muted/50 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto cursor-pointer bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Restaurant...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Create Restaurant
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}