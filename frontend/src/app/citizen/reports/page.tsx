'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  PlusCircle,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Image as ImageIcon,
  Edit2,
  X,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { incidentService } from '@/services/incident.service';
import {
  IncidentReport,
  CreateIncidentData,
  IncidentCategory,
  IncidentSeverity,
} from '@/types/incident';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { getStatusBadgeStyles, getSeverityBadgeStyles, timeAgo } from '@/lib/utils';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/api';

const INCIDENT_CATEGORIES: { value: IncidentCategory; label: string }[] = [
  { value: 'FLOOD', label: 'Flash Flood / Water Inundation' },
  { value: 'STRUCTURAL_DAMAGE', label: 'Building / Bridge Structural Damage' },
  { value: 'LANDSLIDE', label: 'Landslide / Mudflow / Rockfall' },
  { value: 'FIRE_HAZARD', label: 'Fire Hazard / Smoke / Gas Leak' },
  { value: 'ROAD_BLOCKAGE', label: 'Road Blockage / Debris Obstruction' },
  { value: 'POWER_UTILITY', label: 'Downed Power Line / Utility Outage' },
  { value: 'MEDICAL_EMERGENCY', label: 'Mass Casualty / Medical Emergency' },
  { value: 'OTHER', label: 'Other Local Hazard' },
];

const SEVERITY_LEVELS: {
  value: IncidentSeverity;
  label: string;
  badgeClass: string;
}[] = [
  { value: 'LOW', label: 'LOW - Advisory', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'MODERATE', label: 'MODERATE - Caution', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'HIGH', label: 'HIGH - Safety Threat', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'CRITICAL', label: 'CRITICAL - Life Hazard', badgeClass: 'bg-red-100 text-red-800 border-red-300' },
];

/**
 * Transparently parses category and severity if encoded in the title:
 * e.g., "[FLOOD | HIGH] North Bridge Flood" -> category=FLOOD, severity=HIGH, cleanTitle="North Bridge Flood"
 */
function parseReportMeta(title: string) {
  const match = title.match(/^\[([A-Z_]+)\s*\|\s*([A-Z]+)\]\s*(.*)$/);
  if (match) {
    return {
      category: match[1] as IncidentCategory,
      severity: match[2] as IncidentSeverity,
      cleanTitle: match[3],
    };
  }
  return {
    category: null,
    severity: null,
    cleanTitle: title,
  };
}

export default function CitizenReportsPage() {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [editingReport, setEditingReport] = useState<IncidentReport | null>(null);

  // Form states
  const [category, setCategory] = useState<IncidentCategory>('FLOOD');
  const [severity, setSeverity] = useState<IncidentSeverity>('MODERATE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const queryClient = useQueryClient();

  // Fetch citizen's submitted reports (correctly extracts normalized reports array)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['citizen-my-incident-reports'],
    queryFn: () => incidentService.getMyIncidents({ limit: 50 }),
  });

  const reports = data?.reports || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newReport: CreateIncidentData) => incidentService.createIncident(newReport),
    onSuccess: () => {
      setFormSuccess('Incident report submitted successfully to emergency dispatch!');
      setFormError(null);
      resetForm();
      setShowSubmitModal(false);
      queryClient.invalidateQueries({ queryKey: ['citizen-my-incident-reports'] });
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const msg = err.response?.data?.error?.message || 'Failed to submit incident report.';
      setFormError(msg);
    },
  });

  // Edit mutation (allowed while SUBMITTED)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateIncidentData> }) =>
      incidentService.updateIncident(id, data),
    onSuccess: () => {
      setFormSuccess('Incident report updated successfully.');
      setFormError(null);
      setEditingReport(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['citizen-my-incident-reports'] });
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const msg = err.response?.data?.error?.message || 'Failed to update report.';
      setFormError(msg);
    },
  });

  const resetForm = () => {
    setCategory('FLOOD');
    setSeverity('MODERATE');
    setTitle('');
    setDescription('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setImageUrl('');
    setEditingReport(null);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDetectingLocation(false);
        alert('Could not detect location. Please input coordinates or address manually.');
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (latitude === '' || longitude === '') {
      setFormError('Coordinates (latitude & longitude) are required for emergency spatial mapping.');
      return;
    }

    // Transparently encode category and severity into title without adding unsupported backend fields
    const encodedTitle = `[${category} | ${severity}] ${title.trim()}`.slice(0, 200);

    const payload: CreateIncidentData = {
      title: encodedTitle,
      description: description.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: address.trim() || null,
      imageUrl: imageUrl.trim() || null,
    };

    if (editingReport) {
      updateMutation.mutate({ id: editingReport.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleStartEdit = (report: IncidentReport) => {
    setEditingReport(report);
    const meta = parseReportMeta(report.title);
    if (meta.category) setCategory(meta.category);
    if (meta.severity) setSeverity(meta.severity);
    setTitle(meta.cleanTitle);
    setDescription(report.description);
    setAddress(report.address || '');
    setLatitude(report.latitude ?? '');
    setLongitude(report.longitude ?? '');
    setImageUrl(report.imageUrl || '');
    setShowSubmitModal(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Community Incident Reporting & Tracking
          </h1>
          <p className="text-xs sm:text-sm text-[#627D98] mt-1">
            Report local hazards, structural damage, trapped persons, or blockages to emergency coordinators.
          </p>
        </div>

        <Button
          variant="emergency"
          size="sm"
          onClick={() => {
            resetForm();
            setShowSubmitModal(true);
          }}
          className="gap-2 text-xs shadow-xs"
        >
          <PlusCircle className="h-4 w-4" />
          Submit Ground Report
        </Button>
      </div>

      {/* Status Messages */}
      {formSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
            <span>{formSuccess}</span>
          </div>
          <button
            onClick={() => setFormSuccess(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Incident Reports Table / Card List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load your incident reports"
          message="Failed to retrieve incident reports from the server."
          onRetry={() => refetch()}
        />
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => {
            const isSubmitted = report.status === 'SUBMITTED';
            const meta = parseReportMeta(report.title);

            return (
              <Card key={report.id} className="p-5 space-y-3 hover:border-[#1769AA] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Lifecycle Status */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getStatusBadgeStyles(
                          report.status
                        )}`}
                      >
                        {report.status.replace('_', ' ')}
                      </span>

                      {/* Decoded Incident Category Badge */}
                      {meta.category && (
                        <Badge variant="outline" className="text-[10px] font-bold border-slate-300 text-[#102A43]">
                          {meta.category.replace('_', ' ')}
                        </Badge>
                      )}

                      {/* Decoded Incident Severity Badge */}
                      {meta.severity && (
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getSeverityBadgeStyles(
                            meta.severity
                          )}`}
                        >
                          {meta.severity}
                        </span>
                      )}

                      <span className="text-xs text-[#627D98] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Reported {timeAgo(report.createdAt)}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-[#102A43]">{meta.cleanTitle}</h3>
                    <p className="text-xs sm:text-sm text-[#172B4D] leading-relaxed whitespace-pre-line">
                      {report.description}
                    </p>

                    {report.address && (
                      <p className="text-xs text-[#627D98] flex items-center gap-1 pt-1">
                        <MapPin className="h-3.5 w-3.5 text-[#DC3545] shrink-0" />
                        <span>{report.address}</span>
                      </p>
                    )}

                    {report.latitude !== null && report.longitude !== null && (
                      <span className="text-[11px] text-slate-500 block">
                        GPS Coordinates: {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                      </span>
                    )}

                    {report.imageUrl && (
                      <div className="pt-2">
                        <a
                          href={report.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#1769AA] font-semibold hover:underline bg-blue-50 px-2 py-1 rounded"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          View Attached Field Photo &rarr;
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions & Lifecycle Progress */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <div className="text-[10px] text-slate-500 font-medium">
                      Lifecycle: <strong className="text-[#102A43]">{report.status}</strong>
                    </div>

                    {isSubmitted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(report)}
                        className="gap-1.5 text-xs text-[#1769AA] border-[#1769AA]/30 hover:bg-blue-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit Details
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No Ground Incidents Reported"
          description="You have not submitted any local incident reports yet. Use the button above if you observe local hazards or blockages."
          actionLabel="Report an Incident"
          onAction={() => {
            resetForm();
            setShowSubmitModal(true);
          }}
        />
      )}

      {/* ========================================================
          SUBMISSION / EDIT MODAL
          ======================================================== */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#D9E2EC] max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
              <h3 className="font-bold text-base text-[#102A43] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#DC3545]" />
                {editingReport ? 'Edit Pending Incident Report' : 'Submit Ground Incident Report'}
              </h3>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#DC3545]" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* 1. Incident Type Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#172B4D] block">
                  Incident Hazard Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-xs text-[#172B4D] focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]"
                >
                  {INCIDENT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Severity Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#172B4D] block">
                  Observed Severity Level <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SEVERITY_LEVELS.map((sev) => {
                    const isSelected = severity === sev.value;
                    return (
                      <button
                        key={sev.value}
                        type="button"
                        onClick={() => setSeverity(sev.value)}
                        className={`p-2 rounded-lg border text-left text-xs font-semibold transition-all ${
                          isSelected
                            ? `${sev.badgeClass} ring-2 ring-[#102A43] shadow-xs`
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {sev.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#172B4D]">
                  Brief Subject / Title <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Flash Flooding across North Highway Bridge"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* 4. Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#172B4D]">
                  Description of Hazard <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail visible water height, trapped persons, debris, or electrical hazards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-xs text-[#172B4D] placeholder:text-[#829AB1] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                />
              </div>

              {/* 5. Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#172B4D]">
                  Street Address / Nearby Landmark
                </label>
                <Input
                  placeholder="e.g. Near St. Mary's School, Sector 4"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* 6. Coordinates with Geo Detector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#172B4D]">
                    GPS Coordinates <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="text-xs font-semibold text-[#1769AA] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="h-3 w-3" />
                    {detectingLocation ? 'Detecting...' : 'Use My GPS'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    step="any"
                    required
                    placeholder="Latitude (e.g. 28.6139)"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    step="any"
                    required
                    placeholder="Longitude (e.g. 77.2090)"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>

              {/* 7. Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#172B4D]">
                  Image URL (Optional Field Photo)
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/hazard-photo.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <span className="text-[10px] text-slate-500 block">
                  Provide a direct public HTTP/HTTPS image URL of the scene.
                </span>
              </div>

              {/* Helper text explaining transparent encoding */}
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="h-4 w-4 text-[#1769AA] shrink-0 mt-0.5" />
                <span>
                  The selected hazard type and severity will be securely formatted into your emergency dispatch report.
                </span>
              </div>

              <div className="pt-3 border-t border-[#D9E2EC] flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="emergency"
                  size="sm"
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingReport ? 'Save Changes' : 'Submit Ground Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
