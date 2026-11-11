import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import {
  EmergencyResource,
  ResourcesResponseData,
  ResourceDetailResponseData,
  ResourceType,
  CreateResourceData,
  UpdateResourceData,
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
  /**
   * List emergency resources with optional filters and pagination
   */
  async getResources(params?: QueryResourcesParams): Promise<ResourcesResponseData> {
    const res = await apiClient.get<ApiResponse<ResourcesResponseData>>('/emergency-resources', {
      params,
    });
    return res.data.data;
  },

  /**
   * Get a single emergency resource by ID
   */
  async getResourceById(id: string): Promise<ResourceDetailResponseData> {
    const res = await apiClient.get<ApiResponse<{ resource: EmergencyResource }>>(
      `/emergency-resources/${id}`
    );
    return {
      resource: res.data.data.resource,
    };
  },

  /**
   * Create a new emergency resource (AUTHORITY, ADMIN)
   */
  async createResource(data: CreateResourceData): Promise<EmergencyResource> {
    const res = await apiClient.post<ApiResponse<{ resource: EmergencyResource }>>(
      '/emergency-resources',
      data
    );
    return res.data.data.resource;
  },

  /**
   * Update an existing emergency resource (AUTHORITY, ADMIN)
   */
  async updateResource(id: string, data: UpdateResourceData): Promise<EmergencyResource> {
    const res = await apiClient.patch<ApiResponse<{ resource: EmergencyResource }>>(
      `/emergency-resources/${id}`,
      data
    );
    return res.data.data.resource;
  },

  /**
   * Deactivate an emergency resource (AUTHORITY soft-delete) or permanent purge (ADMIN hard delete)
   */
  async deleteResource(id: string, hardDelete = false): Promise<void> {
    await apiClient.delete(`/emergency-resources/${id}`, {
      params: hardDelete ? { hard: 'true' } : undefined,
    });
  },
};

export default resourceService;
