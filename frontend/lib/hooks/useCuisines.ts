"use client";

import { useState, useEffect, useCallback } from "react";
import { Cuisine } from "@/lib/types";
import { cuisineActions } from "@/lib/actions";

export const useCuisines = () => {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCuisines = useCallback(async (params?: {
    name?: string;
    id?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await cuisineActions.getCuisines(params);
      setCuisines(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch cuisines"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllCuisines = useCallback(async (limit = 100, city?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await cuisineActions.getAllCuisines(limit, city);
      setCuisines(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch all cuisines"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCuisinesByName = useCallback(async (name: string, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const data = await cuisineActions.searchCuisinesByName(name, limit);
      setCuisines(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search cuisines"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cuisines,
    loading,
    error,
    fetchCuisines,
    fetchAllCuisines,
    searchCuisinesByName,
  };
};

export const useCuisine = (id: string) => {
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCuisine = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await cuisineActions.getCuisine(id);
      setCuisine(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch cuisine"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCuisine();
  }, [fetchCuisine]);

  return {
    cuisine,
    loading,
    error,
    refetch: fetchCuisine,
  };
};