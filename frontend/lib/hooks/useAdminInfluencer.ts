'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { adminInfluencerActions } from '@/lib/actions';
import { Influencer } from '@/lib/types';

interface InfluencerCreateData {
  name: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  youtube_channel_id: string;
  youtube_channel_url?: string;
  subscriber_count?: number;
  region?: string;
  country?: string;
}

interface InfluencerUpdateData {
  name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  youtube_channel_id?: string;
  youtube_channel_url?: string;
  subscriber_count?: number;
  region?: string;
  country?: string;
}

interface AdminInfluencerResponse {
  message: string;
  influencer_id: string;
}

export function useAdminInfluencer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInfluencer = async (data: InfluencerCreateData): Promise<AdminInfluencerResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminInfluencerActions.createInfluencer(data);
      toast.success('Influencer created successfully');
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create influencer';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInfluencer = async (
    influencerId: string,
    data: InfluencerUpdateData
  ): Promise<AdminInfluencerResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminInfluencerActions.updateInfluencer(influencerId, data);
      toast.success('Influencer updated successfully');
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update influencer';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteInfluencer = async (influencerId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await adminInfluencerActions.deleteInfluencer(influencerId);
      toast.success('Influencer deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete influencer';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getInfluencer = async (influencerId: string): Promise<Influencer | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminInfluencerActions.getInfluencer(influencerId);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch influencer';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createInfluencer,
    updateInfluencer,
    deleteInfluencer,
    getInfluencer,
    loading,
    error,
  };
}