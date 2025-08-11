'use client';

import { useState, useEffect, useCallback } from 'react';
import { Influencer, SearchParams } from '@/types';
import { influencerActions } from '@/lib/actions';

export const useInfluencers = (params?: SearchParams) => {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfluencers = useCallback(async (searchParams?: SearchParams) => {
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

export const useInfluencer = (id: string) => {
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfluencer = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await influencerActions.getInfluencer(id);
      setInfluencer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch influencer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInfluencer();
  }, [fetchInfluencer, id]);

  return {
    influencer,
    loading,
    error,
    refetch: fetchInfluencer
  };
};