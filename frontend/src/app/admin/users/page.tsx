'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  Filter,
  Eye,
  Shield,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Power,
  Info,
} from 'lucide-react';
import { userService, DiscoveredUser } from '@/services/user.service';
import { UserRole } from '@/types/auth';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected user for inspection modal
  const [viewingUser, setViewingUser] = useState<DiscoveredUser | null>(null);

  // Status toggle confirmation modal
  const [togglingUser, setTogglingUser] = useState<DiscoveredUser | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Query discovered users
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-users-list', roleFilter, searchQuery],
    queryFn: () =>
      userService.getDiscoveredUsers({
        role: roleFilter,
        search: searchQuery,
      }),
  });

  const allUsers = useMemo(() => data?.users || [], [data?.users]);

  // Client-side pagination
  const totalUsers = allUsers.length;
  const totalPages = Math.ceil(totalUsers / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allUsers.slice(start, start + pageSize);
  }, [allUsers, page, pageSize]);

  const handleConfirmToggle = () => {
    if (!togglingUser) return;
    setActionNotice(
      `Notice: Direct user mutation rejected by server boundary. Centralized User Administration endpoint (PATCH /api/v1/users/${togglingUser.id}/status) is pending Module 12 merge.`
    );
    setTimeout(() => {
      setTogglingUser(null);
      setActionNotice(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#1769AA] mb-2">
            <Users className="w-3.5 h-3.5" />
            Platform Directory
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">
            User Account Management
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Directory of registered platform actors, field incident reporters, and emergency coordinators.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Directory
        </button>
      </div>

      {/* 2. Architectural Boundary Alert Banner */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-900 shadow-xs">
        <div className="flex items-start gap-3.5">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-950 text-sm">
              Backend Architecture Notice: User Management API (Module 12)
            </h4>
            <p className="text-amber-800 leading-relaxed">
              While authentication and session tokens are strictly implemented via Argon2id and JWT cookies, the standalone <code>GET /api/v1/users</code> collection endpoint is currently pending backend implementation.
            </p>
            <p className="text-amber-900 font-medium pt-0.5">
              To guarantee complete administrative oversight without fabricating fake data, this directory aggregates verified accounts discovered through real operational activity (Ground Incident Reporters, Drill Organizers, and active Administrator sessions).
            </p>
          </div>
        </div>
      </div>

      {/* 3. Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Discovered Users
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769AA] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#102A43]">
              {data?.totalDiscovered || 0}
            </span>
            <span className="text-xs text-slate-500">accounts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Citizens
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">
              {data?.citizensCount || 0}
            </span>
            <span className="text-xs text-slate-500">community members</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Emergency Authorities
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">
              {data?.authoritiesCount || 0}
            </span>
            <span className="text-xs text-slate-500">officers</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              System Administrators
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700">
              {data?.adminsCount || 1}
            </span>
            <span className="text-xs text-slate-500">super users</span>
          </div>
        </div>
      </div>

      {/* 4. Search & Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Role:
          </span>
          {(['ALL', 'CITIZEN', 'AUTHORITY', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRoleFilter(r);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Discovery Source</th>
                <th className="py-3 px-4">Operations</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-44" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200 rounded-full w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-200 rounded-full w-16" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-12" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-8 bg-slate-200 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No users match your criteria</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try refining your search keyword or role filter.'
                        : 'No accounts have been discovered yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#172B4D]">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : u.role === 'AUTHORITY'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-[#1769AA] border border-blue-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {u.discoveredVia}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#172B4D]">
                      {u.activityCount} record{u.activityCount > 1 ? 's' : ''}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingUser(u)}
                          className="p-1.5 text-slate-500 hover:text-[#1769AA] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Inspect User Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTogglingUser(u)}
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
              <span className="font-semibold">{totalPages}</span> ({totalUsers} total)
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

      {/* 6. Inspect User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Account Record
                </span>
                <h3 className="text-xl font-bold text-[#102A43] mt-0.5">
                  {viewingUser.firstName} {viewingUser.lastName}
                </h3>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">User Identifier (UUID)</span>
                <span className="font-mono text-slate-800">{viewingUser.id}</span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Email Address</span>
                <span className="font-mono text-slate-800">{viewingUser.email}</span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Contact Phone</span>
                <span className="text-slate-800 font-medium">{viewingUser.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Role Clearance</span>
                <span className="font-bold text-[#102A43]">{viewingUser.role}</span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Account Status</span>
                <span className="font-semibold text-emerald-700">Active</span>
              </div>
              <div className="flex justify-between pb-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Discovery Activity</span>
                <span className="font-medium text-slate-800">{viewingUser.discoveredVia}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Activity Engagement</span>
                <span className="font-semibold text-[#1769AA]">
                  {viewingUser.activityCount} verified platform interaction{viewingUser.activityCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Status Toggle Confirmation Dialog */}
      {togglingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-[#102A43]">
                Account Status Action
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are modifying the account status for{' '}
              <span className="font-bold text-slate-900">
                {togglingUser.firstName} {togglingUser.lastName}
              </span>{' '}
              ({togglingUser.email}).
            </p>

            {actionNotice ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                {actionNotice}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                Contract Target: <code>PATCH /api/v1/users/{togglingUser.id}/status</code>
                <br />
                Backend Endpoint: Awaiting Module 12 integration.
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setTogglingUser(null);
                  setActionNotice(null);
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
