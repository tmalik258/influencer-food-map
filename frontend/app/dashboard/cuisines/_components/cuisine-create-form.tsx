"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cuisineActions } from '@/lib/actions/cuisine-actions';
import { Cuisine } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Cuisine name must be at least 2 characters.' }).max(50, { message: 'Cuisine name must not exceed 50 characters.' }),
});

interface CuisineCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  cuisine?: Cuisine | null;
}

export function CuisineCreateForm({ open, onOpenChange, onSuccess, cuisine }: CuisineCreateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  const isEditMode = !!cuisine;

  useEffect(() => {
    if (isEditMode && cuisine) {
      form.setValue('name', cuisine.name);
    } else {
      form.reset({ name: '' });
    }
  }, [isEditMode, cuisine, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (isEditMode && cuisine) {
        await cuisineActions.updateCuisine(cuisine.id, values);
        toast.success('Cuisine updated successfully!');
      } else {
        await cuisineActions.createCuisine(values);
        toast.success('Cuisine created successfully!');
      }
      onSuccess();
      if (!isEditMode) {
        form.reset();
      }
      onOpenChange(false);
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} cuisine:`, error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} cuisine. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Cuisine' : 'Create New Cuisine'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuisine Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter cuisine name" 
                      {...field} 
                      className="cursor-pointer"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer"
              >
                {isLoading 
                  ? (isEditMode ? 'Updating...' : 'Creating...') 
                  : (isEditMode ? 'Update Cuisine' : 'Create Cuisine')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}