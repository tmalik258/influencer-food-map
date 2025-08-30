'use client';

import { useState, useEffect, useCallback } from 'react';
import { Video } from '@/lib/types';
import { videoActions } from '@/lib/actions';

export const useVideos = (params?: {
  title?: string;
  youtube_video_id?: string;
  video_title?: string;
  video_url?: string;
  influencer_id?: string;
  influencer_name?: string;
  has_listings?: boolean;
  skip?: number;
  limit?: number;
}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async (searchParams?: typeof params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await videoActions.getVideos(searchParams || params);
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }, [params]);

  return {
    videos,
    loading,
    error,
    fetchVideos,
    refetch: () => fetchVideos(params)
  };
};

export const useInfluencerVideos = (influencerId: string, limit = 20) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    if (!influencerId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await videoActions.getVideosByInfluencer(influencerId, limit);
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }, [influencerId, limit]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos
  };
};