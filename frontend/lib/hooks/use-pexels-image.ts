"use client";

import { useState, useEffect } from "react";
import { getPexelsImageAction } from "../actions/pexels";

interface UsePexelsImageProps {
  query: string;
}

export function usePexelsImage({ query }: UsePexelsImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPexelsImageAction(query);
        if (data && data.image_url) {
          setImageUrl(data.image_url);
        } else {
          // Fallback to Lorem Picsum if Pexels API fails or returns no image
          setImageUrl(`https://picsum.photos/seed/${encodeURIComponent(query)}/1600/900`);
        }
      } catch (err) {
        console.error("Error fetching Pexels image:", err);
        setError("Failed to load image.");
        // Fallback to Lorem Picsum on error
        setImageUrl(`https://picsum.photos/seed/${encodeURIComponent(query)}/1600/900`);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [query]);

  return { imageUrl, loading, error };
}