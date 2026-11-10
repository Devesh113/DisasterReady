'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Radio,
  Search,
  MapPin,
  Clock,
  Filter,
  Navigation,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { alertService } from '@/services/alertService';
import { AlertSeverity, AlertStatus } from '@/types/alert';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { formatDate, formatDateTime, getSeverityBadgeStyles, timeAgo } from '@/lib/utils';

export default function CitizenAlertsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [page, setPage] = useState<number>(1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['citizen-alerts-page', page, selectedSeverity, selectedStatus, searchTerm, userLocation],
    queryFn: () =>
      alertService.getAlerts({
        page,
        limit: 10,
        severity: selectedSeverity !== 'ALL' ? (selectedSeverity as AlertSeverity) : undefined,
        status: selectedStatus !== 'ALL' ? (selectedStatus as AlertStatus) : undefined,
        search: searchTerm.trim() || undefined,
        latitude: userLocation?.lat,
        longitude: userLocation?.lon,
        radiusKm: userLocation ? 50 : undefined,
      }),
  });

  const alerts = data?.alerts || [];
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

  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'];
  const statuses = ['ALL', 'ACTIVE', 'EXPIRED', 'CANCELLED'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Live Emergency Alerts & Hazard Advisories
          </h1>
          <p className="text-xs sm:text-sm text-[#627D98] mt-1">
            Real-time hazard notifications broadcasted by civil defense and emergency response agencies.
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
              Show Alerts Near My Location
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
            <Input
              placeholder="Search alerts by title or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Severity */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-[#627D98] mr-1">Severity:</span>
              {severities.map((sev) => (
                <button
                  key={sev}
                  onClick={() => {
                    setSelectedSeverity(sev);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    selectedSeverity === sev
                      ? 'bg-[#102A43] text-white'
                      : 'bg-[#F5F7FA] text-[#172B4D] hover:bg-[#E3F2FD]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Status */}
            <div className="flex items-center gap-1 border-l border-[#D9E2EC] pl-3">
              <span className="text-xs font-semibold text-[#627D98] mr-1">Status:</span>
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setSelectedStatus(st);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-[#1769AA] text-white'
                      : 'bg-[#F5F7FA] text-[#172B4D] hover:bg-[#E3F2FD]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-3">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to Load Alerts"
          message="Could not retrieve active emergency alerts. Please check backend connection."
          onRetry={() => refetch()}
        />
      ) : alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const badge = getSeverityBadgeStyles(alert.severity);
            const isCritical = alert.severity === 'CRITICAL';
            return (
              <div
                key={alert.id}
                className={`rounded-xl border bg-white p-6 shadow-xs hover:shadow-md transition-all ${
                  isCritical ? 'border-red-300 ring-1 ring-red-200' : 'border-[#D9E2EC]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${badge.bg}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${badge.dot} ${isCritical ? 'animate-ping' : ''}`} />
                        {alert.severity} Severity
                      </span>
                      <Badge variant="outline">{alert.status}</Badge>

                      {alert.disaster?.name && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#1769AA] border border-blue-100">
                          {alert.disaster.name}
                        </span>
                      )}

                      {alert.distanceKm !== undefined && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          📍 {alert.distanceKm} km away
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-[#102A43]">
                      <Link href={`/alerts/${alert.id}`} className="hover:text-[#1769AA]">
                        {alert.title}
                      </Link>
                    </h3>

                    <p className="text-xs sm:text-sm text-[#172B4D] leading-relaxed line-clamp-2">
                      {alert.description}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#627D98]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Issued: {formatDateTime(alert.issuedAt)} ({timeAgo(alert.issuedAt)})
                      </span>
                      {alert.expiresAt && (
                        <span className="flex items-center gap-1 text-amber-700">
                          <Calendar className="h-3.5 w-3.5" />
                          Expires: {formatDateTime(alert.expiresAt)}
                        </span>
                      )}
                      {alert.radius && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          Radius: {alert.radius} km
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 sm:self-center">
                    <Link href={`/alerts/${alert.id}`}>
                      <Button
                        variant={isCritical ? 'emergency' : 'outline'}
                        size="sm"
                        className="gap-2 text-xs"
                      >
                        View Advisory <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#D9E2EC] pt-4">
              <div className="text-xs text-[#627D98]">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} alerts)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage && pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage && pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Radio}
          title="No Alerts Found"
          description="There are currently no active advisories matching your filter selection."
          actionLabel="Reset Filter"
          onAction={() => {
            setSearchTerm('');
            setSelectedSeverity('ALL');
            setSelectedStatus('ACTIVE');
            setUserLocation(null);
          }}
        />
      )}
    </div>
  );
}
