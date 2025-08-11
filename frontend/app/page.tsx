"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { restaurantActions } from "@/lib/actions/restaurant-actions";
import { MessageLoading } from "@/components/ui/message-loading";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [popularCities, setPopularCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [errorCities, setErrorCities] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPopularCities = async () => {
      try {
        const cities = await restaurantActions.getPopularCities();
        setPopularCities(cities);
      } catch (error) {
        console.error("Failed to fetch popular cities:", error);
        setErrorCities("Failed to load popular cities.");
      } finally {
        setLoadingCities(false);
      }
    };

    fetchPopularCities();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/restaurants?city=${encodeURIComponent(searchQuery.trim())}`
      );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero-section min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-gray-100/50"></div>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <Badge variant="secondary" className="mb-6 text-sm font-medium">
            🍽️ Discover the best restaurants recommended by food influencers
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Where are you eating next?
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto">
            Discover amazing restaurants through the eyes of food influencers
            and local experts in your city.
          </p>

          {/* Search Form */}
          <div className="search-container max-w-2xl mx-auto mb-12 p-6">
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Enter your city or suburb"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="px-8 py-6 text-lg font-semibold bg-purple-900 hover:bg-purple-800 text-white"
              >
                <Search className="w-5 h-5 mr-2" />
                Find Restaurants
              </Button>
            </form>
          </div>

          {/* Featured Cities */}
          <div className="mb-8">
            <p className="text-slate-500 mb-4 text-sm font-medium">
              Popular destinations:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {loadingCities && (
                <div className="w-full text-center">
                  <MessageLoading />
                </div>
              )}
              {errorCities && <p className="text-red-500">{errorCities}</p>}
              {!loadingCities && popularCities.length === 0 && !errorCities && (
                <p className="text-center">No popular cities found.</p>
              )}
              {popularCities.map((city) => (
                <Link
                  key={city}
                  href={`/restaurants?city=${encodeURIComponent(city)}`}
                >
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-slate-600 border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer"
                  >
                    {city}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why choose our platform?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Get authentic restaurant recommendations from trusted food
              influencers and local experts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-slate-600" />
                </div>
                <CardTitle className="text-slate-900">Expert Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">
                  Get insights from food influencers who know the local dining
                  scene inside and out.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-slate-600" />
                </div>
                <CardTitle className="text-slate-900">
                  Community Driven
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">
                  Join a community of food lovers sharing their favorite dining
                  experiences.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-slate-600" />
                </div>
                <CardTitle className="text-slate-900">Trending Spots</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">
                  Discover the hottest new restaurants and hidden gems before
                  everyone else.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
