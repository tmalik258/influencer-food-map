'use client';

import { useState, useEffect, useCallback } from 'react';
import { Influencer } from '@/lib/types';
import { influencerActions } from '@/lib/actions';

interface InfluencerParams {
  name?: string;
  id?: string;
  youtube_channel_id?: string;
  youtube_channel_url?: string;
  skip?: number;
  limit?: number;
  include_listings?: boolean;
  include_video_details?: boolean;
}

export const useInfluencers = (params?: InfluencerParams) => {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfluencers = useCallback(async (searchParams?: InfluencerParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await influencerActions.getInfluencers(searchParams || params);
      setInfluencers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch influencers');
    } finally {
      setLoading(false);
    }
  }, [params]);

  return {
    influencers,
    loading,
    error,
    fetchInfluencers,
    refetch: () => fetchInfluencers(params)
  };
};

export const useInfluencersWithListings = (params?: Omit<InfluencerParams, 'include_listings'>) => {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfluencers = useCallback(async (searchParams?: Omit<InfluencerParams, 'include_listings'>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await influencerActions.getInfluencersWithListings(searchParams || params);
      setInfluencers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch influencers with listings');
    } finally {
      setLoading(false);
    }
  }, [params]);

  return {
    influencers,
    loading,
    error,
    fetchInfluencers,
    refetch: () => fetchInfluencers(params)
  };
};

export const useInfluencer = (id: string, params?: {
  include_listings?: boolean;
  include_video_details?: boolean;
}) => {
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfluencer = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await influencerActions.getInfluencer(id, params);
      setInfluencer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch influencer');
    } finally {
      setLoading(false);
    }
  }, [id, params]);

  useEffect(() => {
    fetchInfluencer();
  }, [fetchInfluencer]);

  return {
    influencer,
    loading,
    error,
    refetch: fetchInfluencer
  };
};

export const useInfluencerWithListings = (id: string, params?: {
  include_video_details?: boolean;
}) => {
  return useInfluencer(id, {
    ...params,
    include_listings: true,
  });
};