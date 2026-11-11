'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Radio,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Navigation,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { alertService } from '@/services/alertService';
import { disasterService } from '@/services/disasterService';
import {
  Alert,
  AlertSeverity,
  AlertStatus,
  CreateAlertData,
  UpdateAlertData,
} from '@/types/alert';
import { formatDate } from '@/lib/utils';

export default function AdminAlertsPage() {
  const queryClient = useQueryClient();

  // Filters & State
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<Alert | null>(null);
  const [viewingAlert, setViewingAlert] = useState<Alert | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    disasterId: string;
    title: string;
    description: string;
    severity: AlertSeverity;
    status: AlertStatus;
    latitude: string;
    longitude: string;
    radius: string;
    expiresAt: string;
  }>({
    disasterId: '',
    title: '',
    description: '',
    severity: 'HIGH',
    status: 'ACTIVE',
    latitude: '28.6139',
    longitude: '77.2090',
    radius: '25',
    expiresAt: '',
  });

  // Query alerts
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-alerts-list', page, severityFilter, statusFilter, searchQuery],
    queryFn: () =>
      alertService.getAlerts({
        page,
        limit: 10,
        severity: severityFilter === 'ALL' ? undefined : (severityFilter as AlertSeverity),
        status: statusFilter === 'ALL' ? undefined : (statusFilter as AlertStatus),
        search: searchQuery.trim() || undefined,
      }),
  });

  // Query disaster catalog for UUID dropdown
  const { data: disastersData } = useQuery({
    queryKey: ['admin-disasters-dropdown'],
    queryFn: () => disasterService.getDisasters({ limit: 100 }),
  });

  const alerts: Alert[] = data?.alerts || [];
  const pagination = data?.pagination;
  const disasters = disastersData?.disasters || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateAlertData) => alertService.createAlert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts-list'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Failed to issue alert advisory');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAlertData }) =>
      alertService.updateAlert(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts-list'] });
      setEditingAlert(null);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Failed to update alert advisory');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertService.updateAlert(id, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts-list'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to cancel alert');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertService.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts-list'] });
      setDeletingAlert(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete alert');
    },
  });

  const resetForm = () => {
    setFormData({
      disasterId: disasters.length > 0 ? disasters[0].id : '',
      title: '',
      description: '',
      severity: 'HIGH',
      status: 'ACTIVE',
      latitude: '28.6139',
      longitude: '77.2090',
      radius: '25',
      expiresAt: '',
    });
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    if (disasters.length > 0) {
      setFormData((prev) => ({ ...prev, disasterId: disasters[0].id }));
    }
    setIsCreateOpen(true);
  };

  const openEditModal = (a: Alert) => {
    setEditingAlert(a);
    setFormData({
      disasterId: a.disasterId,
      title: a.title,
      description: a.description,
      severity: a.severity,
      status: a.status,
      latitude: a.latitude != null ? a.latitude.toString() : '28.6139',
      longitude: a.longitude != null ? a.longitude.toString() : '77.2090',
      radius: a.radius != null ? a.radius.toString() : '25',
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 16) : '',
    });
    setFormError(null);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      () => {
        setFormError('Unable to detect GPS position. Please enter manually.');
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const rad = parseFloat(formData.radius);

    if (!formData.title.trim()) {
      setFormError('Alert headline is required.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Advisory description is required.');
      return;
    }
    if (!formData.disasterId) {
      setFormError('Please select a valid linked disaster from the catalog.');
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude must be between -90 and 90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError('Longitude must be between -180 and 180.');
      return;
    }

    const payload: CreateAlertData = {
      disasterId: formData.disasterId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      severity: formData.severity,
      status: formData.status,
      latitude: lat,
      longitude: lng,
      radius: isNaN(rad) ? 25 : rad,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    };

    if (editingAlert) {
      updateMutation.mutate({ id: editingAlert.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-xs font-semibold text-[#DC3545] mb-2 border border-rose-200">
            <Radio className="w-3.5 h-3.5" />
            Civil Protection Broadcast Studio
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">
            Emergency Alert & Warning Center
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Dispatch, edit, and resolve official multi-channel disaster advisories with spatial danger perimeters.
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
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#DC3545] hover:bg-[#B02A37] rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Issue New Alert
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alert by headline, hazard description, or zone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Severity:
            </span>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical (Red)</option>
              <option value="HIGH">High (Orange)</option>
              <option value="MODERATE">Moderate (Yellow)</option>
              <option value="LOW">Low (Green)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="RESOLVED">Resolved Only</option>
              <option value="EXPIRED">Expired Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Headline</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Broadcast Status</th>
                <th className="py-3 px-4">Danger Zone</th>
                <th className="py-3 px-4">Broadcast Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-44" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200 rounded-full w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200 rounded-full w-16" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-8 bg-slate-200 rounded w-28 ml-auto" /></td>
                  </tr>
                ))
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Radio className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No alert broadcasts found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try modifying your search or severity criteria.'
                        : 'Issue your first civil advisory broadcast above.'}
                    </p>
                  </td>
                </tr>
              ) : (
                alerts.map((al) => (
                  <tr key={al.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-xs text-[#172B4D]">{al.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                        {al.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          al.severity === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : al.severity === 'HIGH'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : al.severity === 'MODERATE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {al.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          al.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : al.status === 'CANCELLED'
                            ? 'bg-blue-50 text-[#1769AA] border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {al.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Radius {al.radius || 10} km</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {al.latitude != null ? al.latitude.toFixed(3) : '—'},{' '}
                        {al.longitude != null ? al.longitude.toFixed(3) : '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDate(al.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingAlert(al)}
                          className="p-1.5 text-slate-500 hover:text-[#1769AA] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {al.status === 'ACTIVE' && (
                          <button
                            onClick={() => resolveMutation.mutate(al.id)}
                            disabled={resolveMutation.isPending}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Resolve Alert"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(al)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Advisory"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingAlert(al)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Permanently Delete Alert"
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

      {/* 4. Create / Edit Alert Modal */}
      {(isCreateOpen || editingAlert) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#102A43]">
                  {editingAlert ? 'Edit Civil Advisory' : 'Dispatch Civil Defense Warning'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-channel hazard broadcast across municipal sirens and push notifications.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingAlert(null);
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

              {/* Linked Disaster */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Linked Disaster Taxonomy *
                </label>
                <select
                  value={formData.disasterId}
                  onChange={(e) => setFormData({ ...formData, disasterId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                >
                  {disasters.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Advisory Headline *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Severe Flood Warning — Yamuna Basin Lowlands"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                />
              </div>

              {/* Severity & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Threat Severity *
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value as AlertSeverity })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Danger)</option>
                    <option value="HIGH">HIGH (Severe Hazard)</option>
                    <option value="MODERATE">MODERATE (Elevated Advisory)</option>
                    <option value="LOW">LOW (Informational)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lifecycle Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as AlertStatus })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>
              </div>

              {/* Coordinates & Radius */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Radius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.radius}
                    onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769AA] hover:text-[#125386]"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Pinpointing GPS...' : 'Use Current Coordinates'}
                </button>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Advisory Content & Citizen Directives *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Immediate safety directives, high-ground evacuation points, avoiding bridges..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* Expiration Time */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Scheduled Expiry Window (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingAlert(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#DC3545] hover:bg-[#B02A37] rounded-lg transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Broadcasting...
                    </span>
                  ) : editingAlert ? (
                    'Update Advisory'
                  ) : (
                    'Broadcast Warning'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Alert Confirmation Dialog */}
      {deletingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-[#102A43]">
                Confirm Permanent Alert Purge
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently purge the warning{' '}
              <span className="font-bold text-slate-900">&ldquo;{deletingAlert.title}&rdquo;</span>?
              This is an administrative action (DELETE /api/v1/alerts/:id) and cannot be undone.
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => setDeletingAlert(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingAlert.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-[#DC3545] hover:bg-[#B02A37] rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. View Alert Details Modal */}
      {viewingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  {viewingAlert.severity} ADVISORY
                </span>
                <h3 className="text-xl font-bold text-[#102A43] mt-0.5">
                  {viewingAlert.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingAlert(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Broadcast Status</span>
                <span className="font-bold text-[#102A43]">{viewingAlert.status}</span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Hazard Danger Perimeter</span>
                <span className="font-medium text-slate-800">
                  {viewingAlert.radius || 10} km radius
                </span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Coordinates</span>
                <span className="font-mono text-slate-800">
                  {viewingAlert.latitude != null ? viewingAlert.latitude : '—'},{' '}
                  {viewingAlert.longitude != null ? viewingAlert.longitude : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-1">Directives & Advisory Body</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {viewingAlert.description}
                </p>
              </div>
              <div className="flex justify-between text-slate-500 pt-1">
                <span>Issued: {formatDate(viewingAlert.createdAt)}</span>
                {viewingAlert.expiresAt && (
                  <span>Expires: {formatDate(viewingAlert.expiresAt)}</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingAlert(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
