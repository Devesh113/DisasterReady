'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  PlusCircle,
  Search,
  Filter,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Navigation,
  CheckCircle,
} from 'lucide-react';
import { eventService } from '@/services/eventService';
import { Event, EventStatus, CreateEventData, UpdateEventData } from '@/types/event';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { formatDate, formatDateTime, getStatusBadgeStyles } from '@/lib/utils';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/api';

const EVENT_STATUSES: (EventStatus | 'ALL')[] = [
  'ALL',
  'UPCOMING',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
];

export default function AuthorityEventsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    capacity: 50,
    status: 'UPCOMING',
    latitude: null,
    longitude: null,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Query events
  const { data: eventsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['authority-events-list', page, selectedStatus, searchTerm],
    queryFn: () =>
      eventService.getEvents({
        page,
        limit: 10,
        status: selectedStatus === 'ALL' ? undefined : (selectedStatus as EventStatus),
        search: searchTerm.trim() || undefined,
        sortBy: 'startDate',
        sortOrder: 'asc',
      }),
  });

  const events = eventsData?.events || [];
  const pagination = eventsData?.pagination;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateEventData) => eventService.createEvent(data),
    onSuccess: () => {
      setFormSuccess('Mock drill event created and published for civilian registrations.');
      setFormError(null);
      setIsCreateOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['authority-events-list'] });
      queryClient.invalidateQueries({ queryKey: ['authority-dashboard-events'] });
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      setFormError(err.response?.data?.error?.message || 'Failed to create event.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventData }) =>
      eventService.updateEvent(id, data),
    onSuccess: () => {
      setFormSuccess('Event parameters updated successfully.');
      setFormError(null);
      setEditingEvent(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['authority-events-list'] });
      queryClient.invalidateQueries({ queryKey: ['authority-dashboard-events'] });
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      setFormError(err.response?.data?.error?.message || 'Failed to update event.');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      capacity: 50,
      status: 'UPCOMING',
      latitude: null,
      longitude: null,
    });
    setEditingEvent(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: event.startDate ? event.startDate.slice(0, 16) : '',
      endDate: event.endDate ? event.endDate.slice(0, 16) : '',
      capacity: event.capacity ?? 50,
      status: event.status,
      latitude: event.latitude ?? null,
      longitude: event.longitude ?? null,
    });
    setIsCreateOpen(false);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        }));
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
        alert('Could not detect location. Please enter coordinates manually.');
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.startDate || !formData.endDate) {
      setFormError('Start date and end date are both required.');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setFormError('End date must be scheduled after start date.');
      return;
    }

    const payload: CreateEventData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      capacity: formData.capacity ? Number(formData.capacity) : null,
      status: formData.status,
      latitude: formData.latitude !== null && formData.latitude !== undefined ? Number(formData.latitude) : null,
      longitude: formData.longitude !== null && formData.longitude !== undefined ? Number(formData.longitude) : null,
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleCancelEvent = (event: Event) => {
    if (confirm(`Cancel event "${event.title}"? Registered participants will receive automatic notification.`)) {
      updateMutation.mutate({
        id: event.id,
        data: { status: 'CANCELLED' },
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ========================================================
          1. HEADER
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#1769AA] mb-2">
            <Calendar className="h-4 w-4" />
            Civil Protection Drills & Preparedness Exercises
          </div>
          <h1 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Mock Drill Event Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Organize community evacuation rehearsals, manage training session capacity, and monitor attendance rosters.
          </p>
        </div>

        <Button
          size="sm"
          onClick={openCreateModal}
          className="bg-[#102A43] hover:bg-[#172B4D] text-white font-bold gap-2 text-xs shadow-md"
        >
          <PlusCircle className="h-4 w-4" />
          Schedule New Drill
        </Button>
      </div>

      {/* Notifications */}
      {formSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess(null)} className="text-emerald-700 font-bold">&times;</button>
        </div>
      )}

      {/* ========================================================
          2. TOOLBAR
          ======================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search drills by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-50 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {EVENT_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setSelectedStatus(st);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedStatus === st
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Drills' : st}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          3. EVENTS LIST
          ======================================================== */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load mock drills"
          message="Failed to retrieve events from the server."
          onRetry={() => refetch()}
        />
      ) : events.length === 0 ? (
        <EmptyState
          title="No mock drills found"
          description="Schedule a drill or adjust your search filter."
          icon={Calendar}
          actionLabel="Schedule First Drill"
          onAction={openCreateModal}
        />
      ) : (
        <div className="space-y-3">
          {events.map((evt) => {
            const registered = evt.registrationCount ?? 0;
            const cap = evt.capacity ?? 0;
            const percentFilled = cap > 0 ? Math.min(100, Math.round((registered / cap) * 100)) : 0;

            return (
              <Card
                key={evt.id}
                className="border border-slate-200 hover:border-slate-300 transition-all p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeStyles(evt.status)}`}>
                      {evt.status}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                      <Clock className="h-3 w-3 text-[#1769AA]" />
                      {formatDate(evt.startDate)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">
                      {new Date(evt.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(evt.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#102A43] truncate">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                      {evt.location}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Users className="h-3 w-3 text-blue-500" />
                      Roster: {registered} / {cap > 0 ? cap : 'Unlimited'} ({percentFilled}% full)
                    </span>
                  </div>
                </div>

                {/* Operations */}
                <div className="shrink-0 flex items-center sm:flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/authority/registrations?eventId=${evt.id}`}>
                      <Button size="sm" variant="outline" className="text-xs text-[#1769AA] border-blue-200 hover:bg-blue-50 gap-1">
                        <Users className="h-3.5 w-3.5" />
                        Roster ({registered})
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(evt)}
                      className="text-xs text-slate-700 hover:bg-slate-100"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>

                  {evt.status === 'UPCOMING' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelEvent(evt)}
                      className="text-xs text-red-600 hover:bg-red-50"
                    >
                      Cancel Drill
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================
          4. PAGINATION
          ======================================================== */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
          <div>
            Page <span className="font-bold text-[#102A43]">{pagination.page}</span> of{' '}
            <span className="font-bold text-[#102A43]">{pagination.totalPages}</span> ({pagination.total} drills)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage((prev) => prev + 1)}
              className="gap-1 text-xs"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================
          5. CREATE / EDIT EVENT DIALOG
          ======================================================== */}
      <Dialog
        isOpen={isCreateOpen || editingEvent !== null}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingEvent(null);
          resetForm();
        }}
        title={editingEvent ? 'Edit Mock Drill Exercise' : 'Schedule Community Mock Drill'}
        description="Configure exercise venue, timings, attendance quota, and geographic center."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC3545] flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              Drill Title <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g. Citywide Earthquake Evacuation Rehearsal"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-xs"
            />
          </div>

          {/* Location & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 block">
                Assembly Venue / Address <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Community Civic Center & North Grounds"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white font-bold"
              >
                {EVENT_STATUSES.filter((s) => s !== 'ALL').map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              Exercise Scope & Instructions <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detail required citizen gear, staging procedures, and tactical objectives..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]"
            />
          </div>

          {/* Schedule & Capacity */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Max Capacity</label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 100"
                value={formData.capacity ?? ''}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value === '' ? null : Number(e.target.value) })}
                className="text-xs"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Map Staging Coordinates (Optional)</span>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="text-xs text-[#1769AA] font-bold hover:underline inline-flex items-center gap-1"
              >
                <Navigation className="h-3 w-3" />
                {detectingLocation ? 'Detecting...' : 'Detect Coordinates'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                step="any"
                placeholder="Latitude (e.g. 28.6139)"
                value={formData.latitude ?? ''}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value === '' ? null : Number(e.target.value) })}
                className="text-xs"
              />
              <Input
                type="number"
                step="any"
                placeholder="Longitude (e.g. 77.2090)"
                value={formData.longitude ?? ''}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value === '' ? null : Number(e.target.value) })}
                className="text-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingEvent(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending}
              className="bg-[#102A43] hover:bg-[#172B4D] text-white font-bold"
            >
              {editingEvent ? 'Save Modifications' : 'Publish Mock Drill'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
