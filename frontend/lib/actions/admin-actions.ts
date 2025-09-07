import api from '../api';

// Import types from centralized location
import type {
  Job,
  JobCreateRequest,
  JobUpdateRequest,
  JobsSummary,
  TriggerScrapeResponse,
  TriggerNLPResponse
} from '../types';

export const adminActions = {
  // Job Management
  getJobs: async (): Promise<Job[]> => {
    const response = await api.get('/admin/jobs');
    return response.data;
  },

  getJob: async (jobId: string): Promise<Job> => {
    const response = await api.get(`/admin/jobs/${jobId}`);
    return response.data;
  },

  createJob: async (jobData: JobCreateRequest): Promise<Job> => {
    const response = await api.post('/admin/jobs', jobData);
    return response.data;
  },

  updateJob: async (jobId: string, jobData: JobUpdateRequest): Promise<Job> => {
    const response = await api.put(`/admin/jobs/${jobId}`, jobData);
    return response.data;
  },

  startJob: async (jobId: string): Promise<Job> => {
    const response = await api.post(`/admin/jobs/${jobId}/start`);
    return response.data;
  },

  completeJob: async (jobId: string): Promise<Job> => {
    const response = await api.post(`/admin/jobs/${jobId}/complete`);
    return response.data;
  },

  failJob: async (jobId: string, errorMessage: string): Promise<Job> => {
    const response = await api.post(`/admin/jobs/${jobId}/fail`, { error_message: errorMessage });
    return response.data;
  },

  updateJobProgress: async (jobId: string, progress: number, processedItems?: number): Promise<Job> => {
    const response = await api.post(`/admin/jobs/${jobId}/progress`, {
      progress,
      processed_items: processedItems
    });
    return response.data;
  },

  getJobsSummary: async (): Promise<JobsSummary> => {
    const response = await api.get('/admin/jobs/summary');
    return response.data;
  },

  // Data Synchronization
  triggerYouTubeScraping: async (): Promise<TriggerScrapeResponse> => {
    const response = await api.post('/process/scrape-youtube');
    return response.data;
  },

  triggerNLPProcessing: async (): Promise<TriggerNLPResponse> => {
    const response = await api.post('/process/scrape-listings');
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
    const response = await api.get('/listings', { params });
    return response.data;
  },

  approveListing: async (listingId: string) => {
    const response = await api.put(`/listings/${listingId}`, {
      approved_status: 'Approved'
    });
    return response.data;
  },

  rejectListing: async (listingId: string) => {
    const response = await api.put(`/listings/${listingId}`, {
      approved_status: 'Rejected'
    });
    return response.data;
  },

  deleteListing: async (listingId: string) => {
    const response = await api.delete(`/listings/${listingId}`);
    return response.data;
  },

  // System Overview
  getSystemStats: async () => {
    // TODO: Implement when backend endpoints are available
    // This would typically call multiple endpoints to gather stats
    const [listings, restaurants, influencers, videos] = await Promise.all([
      api.get('/listings?limit=1'),
      api.get('/restaurants?limit=1'),
      api.get('/influencers?limit=1'),
      api.get('/videos?limit=1')
    ]);

    return {
      total_listings: parseInt(listings.headers['x-total-count'] || '0'),
      total_restaurants: parseInt(restaurants.headers['x-total-count'] || '0'),
      total_influencers: parseInt(influencers.headers['x-total-count'] || '0'),
      total_videos: parseInt(videos.headers['x-total-count'] || '0')
    };
  }
};