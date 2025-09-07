import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Listing } from "@/lib/types";
import { Calendar, Quote, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const ListingCard = ({
  listing,
  restaurant_name,
}: {
  listing: Listing;
  restaurant_name?: string;
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          {/* Header Section with Influencer Info and View Profile Button */}
          <div className="flex items-start gap-4">
            {/* Influencer Avatar */}
            <div className="flex-shrink-0">
              {listing?.influencer?.avatar_url ? (
                <Image
                  src={listing.influencer.avatar_url}
                  alt={listing.influencer.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                  {listing?.influencer?.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/influencers/${listing?.influencer?.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                  >
                    {listing?.influencer?.name}
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    {listing.visit_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(listing.visit_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* View Profile Button - Right Aligned */}
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/influencers/${listing?.influencer?.id}`}
                    className="flex items-center gap-2"
                  >
                    View Profile
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Quotes in Two Columns */}
          {listing.quotes && listing.quotes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {listing.quotes.map((quote, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500"
                >
                  <div className="flex items-start gap-2">
                    <Quote className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <blockquote className="text-gray-700 italic text-sm">
                      &quot;{quote}&quot;
                    </blockquote>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Video Section - Full Width at Bottom */}
          <div className="w-full">
            {(() => {
              // Extract YouTube video ID from URL
              const getYouTubeVideoId = (url: string) => {
                const regex =
                  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                const match = url.match(regex);
                return match ? match[1] : null;
              };

              const videoId = getYouTubeVideoId(
                listing?.video?.video_url || ""
              );

              if (videoId) {
                return (
                  <div
                    className="relative w-full"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={`${listing?.influencer?.name} - ${restaurant_name} Review`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                );
              } else {
                return (
                  <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Play className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Video preview not available</p>
                      <p className="text-xs mt-1">
                        <a
                          href={listing?.video?.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-700 underline"
                        >
                          View original video
                        </a>
                      </p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingCard;
