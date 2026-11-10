import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import { Alert, AlertsResponseData, AlertDetailResponseData, AlertSeverity, AlertStatus } from '@/types/alert';
import { DisasterType } from '@/types/disaster';

export interface QueryAlertsParams {
  page?: number;
  limit?: number;
  severity?: AlertSeverity;
  status?: AlertStatus;
  disasterId?: string;
  disasterType?: DisasterType;
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  radius?: number;
}

export const alertService = {
  async getAlerts(params?: QueryAlertsParams): Promise<AlertsResponseData> {
    const res = await apiClient.get<ApiResponse<AlertsResponseData>>('/alerts', {
      params,
    });
    return res.data.data;
  },

  async getAlertById(id: string): Promise<AlertDetailResponseData> {
    const res = await apiClient.get<ApiResponse<AlertDetailResponseData>>(`/alerts/${id}`);
    return res.data.data;
  },
};
