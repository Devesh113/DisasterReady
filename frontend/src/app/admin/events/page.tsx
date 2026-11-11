'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Users,
  Eye,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
} from 'lucide-react';
import { eventService } from '@/services/eventService';
import {
  Event,
  EventStatus,
  CreateEventData,
  UpdateEventData,
  EventAttendee,
} from '@/types/event';
import { formatDate } from '@/lib/utils';

export default function AdminEventsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [rosterEvent, setRosterEvent] = useState<Event | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    capacity: string;
    status: EventStatus;
    latitude: string;
    longitude: string;
  }>({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    capacity: '100',
    status: 'UPCOMING',
    latitude: '28.6139',
    longitude: '77.2090',
  });

  // Query events
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-events-list', page, selectedStatus, searchQuery],
    queryFn: () =>
      eventService.getEvents({
        page,
        limit: 10,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: searchQuery.trim() || undefined,
        sortBy: 'startDate',
        sortOrder: 'desc',
      }),
  });

  // Query roster for selected event (ADMIN has universal authorization)
  const { data: rosterData, isLoading: isLoadingRoster } = useQuery({
    queryKey: ['admin-event-roster', rosterEvent?.id],
    queryFn: () => eventService.getEventAttendees(rosterEvent!.id, { limit: 50 }),
    enabled: Boolean(rosterEvent),
  });

  const events: Event[] = data?.events || [];
  const pagination = data?.pagination;
  const attendees: EventAttendee[] = rosterData?.registrations || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateEventData) => eventService.createEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events-list'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Failed to schedule mock drill');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEventData }) =>
      eventService.updateEvent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events-list'] });
      setEditingEvent(null);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Failed to update mock drill');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events-list'] });
      setDeletingEvent(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete drill');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      capacity: '100',
      status: 'UPCOMING',
      latitude: '28.6139',
      longitude: '77.2090',
    });
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (evt: Event) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      description: evt.description,
      location: evt.location,
      startDate: evt.startDate ? evt.startDate.slice(0, 16) : '',
      endDate: evt.endDate ? evt.endDate.slice(0, 16) : '',
      capacity: evt.capacity ? evt.capacity.toString() : '',
      status: evt.status,
      latitude: evt.latitude ? evt.latitude.toString() : '28.6139',
      longitude: evt.longitude ? evt.longitude.toString() : '77.2090',
    });
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Drill title is required.');
      return;
    }
    if (!formData.location.trim()) {
      setFormError('Venue / location is required.');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setFormError('Start date and end date are both required.');
      return;
    }

    const payload: CreateEventData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
      status: formData.status,
      latitude: parseFloat(formData.latitude) || null,
      longitude: parseFloat(formData.longitude) || null,
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-xs font-semibold text-purple-700 mb-2 border border-purple-200">
            <Calendar className="w-3.5 h-3.5" />
            Civil Defense Training Operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">
            Community Mock Drills & Exercises
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Schedule city-wide evacuation drills, manage citizen capacity quotas, and inspect universal attendee rosters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#102A43] hover:bg-[#163859] rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Schedule Mock Drill
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search drill by title, venue, or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</span>
          {(['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedStatus(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedStatus === st
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Drill Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Location / Venue</th>
                <th className="py-3 px-4">Scheduled Window</th>
                <th className="py-3 px-4">Capacity Quota</th>
                <th className="py-3 px-4">Organizer</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-44" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200 rounded-full w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-8 bg-slate-200 rounded w-28 ml-auto" /></td>
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No mock drills located</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try modifying your search or status filter.'
                        : 'Schedule your first community mock drill above.'}
                    </p>
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-xs text-[#172B4D]">{evt.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                        {evt.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.status === 'UPCOMING'
                            ? 'bg-blue-50 text-[#1769AA] border border-blue-200'
                            : evt.status === 'ONGOING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : evt.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {evt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDate(evt.startDate)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#172B4D]">
                      {evt.capacity ? `${evt.capacity} slots` : 'Unlimited'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {evt.organizer
                        ? `${evt.organizer.firstName} ${evt.organizer.lastName}`
                        : 'EOC Command'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setRosterEvent(evt)}
                          className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Universal Roster Access"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(evt)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Drill"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingEvent(evt)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Permanently Delete Drill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* 4. Create / Edit Event Modal */}
      {(isCreateOpen || editingEvent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#102A43]">
                  {editingEvent ? 'Edit Mock Drill' : 'Schedule Community Mock Drill'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Plan preparation exercises for citizen participation and emergency teams.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingEvent(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Drill Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. City-Wide High-Rise Earthquake Evacuation Drill"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* Location & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Venue / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Central Stadium Ground"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Participant Capacity Quota
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g. 200"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Start Window *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    End Window *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Drill Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as EventStatus })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description & Instructions
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Required safety attire, check-in procedure, participating rescue squads..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#102A43] hover:bg-[#163859] rounded-lg transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    'Saving...'
                  ) : editingEvent ? (
                    'Update Drill'
                  ) : (
                    'Schedule Drill'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Universal Attendee Roster Modal (ADMIN Access) */}
      {rosterEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                  Universal Attendee Roster (Administrator Access)
                </span>
                <h3 className="text-lg font-bold text-[#102A43] mt-0.5">
                  {rosterEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setRosterEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600 pb-2 border-b border-slate-100">
              <span>Quota: <strong>{rosterEvent.capacity || 'Unlimited'}</strong></span>
              <span>•</span>
              <span>Registered: <strong>{attendees.length}</strong></span>
              <span>•</span>
              <span>Venue: <strong>{rosterEvent.location}</strong></span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-3">Citizen Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingRoster ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1" />
                        Loading attendee roster...
                      </td>
                    </tr>
                  ) : attendees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        No citizens have registered for this drill yet.
                      </td>
                    </tr>
                  ) : (
                    attendees.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-[#172B4D]">
                          {att.user.firstName} {att.user.lastName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {att.user.email}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {att.user.phone || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1769AA] border border-blue-200">
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setRosterEvent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Event Confirmation Dialog */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-[#102A43]">
                Confirm Permanent Drill Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the mock drill{' '}
              <span className="font-bold text-slate-900">&ldquo;{deletingEvent.title}&rdquo;</span>?
              This executes DELETE /api/v1/events/:id (Admin exclusive).
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => setDeletingEvent(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingEvent.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-[#DC3545] hover:bg-[#B02A37] rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
