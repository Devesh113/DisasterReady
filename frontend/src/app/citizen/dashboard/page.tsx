'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Calendar,
  CheckSquare,
  FileText,
  Bell,
  ArrowRight,
  Radio,
  Building2,
  Users,
  ShieldCheck,
  PlusCircle,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { alertService } from '@/services/alertService';
import { eventService } from '@/services/eventService';
import { resourceService } from '@/services/resourceService';
import { incidentService } from '@/services/incident.service';
import { preparednessService } from '@/services/preparedness.service';
import { notificationService } from '@/services/notification.service';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, formatDateTime, getSeverityBadgeStyles, getStatusBadgeStyles, timeAgo } from '@/lib/utils';

export default function CitizenDashboardPage() {
  const { user } = useAuth();

  // 1. Fetch active alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['citizen-active-alerts'],
    queryFn: () => alertService.getAlerts({ status: 'ACTIVE', limit: 3 }),
  });

  // 2. Fetch upcoming events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['citizen-upcoming-events'],
    queryFn: () => eventService.getEvents({ status: 'UPCOMING', limit: 3 }),
  });

  // 3. Fetch emergency resources preview
  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ['citizen-resources-preview'],
    queryFn: () => resourceService.getResources({ limit: 3 }),
  });

  // 4. Fetch citizen's own incident reports
  const { data: incidentsData, isLoading: incidentsLoading } = useQuery({
    queryKey: ['citizen-my-incidents-preview'],
    queryFn: () => incidentService.getMyIncidents({ limit: 3 }),
  });

  // 5. Fetch preparedness kit stats
  const { data: kitStats, isLoading: kitLoading } = useQuery({
    queryKey: ['citizen-kit-stats'],
    queryFn: () => preparednessService.getStats(),
  });

  // 6. Fetch recent notifications
  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['citizen-recent-notifications'],
    queryFn: () => notificationService.getNotifications({ limit: 4 }),
  });

  const alerts = alertsData?.alerts || [];
  const events = eventsData?.events || [];
  const resources = resourcesData?.resources || [];
  const myIncidents = incidentsData?.reports || [];
  const notifications = notificationsData?.data || [];

  const readinessPercent = kitStats?.readinessPercentage ?? 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ========================================================
          1. WELCOME BANNER & QUICK ACTIONS
          ======================================================== */}
      <div className="rounded-2xl bg-gradient-to-r from-[#102A43] via-[#102A43] to-[#172B4D] text-white p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-200">
              <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
              Citizen Preparedness Command
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.firstName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Your personalized hub for live community hazard warnings, family survival kits, mock drills, and incident reporting.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/citizen/reports">
              <Button variant="emergency" size="sm" className="gap-2 shadow-xs">
                <AlertTriangle className="h-4 w-4" />
                Report Incident
              </Button>
            </Link>
            <Link href="/citizen/map">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 gap-2">
                <MapPin className="h-4 w-4 text-blue-300" />
                Nearest Shelters
              </Button>
            </Link>
            <Link href="/citizen/preparedness">
              <Button variant="primary" size="sm" className="gap-2 shadow-xs">
                <CheckSquare className="h-4 w-4" />
                Checklist ({readinessPercent}%)
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. METRICS OVERVIEW STRIP
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Regional Alerts */}
        <Card className="p-5 border-[#D9E2EC]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#627D98] uppercase tracking-wider">
              Active Alerts
            </span>
            <div className="h-8 w-8 rounded-lg bg-red-100 text-[#DC3545] flex items-center justify-center">
              <Radio className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#102A43]">
              {alertsLoading ? '—' : alerts.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">broadcasts in zone</span>
          </div>
          <Link href="/citizen/alerts" className="text-xs text-[#1769AA] hover:underline font-semibold mt-3 inline-block">
            View active alerts &rarr;
          </Link>
        </Card>

        {/* Metric 2: Kit Readiness */}
        <Card className="p-5 border-[#D9E2EC]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#627D98] uppercase tracking-wider">
              Emergency Kit
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-[#16A34A] flex items-center justify-center">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#102A43]">
              {kitLoading ? '—' : `${readinessPercent}%`}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({kitStats?.readyItems || 0} / {kitStats?.totalItems || 0} items)
            </span>
          </div>
          <Link href="/citizen/preparedness" className="text-xs text-[#1769AA] hover:underline font-semibold mt-3 inline-block">
            Update supplies checklist &rarr;
          </Link>
        </Card>

        {/* Metric 3: My Incident Reports */}
        <Card className="p-5 border-[#D9E2EC]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#627D98] uppercase tracking-wider">
              My Ground Reports
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-[#1769AA] flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#102A43]">
              {incidentsLoading ? '—' : myIncidents.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">submitted</span>
          </div>
          <Link href="/citizen/reports" className="text-xs text-[#1769AA] hover:underline font-semibold mt-3 inline-block">
            Track report statuses &rarr;
          </Link>
        </Card>

        {/* Metric 4: Upcoming Drills */}
        <Card className="p-5 border-[#D9E2EC]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#627D98] uppercase tracking-wider">
              Public Drills
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-[#B45309] flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#102A43]">
              {eventsLoading ? '—' : events.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">scheduled</span>
          </div>
          <Link href="/citizen/events" className="text-xs text-[#1769AA] hover:underline font-semibold mt-3 inline-block">
            Register for sessions &rarr;
          </Link>
        </Card>
      </div>

      {/* ========================================================
          3. MAIN DASHBOARD TWO-COLUMN LAYOUT
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Alerts Feed & Drills */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active Alerts Card */}
          <Card className="border-[#D9E2EC]">
            <CardHeader className="border-b border-[#D9E2EC] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-[#102A43]">
                  <Radio className="h-5 w-5 text-[#DC3545] animate-pulse" />
                  Active Emergency Advisories
                </CardTitle>
                <Link href="/citizen/alerts" className="text-xs font-semibold text-[#1769AA] hover:underline">
                  All Alerts ({alerts.length}) &rarr;
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-4 divide-y divide-[#D9E2EC]">
              {alertsLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : alerts.length > 0 ? (
                alerts.map((alert) => {
                  const badge = getSeverityBadgeStyles(alert.severity);
                  return (
                    <div key={alert.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.bg}`}>
                          {alert.severity} Severity
                        </span>
                        <span className="text-xs text-[#627D98]">{timeAgo(alert.issuedAt)}</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#102A43]">
                        <Link href={`/citizen/alerts`} className="hover:text-[#1769AA]">
                          {alert.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-[#627D98] line-clamp-2">
                        {alert.description}
                      </p>
                      {alert.radius && (
                        <span className="text-[11px] text-slate-500 block pt-1">
                          📍 Affected radius: {alert.radius} km
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-[#627D98]">
                  No active emergency broadcasts at this time. Normal operational status.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Mock Drills Card */}
          <Card className="border-[#D9E2EC]">
            <CardHeader className="border-b border-[#D9E2EC] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-[#102A43]">
                  <Calendar className="h-5 w-5 text-[#1769AA]" />
                  Upcoming Community Preparedness Drills
                </CardTitle>
                <Link href="/citizen/events" className="text-xs font-semibold text-[#1769AA] hover:underline">
                  Browse All &rarr;
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-4 divide-y divide-[#D9E2EC]">
              {eventsLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : events.length > 0 ? (
                events.map((evt) => (
                  <div key={evt.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="brand">{evt.status}</Badge>
                        <span className="text-xs text-[#627D98] font-medium flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(evt.startDate)}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#102A43]">{evt.title}</h4>
                      <p className="text-xs text-[#627D98] flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#1769AA] shrink-0" />
                        <span className="line-clamp-1">{evt.location}</span>
                      </p>
                    </div>

                    <Link href={`/citizen/events`}>
                      <Button variant="outline" size="sm" className="shrink-0 text-xs">
                        View Details
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#627D98]">
                  No upcoming mock drills currently scheduled.
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Recent Reports Card */}
          <Card className="border-[#D9E2EC]">
            <CardHeader className="border-b border-[#D9E2EC] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-[#102A43]">
                  <FileText className="h-5 w-5 text-[#1769AA]" />
                  My Ground Incident Reports
                </CardTitle>
                <Link href="/citizen/reports" className="text-xs font-semibold text-[#1769AA] hover:underline">
                  Submit New Report &rarr;
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-4 divide-y divide-[#D9E2EC]">
              {incidentsLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : myIncidents.length > 0 ? (
                myIncidents.map((inc) => (
                  <div key={inc.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getStatusBadgeStyles(inc.status)}`}>
                        {inc.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-[#627D98]">{timeAgo(inc.createdAt)}</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#102A43]">{inc.title}</h4>
                    <p className="text-xs text-[#627D98] line-clamp-1">{inc.description}</p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#627D98]">
                  You have not submitted any incident reports yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 4 Cols: Preparedness Progress, Notifications, Shelters */}
        <div className="lg:col-span-4 space-y-8">
          {/* Preparedness Completion Widget */}
          <Card className="border-[#D9E2EC] bg-white">
            <CardHeader className="border-b border-[#D9E2EC] pb-4">
              <CardTitle className="text-base flex items-center gap-2 text-[#102A43]">
                <CheckSquare className="h-5 w-5 text-[#16A34A]" />
                Preparedness Kit
              </CardTitle>
              <CardDescription className="text-xs">
                Personal 72-hour family emergency supplies
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#102A43]">Overall Readiness</span>
                <span className="font-bold text-[#16A34A] text-sm">{readinessPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#16A34A] rounded-full transition-all"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>

              <div className="text-xs text-[#627D98] flex items-center justify-between pt-1">
                <span>Completed: <strong>{kitStats?.readyItems || 0}</strong></span>
                <span>Remaining: <strong>{kitStats?.notReadyItems || 0}</strong></span>
              </div>

              <Link href="/citizen/preparedness" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full justify-center">
                  Open Interactive Checklist
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Notifications Widget */}
          <Card className="border-[#D9E2EC] bg-white">
            <CardHeader className="border-b border-[#D9E2EC] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-[#102A43]">
                  <Bell className="h-5 w-5 text-[#1769AA]" />
                  Notifications
                </CardTitle>
                <Link href="/citizen/notifications" className="text-xs font-semibold text-[#1769AA] hover:underline">
                  All &rarr;
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-[#D9E2EC]">
              {notificationsLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : notifications.length > 0 ? (
                notifications.slice(0, 3).map((notif) => (
                  <div key={notif.id} className="py-2.5 first:pt-0 last:pb-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-[#102A43] truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#627D98] line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[#627D98]">
                  No new notifications.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Safe Shelters Widget */}
          <Card className="border-[#D9E2EC] bg-white">
            <CardHeader className="border-b border-[#D9E2EC] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-[#102A43]">
                  <Building2 className="h-5 w-5 text-[#1769AA]" />
                  Nearby Shelters
                </CardTitle>
                <Link href="/citizen/map" className="text-xs font-semibold text-[#1769AA] hover:underline">
                  Map &rarr;
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-[#D9E2EC]">
              {resourcesLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : resources.length > 0 ? (
                resources.slice(0, 3).map((res) => (
                  <div key={res.id} className="py-2.5 first:pt-0 last:pb-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#102A43] truncate">{res.name}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-[#627D98] truncate">{res.address}</p>
                    {res.phone && (
                      <a href={`tel:${res.phone}`} className="text-[11px] text-[#1769AA] font-semibold hover:underline block pt-0.5">
                        📞 {res.phone}
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[#627D98]">
                  No shelter facilities listed yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
