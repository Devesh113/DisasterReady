import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import {
  Registration,
  RegistrationStatus,
  RegistrationsResponseData,
  RegistrationDetailResponseData,
} from '@/types/registration';

export interface QueryRegistrationsParams {
  page?: number;
  limit?: number;
  status?: RegistrationStatus;
}

export const registrationService = {
  /**
   * Register the authenticated user for an event
   */
  async registerForEvent(eventId: string): Promise<Registration> {
    const res = await apiClient.post<ApiResponse<RegistrationDetailResponseData>>(
      `/events/${eventId}/register`
    );
    return res.data.data.registration;
  },

  /**
   * Cancel event registration by event ID
   */
  async cancelEventRegistration(eventId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/register`);
  },

  /**
   * List the current user's event registrations
   */
  async getMyRegistrations(params?: QueryRegistrationsParams): Promise<RegistrationsResponseData> {
    const res = await apiClient.get<ApiResponse<RegistrationsResponseData>>('/registrations', {
      params,
    });
    return res.data.data;
  },

  /**
   * Get registration details by registration ID
   */
  async getRegistrationById(id: string): Promise<Registration> {
    const res = await apiClient.get<ApiResponse<RegistrationDetailResponseData>>(
      `/registrations/${id}`
    );
    return res.data.data.registration;
  },

  /**
   * Cancel registration by registration ID
   */
  async cancelRegistrationById(id: string): Promise<void> {
    await apiClient.delete(`/registrations/${id}`);
  },
};

export default registrationService;
