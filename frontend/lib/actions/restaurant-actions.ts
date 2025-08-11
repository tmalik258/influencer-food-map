import api from '../api';
import { Restaurant, SearchParams } from '@/types';

export const restaurantActions = {
  getRestaurants: async (params?: SearchParams): Promise<Restaurant[]> => {
    const response = await api.get('/restaurants', { params });
    return response.data;
  },
  
  getRestaurant: async (id: string): Promise<Restaurant> => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },
  
  searchRestaurantsByCity: async (city: string): Promise<Restaurant[]> => {
    const response = await api.get('/restaurants', {
      params: { city, limit: 50 }
    });
    return response.data;
  },

  getPopularCities: async (): Promise<string[]> => {
    const response = await api.get('/restaurants/popular_cities');
    return response.data;
  },
};