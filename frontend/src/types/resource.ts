export type ResourceType =
  | 'SHELTER'
  | 'HOSPITAL'
  | 'FIRE_STATION'
  | 'POLICE_STATION'
  | 'SUPPLY_CENTER'
  | 'EVACUATION_POINT'
  | 'WATER_SOURCE'
  | 'OTHER';

export interface EmergencyResource {
  id: string;
  name: string;
  type: ResourceType;
  description?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  capacity?: number | null;
  isActive: boolean;
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceData {
  name: string;
  type: ResourceType;
  description?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  capacity?: number | null;
  isActive?: boolean;
}

export interface UpdateResourceData {
  name?: string;
  type?: ResourceType;
  description?: string | null;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string | null;
  capacity?: number | null;
  isActive?: boolean;
}

export interface ResourcesResponseData {
  resources: EmergencyResource[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ResourceDetailResponseData {
  resource: EmergencyResource;
}
