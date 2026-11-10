'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EmergencyResource } from '@/types/resource';
import { Phone, Users, MapPin } from 'lucide-react';

// Configure standard leaflet marker icons safely
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">📍</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const typeColors: Record<string, string> = {
  SHELTER: '#1769AA',
  HOSPITAL: '#DC3545',
  FIRE_STATION: '#EA580C',
  POLICE_STATION: '#102A43',
  SUPPLY_CENTER: '#16A34A',
  EVACUATION_POINT: '#9333EA',
  WATER_SOURCE: '#0284C7',
  OTHER: '#64748B',
};

interface LeafletMapInnerProps {
  resources: EmergencyResource[];
  center?: [number, number];
  zoom?: number;
  userCoords?: [number, number] | null;
  radiusKm?: number;
}

export default function LeafletMapInner({
  resources,
  center = [28.6139, 77.209], // Default New Delhi / generic fallback
  zoom = 12,
  userCoords,
  radiusKm,
}: LeafletMapInnerProps) {
  const mapCenter = userCoords || center;

  return (
    <div className="w-full h-full min-h-[450px] relative rounded-xl overflow-hidden border border-[#D9E2EC]">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location Marker & Search Radius */}
        {userCoords && (
          <>
            <Marker
              position={userCoords}
              icon={L.divIcon({
                className: 'user-pin',
                html: `<div style="background-color: #DC3545; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(220,53,69,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">👤</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              })}
            >
              <Popup>
                <div className="font-semibold text-xs">Your Current Location</div>
              </Popup>
            </Marker>

            {radiusKm && (
              <Circle
                center={userCoords}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: '#1769AA',
                  fillColor: '#1769AA',
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: '4 4',
                }}
              />
            )}
          </>
        )}

        {/* Emergency Resources Markers */}
        {resources.map((res) => {
          if (res.latitude === null || res.longitude === null) return null;
          const markerColor = typeColors[res.type] || '#1769AA';
          return (
            <Marker
              key={res.id}
              position={[res.latitude, res.longitude]}
              icon={createCustomIcon(markerColor)}
            >
              <Popup>
                <div className="p-1 space-y-1.5 max-w-[220px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                      {res.type.replace('_', ' ')}
                    </span>
                    {res.distanceKm !== undefined && (
                      <span className="text-[10px] text-blue-600 font-semibold">
                        {res.distanceKm} km away
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-[#102A43] leading-tight">{res.name}</h4>
                  <p className="text-xs text-slate-600 flex items-start gap-1">
                    <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>{res.address}</span>
                  </p>
                  {res.phone && (
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0 text-emerald-600" />
                      <a href={`tel:${res.phone}`} className="hover:underline font-medium">
                        {res.phone}
                      </a>
                    </p>
                  )}
                  {res.capacity && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Users className="h-3 w-3 shrink-0" />
                      <span>Capacity: {res.capacity} people</span>
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
