export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface Event {
  id: string;
  title: string;
  description: string;
  status: EventStatus;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  startDate: string;
  endDate: string;
  capacity?: number | null;
  registrationCount?: number;
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
  organizerId: string;
  organizer?: {
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
}

export interface EventsResponseData {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface EventDetailResponseData {
  event: Event;
}
