'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Phone,
  Mail,
  ArrowRight,
  Check,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { incidentService } from '@/services/incident.service';
import { IncidentReport, IncidentReportStatus, UpdateIncidentData } from '@/types/incident';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { formatDate, formatDateTime, getStatusBadgeStyles, timeAgo } from '@/lib/utils';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/api';

const STATUS_FILTERS: (IncidentReportStatus | 'ALL')[] = [
  'ALL',
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'RESOLVED',
  'REJECTED',
];

/**
 * Valid state transitions matching backend IncidentService.VALID_STATUS_TRANSITIONS:
 * SUBMITTED -> ['UNDER_REVIEW', 'VERIFIED', 'REJECTED']
 * UNDER_REVIEW -> ['VERIFIED', 'RESOLVED', 'REJECTED']
 * VERIFIED -> ['RESOLVED', 'REJECTED']
 * RESOLVED -> ['UNDER_REVIEW']
 * REJECTED -> ['UNDER_REVIEW']
 */
const ALLOWED_TRANSITIONS: Record<IncidentReportStatus, IncidentReportStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
  UNDER_REVIEW: ['VERIFIED', 'RESOLVED', 'REJECTED'],
  VERIFIED: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['UNDER_REVIEW'],
  REJECTED: ['UNDER_REVIEW'],
};

export default function AuthorityIncidentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewingReport, setReviewingReport] = useState<IncidentReport | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch all municipal incidents
  const { data: incidentsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['authority-incidents-list', page, selectedStatus, searchQuery],
    queryFn: () =>
      incidentService.getAllIncidents({
        page,
        limit: 10,
        status: selectedStatus === 'ALL' ? undefined : (selectedStatus as IncidentReportStatus),
        search: searchQuery.trim() || undefined,
      }),
  });

  const reports = incidentsData?.reports || [];
  const pagination = incidentsData?.pagination;

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: IncidentReportStatus }) =>
      incidentService.updateIncident(id, { status: newStatus }),
    onSuccess: (updatedReport) => {
      setActionSuccess(`Incident #${updatedReport.id.slice(0, 8)} status moved to ${updatedReport.status}.`);
      setActionError(null);
      setReviewingReport(null);
      queryClient.invalidateQueries({ queryKey: ['authority-incidents-list'] });
      queryClient.invalidateQueries({ queryKey: ['authority-dashboard-incidents'] });
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      setActionError(err.response?.data?.error?.message || 'Failed to update incident report status.');
    },
  });

  const handleTransitionStatus = (newStatus: IncidentReportStatus) => {
    if (!reviewingReport) return;
    if (confirm(`Confirm moving report status to "${newStatus}"?`)) {
      updateStatusMutation.mutate({
        id: reviewingReport.id,
        newStatus,
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-xs font-semibold text-amber-800 mb-2">
            <ShieldAlert className="h-4 w-4 text-[#F59E0B]" />
            Field Incident Triage & Verification
          </div>
          <h1 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Incident Operations Desk
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Review civilian hazard reports, inspect geographic coordinates, verify ground damage, and dispatch civil defense responders.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 font-bold">&times;</button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC3545] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-700 font-bold">&times;</button>
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
            placeholder="Search by title, location, or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50 text-xs"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {STATUS_FILTERS.map((st) => (
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
              {st === 'ALL' ? 'All Incidents' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          3. INCIDENTS LIST
          ======================================================== */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load incidents"
          message="Failed to retrieve incident reports from the database."
          onRetry={() => refetch()}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No incident reports found"
          description="There are currently no reports matching your active filters."
          icon={ShieldAlert}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="border border-slate-200 hover:border-slate-300 transition-all p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getStatusBadgeStyles(report.status)}`}>
                    {report.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Reported {timeAgo(report.createdAt)}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: #{report.id.slice(0, 8)}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-[#102A43] truncate">
                  {report.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {report.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                  {report.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                      {report.address}
                    </span>
                  )}
                  {report.latitude && report.longitude && (
                    <span>
                      Coords: {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                    </span>
                  )}
                  {report.reportedBy && (
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <User className="h-3 w-3 text-slate-400" />
                      Citizen: {report.reportedBy.firstName} {report.reportedBy.lastName}
                    </span>
                  )}
                  {report.imageUrl && (
                    <span className="text-blue-600 font-semibold flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Photo Attached
                    </span>
                  )}
                </div>
              </div>

              {/* Triage Action */}
              <div className="shrink-0 flex items-center sm:flex-col items-end gap-2">
                <Button
                  size="sm"
                  onClick={() => setReviewingReport(report)}
                  className="bg-[#102A43] hover:bg-[#172B4D] text-white font-bold gap-1.5 text-xs shadow-xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Review & Triage
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================
          4. PAGINATION
          ======================================================== */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
          <div>
            Showing Page <span className="font-bold text-[#102A43]">{pagination.page}</span> of{' '}
            <span className="font-bold text-[#102A43]">{pagination.totalPages}</span> ({pagination.total} reports)
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
          5. REVIEW & TRIAGE MODAL DIALOG
          ======================================================== */}
      {reviewingReport && (
        <Dialog
          isOpen={reviewingReport !== null}
          onClose={() => setReviewingReport(null)}
          title={`Incident Review #${reviewingReport.id.slice(0, 8)}`}
          description={`Reported ${formatDateTime(reviewingReport.createdAt)}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Current Lifecycle Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700">Current Lifecycle Status:</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusBadgeStyles(reviewingReport.status)}`}>
                {reviewingReport.status.replace('_', ' ')}
              </span>
            </div>

            {/* Subject & Description */}
            <div className="space-y-1">
              <span className="font-bold text-slate-700 block">Report Summary / Title:</span>
              <p className="text-sm font-bold text-[#102A43]">{reviewingReport.title}</p>
            </div>

            <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-700 block mb-1">Hazard Details:</span>
              <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                {reviewingReport.description}
              </p>
            </div>

            {/* Coordinates and Address */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold block text-slate-700">Address / Location:</span>
                <span>{reviewingReport.address || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-bold block text-slate-700">GPS Coordinates:</span>
                <span>
                  {reviewingReport.latitude !== null && reviewingReport.longitude !== null
                    ? `${reviewingReport.latitude}, ${reviewingReport.longitude}`
                    : 'Coordinates unavailable'}
                </span>
              </div>
            </div>

            {/* Attached Photo */}
            {reviewingReport.imageUrl && (
              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">Attached Field Evidence:</span>
                <a
                  href={reviewingReport.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#1769AA] font-bold hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                >
                  <ImageIcon className="h-4 w-4" />
                  View Original Field Photo (New Tab) &rarr;
                </a>
              </div>
            )}

            {/* Reporter Information */}
            {reviewingReport.reportedBy && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-[#102A43] block">Reporting Citizen Contact:</span>
                <div className="flex flex-wrap items-center gap-4 text-slate-600">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {reviewingReport.reportedBy.firstName} {reviewingReport.reportedBy.lastName}
                  </span>
                  {reviewingReport.reportedBy.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {reviewingReport.reportedBy.email}
                    </span>
                  )}
                  {reviewingReport.reportedBy.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {reviewingReport.reportedBy.phone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Lifecycle Status Action Bar */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-700 block">
                Permitted Status Progression Actions:
              </span>
              <div className="flex flex-wrap gap-2">
                {(ALLOWED_TRANSITIONS[reviewingReport.status] || []).map((targetStatus) => {
                  let btnColor = 'bg-[#102A43] hover:bg-[#172B4D] text-white';
                  if (targetStatus === 'VERIFIED') btnColor = 'bg-[#1769AA] hover:bg-blue-700 text-white';
                  if (targetStatus === 'RESOLVED') btnColor = 'bg-[#16A34A] hover:bg-emerald-700 text-white';
                  if (targetStatus === 'REJECTED') btnColor = 'bg-red-700 hover:bg-red-800 text-white';

                  return (
                    <Button
                      key={targetStatus}
                      size="sm"
                      onClick={() => handleTransitionStatus(targetStatus)}
                      isLoading={updateStatusMutation.isPending}
                      className={`text-xs font-bold ${btnColor}`}
                    >
                      Move to {targetStatus.replace('_', ' ')}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setReviewingReport(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
