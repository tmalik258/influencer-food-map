"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface RestaurantImageProps {
  src?: string | null;
  alt: string;
  restaurantSlug?: string;
  nameInitial?: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
}

export default function RestaurantImage({
  src,
  alt,
  restaurantSlug,
  nameInitial,
  className,
  fill = true,
  sizes = "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: RestaurantImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src ?? null);
  const [isValid, setIsValid] = useState<boolean>(!!src);
  const [attemptedRefetch, setAttemptedRefetch] = useState<boolean>(false);
  const [loadingRefetch, setLoadingRefetch] = useState<boolean>(false);

  // Keep internal src in sync if parent changes
  useEffect(() => {
    setCurrentSrc(src ?? null);
    setIsValid(!!src);
    setAttemptedRefetch(false);
  }, [src]);

  useEffect(() => {
    if (!currentSrc) {
      setIsValid(false);
      return;
    }

    // Preload to detect errors without rendering a broken image
    const testImg = new window.Image();
    testImg.referrerPolicy = "no-referrer";
    testImg.src = currentSrc;
    testImg.onload = () => setIsValid(true);
    testImg.onerror = async () => {
      setIsValid(false);

      // Try refetch once per mount if we have an ID
      if (!attemptedRefetch && restaurantSlug && !loadingRefetch) {
        setAttemptedRefetch(true);
        setLoadingRefetch(true);
        try {
          const resp = await api.post(`/restaurants/${restaurantSlug}/refetch-photo/`);
          const newUrl: string | undefined = resp?.data?.photo_url;
          if (newUrl) {
            setCurrentSrc(newUrl);
            // Re-validate new URL
            const recheck = new window.Image();
            recheck.referrerPolicy = "no-referrer";
            recheck.src = newUrl;
            recheck.onload = () => setIsValid(true);
            recheck.onerror = () => setIsValid(false);
          }
        } catch (e) {
          // Silently fail; fallback UI will show
          // console.warn("Failed to refetch photo", e);
          console.log("Failed to refetch photo", e);
        } finally {
          setLoadingRefetch(false);
        }
      }
    };

    return () => {
      // Cleanup image object
      testImg.onload = null;
      testImg.onerror = null;
    };
  }, [currentSrc, restaurantSlug, attemptedRefetch, loadingRefetch]);

  if (!isValid) {
    const initial = (nameInitial || (alt?.[0] ?? "")).toUpperCase() || "?";
    return (
      <div
        className={cn(
          "w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center",
          className
        )}
      >
        <span className="text-white font-bold text-4xl">{initial}</span>
      </div>
    );
  }

  // Use Next/Image when valid for optimization
  return (
    <Image
      src={currentSrc as string}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={cn("object-cover w-full h-full", className)}
      referrerPolicy="no-referrer"
      priority={false}
    />
  );
}