'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const cuisineEditSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

type CuisineEditFormData = z.infer<typeof cuisineEditSchema>;

interface Cuisine {
  id: string;
  name: string;
  created_at: string;
}

interface CuisineEditFormProps {
  cuisine: Cuisine;
  onSuccess: (updatedCuisine: Cuisine) => void;
  onCancel: () => void;
}

export function CuisineEditForm({ cuisine, onSuccess, onCancel }: CuisineEditFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CuisineEditFormData>({
    resolver: zodResolver(cuisineEditSchema),
    defaultValues: {
      name: cuisine.name,
    },
  });

  const onSubmit = async (data: CuisineEditFormData) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/cuisines/${cuisine.id}`, data);
      onSuccess(response.data);
    } catch (error) {
      console.error('Error updating cuisine:', error);
      toast.error('Failed to update cuisine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-gray-100">Edit Cuisine</CardTitle>
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">Cuisine Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter cuisine name"
              className="glass-effect backdrop-blur-sm bg-white/70 border-orange-200/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}