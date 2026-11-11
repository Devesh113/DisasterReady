import { Event } from './event';
import { User } from './auth';

export type RegistrationStatus = 'REGISTERED' | 'ATTENDED' | 'CANCELLED';

export interface Registration {
  id: string;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
  eventId: string;
  event?: Event;
  user?: User;
}

export interface RegistrationsResponseData {
  registrations: Registration[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface RegistrationDetailResponseData {
  registration: Registration;
}
