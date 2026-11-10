'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck2,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { incidentService } from '@/services/incident.service';
import { IncidentReport, IncidentReportStatus } from '@/types/incident';
import { formatDate, timeAgo } from '@/lib/utils';

const STATUS_FILTERS: { label: string; value: IncidentReportStatus | 'ALL' }[] = [
  { label: 'All Reports', value: 'ALL' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Verified', value: 'VERIFIED' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const ALLOWED_TRANSITIONS: Record<IncidentReportStatus, IncidentReportStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
  UNDER_REVIEW: ['VERIFIED', 'RESOLVED', 'REJECTED'],
  VERIFIED: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['UNDER_REVIEW'],
  REJECTED: ['UNDER_REVIEW'],
};

export default function AdminIncidentsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<IncidentReportStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [viewingIncident, setViewingIncident] = useState<IncidentReport | null>(null);
  const [deletingIncident, setDeletingIncident] = useState<IncidentReport | null>(null);
  const [targetStatus, setTargetStatus] = useState<IncidentReportStatus | null>(null);

  // Query incidents
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-incidents-list', page, selectedStatus, searchQuery],
    queryFn: () =>
      incidentService.getAllIncidents({
        page,
        limit: 10,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: searchQuery.trim() || undefined,
      }),
  });

  const incidents: IncidentReport[] = data?.reports || [];
  const pagination = data?.pagination;

  // Status transition mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IncidentReportStatus }) =>
      incidentService.updateIncident(id, { status }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-incidents-list'] });
      if (viewingIncident && viewingIncident.id === updated.id) {
        setViewingIncident(updated);
      }
      setTargetStatus(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to update incident status');
    },
  });

  // Delete mutation (ADMIN only)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => incidentService.deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incidents-list'] });
      setDeletingIncident(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete incident report');
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#1769AA] mb-2">
            <FileCheck2 className="w-3.5 h-3.5" />
            Field Intelligence & Incident Operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">
            Incident Triage & Ground Operations
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Review incoming citizen reports, coordinate on-site verification, and manage ground resolution lifecycle.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Triage
        </button>
      </div>

      {/* 2. Search & Status Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by headline, hazard description, or location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setSelectedStatus(f.value);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${
                selectedStatus === f.value
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Incidents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Report Headline</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4">Ground Location</th>
                <th className="py-3 px-4">Citizen Reporter</th>
                <th className="py-3 px-4">Reported At</th>
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
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-8 bg-slate-200 rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No incident reports found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try modifying your search or status filter.'
                        : 'No field incident reports have been submitted.'}
                    </p>
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-xs text-[#172B4D]">{inc.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                        {inc.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inc.status === 'SUBMITTED'
                            ? 'bg-blue-50 text-[#1769AA] border border-blue-200'
                            : inc.status === 'UNDER_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : inc.status === 'VERIFIED'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : inc.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{inc.address || 'Coordinates Recorded'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 pl-4.5">
                        {inc.latitude != null ? inc.latitude.toFixed(3) : '—'},{' '}
                        {inc.longitude != null ? inc.longitude.toFixed(3) : '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {inc.reportedBy ? (
                        <div>
                          <p className="font-semibold text-slate-800">
                            {inc.reportedBy.firstName} {inc.reportedBy.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">{inc.reportedBy.email || 'Citizen'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Anonymous</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {timeAgo(inc.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingIncident(inc)}
                          className="p-1.5 text-slate-500 hover:text-[#1769AA] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Review & Triage"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingIncident(inc)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Permanently Delete Incident"
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

      {/* 4. Review & Triage Modal */}
      {viewingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1769AA]">
                  Field Incident Report
                </span>
                <h3 className="text-xl font-bold text-[#102A43] mt-0.5">
                  {viewingIncident.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingIncident(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Lifecycle Status</span>
                <span className="font-bold text-[#102A43]">{viewingIncident.status}</span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Ground Location</span>
                <span className="font-medium text-slate-800">{viewingIncident.address || 'Reported Location'}</span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">GPS Coordinates</span>
                {viewingIncident.latitude != null && viewingIncident.longitude != null ? (
                  <a
                    href={`https://www.google.com/maps?q=${viewingIncident.latitude},${viewingIncident.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#1769AA] hover:underline flex items-center gap-1"
                  >
                    {viewingIncident.latitude.toFixed(5)}, {viewingIncident.longitude.toFixed(5)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">Not recorded</span>
                )}
              </div>

              {viewingIncident.reportedBy && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block mb-0.5">
                    Reporting Citizen Contact:
                  </span>
                  <p className="font-semibold text-slate-800">
                    {viewingIncident.reportedBy.firstName} {viewingIncident.reportedBy.lastName} ({viewingIncident.reportedBy.email || 'Citizen'})
                  </p>
                  {viewingIncident.reportedBy.phone && (
                    <p className="text-slate-600">Phone: {viewingIncident.reportedBy.phone}</p>
                  )}
                </div>
              )}

              <div>
                <span className="text-slate-500 font-semibold block mb-1">
                  Hazard Observation & Notes
                </span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {viewingIncident.description}
                </p>
              </div>

              {viewingIncident.imageUrl && (
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Attached Field Photo</span>
                  <a
                    href={viewingIncident.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769AA] hover:underline"
                  >
                    View Attached Ground Photo <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Status Transition Desk */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-slate-700 font-bold block mb-2">
                  Update Lifecycle Progression:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(ALLOWED_TRANSITIONS[viewingIncident.status] || []).map((nextSt) => (
                    <button
                      key={nextSt}
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: viewingIncident.id,
                          status: nextSt,
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1769AA] hover:bg-[#125386] transition-colors disabled:opacity-50"
                    >
                      Advance to {nextSt.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingIncident(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Dialog */}
      {deletingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-[#102A43]">
                Confirm Permanent Incident Purge
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the incident report{' '}
              <span className="font-bold text-slate-900">&ldquo;{deletingIncident.title}&rdquo;</span>?
              This action executes DELETE /api/v1/incidents/:id (Admin exclusive).
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => setDeletingIncident(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingIncident.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-[#DC3545] hover:bg-[#B02A37] rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
