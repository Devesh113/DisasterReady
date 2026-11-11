import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import {
  PreparednessItem,
  PreparednessStats,
  CreateKitItemData,
  UpdateKitItemData,
  KitResponseData,
  KitItemDetailResponseData,
  KitStatsResponseData,
} from '@/types/kit';

export interface QueryKitParams {
  page?: number;
  limit?: number;
  category?: string;
  isReady?: boolean;
  sortBy?: 'name' | 'category' | 'isReady' | 'quantity' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export const preparednessService = {
  /**
   * List the authenticated user's kit items
   */
  async getItems(params?: QueryKitParams): Promise<KitResponseData> {
    const res = await apiClient.get<ApiResponse<KitResponseData>>('/preparedness-kit', {
      params,
    });
    return res.data.data;
  },

  /**
   * Get preparedness readiness summary and category distribution
   */
  async getStats(): Promise<PreparednessStats> {
    const res = await apiClient.get<ApiResponse<KitStatsResponseData>>('/preparedness-kit/stats');
    return res.data.data.stats;
  },

  /**
   * Add a new item to the personal emergency kit
   */
  async createItem(data: CreateKitItemData): Promise<PreparednessItem> {
    const res = await apiClient.post<ApiResponse<KitItemDetailResponseData>>('/preparedness-kit', data);
    return res.data.data.item;
  },

  /**
   * Update full item details
   */
  async updateItem(id: string, data: UpdateKitItemData): Promise<PreparednessItem> {
    const res = await apiClient.patch<ApiResponse<KitItemDetailResponseData>>(
      `/preparedness-kit/${id}`,
      data
    );
    return res.data.data.item;
  },

  /**
   * Toggle or update only the readiness flag of an item
   */
  async updateReadiness(id: string, isReady: boolean): Promise<PreparednessItem> {
    const res = await apiClient.patch<ApiResponse<KitItemDetailResponseData>>(
      `/preparedness-kit/${id}/readiness`,
      { isReady }
    );
    return res.data.data.item;
  },

  /**
   * Remove an item from the personal kit
   */
  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/preparedness-kit/${id}`);
  },
};

export default preparednessService;
