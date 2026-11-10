import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import {
  Disaster,
  DisastersResponseData,
  DisasterDetailResponseData,
  DisasterType,
  CreateDisasterData,
  UpdateDisasterData,
} from '@/types/disaster';

export interface QueryDisastersParams {
  page?: number;
  limit?: number;
  type?: DisasterType;
  search?: string;
}

export const disasterService = {
  /**
   * List disaster records with optional pagination, type filter, and search
   */
  async getDisasters(params?: QueryDisastersParams): Promise<DisastersResponseData> {
    const res = await apiClient.get<any>('/disasters', {
      params,
    });
    const raw = res.data;
    const disastersList = Array.isArray(raw.data)
      ? raw.data
      : Array.isArray(raw.data?.disasters)
      ? raw.data.disasters
      : Array.isArray(raw.disasters)
      ? raw.disasters
      : [];

    const paginationData = raw.pagination || raw.data?.pagination || {
      page: params?.page || 1,
      limit: params?.limit || 10,
      total: disastersList.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    return {
      disasters: disastersList,
      pagination: paginationData,
    };
  },

  /**
   * Get single disaster taxonomy details by UUID
   */
  async getDisasterById(id: string): Promise<DisasterDetailResponseData> {
    const res = await apiClient.get<ApiResponse<Disaster | DisasterDetailResponseData>>(`/disasters/${id}`);
    const data = res.data.data;
    if ('disaster' in data) {
      return data as DisasterDetailResponseData;
    }
    return { disaster: data as Disaster };
  },

  /**
   * Create a new disaster catalog entry (ADMIN only)
   */
  async createDisaster(data: CreateDisasterData): Promise<Disaster> {
    const res = await apiClient.post<ApiResponse<Disaster>>('/disasters', data);
    return res.data.data;
  },

  /**
   * Update an existing disaster entry (ADMIN only)
   */
  async updateDisaster(id: string, data: UpdateDisasterData): Promise<Disaster> {
    const res = await apiClient.patch<ApiResponse<Disaster>>(`/disasters/${id}`, data);
    return res.data.data;
  },

  /**
   * Permanently delete a disaster entry (ADMIN only)
   */
  async deleteDisaster(id: string): Promise<void> {
    await apiClient.delete(`/disasters/${id}`);
  },
};

export default disasterService;
