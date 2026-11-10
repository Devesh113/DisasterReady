'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  AlertCircle,
  RefreshCw,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { eventService } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import { Event, EventAttendee } from '@/types/event';
import { formatDate } from '@/lib/utils';

function RegistrationsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const urlEventId = searchParams.get('eventId');

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 1. Fetch available events for the dropdown selector
  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useQuery({
    queryKey: ['authority', 'events', 'dropdown-list'],
    queryFn: () => eventService.getEvents({ limit: 50, sortBy: 'startDate', sortOrder: 'desc' }),
  });

  const events: Event[] = useMemo(() => eventsData?.events || [], [eventsData?.events]);

  // Automatically select event if urlEventId is provided or pick the first available
  useEffect(() => {
    if (urlEventId && events.some((e) => e.id === urlEventId)) {
      setSelectedEventId(urlEventId);
    } else if (!selectedEventId && events.length > 0) {
      // Prefer an event organized by the user if available, otherwise first event
      const userOrganized = events.find((e) => e.organizerId === user?.id);
      setSelectedEventId(userOrganized ? userOrganized.id : events[0].id);
    }
  }, [urlEventId, events, selectedEventId, user?.id]);

  const currentEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [events, selectedEventId]
  );

  const isUserOrganizerOrAdmin = useMemo(() => {
    if (!currentEvent || !user) return false;
    return user.role === 'ADMIN' || currentEvent.organizerId === user.id;
  }, [currentEvent, user]);

  // 2. Fetch attendee registrations for selected event
  const {
    data: attendeesData,
    isLoading: isLoadingAttendees,
    isFetching: isFetchingAttendees,
    error: attendeesError,
    refetch: refetchAttendees,
  } = useQuery({
    queryKey: ['authority', 'event-attendees', selectedEventId, page, statusFilter],
    queryFn: () =>
      eventService.getEventAttendees(selectedEventId, {
        page,
        limit: pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
    enabled: Boolean(selectedEventId),
  });

  const attendees: EventAttendee[] = useMemo(
    () => attendeesData?.registrations || [],
    [attendeesData?.registrations]
  );
  const pagination = attendeesData?.pagination;

  // Filter client-side by search query (name or email)
  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees;
    const q = searchQuery.toLowerCase();
    return attendees.filter(
      (att) =>
        att.user.firstName.toLowerCase().includes(q) ||
        att.user.lastName.toLowerCase().includes(q) ||
        att.user.email.toLowerCase().includes(q) ||
        (att.user.phone && att.user.phone.includes(q))
    );
  }, [attendees, searchQuery]);

  // Capacity calculations
  const totalCapacity = currentEvent?.capacity || null;
  const registeredCount = currentEvent?.registrationCount ?? pagination?.total ?? attendees.length;
  const capacityPercent =
    totalCapacity && totalCapacity > 0
      ? Math.min(100, Math.round((registeredCount / totalCapacity) * 100))
      : null;

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredAttendees.length || !currentEvent) return;
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Registration Status', 'Registered At'];
    const rows = filteredAttendees.map((a) => [
      `"${a.user.firstName}"`,
      `"${a.user.lastName}"`,
      `"${a.user.email}"`,
      `"${a.user.phone || 'N/A'}"`,
      `"${a.status}"`,
      `"${new Date(a.createdAt).toISOString()}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `drill-roster-${currentEvent.id.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
            Mock Drill Attendee Rosters
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track community drill registration, attendance check-ins, and capacity quotas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchAttendees()}
            disabled={isFetchingAttendees || !selectedEventId}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingAttendees ? 'animate-spin' : ''}`} />
            Refresh Roster
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredAttendees.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-[#1769AA] rounded-lg hover:bg-[#125386] transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Event Selection & Context Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-xl">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Select Mock Drill / Training Session
            </label>
            {isLoadingEvents ? (
              <div className="h-10 bg-slate-100 animate-pulse rounded-lg" />
            ) : events.length === 0 ? (
              <div className="text-sm text-slate-500 italic">No mock drills available.</div>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setPage(1);
                }}
                className="w-full text-sm font-medium text-[#172B4D] bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
              >
                {events.map((evt) => {
                  const isMine = evt.organizerId === user?.id;
                  return (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.status}) — {new Date(evt.startDate).toLocaleDateString()}
                      {isMine ? ' [Organized by You]' : ''}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {currentEvent && (
            <div className="flex items-center gap-3 self-end md:self-center">
              <Link
                href={`/authority/events`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769AA] hover:text-[#125386] bg-blue-50 px-3 py-2 rounded-lg border border-blue-100"
              >
                <Calendar className="w-3.5 h-3.5" />
                Manage Drill in Calendar
              </Link>
            </div>
          )}
        </div>

        {/* Selected Drill Quick Details */}
        {currentEvent && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-slate-500 block">Location</span>
              <span className="text-sm font-semibold text-[#172B4D] truncate block">
                {currentEvent.location}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Schedule Window</span>
              <span className="text-sm font-semibold text-[#172B4D]">
                {formatDate(currentEvent.startDate)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Drill Status</span>
              <span
                className={`inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  currentEvent.status === 'UPCOMING'
                    ? 'bg-blue-50 text-[#1769AA] border border-blue-200'
                    : currentEvent.status === 'ONGOING'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : currentEvent.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {currentEvent.status}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Organizer</span>
              <span className="text-sm font-semibold text-[#172B4D]">
                {currentEvent.organizer
                  ? `${currentEvent.organizer.firstName} ${currentEvent.organizer.lastName}`
                  : 'Emergency Authority'}
                {currentEvent.organizerId === user?.id && (
                  <span className="ml-1.5 text-[11px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                    You
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      {currentEvent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Registered</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769AA] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#172B4D]">
                {pagination?.total ?? attendees.length}
              </span>
              <span className="text-xs text-slate-500">citizens</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Quota Capacity</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#172B4D]">
                {totalCapacity ? totalCapacity : 'Unlimited'}
              </span>
              {totalCapacity && (
                <span className="text-xs text-slate-500">
                  ({Math.max(0, totalCapacity - (pagination?.total || 0))} slots remaining)
                </span>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Capacity Filled</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#172B4D]">
                  {capacityPercent !== null ? `${capacityPercent}%` : 'N/A'}
                </span>
              </div>
              {capacityPercent !== null && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      capacityPercent > 90
                        ? 'bg-rose-500'
                        : capacityPercent > 70
                        ? 'bg-amber-500'
                        : 'bg-[#1769AA]'
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Access Scope</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm font-bold text-[#172B4D]">
                {user?.role === 'ADMIN'
                  ? 'Administrator'
                  : isUserOrganizerOrAdmin
                  ? 'Organizing Authority'
                  : 'Observer (Read-Only)'}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                {isUserOrganizerOrAdmin
                  ? 'Full roster authorization'
                  : 'Restricted roster access'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Roster Controls: Filter & Search */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search attendee by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {(['ALL', 'REGISTERED', 'ATTENDED', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Authorization Forbidden Alert if not organizer or admin */}
      {attendeesError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <h4 className="font-bold text-amber-900">Attendee Roster Authorization Restriction</h4>
              <p className="mt-1 text-amber-800">
                Backend security policy strictly restricts attendee lists to the designated drill organizer or System Administrators.
                {currentEvent && (
                  <span className="block mt-1 font-medium">
                    Current Drill Organizer:{' '}
                    {currentEvent.organizer
                      ? `${currentEvent.organizer.firstName} ${currentEvent.organizer.lastName} (${currentEvent.organizer.role || 'Authority'})`
                      : 'Another Authority Officer'}
                  </span>
                )}
              </p>
              <p className="mt-2 text-xs text-amber-700">
                To view attendee names and contact details, please switch to a drill you have organized, or log in with an Administrator credential.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Attendee Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Citizen Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Roster Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoadingAttendees ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-slate-200 rounded w-32" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-slate-200 rounded w-44" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-slate-200 rounded w-28" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-6 bg-slate-200 rounded-full w-20" />
                    </td>
                  </tr>
                ))
              ) : filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No registered attendees found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'No attendees match your search query.'
                        : 'No citizens have registered for this mock drill yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAttendees.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#172B4D]">
                      {att.user.firstName} {att.user.lastName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      {att.user.email}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {att.user.phone || <span className="text-slate-400 italic">Not provided</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {formatDate(att.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          att.status === 'ATTENDED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : att.status === 'REGISTERED'
                            ? 'bg-blue-50 text-[#1769AA] border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {att.status === 'ATTENDED' && <CheckCircle2 className="w-3 h-3" />}
                        {att.status === 'REGISTERED' && <Clock className="w-3 h-3" />}
                        {att.status === 'CANCELLED' && <XCircle className="w-3 h-3" />}
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total}{' '}
              total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthorityRegistrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1769AA] mb-3" />
          <p className="font-semibold text-slate-700">Loading Attendee Rosters...</p>
        </div>
      }
    >
      <RegistrationsContent />
    </Suspense>
  );
}
