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
  slug: string;
  name: string;
  avatar: string;
  engagement: number;
  subscribers: string;
  videos: number;
}

export interface TopRestaurant {
  id: string;
  slug: string;
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

// Import Job from API types
import type { Job } from "./api";

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
  selectedInfluencer: string;
  setSelectedInfluencer: (value: string) => void;
  processedFilter: "all" | "completed" | "pending" | "failed";
  setProcessedFilter: (value: "all" | "completed" | "pending" | "failed") => void;
}

export interface VideoHeaderProps {
  onCreateClick: () => void;
  selectedVideos?: Video[];
  onProcessSelectedVideos?: () => void;
  isProcessModalOpen?: boolean;
  showSelection?: boolean;
  onToggleSelection?: () => void;
}

export interface VideoTableProps {
  videos: Video[];
  loading?: boolean;
  searchTerm: string;
  selectedInfluencer: string;
  hasListings: boolean | undefined;
  processedFilter: "all" | "completed" | "pending" | "failed";
  onViewVideo: (video: Video) => void;
  onEditVideo: (video: Video) => void;
  onDeleteVideo: (video: Video) => void;
  onClearFilters: () => void;
  // Pagination props
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
  // Selection props
  selectedVideos?: Video[];
  onVideoSelect?: (video: Video, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  // Listings information
  videoListingsCounts?: Record<string, number>;
}

export interface ListingFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: "approved" | "rejected" | "pending" | "all";
  setStatusFilter: (value: "approved" | "rejected" | "pending" | "all") => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  onCreateClick: () => void;
}

export interface ListingHeaderProps {
  totalCount?: number;
  onRefresh?: () => void;
}

export interface ListingTableProps {
  listings: Listing[];
  loading: boolean;
  actionLoading: string | null;
  // Pagination props
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
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
import type { Listing, Video } from "./index";
