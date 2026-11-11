'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Calendar,
  MapPin,
  ShieldAlert,
  User,
  Radio,
  BookOpen,
  Share2,
  CheckCircle,
} from 'lucide-react';
import { alertService } from '@/services/alertService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import ErrorState from '@/components/shared/ErrorState';
import { formatDate, formatDateTime, getSeverityBadgeStyles, timeAgo } from '@/lib/utils';

export default function AlertDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['alert-detail', id],
    queryFn: () => alertService.getAlertById(id),
    enabled: Boolean(id),
  });

  const alert = data?.alert;
  const badge = alert ? getSeverityBadgeStyles(alert.severity) : null;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !alert) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/alerts">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Live Alerts Feed
            </Button>
          </Link>
        </div>
        <ErrorState
          title="Alert Broadcast Not Found"
          message={`Unable to locate alert record with identifier '${id}'. The alert may have expired or been revoked.`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isCritical = alert.severity === 'CRITICAL';

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/alerts">
            <Button variant="outline" size="sm" className="gap-2 text-[#172B4D]">
              <ArrowLeft className="h-4 w-4" /> Back to Alerts Feed
            </Button>
          </Link>
          <span className="text-xs text-[#627D98]">Alert ID: {alert.id}</span>
        </div>

        {/* Header Broadcast Card */}
        <div
          className={`rounded-2xl border bg-white p-8 sm:p-10 shadow-sm space-y-6 ${
            isCritical ? 'border-red-300 ring-2 ring-red-200' : 'border-[#D9E2EC]'
          }`}
        >
          {/* Severity & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9E2EC] pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-2 ${badge?.bg}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${badge?.dot} ${isCritical ? 'animate-ping' : ''}`} />
                {alert.severity} Severity Broadcast
              </span>
              <Badge variant="outline">{alert.status}</Badge>
            </div>

            <div className="text-xs text-[#627D98] flex items-center gap-1 font-medium">
              <Clock className="h-3.5 w-3.5" />
              Issued {timeAgo(alert.issuedAt)}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight leading-snug">
              {alert.title}
            </h1>

            <div className="prose max-w-none text-[#172B4D] leading-relaxed text-base whitespace-pre-line bg-[#F5F7FA] p-6 rounded-xl border border-[#D9E2EC]">
              {alert.description}
            </div>
          </div>

          {/* Timestamps & Geography Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-[#D9E2EC] text-xs">
            <div className="space-y-1">
              <span className="text-[#627D98] font-medium block">Issue Timestamp:</span>
              <span className="font-semibold text-[#102A43] flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#1769AA]" />
                {formatDateTime(alert.issuedAt)}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[#627D98] font-medium block">Expiration Timestamp:</span>
              <span className="font-semibold text-[#102A43] flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-amber-600" />
                {alert.expiresAt ? formatDateTime(alert.expiresAt) : 'Until further notice'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[#627D98] font-medium block">Geographic Impact:</span>
              <span className="font-semibold text-[#102A43] flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#DC3545]" />
                {alert.radius ? `${alert.radius} km radius` : 'Regional alert zone'}
              </span>
            </div>
          </div>

          {/* Issuing Authority & Linked Disaster */}
          <div className="pt-4 border-t border-[#D9E2EC] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            {alert.issuedBy && (
              <div className="flex items-center gap-2 text-slate-700">
                <User className="h-4 w-4 text-[#1769AA]" />
                <span>
                  Issuing Official: <strong>{alert.issuedBy.firstName} {alert.issuedBy.lastName}</strong> ({alert.issuedBy.role})
                </span>
              </div>
            )}

            {alert.disaster && (
              <Link
                href={`/awareness/${alert.disaster.id}`}
                className="text-xs font-semibold text-[#1769AA] hover:underline flex items-center gap-1"
              >
                <BookOpen className="h-4 w-4" />
                View {alert.disaster.name} Preparedness Guide &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Emergency Immediate Action Guidelines */}
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-base text-red-950 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#DC3545]" />
              Civil Defense Instructions During This Advisory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#172B4D]">
            <p>
              1. <strong>Do Not Panic:</strong> Remain in communication with local emergency management authorities via civil radio or official app alerts.
            </p>
            <p>
              2. <strong>Prepare for Evacuation:</strong> If situated within the affected impact radius, verify your family emergency grab bag and follow all evacuation directives immediately.
            </p>
            <p>
              3. <strong>Locate Nearest Shelter:</strong> Consult our interactive shelter map to identify safe reinforced facilities outside vulnerable zones.
            </p>
          </CardContent>
        </Card>

        {/* Safe Shelters Quick CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-xl border border-[#D9E2EC] bg-white">
          <div>
            <h4 className="font-bold text-[#102A43] text-sm">Need to Find an Evacuation Safe Shelter?</h4>
            <p className="text-xs text-[#627D98] mt-0.5">Explore our geolocated map of active shelters, hospitals, and relief hubs.</p>
          </div>
          <Link href="/resources">
            <Button variant="primary" size="sm" className="gap-2">
              <MapPin className="h-4 w-4" />
              Open Shelter Locator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
