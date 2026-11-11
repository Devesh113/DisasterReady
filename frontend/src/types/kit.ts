export interface PreparednessItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  quantity: number;
  isReady: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreparednessStats {
  totalItems: number;
  readyItems: number;
  notReadyItems: number;
  readinessPercentage: number;
  categories: Array<{
    category: string;
    count: number;
  }>;
}

export interface CreateKitItemData {
  name: string;
  description?: string | null;
  category: string;
  quantity?: number;
  isReady?: boolean;
}

export interface UpdateKitItemData {
  name?: string;
  description?: string | null;
  category?: string;
  quantity?: number;
  isReady?: boolean;
}

export interface KitResponseData {
  items: PreparednessItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface KitItemDetailResponseData {
  item: PreparednessItem;
}

export interface KitStatsResponseData {
  stats: PreparednessStats;
}
