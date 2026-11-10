import { DisasterType } from './disaster';

export type AlertSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  issuedAt: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  disasterId: string;
  issuedById: string;
  distanceKm?: number;
  disaster?: {
    id: string;
    name: string;
    type: DisasterType;
    guidelines?: string | null;
  };
  issuedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface CreateAlertData {
  title: string;
  description: string;
  severity: AlertSeverity;
  status?: AlertStatus;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  expiresAt?: string | null;
  disasterId: string;
}

export interface UpdateAlertData {
  title?: string;
  description?: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  expiresAt?: string | null;
  disasterId?: string;
}

export interface AlertsResponseData {
  alerts: Alert[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AlertDetailResponseData {
  alert: Alert;
}
