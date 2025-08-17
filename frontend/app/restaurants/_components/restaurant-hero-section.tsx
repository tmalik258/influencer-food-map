"use client";


import Image from "next/image";
import { useState } from "react";

interface RestaurantHeroSectionProps {
  city: string;
}

export function RestaurantHeroSection({ city }: RestaurantHeroSectionProps) {
  const [isLoading, setIsLoading] = useState(true);

  console.log("RestaurantHeroSection rendered. City:", city);

  // Generate image URL based on city prop using Picsum for reliability
  const imageUrl = city 
    ? `https://picsum.photos/1920/1080?random=${encodeURIComponent(city)}` 
    : `https://picsum.photos/1920/1080?random=restaurant`;

  console.log("Image URL:", imageUrl);

  return (
    <div className="relative min-h-[70vh] rounded-lg pt-10 flex items-center justify-center overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={imageUrl}
        alt="Cityscape background"
        fill
        className="object-cover"
        priority
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          console.log("Image failed to load:", imageUrl);
          setIsLoading(false);
        }}
      />
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
