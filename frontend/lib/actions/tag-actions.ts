import { Tag } from '@/lib/types';
import api from '../api';

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
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
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
};