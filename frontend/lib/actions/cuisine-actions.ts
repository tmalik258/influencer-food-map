import { Cuisine } from '@/lib/types';
import api from '../api';

export const cuisineActions = {
  /**
   * Get cuisines with optional filters
   */
  async getCuisines(params?: {
    name?: string;
    id?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }): Promise<Cuisine[]> {
    try {
      const response = await api.get('/cuisines/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching cuisines:', error);
      throw error;
    }
  },

  /**
   * Get a single cuisine by ID
   */
  async getCuisine(cuisineId: string): Promise<Cuisine> {
    try {
      const response = await api.get(`/cuisines/${cuisineId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching cuisine ${cuisineId}:`, error);
      throw error;
    }
  },

  /**
   * Search cuisines by name
   */
  async searchCuisinesByName(name: string, limit = 20): Promise<Cuisine[]> {
    try {
      const response = await api.get('/cuisines/', {
        params: {
          name,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching cuisines by name "${name}":`, error);
      throw error;
    }
  },

  /**
   * Get all available cuisines
   */
  async getAllCuisines(limit = 100, city?: string): Promise<Cuisine[]> {
    try {
      const response = await api.get('/cuisines/', {
        params: {
          limit,
          city,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all cuisines:', error);
      throw error;
    }
  },
};