'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Radio,
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Eye,
  Info,
} from 'lucide-react';
import { alertService } from '@/services/alertService';
import { disasterService } from '@/services/disasterService';
import { Alert, AlertSeverity, AlertStatus, CreateAlertData, UpdateAlertData } from '@/types/alert';
import { Disaster } from '@/types/disaster';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { formatDate, formatDateTime, getSeverityBadgeStyles, timeAgo } from '@/lib/utils';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/api';

const SEVERITIES: AlertSeverity[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
const STATUSES: AlertStatus[] = ['ACTIVE', 'EXPIRED', 'CANCELLED'];

export default function AuthorityAlertsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [inspectingAlert, setInspectingAlert] = useState<Alert | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateAlertData>({
    title: '',
    description: '',
    severity: 'HIGH',
    status: 'ACTIVE',
    disasterId: '',
    latitude: null,
    longitude: null,
    radius: 25,
    expiresAt: null,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Query Alerts
  const { data: alertsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['authority-alerts-list', page, filterSeverity, filterStatus, searchTerm],
    queryFn: () =>
      alertService.getAlerts({
        page,
        limit: 10,
        severity: filterSeverity === 'ALL' ? undefined : (filterSeverity as AlertSeverity),
        status: filterStatus === 'ALL' ? undefined : (filterStatus as AlertStatus),
        search: searchTerm.trim() || undefined,
      }),
  });

  // Query Disaster Catalog for disasterId selection
  const { data: disastersData } = useQuery({
    queryKey: ['authority-disasters-dropdown'],
    queryFn: () => disasterService.getDisasters({ limit: 50 }),
  });

  const alerts = alertsData?.alerts || [];
  const pagination = alertsData?.pagination;
  const disasters = disastersData?.disasters || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateAlertData) => alertService.createAlert(data),
    onSuccess: () => {
      setFormSuccess('Emergency alert broadcasted successfully to all active citizen units!');
      setFormError(null);
      setIsCreateOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['authority-alerts-list'] });
      queryClient.invalidateQueries({ queryKey: ['authority-dashboard-alerts'] });
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      setFormError(err.response?.data?.error?.message || 'Failed to broadcast emergency alert.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertData }) =>
      alertService.updateAlert(id, data),
    onSuccess: () => {
      setFormSuccess('Alert advisory parameters updated successfully.');
      setFormError(null);
      setEditingAlert(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['authority-alerts-list'] });
      queryClient.invalidateQueries({ queryKey: ['authority-dashboard-alerts'] });
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      setFormError(err.response?.data?.error?.message || 'Failed to update alert.');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      severity: 'HIGH',
      status: 'ACTIVE',
      disasterId: disasters[0]?.id || '',
      latitude: null,
      longitude: null,
      radius: 25,
      expiresAt: null,
    });
    setEditingAlert(null);
  };

  const openCreateModal = () => {
    resetForm();
    if (disasters.length > 0 && !formData.disasterId) {
      setFormData((prev) => ({ ...prev, disasterId: disasters[0].id }));
    }
    setIsCreateOpen(true);
  };

  const openEditModal = (alert: Alert) => {
    setEditingAlert(alert);
    setFormData({
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      status: alert.status,
      disasterId: alert.disasterId,
      latitude: alert.latitude ?? null,
      longitude: alert.longitude ?? null,
      radius: alert.radius ?? null,
      expiresAt: alert.expiresAt ? alert.expiresAt.split('T')[0] : null,
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
      (err) => {
        console.warn('Geolocation error:', err);
        setDetectingLocation(false);
        alert('Could not detect location. Please enter coordinates manually.');
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.disasterId && disasters.length > 0) {
      formData.disasterId = disasters[0].id;
    }

    if (!formData.disasterId) {
      setFormError('Please select an associated disaster type from the catalog.');
      return;
    }

    const payload: CreateAlertData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      severity: formData.severity,
      status: formData.status,
      disasterId: formData.disasterId,
      latitude: formData.latitude !== null && formData.latitude !== undefined ? Number(formData.latitude) : null,
      longitude: formData.longitude !== null && formData.longitude !== undefined ? Number(formData.longitude) : null,
      radius: formData.radius !== null && formData.radius !== undefined ? Number(formData.radius) : null,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    };

    if (editingAlert) {
      updateMutation.mutate({ id: editingAlert.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleResolveAlert = (alert: Alert) => {
    if (confirm(`Terminate broadcast and mark alert "${alert.title}" as EXPIRED?`)) {
      updateMutation.mutate({
        id: alert.id,
        data: { status: 'EXPIRED' },
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ========================================================
          1. HEADER & ACTION BAR
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-xs font-semibold text-[#DC3545] mb-2">
            <Radio className="h-4 w-4" />
            Civil Defense Alert Studio
          </div>
          <h1 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Emergency Broadcast Advisories
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Publish real-time hazard bulletins, manage alert lifecycles, and configure spatial danger zones.
          </p>
        </div>

        <Button
          size="sm"
          onClick={openCreateModal}
          className="bg-[#DC3545] hover:bg-red-700 text-white font-bold gap-2 text-xs shadow-md"
        >
          <PlusCircle className="h-4 w-4" />
          Broadcast New Alert
        </Button>
      </div>

      {/* Success Notification */}
      {formSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess(null)} className="text-emerald-700 font-bold">&times;</button>
        </div>
      )}

      {/* ========================================================
          2. SEARCH & FILTER TOOLBAR
          ======================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search alerts by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-50 text-xs"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => {
                setFilterSeverity(sev);
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filterSeverity === sev
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          {['ALL', 'ACTIVE', 'EXPIRED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setFilterStatus(st);
                setPage(1);
              }}
              className={`flex-1 md:flex-initial px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                filterStatus === st
                  ? 'bg-white text-[#102A43] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          3. ALERTS TABLE / CARDS
          ======================================================== */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load alerts"
          message="Failed to retrieve alerts from the command server."
          onRetry={() => refetch()}
        />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No alerts found"
          description="No emergency alerts match the selected filters or search terms."
          icon={Radio}
          actionLabel="Broadcast First Alert"
          onAction={openCreateModal}
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isActive = alert.status === 'ACTIVE';
            return (
              <Card
                key={alert.id}
                className={`border transition-all hover:shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isActive ? 'border-red-200 bg-red-50/15' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getSeverityBadgeStyles(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {alert.status}
                    </span>
                    {alert.disaster?.name && (
                      <Badge variant="outline" className="text-[10px] font-semibold border-slate-300">
                        {alert.disaster.name}
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Issued {timeAgo(alert.issuedAt || alert.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#102A43] truncate">
                    {alert.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                    {alert.radius && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#DC3545]" />
                        Radius: {alert.radius} km
                      </span>
                    )}
                    {alert.latitude && alert.longitude && (
                      <span>
                        Coords: {alert.latitude.toFixed(3)}, {alert.longitude.toFixed(3)}
                      </span>
                    )}
                    {alert.expiresAt && (
                      <span>Expires: {formatDateTime(alert.expiresAt)}</span>
                    )}
                  </div>
                </div>

                {/* Operations & Lifecycle Actions */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectingAlert(alert)}
                      className="text-xs text-[#1769AA] border-blue-200 hover:bg-blue-50"
                      title="Inspect full details"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Details
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(alert)}
                      className="text-xs text-slate-700 hover:bg-slate-100"
                      title="Edit alert parameters"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>

                  {isActive && (
                    <Button
                      size="sm"
                      variant="emergency"
                      onClick={() => handleResolveAlert(alert)}
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
                    >
                      Resolve / End
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
            <span className="font-bold text-[#102A43]">{pagination.totalPages}</span> ({pagination.total} total alerts)
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
          5. CREATE / EDIT ALERT DIALOG
          ======================================================== */}
      <Dialog
        isOpen={isCreateOpen || editingAlert !== null}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingAlert(null);
          resetForm();
        }}
        title={editingAlert ? 'Edit Alert Bulletin' : 'Broadcast Emergency Alert'}
        description="Publish life-safety notifications to civil defense units and mobile citizen apps."
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
              Alert Title <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g. Severe Flash Flood Warning - Valley Drainage Basin"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-xs"
            />
          </div>

          {/* Disaster Taxonomy Selector */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              Associated Disaster Protocol <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.disasterId}
              onChange={(e) => setFormData({ ...formData, disasterId: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA] bg-white"
            >
              <option value="" disabled>Select a Disaster Category</option>
              {disasters.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.type})
                </option>
              ))}
            </select>
          </div>

          {/* Severity & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                Severity Level <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as AlertSeverity })}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white font-bold"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Broadcast Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AlertStatus })}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white font-bold"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              Detailed Safety Instructions <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide immediate life-safety actions (e.g. evacuate to high ground, do not wade in floodwaters)..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]"
            />
          </div>

          {/* Spatial Coordinates & Radius */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Geospatial Hazard Parameters</span>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="text-xs text-[#1769AA] font-bold hover:underline inline-flex items-center gap-1"
              >
                <Navigation className="h-3 w-3" />
                {detectingLocation ? 'Detecting...' : 'Use EOC Coordinates'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 block">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 28.6139"
                  value={formData.latitude ?? ''}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value === '' ? null : Number(e.target.value) })}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 77.2090"
                  value={formData.longitude ?? ''}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value === '' ? null : Number(e.target.value) })}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block">Radius (km)</label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  placeholder="e.g. 50"
                  value={formData.radius ?? ''}
                  onChange={(e) => setFormData({ ...formData, radius: e.target.value === '' ? null : Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Automatic Expiration Date</label>
            <Input
              type="date"
              value={formData.expiresAt || ''}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value || null })}
              className="text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingAlert(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending}
              className="bg-[#DC3545] hover:bg-red-700 text-white font-bold"
            >
              {editingAlert ? 'Save Modifications' : 'Dispatch Broadcast'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ========================================================
          6. INSPECT DETAILS DIALOG
          ======================================================== */}
      {inspectingAlert && (
        <Dialog
          isOpen={inspectingAlert !== null}
          onClose={() => setInspectingAlert(null)}
          title={inspectingAlert.title}
          description={`Advisory Details • ${inspectingAlert.severity} • Status: ${inspectingAlert.status}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Instruction Message
              </span>
              <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                {inspectingAlert.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="font-bold block text-slate-700">Disaster Category</span>
                <span>{inspectingAlert.disaster?.name || 'Emergency Protocol'}</span>
              </div>
              <div>
                <span className="font-bold block text-slate-700">Affected Danger Zone</span>
                <span>
                  {inspectingAlert.radius ? `${inspectingAlert.radius} km radius` : 'Regional zone'}
                </span>
              </div>
              <div>
                <span className="font-bold block text-slate-700">Center Coordinates</span>
                <span>
                  {inspectingAlert.latitude && inspectingAlert.longitude
                    ? `${inspectingAlert.latitude}, ${inspectingAlert.longitude}`
                    : 'Unspecified'}
                </span>
              </div>
              <div>
                <span className="font-bold block text-slate-700">Broadcast Time</span>
                <span>{formatDateTime(inspectingAlert.issuedAt || inspectingAlert.createdAt)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setInspectingAlert(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
