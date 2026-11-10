import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import { DisastersResponseData, DisasterDetailResponseData, DisasterType } from '@/types/disaster';

export interface QueryDisastersParams {
  page?: number;
  limit?: number;
  type?: DisasterType;
  search?: string;
}

export const disasterService = {
  async getDisasters(params?: QueryDisastersParams): Promise<DisastersResponseData> {
    const res = await apiClient.get<ApiResponse<DisastersResponseData>>('/disasters', {
      params,
    });
    return res.data.data;
  },

  async getDisasterById(id: string): Promise<DisasterDetailResponseData> {
    const res = await apiClient.get<ApiResponse<DisasterDetailResponseData>>(`/disasters/${id}`);
    return res.data.data;
  },
};
