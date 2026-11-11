import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import {
  Event,
  EventsResponseData,
  EventDetailResponseData,
  EventStatus,
  CreateEventData,
  UpdateEventData,
  EventAttendeesResponseData,
} from '@/types/event';

export interface QueryEventsParams {
  page?: number;
  limit?: number;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sortBy?: 'startDate' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface QueryAttendeeParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const eventService = {
  /**
   * List mock drills and events with search and status filters
   */
  async getEvents(params?: QueryEventsParams): Promise<EventsResponseData> {
    const res = await apiClient.get<ApiResponse<EventsResponseData>>('/events', {
      params,
    });
    return res.data.data;
  },

  /**
   * Get single event details by UUID
   */
  async getEventById(id: string): Promise<EventDetailResponseData> {
    const res = await apiClient.get<ApiResponse<EventDetailResponseData>>(`/events/${id}`);
    return res.data.data;
  },

  /**
   * Create a new community mock drill or training event (AUTHORITY, ADMIN)
   */
  async createEvent(data: CreateEventData): Promise<Event> {
    const res = await apiClient.post<ApiResponse<{ event: Event }>>('/events', data);
    return res.data.data.event;
  },

  /**
   * Update an existing mock drill (Organizer or ADMIN)
   */
  async updateEvent(id: string, data: UpdateEventData): Promise<Event> {
    const res = await apiClient.patch<ApiResponse<{ event: Event }>>(`/events/${id}`, data);
    return res.data.data.event;
  },

  /**
   * Delete an event (ADMIN only)
   */
  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
  },

  /**
   * Retrieve registered attendee roster for an event (Organizer or ADMIN)
   */
  async getEventAttendees(
    eventId: string,
    params?: QueryAttendeeParams
  ): Promise<EventAttendeesResponseData> {
    const res = await apiClient.get<ApiResponse<EventAttendeesResponseData>>(
      `/events/${eventId}/registrations`,
      { params }
    );
    return res.data.data;
  },
};

export default eventService;
