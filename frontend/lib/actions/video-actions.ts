import { Video, VideosResponse } from '@/lib/types';
import api from '../api';

export const videoActions = {
  /**
   * Get videos with optional filters
   */
  async getVideos(params?: {
    title?: string;
    youtube_video_id?: string;
    video_title?: string;
    video_url?: string;
    influencer_id?: string;
    influencer_name?: string;
    has_listings?: boolean;
    status?: "completed" | "pending" | "failed";
    skip?: number;
    limit?: number;
  }): Promise<VideosResponse> {
    try {
      const response = await api.get('/videos/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  },

  /**
   * Get a single video by ID
   */
  async getVideo(videoId: string): Promise<Video> {
    try {
      const response = await api.get(`/videos/${videoId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching video ${videoId}:`, error);
      throw error;
    }
  },

  /**
   * Get videos by influencer ID
   */
  async getVideosByInfluencer(influencerSlug: string, limit = 20): Promise<Video[]> {
    try {
      const response = await api.get('/videos/', {
        params: {
          influencer_slug: influencerSlug,
          limit,
        },
      });
      return response.data.videos;
    } catch (error) {
      console.error(`Error fetching videos for influencer ${influencerSlug}:`, error);
      throw error;
    }
  },

  /**
   * Get videos with listings (videos that have restaurant reviews)
   */
  async getVideosWithListings(limit = 50): Promise<Video[]> {
    try {
      const response = await api.get('/videos/', {
        params: {
          has_listings: true,
          limit,
        },
      });
      return response.data.videos;
    } catch (error) {
      console.error('Error fetching videos with listings:', error);
      throw error;
    }
  },

  /**
   * Search videos by title
   */
  async searchVideosByTitle(title: string, limit = 20): Promise<Video[]> {
    try {
      const response = await api.get('/videos/', {
        params: {
          title,
          limit,
        },
      });
      return response.data.videos;
    } catch (error) {
      console.error(`Error searching videos by title "${title}":`, error);
      throw error;
    }
  },
};