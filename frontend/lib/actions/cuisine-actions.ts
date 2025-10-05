import { Cuisine, Restaurant } from '@/lib/types';
import api, { adminApi } from '../api';

// In-memory cache for all cuisines to avoid repeated fetching across mounts
let allCuisinesCache: Cuisine[] | null = null;
let allCuisinesCacheKey: string | null = null;

interface PaginatedCuisinesResponse {
  cuisines: Cuisine[];
  total: number;
}

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
      // Handle both old and new response formats for backward compatibility
      return Array.isArray(response.data) ? response.data : response.data.cuisines;
    } catch (error) {
      console.error('Error fetching cuisines:', error);
      throw error;
    }
  },

  /**
   * Get paginated cuisines with total count
   */
  async getCuisinesPaginated(params?: {
    name?: string;
    id?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }): Promise<PaginatedCuisinesResponse> {
    try {
      const response = await api.get('/cuisines/', { params });
      // Handle both old and new response formats
      if (Array.isArray(response.data)) {
        // Old format - return as paginated response
        return {
          cuisines: response.data,
          total: response.data.length
        };
      }
      // New format - return as is
      return response.data;
    } catch (error) {
      console.error('Error fetching paginated cuisines:', error);
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
      const cacheKey = `${limit}:${city ?? ''}`;
      if (allCuisinesCache && allCuisinesCacheKey === cacheKey) {
        return allCuisinesCache;
      }
      const response = await api.get('/cuisines/', {
        params: {
          limit,
          city,
        },
      });
      const data = response.data;
      const cuisines = Array.isArray(data) ? data : data?.cuisines ?? [];
      allCuisinesCache = cuisines;
      allCuisinesCacheKey = cacheKey;
      return cuisines;
    } catch (error) {
      console.error('Error fetching all cuisines:', error);
      throw error;
    }
  },

  /**
   * Create a new cuisine
   */
  async createCuisine(cuisineData: { name: string; description?: string }): Promise<Cuisine> {
    try {
      const response = await adminApi.post('/cuisines/', cuisineData);
      return response.data;
    } catch (error) {
      console.error('Error creating cuisine:', error);
      throw error;
    }
  },

  /**
   * Update an existing cuisine
   */
  async updateCuisine(cuisineId: string, cuisineData: { name?: string; description?: string }): Promise<Cuisine> {
    try {
      const response = await adminApi.put(`/cuisines/${cuisineId}/`, cuisineData);
      return response.data;
    } catch (error) {
      console.error(`Error updating cuisine ${cuisineId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a cuisine
   */
  async deleteCuisine(cuisineId: string): Promise<void> {
    try {
      await adminApi.delete(`/cuisines/${cuisineId}/`);
    } catch (error) {
      console.error(`Error deleting cuisine ${cuisineId}:`, error);
      throw error;
    }
  },

  /**
   * Get restaurants by cuisine ID with pagination
   */
  async getRestaurantsByCuisine(
    cuisineId: string,
    params?: {
      skip?: number;
      limit?: number;
      include_listings?: boolean;
      include_video_details?: boolean;
    }
  ): Promise<{ restaurants: Restaurant[]; total: number }> {
    try {
      const response = await api.get(`/cuisines/${cuisineId}/restaurants/`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching restaurants for cuisine ${cuisineId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a restaurant from a cuisine
   */
  async removeRestaurantFromCuisine(cuisineId: string, restaurantId: string): Promise<void> {
    try {
      await api.delete(`/cuisines/${cuisineId}/restaurants/${restaurantId}/`);
    } catch (error) {
      console.error(`Error removing restaurant ${restaurantId} from cuisine ${cuisineId}:`, error);
      throw error;
    }
  },
};