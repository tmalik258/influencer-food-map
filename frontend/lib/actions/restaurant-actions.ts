import api from '../api';
import { Restaurant, SearchParams, OptimizedFeaturedResponse } from '@/types';

export const restaurantActions = {
  getRestaurants: async (params?: SearchParams): Promise<Restaurant[]> => {
    const response = await api.get('/restaurants', { params });
    return response.data;
  },
  
  getRestaurant: async (id: string, includeListings = false, includeVideoDetails = true): Promise<Restaurant> => {
    const response = await api.get(`/restaurants/${id}`, {
      params: {
        include_listings: includeListings,
        include_video_details: includeVideoDetails
      }
    });
    return response.data;
  },
  
  // New method to get restaurants with listings (optimized for performance)
  getRestaurantsWithListings: async (params?: Omit<SearchParams, 'include_listings'>, includeVideoDetails = false): Promise<Restaurant[]> => {
    const response = await api.get('/restaurants', {
      params: {
        ...params,
        include_listings: true,
        include_video_details: includeVideoDetails
      }
    });
    return response.data;
  },
  
  searchRestaurantsByCity: async (city: string, includeListings = false, includeVideoDetails = false): Promise<Restaurant[]> => {
    const response = await api.get('/restaurants', {
      params: { 
        city, 
        limit: 50,
        include_listings: includeListings,
        include_video_details: includeVideoDetails
      }
    });
    return response.data;
  },

  getPopularCities: async (): Promise<string[]> => {
    const response = await api.get('/restaurants/popular_cities');
    return response.data;
  },

  getFeaturedOptimized: async (): Promise<OptimizedFeaturedResponse> => {
    const response = await api.get('/restaurants/featured-optimized');
    return response.data;
  },
};