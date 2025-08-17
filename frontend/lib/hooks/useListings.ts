'use client';

import { useState, useEffect, useCallback } from 'react';
import { Listing, SearchParams } from '@/types';
import { listingActions } from '@/lib/actions';

export const useListings = (params?: SearchParams) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async (searchParams?: SearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listingActions.getListings(searchParams || params);
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (params) {
      fetchListings();
    }
  }, [fetchListings, params]);

  return {
    listings,
    loading,
    error,
    fetchListings,
    refetch: () => fetchListings(params)
  };
};

export const useListing = (id: string) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await listingActions.getListing(id);
      setListing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listing');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing, id]);

  return {
    listing,
    loading,
    error,
    refetch: fetchListing
  };
};

export const useRestaurantListings = (restaurantId: string) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!restaurantId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await listingActions.getListingsByRestaurant(restaurantId);
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurant listings');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings, restaurantId]);

  return {
    listings,
    loading,
    error,
    refetch: fetchListings
  };
};

export const useInfluencerListings = (influencerId: string) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!influencerId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await listingActions.getListingsByInfluencer(influencerId);
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch influencer listings');
    } finally {
      setLoading(false);
    }
  }, [influencerId]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings, influencerId]);

  return {
    listings,
    loading,
    error,
    refetch: fetchListings
  };
};