'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Search,
  Navigation,
  Phone,
  Users,
  Building2,
  HeartPulse,
  Flame,
  Shield,
  Package,
  Droplets,
} from 'lucide-react';
import { resourceService } from '@/services/resourceService';
import { EmergencyResource, ResourceType } from '@/types/resource';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import EmergencyMap from '@/components/maps/EmergencyMap';
import ErrorState from '@/components/shared/ErrorState';

const resourceTypeIcons: Record<string, React.ElementType> = {
  SHELTER: Building2,
  HOSPITAL: HeartPulse,
  FIRE_STATION: Flame,
  POLICE_STATION: Shield,
  SUPPLY_CENTER: Package,
  EVACUATION_POINT: MapPin,
  WATER_SOURCE: Droplets,
  OTHER: Building2,
};

export default function CitizenMapPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['citizen-map-resources', selectedType, searchTerm, userLocation],
    queryFn: () =>
      resourceService.getResources({
        limit: 50,
        type: selectedType !== 'ALL' ? (selectedType as ResourceType) : undefined,
        search: searchTerm.trim() || undefined,
        latitude: userLocation?.lat,
        longitude: userLocation?.lon,
        radiusKm: userLocation ? 50 : undefined,
      }),
  });

  const resources = data?.resources || [];

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setGeoLoading(false);
      },
      (err) => {
        console.warn('Geolocation permission error:', err);
        setGeoLoading(false);
        alert('Could not determine your location. Please check browser permissions.');
      }
    );
  };

  const types = [
    'ALL',
    'SHELTER',
    'HOSPITAL',
    'FIRE_STATION',
    'POLICE_STATION',
    'SUPPLY_CENTER',
    'EVACUATION_POINT',
    'WATER_SOURCE',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Safe Shelter & Emergency Resource Map
          </h1>
          <p className="text-xs sm:text-sm text-[#627D98] mt-1">
            Locate verified safe structures, trauma hospitals, fire stations, and supplies in your vicinity.
          </p>
        </div>

        <div>
          {userLocation ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserLocation(null)}
              className="gap-2 text-xs border-emerald-300 text-emerald-800 bg-emerald-50"
            >
              <MapPin className="h-4 w-4 text-emerald-600" />
              Radius Filter Active (50km) — Clear
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              isLoading={geoLoading}
              onClick={handleGetLocation}
              className="gap-2 text-xs text-[#1769AA]"
            >
              <Navigation className="h-4 w-4" />
              Center on My Location
            </Button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#1769AA]" />
            Live Emergency Facility Grid
          </span>
          <span className="text-xs text-[#627D98]">
            {resources.length} active emergency facilities mapped
          </span>
        </div>

        <div className="h-[460px] w-full">
          <EmergencyMap
            resources={resources}
            userCoords={userLocation ? [userLocation.lat, userLocation.lon] : null}
            radiusKm={userLocation ? 50 : undefined}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
            <Input
              placeholder="Search facility by name or street address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedType === type
                    ? 'bg-[#1769AA] text-white shadow-xs'
                    : 'bg-[#F5F7FA] text-[#172B4D] hover:bg-[#E3F2FD]'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Directory */}
      {isError ? (
        <ErrorState
          title="Could not load map facilities"
          message="Failed to retrieve emergency resources from the server."
          onRetry={() => refetch()}
        />
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => {
            const Icon = resourceTypeIcons[res.type] || Building2;
            return (
              <Card key={res.id} className="p-4 space-y-2.5 hover:border-[#1769AA] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#E3F2FD] text-[#1769AA] flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <Badge variant="brand" className="text-[10px] py-0">
                      {res.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  {res.distanceKm !== undefined && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {res.distanceKm} km away
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-[#102A43] truncate">{res.name}</h4>
                <p className="text-xs text-[#627D98] flex items-center gap-1 truncate">
                  <MapPin className="h-3.5 w-3.5 text-[#1769AA] shrink-0" />
                  {res.address}
                </p>

                <div className="pt-2 border-t border-[#D9E2EC] flex items-center justify-between text-xs">
                  {res.phone ? (
                    <a
                      href={`tel:${res.phone}`}
                      className="text-[#1769AA] font-semibold hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {res.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400">Open 24/7 during alert</span>
                  )}

                  {res.capacity && (
                    <span className="text-slate-500 text-[11px]">
                      Cap: {res.capacity}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
