'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const listingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.url('Invalid URL format').optional().or(z.literal('')),
  rating: z.number().min(0).max(5).optional(),
  price_range: z.string().optional(),
  cuisine_type: z.string().optional(),
  opening_hours: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface Listing {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  price_range?: string;
  cuisine_type?: string;
  opening_hours?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at?: string;
}

interface ListingEditFormProps {
  listing: Listing;
  onSuccess: (updatedListing: Listing) => void;
  onCancel: () => void;
}

export function ListingEditForm({ listing, onSuccess, onCancel }: ListingEditFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      name: listing.name,
      description: listing.description || '',
      address: listing.address || '',
      phone: listing.phone || '',
      website: listing.website || '',
      rating: listing.rating || undefined,
      price_range: listing.price_range || '',
      cuisine_type: listing.cuisine_type || '',
      opening_hours: listing.opening_hours || '',
      status: listing.status,
    },
  });

  const watchedStatus = watch('status');

  const onSubmit = async (data: ListingFormData) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/listings/${listing.id}`, data);
      onSuccess(response.data);
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <MapPin className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <CardTitle className="text-2xl text-gray-900 dark:text-white">Edit Listing</CardTitle>
            <p className="text-gray-600 dark:text-gray-300">Update restaurant listing information</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                placeholder="Enter restaurant name"
                {...register('name')}
                className={`glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter restaurant description"
                rows={3}
                {...register('description')}
                className={`glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500 ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watchedStatus}
                onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'pending')}
              >
                <SelectTrigger className="glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Contact Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter restaurant address"
                {...register('address')}
                className={`glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500 ${errors.address ? 'border-red-500' : ''}`}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  {...register('phone')}
                  className={`glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500 ${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://example.com"
                  {...register('website')}
                  className={`glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500 ${errors.website ? 'border-red-500' : ''}`}
                />
                {errors.website && (
                  <p className="text-sm text-red-500">{errors.website.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Restaurant Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Restaurant Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="4.5"
                  {...register('rating', { valueAsNumber: true })}
                  className={`glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500 ${errors.rating ? 'border-red-500' : ''}`}
                />
                {errors.rating && (
                  <p className="text-sm text-red-500">{errors.rating.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_range">Price Range</Label>
                <Input
                  id="price_range"
                  placeholder="$$ - $$$"
                  {...register('price_range')}
                  className={`glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500 ${errors.price_range ? 'border-red-500' : ''}`}
                />
                {errors.price_range && (
                  <p className="text-sm text-red-500">{errors.price_range.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisine_type">Cuisine Type</Label>
                <Input
                  id="cuisine_type"
                  placeholder="Italian, Chinese, etc."
                  {...register('cuisine_type')}
                  className={`glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500 ${errors.cuisine_type ? 'border-red-500' : ''}`}
                />
                {errors.cuisine_type && (
                  <p className="text-sm text-red-500">{errors.cuisine_type.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening_hours">Opening Hours</Label>
              <Textarea
                id="opening_hours"
                placeholder="Mon-Fri: 9:00 AM - 10:00 PM&#10;Sat-Sun: 10:00 AM - 11:00 PM"
                rows={3}
                {...register('opening_hours')}
                className={`glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500 ${errors.opening_hours ? 'border-red-500' : ''}`}
              />
              {errors.opening_hours && (
                <p className="text-sm text-red-500">{errors.opening_hours.message}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-800/20 cursor-pointer"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
            >
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