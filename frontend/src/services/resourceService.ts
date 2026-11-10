import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import {
  EmergencyResource,
  ResourcesResponseData,
  ResourceDetailResponseData,
  ResourceType,
} from '@/types/resource';

export interface QueryResourcesParams {
  page?: number;
  limit?: number;
  type?: ResourceType;
  isActive?: boolean;
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sortBy?: 'name' | 'type' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export const resourceService = {
  async getResources(params?: QueryResourcesParams): Promise<ResourcesResponseData> {
    const res = await apiClient.get<ApiResponse<ResourcesResponseData>>('/emergency-resources', {
      params,
    });
    return res.data.data;
  },

  async getResourceById(id: string): Promise<ResourceDetailResponseData> {
    const res = await apiClient.get<ApiResponse<ResourceDetailResponseData>>(
      `/emergency-resources/${id}`
    );
    return res.data.data;
  },
};
