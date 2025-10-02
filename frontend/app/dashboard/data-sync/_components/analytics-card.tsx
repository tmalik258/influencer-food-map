import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export function AnalyticsCard({ title, value, description, icon: Icon, trend }: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-orange-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
        {trend && (
          <div className={`flex items-center mt-2 text-xs ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${
              trend.isPositive ? '' : 'rotate-180'
            }`} />
            {Math.abs(trend.value)}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  );
}