'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  FileText,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Flame,
  PlusCircle,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { alertService } from '@/services/alertService';
import { incidentService } from '@/services/incident.service';
import { eventService } from '@/services/eventService';
import { resourceService } from '@/services/resourceService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import {
  formatDate,
  formatDateTime,
  getSeverityBadgeStyles,
  getStatusBadgeStyles,
  timeAgo,
} from '@/lib/utils';
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
} from 'recharts';

export default function AuthorityDashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Query Active Alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['authority-dashboard-alerts'],
    queryFn: () => alertService.getAlerts({ status: 'ACTIVE', limit: 10 }),
  });

  // 2. Query All Incidents for Triage Metrics
  const { data: incidentsData, isLoading: incidentsLoading } = useQuery({
    queryKey: ['authority-dashboard-incidents'],
    queryFn: () => incidentService.getAllIncidents({ limit: 100 }),
  });

  // 3. Query Upcoming Events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['authority-dashboard-events'],
    queryFn: () => eventService.getEvents({ status: 'UPCOMING', limit: 5 }),
  });

  // 4. Query Emergency Resources
  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ['authority-dashboard-resources'],
    queryFn: () => resourceService.getResources({ limit: 100 }),
  });

  const activeAlerts = alertsData?.alerts || [];
  const incidents = incidentsData?.reports || [];
  const upcomingEvents = eventsData?.events || [];
  const resources = resourcesData?.resources || [];

  // Compute Incident Metrics
  const submittedCount = incidents.filter((i) => i.status === 'SUBMITTED').length;
  const underReviewCount = incidents.filter((i) => i.status === 'UNDER_REVIEW').length;
  const verifiedCount = incidents.filter((i) => i.status === 'VERIFIED').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;
  const rejectedCount = incidents.filter((i) => i.status === 'REJECTED').length;

  // Compute Resource Metrics
  const operationalResourcesCount = resources.filter((r) => r.isActive).length;

  // Chart Data: Incident Status Lifecycle
  const incidentStatusChartData = [
    { name: 'Submitted', count: submittedCount, fill: '#F59E0B' },
    { name: 'Under Review', count: underReviewCount, fill: '#1769AA' },
    { name: 'Verified', count: verifiedCount, fill: '#DC3545' },
    { name: 'Resolved', count: resolvedCount, fill: '#16A34A' },
    { name: 'Rejected', count: rejectedCount, fill: '#64748B' },
  ];

  // Chart Data: Resource Categories
  const resourceCategoriesMap: Record<string, number> = {};
  resources.forEach((r) => {
    const key = r.type.replace('_', ' ');
    resourceCategoriesMap[key] = (resourceCategoriesMap[key] || 0) + 1;
  });
  const resourceChartData = Object.entries(resourceCategoriesMap).map(([type, count]) => ({
    name: type,
    count,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ========================================================
          1. EOC COMMAND BANNER & QUICK OPERATIONS
          ======================================================== */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102A43] via-[#102A43] to-[#1A365D] text-white p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-200">
              <ShieldAlert className="h-4 w-4 text-[#DC3545]" />
              Emergency Operations Center • Duty Watch
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Command Station: Officer {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Supervise regional civil defense operations, broadcast high-priority hazard warnings, evaluate field incident reports, and dispatch emergency response resources.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/authority/alerts">
              <Button size="sm" className="bg-[#DC3545] hover:bg-red-700 text-white font-bold gap-2 text-xs shadow-md">
                <Radio className="h-4 w-4" />
                Broadcast Alert
              </Button>
            </Link>
            <Link href="/authority/incidents">
              <Button size="sm" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold gap-2 text-xs">
                <FileText className="h-4 w-4 text-amber-300" />
                Triage Incidents ({submittedCount})
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. OPERATIONAL SUMMARY METRIC CARDS
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Active Alerts */}
        <Card className="border border-red-200 bg-red-50/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Active Alerts</span>
            <Radio className="h-4 w-4 text-[#DC3545]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#102A43]">
            {alertsLoading ? <Skeleton className="h-8 w-12" /> : activeAlerts.length}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Live broadcasts</p>
        </Card>

        {/* Pending Incidents */}
        <Card className="border border-amber-200 bg-amber-50/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#102A43]">
            {incidentsLoading ? <Skeleton className="h-8 w-12" /> : submittedCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Awaiting verification</p>
        </Card>

        {/* Verified Incidents */}
        <Card className="border border-blue-200 bg-blue-50/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1769AA]">Verified Hazards</span>
            <ShieldAlert className="h-4 w-4 text-[#1769AA]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#102A43]">
            {incidentsLoading ? <Skeleton className="h-8 w-12" /> : verifiedCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Confirmed on ground</p>
        </Card>

        {/* Resolved Incidents */}
        <Card className="border border-emerald-200 bg-emerald-50/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#102A43]">
            {incidentsLoading ? <Skeleton className="h-8 w-12" /> : resolvedCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Mitigated hazards</p>
        </Card>

        {/* Upcoming Mock Drills */}
        <Card className="border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Upcoming Drills</span>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#102A43]">
            {eventsLoading ? <Skeleton className="h-8 w-12" /> : upcomingEvents.length}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Scheduled sessions</p>
        </Card>

        {/* Operational Facilities */}
        <Card className="border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Active Facilities</span>
            <Building2 className="h-4 w-4 text-slate-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#102A43]">
            {resourcesLoading ? <Skeleton className="h-8 w-12" /> : operationalResourcesCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Shelters & stations</p>
        </Card>
      </div>

      {/* ========================================================
          3. REAL-TIME RECHARTS ANALYTICS
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Lifecycle Bar Chart */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#102A43] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#1769AA]" />
                Incident Reports Triage Lifecycle
              </CardTitle>
              <CardDescription className="text-xs">
                Real distribution of community reports across active processing stages
              </CardDescription>
            </div>
            <Link href="/authority/incidents" className="text-xs font-semibold text-[#1769AA] hover:underline flex items-center gap-1">
              Manage &rarr;
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {incidents.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-xs">
                No incidents reported yet.
              </div>
            ) : mounted ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incidentStatusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#102A43] text-white text-xs p-2 rounded-lg shadow-lg">
                              <p className="font-bold">{data.name}</p>
                              <p className="text-blue-200 mt-0.5">{data.count} reports</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {incidentStatusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
            )}
          </CardContent>
        </Card>

        {/* Resources Distribution Bar Chart */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#102A43] flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#1769AA]" />
                Emergency Facilities Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Operational shelter capacities and emergency response stations logged
              </CardDescription>
            </div>
            <Link href="/authority/resources" className="text-xs font-semibold text-[#1769AA] hover:underline flex items-center gap-1">
              Directory &rarr;
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {resourceChartData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-xs">
                No resource data available.
              </div>
            ) : mounted ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#102A43] text-white text-xs p-2 rounded-lg shadow-lg">
                              <p className="font-bold">{data.name}</p>
                              <p className="text-blue-200 mt-0.5">{data.count} facilities</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="#1769AA" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========================================================
          4. RECENT OPERATIONAL ACTIVITY (TWO-COLUMN DESK)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Incidents Table */}
        <Card className="border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#102A43] flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                Latest Incident Submissions
              </CardTitle>
              <CardDescription className="text-xs">
                Incoming ground reports requiring verification or action
              </CardDescription>
            </div>
            <Link href="/authority/incidents">
              <Button variant="ghost" size="sm" className="text-xs text-[#1769AA] gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-slate-100 flex-1">
            {incidentsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No incident reports currently recorded in database.
              </div>
            ) : (
              incidents.slice(0, 4).map((inc) => (
                <div key={inc.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeStyles(inc.status)}`}>
                        {inc.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(inc.createdAt)}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#102A43] truncate">{inc.title}</h4>
                    {inc.address && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                        {inc.address}
                      </p>
                    )}
                  </div>
                  <Link href={`/authority/incidents?reportId=${inc.id}`}>
                    <Button size="sm" variant="outline" className="text-xs text-[#1769AA] border-blue-200 hover:bg-blue-50 shrink-0">
                      Triage
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active Emergency Broadcasts Table */}
        <Card className="border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#102A43] flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#DC3545]" />
                Live Broadcast Advisories
              </CardTitle>
              <CardDescription className="text-xs">
                Civil defense warnings currently broadcast to citizens
              </CardDescription>
            </div>
            <Link href="/authority/alerts">
              <Button variant="ghost" size="sm" className="text-xs text-[#1769AA] gap-1">
                Studio <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-slate-100 flex-1">
            {alertsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : activeAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active broadcasts. All regions in normal readiness.
              </div>
            ) : (
              activeAlerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSeverityBadgeStyles(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Issued {timeAgo(alert.issuedAt || alert.createdAt)}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#102A43] truncate">{alert.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{alert.description}</p>
                  </div>
                  <Link href={`/authority/alerts?alertId=${alert.id}`}>
                    <Button size="sm" variant="outline" className="text-xs text-[#DC3545] border-red-200 hover:bg-red-50 shrink-0">
                      Manage
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
