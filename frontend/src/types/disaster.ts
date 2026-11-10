export type DisasterType =
  | 'EARTHQUAKE'
  | 'FLOOD'
  | 'CYCLONE'
  | 'TSUNAMI'
  | 'WILDFIRE'
  | 'LANDSLIDE'
  | 'DROUGHT'
  | 'VOLCANIC_ERUPTION'
  | 'TORNADO'
  | 'INDUSTRIAL_ACCIDENT'
  | 'OTHER';

export interface Disaster {
  id: string;
  name: string;
  type: DisasterType;
  description: string;
  guidelines?: string | null;
  iconUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisastersResponseData {
  disasters: Disaster[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface DisasterDetailResponseData {
  disaster: Disaster;
}
