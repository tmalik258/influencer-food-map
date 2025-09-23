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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminRestaurant } from '@/lib/hooks/useAdminRestaurant';
import {
  createRestaurantSchema,
  CreateRestaurantFormData,
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
      
      await createRestaurant(data);
      
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
        className="max-w-md glass-effect border-orange-500/30 backdrop-blur-xl shadow-2xl"
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
            Enter the restaurant name. Additional details will be fetched automatically from Google Places.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Restaurant Name */}
            <div className="space-y-6 p-6 rounded-xl bg-card/50 border border-border/30">
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
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="hover:bg-muted/50 transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="bg-orange-500 hover:bg-orange-600 text-white transition-colors duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Restaurant'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}