export type IncidentReportStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'RESOLVED'
  | 'REJECTED';

export type IncidentCategory =
  | 'FLOOD'
  | 'STRUCTURAL_DAMAGE'
  | 'LANDSLIDE'
  | 'FIRE_HAZARD'
  | 'ROAD_BLOCKAGE'
  | 'POWER_UTILITY'
  | 'MEDICAL_EMERGENCY'
  | 'OTHER';

export type IncidentSeverity =
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'CRITICAL';

export interface IncidentReport {
  id: string;
  title: string;
  description: string;
  status: IncidentReportStatus;
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  reportedById: string;
  reportedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  distanceKm?: number;
}

export interface CreateIncidentData {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  imageUrl?: string | null;
}

export interface UpdateIncidentData {
  title?: string;
  description?: string;
  status?: IncidentReportStatus;
  latitude?: number;
  longitude?: number;
  address?: string | null;
  imageUrl?: string | null;
}

/**
 * Normalised response from GET /api/v1/incidents/me
 */
export interface IncidentsResponseData {
  reports: IncidentReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Direct response payload from backend for single incident
 */
export type IncidentDetailResponseData = IncidentReport;
