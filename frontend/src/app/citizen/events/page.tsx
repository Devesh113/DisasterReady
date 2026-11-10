'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { eventService } from '@/services/eventService';
import { registrationService } from '@/services/registration.service';
import { EventStatus, Event } from '@/types/event';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { formatDate, formatDateTime } from '@/lib/utils';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/api';

export default function CitizenEventsPage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-registrations'>('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState<number>(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // 1. Fetch all public events
  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ['citizen-events-list', page, searchTerm],
    queryFn: () =>
      eventService.getEvents({
        page,
        limit: 9,
        search: searchTerm.trim() || undefined,
        sortBy: 'startDate',
        sortOrder: 'asc',
      }),
  });

  // 2. Fetch my registrations
  const {
    data: myRegData,
    isLoading: myRegLoading,
    isError: myRegError,
    refetch: refetchMyRegs,
  } = useQuery({
    queryKey: ['citizen-my-registrations'],
    queryFn: () => registrationService.getMyRegistrations({ limit: 50 }),
  });

  const events = eventsData?.events || [];
  const pagination = eventsData?.pagination;
  const myRegistrations = myRegData?.registrations || [];

  // Map of event IDs user is registered for
  const registeredEventIds = new Set(
    myRegistrations
      .filter((r) => r.status === 'REGISTERED')
      .map((r) => r.eventId)
  );

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (eventId: string) => registrationService.registerForEvent(eventId),
    onSuccess: () => {
      setActionSuccess('Successfully registered for the mock drill session!');
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['citizen-events-list'] });
      queryClient.invalidateQueries({ queryKey: ['citizen-my-registrations'] });
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const msg = err.response?.data?.error?.message || 'Failed to register for event.';
      setActionError(msg);
      setActionSuccess(null);
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (eventId: string) => registrationService.cancelEventRegistration(eventId),
    onSuccess: () => {
      setActionSuccess('Your drill registration has been cancelled.');
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['citizen-events-list'] });
      queryClient.invalidateQueries({ queryKey: ['citizen-my-registrations'] });
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const msg = err.response?.data?.error?.message || 'Failed to cancel registration.';
      setActionError(msg);
      setActionSuccess(null);
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Mock Drills & Preparedness Workshops
          </h1>
          <p className="text-xs sm:text-sm text-[#627D98] mt-1">
            Register for practical disaster evacuation drills, school workshops, and civil defense safety sessions.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center rounded-xl bg-slate-200/70 p-1">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-white text-[#102A43] shadow-xs'
                : 'text-[#627D98] hover:text-[#102A43]'
            }`}
          >
            Available Drills ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('my-registrations')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my-registrations'
                ? 'bg-white text-[#102A43] shadow-xs'
                : 'text-[#627D98] hover:text-[#102A43]'
            }`}
          >
            <span>My Registrations</span>
            {myRegistrations.length > 0 && (
              <span className="h-4 px-1.5 rounded-full bg-[#1769AA] text-white text-[10px] font-bold inline-flex items-center">
                {myRegistrations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            &times;
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#DC3545] shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-900 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* ========================================================
          TAB 1: BROWSE ALL DRILLS
          ======================================================== */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-xs">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
              <Input
                placeholder="Search drills by title, venue or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : eventsError ? (
            <ErrorState
              title="Could not load events"
              message="Failed to fetch drill events from the API."
              onRetry={() => refetchEvents()}
            />
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => {
                const isRegistered = registeredEventIds.has(evt.id);
                const regCount = evt.registrationCount ?? 0;
                const capacity = evt.capacity ?? null;
                const isFull = capacity ? regCount >= capacity : false;
                const isUpcoming = evt.status === 'UPCOMING';

                return (
                  <Card key={evt.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="brand">{evt.status}</Badge>
                        <span className="text-xs text-[#627D98] flex items-center gap-1 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-[#1769AA]" />
                          {formatDate(evt.startDate)}
                        </span>
                      </div>

                      <CardTitle className="text-base text-[#102A43] line-clamp-1">{evt.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1 text-xs leading-relaxed">
                        {evt.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2 text-xs text-[#172B4D]">
                      <div className="flex items-start gap-2 text-[#627D98]">
                        <MapPin className="h-4 w-4 text-[#1769AA] shrink-0 mt-0.5" />
                        <span className="line-clamp-1 font-medium text-[#172B4D]">{evt.location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[#627D98]">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>{formatDateTime(evt.startDate)}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#D9E2EC]">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Users className="h-4 w-4 text-emerald-600" />
                          <span>
                            {regCount} {capacity ? `/ ${capacity}` : ''} registered
                          </span>
                        </span>

                        {isFull ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            Capacity Full
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Seats Open
                          </span>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="border-t border-[#D9E2EC] pt-4 gap-2">
                      {isRegistered ? (
                        <div className="w-full flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Registered
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(evt.id)}
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isFull || !isUpcoming}
                          isLoading={registerMutation.isPending}
                          onClick={() => registerMutation.mutate(evt.id)}
                          className="w-full justify-center text-xs"
                        >
                          {isFull ? 'Session Full' : !isUpcoming ? 'Session Closed' : 'Register Now'}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No Drills Found"
              description="No community mock drills match your current search."
              actionLabel="Reset Search"
              onAction={() => setSearchTerm('')}
            />
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#D9E2EC] pt-4">
              <div className="text-xs text-[#627D98]">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} drills)
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
      )}

      {/* ========================================================
          TAB 2: MY REGISTRATIONS
          ======================================================== */}
      {activeTab === 'my-registrations' && (
        <div className="space-y-4">
          {myRegLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : myRegError ? (
            <ErrorState
              title="Failed to Load Registrations"
              message="Could not retrieve your event registrations."
              onRetry={() => refetchMyRegs()}
            />
          ) : myRegistrations.length > 0 ? (
            <div className="space-y-3">
              {myRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="rounded-xl border border-[#D9E2EC] bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {reg.status}
                      </span>
                      <span className="text-xs text-[#627D98]">
                        Registered on {formatDate(reg.createdAt)}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-[#102A43]">
                      {reg.event?.title || 'Mock Drill Session'}
                    </h3>

                    {reg.event && (
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#627D98] pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-[#1769AA]" />
                          {formatDateTime(reg.event.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#DC3545]" />
                          {reg.event.location}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(reg.eventId)}
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Cancel Registration
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={UserCheck}
              title="You Have No Active Drill Registrations"
              description="Register for an upcoming mock drill from the available sessions to practice emergency evacuation."
              actionLabel="Browse Available Drills"
              onAction={() => setActiveTab('browse')}
            />
          )}
        </div>
      )}
    </div>
  );
}
