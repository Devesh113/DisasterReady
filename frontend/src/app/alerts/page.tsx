'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Radio,
  Search,
  MapPin,
  Clock,
  Filter,
  Navigation,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { alertService } from '@/services/alertService';
import { AlertSeverity, AlertStatus } from '@/types/alert';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { formatDate, formatDateTime, getSeverityBadgeStyles, timeAgo } from '@/lib/utils';

export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [page, setPage] = useState<number>(1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-alerts', page, selectedSeverity, selectedStatus, searchTerm, userLocation],
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

  const handleClearLocation = () => {
    setUserLocation(null);
  };

  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'];
  const statuses = ['ALL', 'ACTIVE', 'EXPIRED', 'CANCELLED'];

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-[#102A43] via-[#102A43] to-[#172B4D] text-white p-8 sm:p-10 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-200 border border-red-500/30 text-xs font-semibold mb-3">
                <span className="h-2 w-2 rounded-full bg-[#DC3545] animate-ping" />
                Live Civil Defense Broadcast Feed
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Emergency Alerts & Hazard Advisories
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Direct authority warnings categorized by severity level, geographic radius, and validity periods.
                Stay informed to make rapid, life-saving decisions.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              {userLocation ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearLocation}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 gap-2"
                >
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  Clear Radius (50km)
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
                  Alerts Near Me
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
              <Input
                placeholder="Search alerts by title or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Severity & Status Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Severity Pills */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-[#627D98] mr-1">Severity:</span>
                {severities.map((sev) => {
                  const isSelected = selectedSeverity === sev;
                  return (
                    <button
                      key={sev}
                      onClick={() => {
                        setSelectedSeverity(sev);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#102A43] text-white shadow-xs'
                          : 'bg-[#F5F7FA] text-[#172B4D] hover:bg-[#E3F2FD]'
                      }`}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-1 border-l border-[#D9E2EC] pl-3">
                <span className="text-xs font-semibold text-[#627D98] mr-1">Status:</span>
                {statuses.map((st) => {
                  const isSelected = selectedStatus === st;
                  return (
                    <button
                      key={st}
                      onClick={() => {
                        setSelectedStatus(st);
                        setPage(1);
                      }}
                      className={`px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1769AA] text-white'
                          : 'bg-[#F5F7FA] text-[#172B4D] hover:bg-[#E3F2FD]'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
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
            title="Failed to Load Live Alerts"
            message="Could not retrieve alert broadcasts from the backend API. Please verify backend service availability."
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
                      {/* Top Meta Strip */}
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
                            📍 {alert.distanceKm} km from you
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-xl font-bold text-[#102A43] hover:text-[#1769AA] transition-colors">
                        <Link href={`/alerts/${alert.id}`}>{alert.title}</Link>
                      </h3>

                      <p className="text-sm text-[#172B4D] leading-relaxed line-clamp-2">
                        {alert.description}
                      </p>

                      {/* Footer Details: Timestamps & Issuing Authority */}
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
                            Affected Radius: {alert.radius} km
                          </span>
                        )}
                        {alert.issuedBy && (
                          <span className="text-slate-500">
                            Authority: {alert.issuedBy.firstName} {alert.issuedBy.lastName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View Details CTA */}
                    <div className="shrink-0 sm:self-center">
                      <Link href={`/alerts/${alert.id}`}>
                        <Button
                          variant={isCritical ? 'emergency' : 'outline'}
                          size="sm"
                          className="gap-2 w-full sm:w-auto"
                        >
                          View Full Notice <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#D9E2EC] pt-6">
                <div className="text-xs text-[#627D98]">
                  Showing page <strong className="text-[#102A43]">{pagination.page}</strong> of{' '}
                  <strong className="text-[#102A43]">{pagination.totalPages}</strong> ({pagination.total} total alerts)
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
            icon={Radio}
            title="No Alerts Found Matching Your Criteria"
            description="There are currently no active or historical emergency advisories that match your selected filters."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchTerm('');
              setSelectedSeverity('ALL');
              setSelectedStatus('ACTIVE');
              setUserLocation(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
