import { Badge } from "@/components/ui/badge";

interface StatsCardProps {
  value: string | number;
  label: string;
  isGradient?: boolean;
  showBadge?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  value, 
  label, 
  isGradient = false, 
  showBadge = false 
}) => {
  const baseClasses = "rounded-lg shadow-xl p-6 text-center";
  const cardClasses = isGradient 
    ? `${baseClasses} bg-gradient-to-br from-orange-400 to-red-500 text-white relative`
    : `${baseClasses} bg-white`;

  return (
    <div className={cardClasses}>
      {showBadge && (
        <Badge className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-1 rotate-12">
          ⭐ TOP
        </Badge>
      )}
      <div className={`text-2xl md:text-3xl font-bold ${
        isGradient ? "text-white" : "text-gray-900"
      }`}>
        {value}
      </div>
      <div className={`text-sm md:text-base ${
        isGradient ? "text-white" : "text-gray-600"
      }`}>
        {label}
      </div>
    </div>
  );
};