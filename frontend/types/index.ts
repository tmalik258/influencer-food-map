export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  google_place_id?: string;
  google_rating?: number;
  business_status: string;
  photo_url?: string;
  tags?: Tag[];
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Influencer {
  id: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  region?: string;
  youtube_channel_id: string;
  youtube_channel_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  influencer_id: string;
  youtube_video_id: string;
  title: string;
  description?: string;
  video_url: string;
  published_at?: string;
  transcription?: string;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  restaurant: Restaurant;
  video: Video;
  influencer: Influencer;
  visit_date?: string;
  quotes?: string[];
  context?: string[];
  confidence_score?: number;
  approved?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchParams {
  city?: string;
  name?: string;
  skip?: number;
  limit?: number;
  approved_status?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}