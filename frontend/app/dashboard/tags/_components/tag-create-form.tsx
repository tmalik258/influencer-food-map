"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import axios from 'axios';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Tag name must be at least 2 characters.' }).max(50, { message: 'Tag name must not exceed 50 characters.' }),
});

interface TagCreateFormProps {
  onSuccess: () => void;
}

export default function TagCreateForm({ onSuccess }: TagCreateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await axios.post('/api/tags', values);
      toast.success('Tag created successfully!');
      onSuccess();
      form.reset();
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error('Failed to create tag. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter tag name" 
                  {...field} 
                  className="glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
        >
          {isLoading ? 'Creating...' : 'Create Tag'}
        </Button>
      </form>
    </Form>
  );
}