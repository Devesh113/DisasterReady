import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import {
  Alert,
  AlertsResponseData,
  AlertDetailResponseData,
  AlertSeverity,
  AlertStatus,
  CreateAlertData,
  UpdateAlertData,
} from '@/types/alert';
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
  /**
   * List alerts with pagination, multi-attribute filtering, and proximity search
   */
  async getAlerts(params?: QueryAlertsParams): Promise<AlertsResponseData> {
    const res = await apiClient.get<Record<string, unknown>>('/alerts', {
      params,
    });
    const raw = res.data;
    const rawData = raw?.data;
    const alertList: Alert[] = Array.isArray(rawData)
      ? (rawData as Alert[])
      : Array.isArray((raw as Record<string, unknown>)?.alerts)
      ? ((raw as Record<string, unknown>).alerts as Alert[])
      : [];

    const rawPagination = (raw?.pagination as Record<string, unknown>) || {};
    const page = Number(rawPagination.page) || 1;
    const limit = Number(rawPagination.limit) || 10;
    const total = Number(rawPagination.total) || alertList.length;
    const totalPages = Number(rawPagination.totalPages) || Math.ceil(total / limit) || 1;

    return {
      alerts: alertList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: typeof rawPagination.hasNextPage === 'boolean' ? (rawPagination.hasNextPage as boolean) : page < totalPages,
        hasPrevPage: typeof rawPagination.hasPrevPage === 'boolean' ? (rawPagination.hasPrevPage as boolean) : page > 1,
      },
    };
  },

  /**
   * Get single alert details by UUID
   */
  async getAlertById(id: string): Promise<AlertDetailResponseData> {
    const res = await apiClient.get<Record<string, unknown>>(`/alerts/${id}`);
    const alert = (res.data?.data as Alert) || (res.data?.alert as Alert);
    return { alert };
  },

  /**
   * Broadcast/create a new emergency alert (AUTHORITY, ADMIN)
   */
  async createAlert(data: CreateAlertData): Promise<Alert> {
    const res = await apiClient.post<ApiResponse<Alert>>('/alerts', data);
    return res.data.data;
  },

  /**
   * Update an existing alert status or details (AUTHORITY creator or ADMIN)
   */
  async updateAlert(id: string, data: UpdateAlertData): Promise<Alert> {
    const res = await apiClient.patch<ApiResponse<Alert>>(`/alerts/${id}`, data);
    return res.data.data;
  },

  /**
   * Delete an alert (ADMIN only)
   */
  async deleteAlert(id: string): Promise<void> {
    await apiClient.delete(`/alerts/${id}`);
  },
};

export default alertService;
