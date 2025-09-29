// API-related interfaces and types

// Admin actions types
export interface Job {
  id: string;
  job_type: 'scrape_youtube' | 'transcription_nlp';
  status: 'pending' | 'running' | 'completed' | 'failed';
  title: string;
  description: string;
  progress: number;
  total_items: number;
  processed_items: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  started_by: string;
  // New job tracking fields
  queue_size?: number;
  items_in_progress?: number;
  failed_items?: number;
  retry_count?: number;
  max_retries?: number;
  estimated_completion_time?: string;
  processing_rate?: number;
  last_heartbeat?: string;
  cancellation_requested?: boolean;
  cancelled_by?: string;
  cancelled_at?: string;
}

export interface JobCreateRequest {
  job_type: 'scrape_youtube' | 'transcription_nlp';
  title: string;
  description?: string;
  total_items?: number;
}

export interface JobUpdateRequest {
  title?: string;
  description?: string;
  progress?: number;
  total_items?: number;
  processed_items?: number;
}

export interface JobsSummary {
  total_jobs: number;
  pending_jobs: number;
  running_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
}

export interface TriggerScrapeResponse {
  message: string;
  job_id: string;
}

export interface TriggerNLPResponse {
  message: string;
  job_id: string;
}

// Job cancellation and analytics interfaces
export interface JobCancellationRequest {
  job_id: string;
  reason?: string;
  cancelled_by: string;
}

export interface JobAnalytics {
  total_jobs: number;
  jobs_by_status: {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  jobs_by_type: {
    scrape_youtube: number;
    transcription_nlp: number;
  };
  average_completion_time: number;
  success_rate: number;
  failure_rate: number;
  cancellation_rate: number;
  completed_jobs: number;
  failed_jobs: number;
  running_jobs: number;
}

// Search and pagination types
export interface SearchParams {
  city?: string;
  name?: string;
  video_id?: string;
  restaurant_id?: string;
  influencer_id?: string;
  tag?: string;
  cuisine?: string;
  sort_by?: string;
  skip?: number;
  limit?: number;
  offset?: number;
  approved_status?: string;
  include_listings?: boolean;
  include_video_details?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  pagination?: PaginationResult;
}

// Restaurant API types
export interface CityRestaurants {
  city: string;
  restaurants: Restaurant[];
}

export interface OptimizedFeaturedResponse {
  cities: CityRestaurants[];
}

// Paginated responses
export interface PaginatedRestaurantsParams extends Omit<SearchParams, 'skip' | 'limit'> {
  page: number;
  limit: number;
}

export interface PaginatedRestaurantsResponse {
  restaurants: Restaurant[];
  total: number;
}

export interface PaginatedInfluencersParams {
  page: number;
  limit: number;
  search?: string;
  region?: string;
  sortBy?: 'name' | 'subscriber_count' | 'total_videos' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedInfluencersResponse {
  influencers: Influencer[];
  total: number;
}

// Influencer API types
export interface InfluencerParams {
  region?: string;
  limit?: number;
  include_stats?: boolean;
}

// Hook options
export interface UseApiWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  enabled?: boolean;
}

// Pexels API types
export interface UsePexelsImageProps {
  query: string;
  fallbackUrl?: string;
  size?: 'small' | 'medium' | 'large';
}

// Import base types
import type { Restaurant, Influencer } from './index';