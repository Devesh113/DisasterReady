'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Building2,
  AlertCircle,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { eventService } from '@/services/eventService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import ErrorState from '@/components/shared/ErrorState';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['event-detail', id],
    queryFn: () => eventService.getEventById(id),
    enabled: Boolean(id),
  });

  const event = data?.event;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/events">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Drills Directory
            </Button>
          </Link>
        </div>
        <ErrorState
          title="Event Not Found"
          message={`Unable to locate mock drill record for ID: '${id}'. It may have been removed by an authority.`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const regCount = event.registrationCount ?? 0;
  const capacity = event.capacity ?? null;
  const percentage = capacity ? Math.min(100, Math.round((regCount / capacity) * 100)) : null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/events">
            <Button variant="outline" size="sm" className="gap-2 text-[#172B4D]">
              <ArrowLeft className="h-4 w-4" /> Back to All Events
            </Button>
          </Link>
          <span className="text-xs text-[#627D98]">Event ID: {event.id}</span>
        </div>

        {/* Header Event Card */}
        <div className="rounded-2xl border border-[#D9E2EC] bg-white p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9E2EC] pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="brand">{event.status}</Badge>
              <span className="text-xs text-[#627D98] flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#1769AA]" />
                {formatDate(event.startDate)}
              </span>
            </div>

            {event.organizer && (
              <span className="text-xs text-slate-600 font-medium">
                Organized by: <strong>{event.organizer.firstName} {event.organizer.lastName}</strong>
              </span>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
              {event.title}
            </h1>
            <p className="text-base text-[#172B4D] leading-relaxed whitespace-pre-line bg-[#F5F7FA] p-6 rounded-xl border border-[#D9E2EC]">
              {event.description}
            </p>
          </div>

          {/* Time, Location & Capacity details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#D9E2EC]">
            {/* Schedule */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#627D98]">
                Session Schedule
              </h3>
              <div className="space-y-2 text-sm text-[#172B4D]">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#1769AA] shrink-0" />
                  <span><strong>Starts:</strong> {formatDateTime(event.startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                  <span><strong>Ends:</strong> {formatDateTime(event.endDate)}</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#627D98]">
                Venue & Address
              </h3>
              <div className="flex items-start gap-2 text-sm text-[#172B4D]">
                <MapPin className="h-4 w-4 text-[#DC3545] shrink-0 mt-0.5" />
                <span className="leading-snug">{event.location}</span>
              </div>
              {event.latitude !== null && event.longitude !== null && (
                <span className="text-xs text-[#627D98] block pl-6">
                  Coordinates: {event.latitude?.toFixed(4)}, {event.longitude?.toFixed(4)}
                </span>
              )}
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div className="pt-4 border-t border-[#D9E2EC] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#102A43] flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-600" />
                Registered Participants: {regCount} {capacity ? `/ ${capacity}` : ''}
              </span>
              {percentage !== null && (
                <span className="font-bold text-[#1769AA]">{percentage}% Capacity</span>
              )}
            </div>

            {percentage !== null && (
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${
                    percentage >= 100 ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-[#1769AA]'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Registration Callout Card */}
        <Card className="border-[#1769AA]/30 bg-white shadow-sm">
          <CardHeader className="bg-[#E3F2FD]/50 border-b border-[#D9E2EC]">
            <CardTitle className="text-base flex items-center gap-2 text-[#102A43]">
              <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
              Event Registration Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-[#172B4D] leading-relaxed">
              Participation in certified community drills and workshops requires an authenticated Citizen or Volunteer account.
              Attendance certificates and roster verification are maintained through your platform profile.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/login">
                <Button variant="primary" size="md" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In to Register for this Drill
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="md">
                  Create New Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
