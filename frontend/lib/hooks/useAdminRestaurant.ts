'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { Restaurant } from '@/lib/types';

interface RestaurantCreateData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  google_place_id?: string;
  google_rating?: number;
  business_status?: string;
  photo_url?: string;
  is_active?: boolean;
}

interface RestaurantUpdateData {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  google_place_id?: string;
  google_rating?: number;
  business_status?: string;
  photo_url?: string;
  is_active?: boolean;
}

interface AdminRestaurantResponse {
  message: string;
  restaurant_id: string;
}

export function useAdminRestaurant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRestaurant = async (data: RestaurantCreateData): Promise<AdminRestaurantResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.post<AdminRestaurantResponse>('/restaurants', data);
      toast.success('Restaurant created successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create restaurant';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateRestaurant = async (
    restaurantId: string,
    data: RestaurantUpdateData
  ): Promise<AdminRestaurantResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.patch<AdminRestaurantResponse>(`/restaurants/${restaurantId}`, data);
      toast.success('Restaurant updated successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update restaurant';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteRestaurant = async (restaurantId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await adminApi.delete(`/restaurants/${restaurantId}`);
      toast.success('Restaurant deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete restaurant';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getRestaurant = async (restaurantId: string): Promise<Restaurant | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.get<Restaurant>(`/restaurants/${restaurantId}`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch restaurant';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getRestaurant,
    loading,
    error,
  };
}