"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag } from "@/types";
import { tagActions } from "@/lib/actions";

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async (params?: {
    name?: string;
    id?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await tagActions.getTags(params);
      setTags(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch tags"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllTags = useCallback(async (limit = 100, city?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await tagActions.getAllTags(limit, city);
      setTags(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch all tags"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const searchTagsByName = useCallback(async (name: string, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const data = await tagActions.searchTagsByName(name, limit);
      setTags(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search tags"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tags,
    loading,
    error,
    fetchTags,
    fetchAllTags,
    searchTagsByName,
  };
};

export const useTag = (id: string) => {
  const [tag, setTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTag = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await tagActions.getTag(id);
      setTag(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch tag"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTag();
  }, [fetchTag]);

  return {
    tag,
    loading,
    error,
    refetch: fetchTag,
  };
};