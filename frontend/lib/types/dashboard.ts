// Dashboard-specific interfaces and types

// Analytics types
export interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface QuickActionsCardProps {
  onTriggerScrape: () => void;
  onTriggerNLP: () => void;
  isLoading: boolean;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface RecentActivityCardProps {
  activities: Activity[];
  isLoading: boolean;
}

export interface JobCardProps {
  job: Job;
  onTrigger: (type: string) => void;
}

export interface AnalyticsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  isLoading: boolean;
}

export interface AnalyticsMetricsProps {
  metrics: MetricCard[];
  isLoading?: boolean;
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

export interface OverviewTabProps {
  userGrowthData: ChartData[];
  videoEngagementData: ChartData[];
  isLoading?: boolean;
}

export interface TopInfluencer {
  id: string;
  name: string;
  avatar: string;
  engagement: number;
  subscribers: string;
  videos: number;
}

export interface TopRestaurant {
  id: string;
  name: string;
  city: string;
  mentions: number;
  videos: number;
  views: string;
  rating: number;
}

export interface EngagementTabProps {
  topInfluencers: TopInfluencer[];
  topRestaurants: TopRestaurant[];
  isLoading?: boolean;
}

export interface PerformanceTabProps {
  viewMetrics: {
    totalViews: number;
    uniqueViews: number;
    avgViewDuration: number;
  };
  engagementMetrics: {
    likes: number;
    comments: number;
    shares: number;
  };
  timeMetrics: {
    avgSessionTime: number;
    bounceRate: number;
    returnVisitors: number;
  };
  isLoading?: boolean;
}

export interface InsightsTabProps {
  keyInsights: string[];
  trendingTopics: {
    topic: string;
    mentions: number;
    trend: "up" | "down" | "stable";
  }[];
  isLoading?: boolean;
}

// System overview types
export interface SystemStats {
  totalListings: number;
  totalRestaurants: number;
  totalInfluencers: number;
  totalVideos: number;
}

export interface SystemMetricCardsProps {
  stats: SystemStats;
  isLoading?: boolean;
}

export interface SystemApprovalRateProps {
  approvedListings: number;
  totalListings: number;
  pendingListings: number;
}

// Import Job from API types
import type { Job } from "./api";

export interface SystemRecentJobsProps {
  jobs: Job[];
  isLoading?: boolean;
}

// Video management types
export interface VideoFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
  hasListings: boolean | undefined;
  setHasListings: (value: boolean | undefined) => void;
}

export interface VideoHeaderProps {
  videoCount: number;
}

export interface VideoTableProps {
  videos: Video[];
  searchTerm: string;
  selectedInfluencer: string;
  hasListings: boolean | undefined;
  onViewVideo: (video: Video) => void;
  onEditVideo: (video: Video) => void;
  onDeleteVideo: (video: Video) => void;
  onClearFilters: () => void;
}

// Listing management types
export interface Listing {
  id: string;
  restaurant: {
    name: string;
    city: string;
  };
  influencer: {
    name: string;
  };
  video: {
    title: string;
  };
  quotes: string[];
  confidence_score: number;
  approved?: boolean;
  visit_date?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface ListingFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  onSearch: () => void;
}

export interface ListingHeaderProps {
  totalCount?: number;
  onRefresh?: () => void;
}

export interface ListingTableProps {
  listings: Listing[];
  loading: boolean;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// Data sync types
export interface JobCardProps {
  job: Job;
  onTrigger: (jobType: string) => void;
  isLoading?: boolean;
}

// Import base types
import type { Video } from "./index";
