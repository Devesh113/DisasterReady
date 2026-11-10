'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Building2,
  Users,
  Activity,
  PlusCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  Radio,
  BookOpen,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { alertService } from '@/services/alertService';
import { incidentService } from '@/services/incident.service';
import { eventService } from '@/services/eventService';
import { resourceService } from '@/services/resourceService';
import { userService } from '@/services/user.service';
import { disasterService } from '@/services/disasterService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, timeAgo } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Incidents
  const {
    data: incidentsData,
    isLoading: isLoadingIncidents,
    refetch: refetchIncidents,
  } = useQuery({
    queryKey: ['admin-dashboard-incidents'],
    queryFn: () => incidentService.getAllIncidents({ limit: 100 }),
  });

  // 2. Fetch Alerts
  const {
    data: alertsData,
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ['admin-dashboard-alerts'],
    queryFn: () => alertService.getAlerts({ limit: 50 }),
  });

  // 3. Fetch Emergency Resources
  const {
    data: resourcesData,
    isLoading: isLoadingResources,
    refetch: refetchResources,
  } = useQuery({
    queryKey: ['admin-dashboard-resources'],
    queryFn: () => resourceService.getResources({ limit: 100 }),
  });

  // 4. Fetch Events
  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ['admin-dashboard-events'],
    queryFn: () => eventService.getEvents({ limit: 50 }),
  });

  // 5. Fetch Disasters Catalog Count
  const { data: disastersData } = useQuery({
    queryKey: ['admin-dashboard-disasters'],
    queryFn: () => disasterService.getDisasters({ limit: 100 }),
  });

  // 6. Fetch Discovered Users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-dashboard-users'],
    queryFn: () => userService.getDiscoveredUsers(),
  });

  const refetchAll = () => {
    refetchIncidents();
    refetchAlerts();
    refetchResources();
    refetchEvents();
  };

  const incidents = useMemo(() => incidentsData?.reports || [], [incidentsData?.reports]);
  const alerts = useMemo(() => alertsData?.alerts || [], [alertsData?.alerts]);
  const resources = useMemo(() => resourcesData?.resources || [], [resourcesData?.resources]);
  const events = useMemo(() => eventsData?.events || [], [eventsData?.events]);
  const disasters = useMemo(() => disastersData?.disasters || [], [disastersData?.disasters]);

  // Metrics Calculations
  const pendingIncidentsCount = useMemo(
    () => incidents.filter((i) => i.status === 'SUBMITTED' || i.status === 'UNDER_REVIEW').length,
    [incidents]
  );
  const activeAlertsCount = useMemo(
    () => alerts.filter((a) => a.status === 'ACTIVE').length,
    [alerts]
  );
  const criticalAlertsCount = useMemo(
    () => alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length,
    [alerts]
  );
  const activeResourcesCount = useMemo(
    () => resources.filter((r) => r.isActive).length,
    [resources]
  );
  const upcomingEventsCount = useMemo(
    () => events.filter((e) => e.status === 'UPCOMING' || e.status === 'ONGOING').length,
    [events]
  );

  // Visualization 1: Incident Status Distribution
  const incidentStatusData = useMemo(() => {
    const counts = { SUBMITTED: 0, UNDER_REVIEW: 0, VERIFIED: 0, RESOLVED: 0, REJECTED: 0 };
    incidents.forEach((i) => {
      if (counts[i.status as keyof typeof counts] !== undefined) {
        counts[i.status as keyof typeof counts]++;
      }
    });
    return [
      { name: 'Submitted', count: counts.SUBMITTED, color: '#3B82F6' },
      { name: 'Under Review', count: counts.UNDER_REVIEW, color: '#F59E0B' },
      { name: 'Verified', count: counts.VERIFIED, color: '#8B5CF6' },
      { name: 'Resolved', count: counts.RESOLVED, color: '#16A34A' },
      { name: 'Rejected', count: counts.REJECTED, color: '#64748B' },
    ];
  }, [incidents]);

  // Visualization 2: Alerts by Severity
  const alertSeverityData = useMemo(() => {
    const counts = { LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 };
    alerts.forEach((a) => {
      if (counts[a.severity as keyof typeof counts] !== undefined) {
        counts[a.severity as keyof typeof counts]++;
      }
    });
    return [
      { name: 'Low', count: counts.LOW, color: '#16A34A' },
      { name: 'Moderate', count: counts.MODERATE, color: '#F59E0B' },
      { name: 'High', count: counts.HIGH, color: '#EA580C' },
      { name: 'Critical', count: counts.CRITICAL, color: '#DC3545' },
    ];
  }, [alerts]);

  // Visualization 3: Resources by Type
  const resourceTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      name: type.replace('_', ' '),
      count,
    }));
  }, [resources]);

  // Visualization 4: User Roles Distribution
  const userRolesData = useMemo(() => {
    return [
      { name: 'Citizens', count: usersData?.citizensCount || 0, color: '#1769AA' },
      { name: 'Authorities', count: usersData?.authoritiesCount || 0, color: '#F59E0B' },
      { name: 'Admins', count: usersData?.adminsCount || 1, color: '#DC3545' },
    ];
  }, [usersData]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-xs font-semibold text-rose-700 mb-2 border border-rose-200">
            <Shield className="w-3.5 h-3.5" />
            Executive Command Console
          </div>
          <h1 className="text-3xl font-extrabold text-[#102A43] tracking-tight">
            Platform Operations & System Health
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Global administrative governance across civil defense alerts, incident triage, disaster taxonomies, and emergency assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refetchAll}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync All Data
          </button>
          <Link
            href="/admin/alerts"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#DC3545] rounded-lg hover:bg-[#B02A37] transition-colors shadow-xs"
          >
            <Radio className="w-3.5 h-3.5" />
            Issue Alert
          </Link>
        </div>
      </div>

      {/* 2. Top Executive Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Incidents Card */}
        <Card className="border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Incidents
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769AA] flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#102A43]">
                {isLoadingIncidents ? <Skeleton className="h-8 w-12" /> : incidents.length}
              </span>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                {pendingIncidentsCount} pending
              </span>
            </div>
            <Link
              href="/admin/incidents"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1769AA] hover:underline"
            >
              Open Triage Desk <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Alerts Card */}
        <Card className="border-slate-200 shadow-xs hover:border-rose-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Civil Advisories
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#DC3545] flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#102A43]">
                {isLoadingAlerts ? <Skeleton className="h-8 w-12" /> : activeAlertsCount}
              </span>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                {criticalAlertsCount} critical
              </span>
            </div>
            <Link
              href="/admin/alerts"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC3545] hover:underline"
            >
              Manage Advisories <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Resources Card */}
        <Card className="border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Facilities & Shelters
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#102A43]">
                {isLoadingResources ? <Skeleton className="h-8 w-12" /> : resources.length}
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {activeResourcesCount} active
              </span>
            </div>
            <Link
              href="/admin/resources"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
            >
              Manage Directory <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Events Card */}
        <Card className="border-slate-200 shadow-xs hover:border-purple-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mock Drills
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#102A43]">
                {isLoadingEvents ? <Skeleton className="h-8 w-12" /> : events.length}
              </span>
              <span className="text-xs font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                {upcomingEventsCount} upcoming
              </span>
            </div>
            <Link
              href="/admin/events"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:underline"
            >
              Inspect Drills <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Discovered Accounts
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#102A43]">
                {isLoadingUsers ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  usersData?.totalDiscovered || 0
                )}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                verified
              </span>
            </div>
            <Link
              href="/admin/users"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:underline"
            >
              User Directory <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 3. Recharts Visualizations Grid (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Incident Lifecycle Distribution */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#102A43]">
                  Incident Report Lifecycle
                </CardTitle>
                <CardDescription className="text-xs">
                  Ground incidents distribution by triage status
                </CardDescription>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {incidents.length} total
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {mounted && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incidentStatusData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {incidentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Alerts by Hazard Severity */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#102A43]">
                  Advisories by Severity
                </CardTitle>
                <CardDescription className="text-xs">
                  Active and historical hazard alerts across the municipality
                </CardDescription>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {alerts.length} alerts
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {mounted && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alertSeverityData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {alertSeverityData.map((entry, index) => (
                        <Cell key={`sev-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Emergency Resource Distribution */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#102A43]">
                  Emergency Infrastructure by Facility Type
                </CardTitle>
                <CardDescription className="text-xs">
                  Shelters, medical facilities, depots, and dispatch points
                </CardDescription>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {resources.length} units
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {mounted && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={resourceTypeData}
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 10 }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="count" fill="#1769AA" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Platform Accounts by Role */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#102A43]">
                  Discovered Platform Roles
                </CardTitle>
                <CardDescription className="text-xs">
                  Identified actors across field operations and coordination
                </CardDescription>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {usersData?.totalDiscovered || 0} discovered
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {mounted && (
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRolesData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {userRolesData.map((entry, index) => (
                        <Cell key={`role-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => <span className="text-xs text-slate-600">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Live Operation Queues & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Incident Triage Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#1769AA]" />
              <h3 className="font-bold text-sm text-[#102A43]">
                Recent Incoming Incident Reports
              </h3>
            </div>
            <Link
              href="/admin/incidents"
              className="text-xs font-semibold text-[#1769AA] hover:underline"
            >
              View All ({incidents.length})
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            {isLoadingIncidents ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-4 bg-slate-200 rounded w-48" />
                    <div className="h-3 bg-slate-200 rounded w-28" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded-full w-20" />
                </div>
              ))
            ) : incidents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                No ground incident reports recorded.
              </div>
            ) : (
              incidents.slice(0, 5).map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-[#172B4D] truncate">{inc.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo(inc.createdAt)}</span>
                      <span>•</span>
                      <span className="truncate">{inc.address || 'Reported Location'}</span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      inc.status === 'SUBMITTED'
                        ? 'bg-blue-50 text-[#1769AA] border border-blue-200'
                        : inc.status === 'UNDER_REVIEW'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : inc.status === 'VERIFIED'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {inc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Alerts Stream */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#DC3545]" />
              <h3 className="font-bold text-sm text-[#102A43]">Live Civil Warnings</h3>
            </div>
            <Link
              href="/admin/alerts"
              className="text-xs font-semibold text-[#DC3545] hover:underline"
            >
              Broadcast Studio ({alerts.length})
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            {isLoadingAlerts ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-4 bg-slate-200 rounded w-48" />
                    <div className="h-3 bg-slate-200 rounded w-32" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded-full w-16" />
                </div>
              ))
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                No active hazard advisories currently broadcasting.
              </div>
            ) : (
              alerts.slice(0, 5).map((al) => (
                <div
                  key={al.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-xs text-[#172B4D] truncate">{al.title}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>Radius: {al.radius || 10}km</span>
                      <span>•</span>
                      <span>Issued: {formatDate(al.createdAt)}</span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. Useful Administrative Quick Actions */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold">Administrative Command Shortcuts</h3>
            <p className="text-xs text-slate-400 mt-1">
              Direct access to system creation wizards, emergency broadcasts, and platform directories.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/disasters"
            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Disaster Catalog</p>
              <p className="text-[11px] text-slate-400">Add or edit hazard SOP</p>
            </div>
          </Link>

          <Link
            href="/admin/alerts"
            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Broadcast Warning</p>
              <p className="text-[11px] text-slate-400">Issue civil hazard alert</p>
            </div>
          </Link>

          <Link
            href="/admin/resources"
            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Deploy Asset</p>
              <p className="text-[11px] text-slate-400">Add shelter or hospital</p>
            </div>
          </Link>

          <Link
            href="/admin/events"
            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Schedule Mock Drill</p>
              <p className="text-[11px] text-slate-400">Plan preparation drill</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
