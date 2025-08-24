"use client";
import Image from "next/image";

import { usePexelsImage } from "@/lib/hooks/use-pexels-image";

interface RestaurantHeroSectionProps {
  city: string;
}

export function RestaurantHeroSection({ city }: RestaurantHeroSectionProps) {
  const { imageUrl: pexelsImageUrl, loading } = usePexelsImage({
    query: "food" + " " + city,
  });

  const finalImageUrl = pexelsImageUrl;
  console.log("RestaurantHeroSection rendered. City:", city);

  return (
    <div className="relative min-h-[70vh] rounded-lg pt-10 flex items-center justify-center overflow-hidden">
      {loading || !finalImageUrl ? (
        <div className="absolute inset-0 z-0 bg-gray-200 animate-pulse" />
      ) : (
        <Image
          src={finalImageUrl}
          alt="Cityscape background"
          fill
          className="object-cover"
          priority
          decoding="async"
        />
      )}
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="relative z-10 text-center text-white px-4">
        <p className="text-lg font-semibold mb-2">
          {city ? city.toUpperCase() + "'S" : "FOODTUBER'S"}
        </p>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">
          Critics&apos; Picks
        </h1>
        <p className="text-xl md:text-2xl text-white/90">
          HANDPICKED BY CELEBRITY CHEFS & TOP FOOD CREATORS.
        </p>
      </div>
    </div>
  );
}
