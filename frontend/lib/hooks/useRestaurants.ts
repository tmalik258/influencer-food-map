"use client";

import { useState, useEffect, useCallback } from "react";
import { Restaurant, SearchParams } from "@/types";
import { restaurantActions } from "@/lib/actions";

export const useRestaurants = (params?: SearchParams) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(
    async (searchParams?: SearchParams) => {
      setLoading(true);
      setError(null);
      try {
        const data = await restaurantActions.getRestaurants(
          searchParams || params
        );
        setRestaurants(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch restaurants"
        );
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  const searchByCity = useCallback(async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await restaurantActions.searchRestaurantsByCity(city);
      setRestaurants(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search restaurants"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    restaurants,
    loading,
    error,
    fetchRestaurants,
    searchByCity,
    refetch: () => fetchRestaurants(params),
  };
};

export const useRestaurant = (id: string) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurant = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const data = await restaurantActions.getRestaurant(id);
      setRestaurant(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch restaurant"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRestaurant();
  }, [id, fetchRestaurant]);

  return {
    restaurant,
    loading,
    error,
    refetch: fetchRestaurant,
  };
};
