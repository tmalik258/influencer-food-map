'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, X, Tag } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(100, 'Tag name must be less than 100 characters'),
});

type TagFormData = z.infer<typeof tagSchema>;

interface Tag {
  id: string;
  name: string;
  created_at: string;
}

interface TagEditFormProps {
  tag: Tag;
  onSuccess: (updatedTag: Tag) => void;
  onCancel: () => void;
}

export function TagEditForm({ tag, onSuccess, onCancel }: TagEditFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: tag.name,
    },
  });

  const onSubmit = async (data: TagFormData) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/tags/${tag.id}`, data);
      onSuccess(response.data);
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Failed to update tag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Tag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Edit Tag</CardTitle>
            <p className="text-muted-foreground">Update tag information</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tag Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tag Name *</Label>
            <Input
              id="name"
              placeholder="Enter tag name"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
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