'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Search,
  Filter,
  Navigation,
  Phone,
  Users,
  ShieldCheck,
  Building2,
  HeartPulse,
  Flame,
  Shield,
  Package,
  Droplets,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { resourceService } from '@/services/resourceService';
import { EmergencyResource, ResourceType } from '@/types/resource';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import EmergencyMap from '@/components/maps/EmergencyMap';

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

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-resources', page, selectedType, searchTerm, userLocation],
    queryFn: () =>
      resourceService.getResources({
        page,
        limit: 12,
        type: selectedType !== 'ALL' ? (selectedType as ResourceType) : undefined,
        search: searchTerm.trim() || undefined,
        latitude: userLocation?.lat,
        longitude: userLocation?.lon,
        radiusKm: userLocation ? 50 : undefined,
      }),
  });

  const resources = data?.resources || [];
  const pagination = data?.pagination;

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
        console.warn('Geolocation access denied:', err);
        setGeoLoading(false);
        alert('Could not determine your location. Please check browser permissions.');
      }
    );
  };

  const handleClearLocation = () => {
    setUserLocation(null);
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
    <div className="min-h-screen bg-[#F5F7FA] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="rounded-2xl bg-[#102A43] text-white p-8 sm:p-10 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Badge variant="brand" className="bg-white/10 text-blue-200 border-white/20 mb-2">
                Emergency Infrastructure
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Safe Shelter Locator & Emergency Resources
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Geolocated directory of verified cyclone shelters, trauma centers, fire stations, and relief supply depots.
              </p>
            </div>

            <div className="shrink-0">
              {userLocation ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearLocation}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 gap-2"
                >
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  Clear Location (50km)
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={geoLoading}
                  onClick={handleGetLocation}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 gap-2"
                >
                  <Navigation className="h-4 w-4 text-blue-300" />
                  Find Near Me
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Leaflet Map */}
        <div className="rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#1769AA]" />
              Interactive Emergency Grid
            </span>
            <span className="text-xs text-[#627D98]">
              {resources.length} active emergency facilities mapped
            </span>
          </div>

          <div className="h-[420px] w-full">
            <EmergencyMap
              resources={resources}
              userCoords={userLocation ? [userLocation.lat, userLocation.lon] : null}
              radiusKm={userLocation ? 50 : undefined}
            />
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
              <Input
                placeholder="Search resources by facility name or address..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
              <span className="text-xs font-semibold text-[#627D98] mr-1 hidden sm:inline">
                Type:
              </span>
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedType === type
                      ? 'bg-[#1769AA] text-white shadow-xs'
                      : 'bg-[#F5F7FA] text-[#172B4D] hover:bg-[#E3F2FD] hover:text-[#1769AA]'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to Load Emergency Resources"
            message="Could not retrieve emergency facilities from the backend service. Please check your network connection."
            onRetry={() => refetch()}
          />
        ) : resources.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((res) => {
                const Icon = resourceTypeIcons[res.type] || Building2;
                return (
                  <Card key={res.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-[#E3F2FD] text-[#1769AA] flex items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </div>
                          <Badge variant="brand">{res.type.replace('_', ' ')}</Badge>
                        </div>

                        {res.distanceKm !== undefined && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {res.distanceKm} km away
                          </span>
                        )}
                      </div>

                      <CardTitle className="text-lg line-clamp-1">{res.name}</CardTitle>
                      {res.description && (
                        <p className="text-xs text-[#627D98] line-clamp-2 mt-1">
                          {res.description}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-2.5 text-xs text-[#172B4D]">
                      <div className="flex items-start gap-2 text-[#627D98]">
                        <MapPin className="h-4 w-4 text-[#1769AA] shrink-0 mt-0.5" />
                        <span className="leading-snug text-[#172B4D] font-medium">{res.address}</span>
                      </div>

                      {res.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                          <a href={`tel:${res.phone}`} className="text-[#1769AA] font-semibold hover:underline">
                            {res.phone}
                          </a>
                        </div>
                      )}

                      {res.capacity && (
                        <div className="flex items-center gap-2 text-[#627D98]">
                          <Users className="h-4 w-4 text-slate-500 shrink-0" />
                          <span>Emergency Capacity: <strong>{res.capacity} persons</strong></span>
                        </div>
                      )}
                    </CardContent>

                    <div className="p-4 border-t border-[#D9E2EC] bg-[#F5F7FA] rounded-b-xl flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Operational
                      </span>

                      {res.phone ? (
                        <a
                          href={`tel:${res.phone}`}
                          className="font-semibold text-[#1769AA] hover:underline"
                        >
                          Call Facility &rarr;
                        </a>
                      ) : (
                        <span className="text-slate-400">Open 24/7 during alert</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#D9E2EC] pt-6">
                <div className="text-xs text-[#627D98]">
                  Showing page <strong className="text-[#102A43]">{pagination.page}</strong> of{' '}
                  <strong className="text-[#102A43]">{pagination.totalPages}</strong> ({pagination.total} facilities)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevPage && pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage && pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="gap-1"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="No Emergency Facilities Located"
            description="No emergency resources matched your search filter. Try clearing filters or expanding search range."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchTerm('');
              setSelectedType('ALL');
              setUserLocation(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
