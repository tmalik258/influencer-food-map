import api from '../api';

const influencerActions = {
  getInfluencers: async (params?: {
    name?: string;
    id?: string;
    youtube_channel_id?: string;
    youtube_channel_url?: string;
    skip?: number;
    limit?: number;
    include_listings?: boolean;
    include_video_details?: boolean;
  }) => {
    const response = await api.get("/influencers/", { params });
    return response.data;
  },

  getInfluencer: async (id: string, params?: {
    include_listings?: boolean;
    include_video_details?: boolean;
  }) => {
    const response = await api.get(`/influencers/${id}/`, { params });
    return response.data;
  },

  getInfluencersWithListings: async (params?: {
    name?: string;
    id?: string;
    youtube_channel_id?: string;
    youtube_channel_url?: string;
    skip?: number;
    limit?: number;
    include_video_details?: boolean;
  }) => {
    const response = await api.get("/influencers/", {
      params: {
        ...params,
        include_listings: true,
      },
    });
    return response.data;
  },

  // Slug-based API functions
  getInfluencerBySlug: async (slug: string, params?: {
    include_listings?: boolean;
    include_video_details?: boolean;
  }) => {
    const response = await api.get(`/influencers/slug/${slug}/`, { params });
    return response.data;
  },

  // Get influencer by either ID or slug (universal method)
  getInfluencerByIdOrSlug: async (idOrSlug: string, params?: {
    include_listings?: boolean;
    include_video_details?: boolean;
  }) => {
    // Try to get by ID first
    try {
      return await this.getInfluencer(idOrSlug, params);
    } catch (error) {
      // If ID lookup fails, try slug
      return await this.getInfluencerBySlug(idOrSlug, params);
    }
  },
};

export { influencerActions };