import { adminApi } from '../api';

// Import types from centralized location
import type {
  Job,
  TriggerScrapeResponse,
  TriggerNLPResponse,
} from '../types';

export const adminActions = {
  // Job Management
  getJobs: async (params?: {
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    job_type?: 'scrape_youtube' | 'transcription_nlp';
    sort_by?: 'created_at' | 'started_at' | 'completed_at' | 'progress' | 'status';
    sort_order?: 'asc' | 'desc';
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<Job[]> => {
    const response = await adminApi.get('/jobs/', { params });
    return response.data;
  },

  getJob: async (jobId: string): Promise<Job> => {
    const response = await adminApi.get(`/jobs/${jobId}/`);
    return response.data;
  },

  startJob: async (jobId: string): Promise<Job> => {
    const response = await adminApi.post(`/jobs/${jobId}/start/`);
    return response.data;
  },

  completeJob: async (jobId: string): Promise<Job> => {
    const response = await adminApi.post(`/jobs/${jobId}/complete/`);
    return response.data;
  },

  failJob: async (jobId: string, errorMessage: string): Promise<Job> => {
    const response = await adminApi.post(`/jobs/${jobId}/fail/`, { error_message: errorMessage });
    return response.data;
  },

  updateJobProgress: async (jobId: string, progress: number, processedItems?: number): Promise<Job> => {
    const response = await adminApi.post(`/jobs/${jobId}/progress/`, {
      progress,
      processed_items: processedItems
    });
    return response.data;
  },

  cancelJob: async (jobId: string, reason?: string): Promise<Job> => {
    const response = await adminApi.post(`/jobs/${jobId}/cancel/`, {
      reason: reason || 'Cancelled by user'
    });
    return response.data;
  },

  requestJobCancellation: async (jobId: string, reason?: string): Promise<Job> => {
    const response = await adminApi.post(`/jobs/${jobId}/request-cancellation/`, {
      reason: reason || 'Cancellation requested by user'
    });
    return response.data;
  },

  // Data Synchronization
  triggerYouTubeScraping: async (videoIds?: string[], triggerType: 'manual' | 'system' = 'manual'): Promise<TriggerScrapeResponse> => {
    const requestBody = {
      ...(videoIds ? { video_ids: videoIds } : {}),
      trigger_type: triggerType
    };
    const response = await adminApi.post('/process/scrape-youtube/', requestBody);
    return response.data;
  },

  triggerNLPProcessing: async (videoIds?: string[], triggerType: 'manual' | 'system' = 'manual'): Promise<TriggerNLPResponse> => {
    const requestBody = {
      ...(videoIds ? { video_ids: videoIds } : {}),
      trigger_type: triggerType
    };
    const response = await adminApi.post('/process/transcription-nlp/', requestBody);
    return response.data;
  },

  // Admin Listings Management
  getAdminListings: async (params?: {
    approved_status?: 'Approved' | 'Pending' | 'Rejected';
    search?: string;
    sort_by?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await adminApi.get('/listings/', { params });
    return response.data;
  },

  approveListing: async (listingId: string) => {
    const response = await adminApi.put(`/listings/${listingId}/`, {
      approved_status: 'Approved'
    });
    return response.data;
  },

  rejectListing: async (listingId: string) => {
    const response = await adminApi.put(`/listings/${listingId}/`, {
      approved_status: 'Rejected'
    });
    return response.data;
  },

  deleteListing: async (listingId: string) => {
    const response = await adminApi.delete(`/listings/${listingId}/`);
    return response.data;
  },

  // System Overview
  getSystemStats: async () => {
    // TODO: Implement when backend endpoints are available
    // This would typically call multiple endpoints to gather stats
    const [listings, restaurants, influencers, videos] = await Promise.all([
      adminApi.get('/listings?limit=1'),
      adminApi.get('/restaurants?limit=1'),
      adminApi.get('/influencers?limit=1'),
      adminApi.get('/videos?limit=1')
    ]);

    return {
      total_listings: parseInt(listings.headers['x-total-count'] || '0'),
      total_restaurants: parseInt(restaurants.headers['x-total-count'] || '0'),
      total_influencers: parseInt(influencers.headers['x-total-count'] || '0'),
      total_videos: parseInt(videos.headers['x-total-count'] || '0')
    };
  }
};