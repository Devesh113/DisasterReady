import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import {
  IncidentReport,
  CreateIncidentData,
  UpdateIncidentData,
  IncidentsResponseData,
  IncidentReportStatus,
} from '@/types/incident';

export interface QueryIncidentsParams {
  page?: number;
  limit?: number;
  status?: IncidentReportStatus;
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

interface RawUserIncidentsResponse {
  success: boolean;
  data: IncidentReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const incidentService = {
  /**
   * Submit a new ground incident report
   */
  async createIncident(data: CreateIncidentData): Promise<IncidentReport> {
    const res = await apiClient.post<ApiResponse<IncidentReport>>('/incidents', data);
    return res.data.data;
  },

  /**
   * Get the authenticated user's submitted incident reports
   * Correctly maps the backend response: { success: true, data: reports, pagination }
   */
  async getMyIncidents(params?: QueryIncidentsParams): Promise<IncidentsResponseData> {
    const res = await apiClient.get<RawUserIncidentsResponse>('/incidents/me', {
      params,
    });
    return {
      reports: res.data.data || [],
      pagination: res.data.pagination || {
        page: 1,
        limit: 10,
        total: (res.data.data || []).length,
        totalPages: 1,
      },
    };
  },

  /**
   * List all submitted incident reports across the municipality (AUTHORITY, ADMIN)
   */
  async getAllIncidents(params?: QueryIncidentsParams): Promise<IncidentsResponseData> {
    const res = await apiClient.get<RawUserIncidentsResponse>('/incidents', {
      params,
    });
    return {
      reports: res.data.data || [],
      pagination: res.data.pagination || {
        page: 1,
        limit: 10,
        total: (res.data.data || []).length,
        totalPages: 1,
      },
    };
  },

  /**
   * Get single incident report details
   */
  async getIncidentById(id: string): Promise<IncidentReport> {
    const res = await apiClient.get<ApiResponse<IncidentReport>>(`/incidents/${id}`);
    return res.data.data;
  },

  /**
   * Edit or update an incident report (status transition for AUTHORITY/ADMIN, or content update for owner while SUBMITTED)
   */
  async updateIncident(id: string, data: UpdateIncidentData): Promise<IncidentReport> {
    const res = await apiClient.patch<ApiResponse<IncidentReport>>(`/incidents/${id}`, data);
    return res.data.data;
  },

  /**
   * Delete an incident report (ADMIN only)
   */
  async deleteIncident(id: string): Promise<void> {
    await apiClient.delete(`/incidents/${id}`);
  },
};

export default incidentService;
