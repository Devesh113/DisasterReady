'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { eventService } from '@/services/eventService';
import { EventStatus } from '@/types/event';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { formatDate, formatDateTime, getStatusBadgeStyles } from '@/lib/utils';

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-events', page, selectedStatus, searchTerm],
    queryFn: () =>
      eventService.getEvents({
        page,
        limit: 9,
        status: selectedStatus !== 'ALL' ? (selectedStatus as EventStatus) : undefined,
        search: searchTerm.trim() || undefined,
        sortBy: 'startDate',
        sortOrder: 'asc',
      }),
  });

  const events = data?.events || [];
  const pagination = data?.pagination;

  const statuses = ['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED'];

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="rounded-2xl bg-[#102A43] text-white p-8 sm:p-10 shadow-lg space-y-4">
          <Badge variant="brand" className="bg-white/10 text-blue-200 border-white/20">
            Civil Preparedness Drills
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Mock Drills, Training & Community Workshops
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Hands-on emergency mock drills, CPR/first-aid workshops, and school evacuation simulations organized by certified disaster management authorities and partner institutions.
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
            <span>Open to all citizens and community volunteers. Capacity is limited per session.</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
              <Input
                placeholder="Search events by title, description or location..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-[#627D98] mr-1">Status:</span>
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setSelectedStatus(st);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-[#1769AA] text-white shadow-xs'
                      : 'bg-[#F5F7FA] text-[#172B4D] hover:bg-[#E3F2FD] hover:text-[#1769AA]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to Load Events"
            message="Could not retrieve scheduled mock drills from the backend service. Please check your connection."
            onRetry={() => refetch()}
          />
        ) : events.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => {
                const isUpcoming = evt.status === 'UPCOMING';
                const regCount = evt.registrationCount ?? 0;
                const capacity = evt.capacity ?? null;
                const isFull = capacity ? regCount >= capacity : false;

                return (
                  <Card
                    key={evt.id}
                    className="flex flex-col justify-between hover:border-[#1769AA] hover:shadow-md transition-all group"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="brand">{evt.status}</Badge>
                        <span className="text-xs text-[#627D98] flex items-center gap-1 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-[#1769AA]" />
                          {formatDate(evt.startDate)}
                        </span>
                      </div>

                      <CardTitle className="text-lg group-hover:text-[#1769AA] transition-colors line-clamp-1">
                        {evt.title}
                      </CardTitle>

                      <CardDescription className="line-clamp-2 mt-2 text-xs leading-relaxed">
                        {evt.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2.5 text-xs text-[#172B4D]">
                      <div className="flex items-start gap-2 text-[#627D98]">
                        <MapPin className="h-4 w-4 text-[#1769AA] shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-[#172B4D] font-medium">{evt.location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[#627D98]">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>
                          {formatDateTime(evt.startDate)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#D9E2EC]">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Users className="h-4 w-4 text-emerald-600" />
                          <span>
                            {regCount} {capacity ? `/ ${capacity}` : 'registered'}
                          </span>
                        </span>

                        {isFull ? (
                          <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            Capacity Full
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Seats Open
                          </span>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="border-t border-[#D9E2EC] pt-4">
                      <Link href={`/events/${evt.id}`} className="w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center gap-2 group-hover:bg-[#1769AA] group-hover:text-white transition-all"
                        >
                          <span>View Drill Details</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#D9E2EC] pt-6">
                <div className="text-xs text-[#627D98]">
                  Showing page <strong className="text-[#102A43]">{pagination.page}</strong> of{' '}
                  <strong className="text-[#102A43]">{pagination.totalPages}</strong> ({pagination.total} total drills)
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
            icon={Calendar}
            title="No Mock Drills or Training Events Found"
            description="No scheduled drills match your search filters. Check back soon or reset filters."
            actionLabel="Reset Search"
            onAction={() => {
              setSearchTerm('');
              setSelectedStatus('ALL');
            }}
          />
        )}
      </div>
    </div>
  );
}
