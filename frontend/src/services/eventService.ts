import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';
import { Event, EventsResponseData, EventDetailResponseData, EventStatus } from '@/types/event';

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

export const eventService = {
  async getEvents(params?: QueryEventsParams): Promise<EventsResponseData> {
    const res = await apiClient.get<ApiResponse<EventsResponseData>>('/events', {
      params,
    });
    return res.data.data;
  },

  async getEventById(id: string): Promise<EventDetailResponseData> {
    const res = await apiClient.get<ApiResponse<EventDetailResponseData>>(`/events/${id}`);
    return res.data.data;
  },
};
