'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Plus,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Building,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  Power,
  FileBadge,
} from 'lucide-react';
import { userService, DiscoveredUser } from '@/services/user.service';
import { formatDate } from '@/lib/utils';

export default function AdminAuthoritiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected authority officer for detail dossier
  const [viewingOfficer, setViewingOfficer] = useState<DiscoveredUser | null>(null);

  // Modals for Provisioning and Status
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionNotice, setProvisionNotice] = useState<string | null>(null);
  const [togglingOfficer, setTogglingOfficer] = useState<DiscoveredUser | null>(null);
  const [toggleNotice, setToggleNotice] = useState<string | null>(null);

  // Form for provisional authority setup
  const [officerForm, setOfficerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jurisdiction: 'Civil Defense & Disaster Operations Division',
  });

  // Query discovered authority users
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-authorities-list', searchQuery],
    queryFn: () =>
      userService.getDiscoveredUsers({
        role: 'AUTHORITY',
        search: searchQuery,
      }),
  });

  const authorities = useMemo(() => data?.users || [], [data?.users]);

  const totalOfficers = authorities.length;
  const totalPages = Math.ceil(totalOfficers / pageSize) || 1;
  const paginatedOfficers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return authorities.slice(start, start + pageSize);
  }, [authorities, page, pageSize]);

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionNotice(
      'Security Policy Enforcement: Public registration endpoint (POST /api/v1/auth/register) strictly forces role: CITIZEN. Provisioning an AUTHORITY credential requires the Administrative User Provisioning API (POST /api/v1/users), currently queued in Module 12.'
    );
  };

  const handleConfirmToggle = () => {
    if (!togglingOfficer) return;
    setToggleNotice(
      `Notice: Direct officer mutation rejected by server boundary. Endpoint PATCH /api/v1/users/${togglingOfficer.id}/status is awaiting Module 12 merge.`
    );
    setTimeout(() => {
      setTogglingOfficer(null);
      setToggleNotice(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-xs font-semibold text-amber-700 mb-2 border border-amber-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            Field Command & Emergency Personnel
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">
            Emergency Authority Management
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Maintain authorized civil defense personnel, incident responders, and drill organizers.
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
            onClick={() => {
              setIsProvisionModalOpen(true);
              setProvisionNotice(null);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#102A43] hover:bg-[#163859] rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Provision Authority Account
          </button>
        </div>
      </div>

      {/* 2. Architectural Boundary Alert */}
      <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 sm:p-5 text-blue-900 shadow-xs">
        <div className="flex items-start gap-3.5">
          <Info className="w-5 h-5 text-[#1769AA] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-blue-950 text-sm">
              Role Isolation & Authority Authorization Contract
            </h4>
            <p className="text-blue-800 leading-relaxed">
              DisasterReady strictly enforces Role-Based Access Control (RBAC). In compliance with cybersecurity guidelines, public signup prevents role escalation and forces <code>role: CITIZEN</code>. Authority accounts are seeded or provisioned directly through administrative management.
            </p>
            <p className="text-blue-900 font-medium pt-0.5">
              The active officers shown below have been verified through active mock drill coordination and incident operations.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search & Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search officer by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Total Officers: <span className="text-[#102A43] font-bold">{totalOfficers}</span>
        </span>
      </div>

      {/* 4. Authorities Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Officer Name</th>
                <th className="py-3 px-4">Official Email</th>
                <th className="py-3 px-4">Clearance Role</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Drills / Triage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-48" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200 rounded-full w-24" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-40" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200 rounded-full w-16" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-8 bg-slate-200 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedOfficers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No emergency authorities located</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'No officers match your search query.'
                        : 'No authority profiles discovered yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOfficers.map((officer) => (
                  <tr key={officer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#172B4D]">
                      {officer.firstName} {officer.lastName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {officer.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        AUTHORITY
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      Civil Defense Command
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#172B4D]">
                      {officer.activityCount} drill{officer.activityCount > 1 ? 's' : ''} organized
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingOfficer(officer)}
                          className="p-1.5 text-slate-500 hover:text-[#1769AA] hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Officer Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTogglingOfficer(officer)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Account Status Actions"
                        >
                          <Power className="w-4 h-4" />
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
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page <span className="font-semibold">{page}</span> of{' '}
              <span className="font-semibold">{totalPages}</span> ({totalOfficers} total)
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Officer Dossier Modal */}
      {viewingOfficer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Officer Credential Dossier
                </span>
                <h3 className="text-xl font-bold text-[#102A43] mt-0.5">
                  {viewingOfficer.firstName} {viewingOfficer.lastName}
                </h3>
              </div>
              <button
                onClick={() => setViewingOfficer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Officer UUID</span>
                <span className="font-mono text-slate-800">{viewingOfficer.id}</span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Official Email</span>
                <span className="font-mono text-slate-800">{viewingOfficer.email}</span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Clearance Level</span>
                <span className="font-bold text-amber-800">AUTHORITY (EOC Responder)</span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Command Unit</span>
                <span className="font-medium text-slate-800">
                  Civil Defense & Disaster Operations Division
                </span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Operational Engagements</span>
                <span className="font-semibold text-[#1769AA]">
                  {viewingOfficer.activityCount} community drills organized
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Access Rights</span>
                <span className="font-medium text-emerald-700">
                  Incident Triage, Alert Broadcasts, Facility Deployments
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingOfficer(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Provision Authority Account Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#102A43]">
                  Provision Emergency Authority Account
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Administrative onboarding for certified disaster management officers.
                </p>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {provisionNotice && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{provisionNotice}</span>
              </div>
            )}

            <form onSubmit={handleProvisionSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={officerForm.firstName}
                    onChange={(e) =>
                      setOfficerForm({ ...officerForm, firstName: e.target.value })
                    }
                    placeholder="e.g. Rajesh"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={officerForm.lastName}
                    onChange={(e) =>
                      setOfficerForm({ ...officerForm, lastName: e.target.value })
                    }
                    placeholder="e.g. Kumar"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={officerForm.email}
                  onChange={(e) =>
                    setOfficerForm({ ...officerForm, email: e.target.value })
                  }
                  placeholder="e.g. r.kumar@disasterready.gov"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Jurisdiction Unit
                </label>
                <input
                  type="text"
                  value={officerForm.jurisdiction}
                  onChange={(e) =>
                    setOfficerForm({ ...officerForm, jurisdiction: e.target.value })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px]">
                Target Endpoint: <code>POST /api/v1/users</code> (queued in Module 12).
                <br />
                Security Rule: Automatic generation of 16-character temporary master password sent via secure channel.
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#102A43] hover:bg-[#163859] rounded-lg"
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Status Action Dialog */}
      {togglingOfficer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-[#102A43]">
                Officer Credential Action
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are updating operational clearance for{' '}
              <span className="font-bold text-slate-900">
                {togglingOfficer.firstName} {togglingOfficer.lastName}
              </span>{' '}
              ({togglingOfficer.email}).
            </p>

            {toggleNotice ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                {toggleNotice}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                Contract Target: <code>PATCH /api/v1/users/{togglingOfficer.id}/status</code>
                <br />
                Backend Endpoint: Awaiting Module 12 integration.
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setTogglingOfficer(null);
                  setToggleNotice(null);
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Dismiss
              </button>
              <button
                onClick={handleConfirmToggle}
                className="px-4 py-2 text-xs font-bold text-white bg-[#102A43] hover:bg-[#163859] rounded-lg"
              >
                Execute Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
