"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface Country {
  code: string;
  name: string;
}

export type CountriesSource = "influencers" | "restaurants";

export function useCountries(source: CountriesSource = "influencers", influencerId?: string, disabled: boolean = false) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(!disabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetching if disabled
    if (disabled) {
      setLoading(false);
      return;
    }

    const fetchCountries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let endpoint = source === "restaurants" ? "/restaurants/countries" : "/influencers/countries";
        
        // Add influencer_id parameter for restaurant countries if provided
        if (source === "restaurants" && influencerId) {
          endpoint += `?influencer_id=${influencerId}`;
        }
        
        const response = await api.get(endpoint);
        
        if (response.data && response.data.country) {
          setCountries(response.data.country);
        }
      } catch (err) {
        console.error(`Error fetching countries from ${source}:`, err);
        setError("Failed to load countries");
        
        // Fallback to static countries list if API fails
        const fallbackCountries: Country[] = [
          { code: "US", name: "United States" },
          { code: "CA", name: "Canada" },
          { code: "GB", name: "United Kingdom" },
          { code: "AU", name: "Australia" },
          { code: "DE", name: "Germany" },
          { code: "FR", name: "France" },
          { code: "IT", name: "Italy" },
          { code: "ES", name: "Spain" },
          { code: "JP", name: "Japan" },
          { code: "KR", name: "South Korea" },
          { code: "IN", name: "India" },
          { code: "BR", name: "Brazil" },
          { code: "MX", name: "Mexico" },
          { code: "TH", name: "Thailand" },
          { code: "VN", name: "Vietnam" },
        ];
        setCountries(fallbackCountries);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [source, influencerId, disabled]);

  return { countries, loading, error };
}