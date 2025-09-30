import { Tag } from '@/lib/types';
import api, { adminApi } from '../api';

interface PaginatedTagsResponse {
  tags: Tag[];
  total: number;
}

export const tagActions = {
  /**
   * Get tags with optional filters
   */
  async getTags(params?: {
    name?: string;
    id?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }): Promise<Tag[]> {
    try {
      const response = await api.get('/tags/', { params });
      // Handle both old and new response formats for backward compatibility
      return Array.isArray(response.data) ? response.data : response.data.tags;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  },

  /**
   * Get paginated tags with total count
   */
  async getTagsPaginated(params?: {
    name?: string;
    id?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }): Promise<PaginatedTagsResponse> {
    try {
      const response = await api.get('/tags/', { params });
      // Handle both old and new response formats
      if (Array.isArray(response.data)) {
        // Old format - return as paginated response
        return {
          tags: response.data,
          total: response.data.length
        };
      }
      // New format - return as is
      return response.data;
    } catch (error) {
      console.error('Error fetching paginated tags:', error);
      throw error;
    }
  },

  /**
   * Get a single tag by ID
   */
  async getTag(tagId: string): Promise<Tag> {
    try {
      const response = await api.get(`/tags/${tagId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tag ${tagId}:`, error);
      throw error;
    }
  },

  /**
   * Search tags by name
   */
  async searchTagsByName(name: string, limit = 20): Promise<Tag[]> {
    try {
      const response = await api.get('/tags/', {
        params: {
          name,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching tags by name "${name}":`, error);
      throw error;
    }
  },

  /**
   * Get all available cuisine tags
   */
  async getAllTags(limit = 100, city?: string): Promise<Tag[]> {
    try {
      const response = await api.get('/tags/', {
        params: {
          limit,
          city,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all tags:', error);
      throw error;
    }
  },

  /**
   * Create a new tag
   */
  async createTag(tagData: { name: string; description?: string }): Promise<Tag> {
    try {
      const response = await adminApi.post('/tags/', tagData);
      return response.data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  },

  /**
   * Update an existing tag
   */
  async updateTag(tagId: string, tagData: { name?: string; description?: string }): Promise<Tag> {
    try {
      const response = await adminApi.put(`/tags/${tagId}/`, tagData);
      return response.data;
    } catch (error) {
      console.error(`Error updating tag ${tagId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a tag
   */
  async deleteTag(tagId: string): Promise<void> {
    try {
      await adminApi.delete(`/tags/${tagId}/`);
    } catch (error) {
      console.error(`Error deleting tag ${tagId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a restaurant from a tag
   */
  async removeRestaurantFromTag(tagId: string, restaurantId: string): Promise<void> {
    try {
      await api.delete(`/tags/${tagId}/restaurants/${restaurantId}/`);
    } catch (error) {
      console.error(`Error removing restaurant ${restaurantId} from tag ${tagId}:`, error);
      throw error;
    }
  },
};