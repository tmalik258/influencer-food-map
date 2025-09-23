"use client";

import { useState, useCallback } from "react";
import { geocodingActions, GeocodeRequest, GeocodeResponse } from "@/lib/actions/geocoding-actions";

export const useGeocoding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeAddress = useCallback(async (request: GeocodeRequest): Promise<GeocodeResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await geocodingActions.geocodeAddress(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to geocode address";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const geocodeAddressGet = useCallback(async (address: string, city: string, country: string): Promise<GeocodeResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await geocodingActions.geocodeAddressGet(address, city, country);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to geocode address";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    geocodeAddress,
    geocodeAddressGet,
    loading,
    error,
    isLoading: loading
  };
};