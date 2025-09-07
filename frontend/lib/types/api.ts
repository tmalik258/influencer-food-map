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

// Search and pagination types
export interface SearchParams {
  city?: string;
  name?: string;
  skip?: number;
  limit?: number;
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

export interface UseAutoRefreshOptions {
  interval?: number;
  enabled?: boolean;
  onRefresh?: () => void;
}

export interface AutoRefreshState {
  isEnabled: boolean;
  interval: number;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
}

// Pexels API types
export interface UsePexelsImageProps {
  query: string;
  fallbackUrl?: string;
  size?: 'small' | 'medium' | 'large';
}

// Import base types
import type { Restaurant, Influencer } from './index';