import { Star, StarHalf } from "lucide-react";

interface RatingStarsProps {
  rating: number;
}

const RatingStars = ({ rating }: RatingStarsProps) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-5 w-5 fill-current text-orange-400" />
      ))}
      {hasHalfStar && <StarHalf className="h-5 w-5 fill-current text-orange-400" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
      ))}
    </div>
  );
};

export default RatingStars;
