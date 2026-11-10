'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Waves,
  Activity,
  Wind,
  Mountain,
  Factory,
  Radio,
  Calendar,
  MapPin,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Users,
  Building2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { alertService } from '@/services/alertService';
import { eventService } from '@/services/eventService';
import { resourceService } from '@/services/resourceService';
import { disasterService } from '@/services/disasterService';
import { formatDate, formatDateTime, getSeverityBadgeStyles, timeAgo } from '@/lib/utils';

export default function HomePage() {
  // 1. Fetch live active alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['landing-alerts'],
    queryFn: () => alertService.getAlerts({ limit: 3, status: 'ACTIVE' }),
  });

  // 2. Fetch upcoming events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['landing-events'],
    queryFn: () => eventService.getEvents({ limit: 3, status: 'UPCOMING' }),
  });

  // 3. Fetch emergency resources preview
  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ['landing-resources'],
    queryFn: () => resourceService.getResources({ limit: 3 }),
  });

  // 4. Fetch disaster taxonomy
  const { data: disastersData, isLoading: disastersLoading } = useQuery({
    queryKey: ['landing-disasters'],
    queryFn: () => disasterService.getDisasters({ limit: 8 }),
  });

  const alerts = alertsData?.alerts || [];
  const events = eventsData?.events || [];
  const resources = resourcesData?.resources || [];
  const disasters = disastersData?.disasters || [];

  // Static curriculum categories matching prompt
  const disasterCategories = [
    {
      title: 'Earthquake',
      type: 'EARTHQUAKE',
      icon: Activity,
      color: 'bg-amber-500',
      description: 'Sudden tectonic fault slippages causing ground shaking, structural collapse, and aftershocks.',
      rule: 'Drop, Cover, and Hold On under heavy furniture.',
    },
    {
      title: 'Flood',
      type: 'FLOOD',
      icon: Waves,
      color: 'bg-blue-500',
      description: 'Rising river basins, dam discharges, or cloudbursts causing inundation of residential zones.',
      rule: 'Never walk or drive into moving water ("Turn Around, Don’t Drown").',
    },
    {
      title: 'Cyclone & Storms',
      type: 'CYCLONE',
      icon: Wind,
      color: 'bg-teal-500',
      description: 'Intense low-pressure weather systems with torrential rain, storm surges, and destructive winds.',
      rule: 'Board windows, move away from coastlines, store 72h potable water.',
    },
    {
      title: 'Tsunami',
      type: 'TSUNAMI',
      icon: Waves,
      color: 'bg-indigo-600',
      description: 'Giant ocean surges triggered by undersea earthquakes or landslides impacting coastal zones.',
      rule: 'Move immediately inland and to high ground if ground shaking is felt.',
    },
    {
      title: 'Landslide',
      type: 'LANDSLIDE',
      icon: Mountain,
      color: 'bg-amber-700',
      description: 'Mass downward movement of soil, rock, and debris down slopes during heavy monsoon rains.',
      rule: 'Stay alert for cracking sounds and sudden stream muddying; evacuate slopes.',
    },
    {
      title: 'Wildfire',
      type: 'WILDFIRE',
      icon: Flame,
      color: 'bg-orange-600',
      description: 'Fast-spreading fires through vegetation in arid and forest areas threatening settlements.',
      rule: 'Clear defensible space around structures; follow early evacuation orders.',
    },
    {
      title: 'Industrial & Chemical',
      type: 'INDUSTRIAL_ACCIDENT',
      icon: Factory,
      color: 'bg-red-600',
      description: 'Hazardous gas leaks, chemical spills, or toxic fires originating from factory complexes.',
      rule: 'Shelter in place, seal windows and vents, breathe through damp cloth.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* ========================================================
          1. HERO SECTION
          ======================================================== */}
      <section className="relative bg-gradient-to-b from-[#102A43] via-[#102A43] to-[#172B4D] text-white py-20 lg:py-28 overflow-hidden">
        {/* Background grid accent */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur border border-white/20">
                <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
                Community Preparedness & Emergency Response Network
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Be Aware. Be Prepared. <br />
                <span className="text-[#64B5F6]">Save Lives Together.</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed font-normal">
                DisasterReady bridges the gap between public awareness, personal emergency readiness, and authority coordination through real-time hazard alerts, scientific drills, and safe shelter locators.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/awareness">
                  <Button variant="primary" size="lg" className="gap-2 text-base font-semibold shadow-lg">
                    <ShieldCheck className="h-5 w-5" />
                    Get Prepared
                  </Button>
                </Link>
                <Link href="/alerts">
                  <Button variant="emergency" size="lg" className="gap-2 text-base font-semibold shadow-lg">
                    <Radio className="h-5 w-5 animate-pulse" />
                    Explore Live Alerts
                  </Button>
                </Link>
                <Link href="/resources">
                  <Button variant="outline" size="lg" className="gap-2 text-white border-white/30 bg-white/5 hover:bg-white/10">
                    <MapPin className="h-5 w-5 text-slate-300" />
                    Find Shelters
                  </Button>
                </Link>
              </div>

              {/* Quick Trust Pillars */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-xs text-slate-300">
                <div>
                  <span className="font-bold text-white block text-sm">Real-Time</span>
                  Authority hazard broadcasts
                </div>
                <div>
                  <span className="font-bold text-white block text-sm">Actionable</span>
                  Step-by-step safety guidelines
                </div>
                <div>
                  <span className="font-bold text-white block text-sm">Coordinated</span>
                  Verified safe shelters & drills
                </div>
              </div>
            </div>

            {/* Hero Interactive Alert Card Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-red-400 animate-pulse" />
                    <span className="text-sm font-bold uppercase tracking-wider text-white">
                      Active Emergency Feed
                    </span>
                  </div>
                  <Link href="/alerts" className="text-xs text-blue-300 hover:text-white flex items-center gap-1 font-medium">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {alertsLoading ? (
                  <div className="space-y-3 py-4">
                    <Skeleton className="h-16 w-full bg-white/10" />
                    <Skeleton className="h-16 w-full bg-white/10" />
                  </div>
                ) : alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.slice(0, 2).map((alert) => {
                      const badge = getSeverityBadgeStyles(alert.severity);
                      return (
                        <Link
                          key={alert.id}
                          href={`/alerts/${alert.id}`}
                          className="block p-4 rounded-xl bg-white/90 text-[#172B4D] hover:bg-white transition-all shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.bg}`}>
                              {alert.severity} Severity
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {timeAgo(alert.issuedAt)}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[#102A43] line-clamp-1 mb-1">
                            {alert.title}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {alert.description}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white">No Critical Alerts Active</p>
                    <p className="text-xs text-slate-300 mt-1">
                      All regional disaster monitoring systems report normal operational conditions.
                    </p>
                  </div>
                )}

                <div className="pt-2 text-center">
                  <Link href="/events" className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Upcoming Community Mock Drills Available &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. LIVE ALERTS HIGHLIGHT STRIP
          ======================================================== */}
      {alerts.length > 0 && (
        <section className="bg-red-50 border-b border-red-200 py-3 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-[#DC3545] animate-ping" />
              <div className="text-sm text-red-900 font-medium">
                <strong className="font-bold text-[#DC3545]">Active Advisory:</strong>{' '}
                {alerts[0].title} — <span className="hidden sm:inline">{alerts[0].description.slice(0, 80)}...</span>
              </div>
            </div>
            <Link href={`/alerts/${alerts[0].id}`}>
              <Button variant="emergency" size="sm" className="shrink-0 text-xs py-1">
                Read Full Advisory
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================
          3. HOW DISASTERREADY WORKS
          ======================================================== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="brand">Resilience Lifecycle</Badge>
            <h2 className="text-3xl font-extrabold text-[#102A43] sm:text-4xl">
              How DisasterReady Protects Your Community
            </h2>
            <p className="text-base text-[#627D98]">
              A complete preparedness and response framework designed to eliminate information asymmetry and empower rapid, calm action during crisis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl border border-[#D9E2EC] bg-[#F5F7FA] space-y-4 hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1769AA] text-white font-bold text-lg shadow-sm">
                1
              </div>
              <h3 className="text-xl font-bold text-[#102A43]">Learn</h3>
              <p className="text-sm text-[#627D98] leading-relaxed">
                Access verified scientific safety guidelines, hazard causes, and dos-and-don&apos;ts for 10+ disaster types.
              </p>
              <Link href="/awareness" className="text-xs font-semibold text-[#1769AA] flex items-center gap-1 hover:underline">
                Explore guides <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl border border-[#D9E2EC] bg-[#F5F7FA] space-y-4 hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#16A34A] text-white font-bold text-lg shadow-sm">
                2
              </div>
              <h3 className="text-xl font-bold text-[#102A43]">Prepare</h3>
              <p className="text-sm text-[#627D98] leading-relaxed">
                Build a personal 72-hour emergency kit for food, water, documents, and first aid with readiness tracking.
              </p>
              <Link href="/register" className="text-xs font-semibold text-[#16A34A] flex items-center gap-1 hover:underline">
                Start your kit <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl border border-[#D9E2EC] bg-[#F5F7FA] space-y-4 hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F59E0B] text-white font-bold text-lg shadow-sm">
                3
              </div>
              <h3 className="text-xl font-bold text-[#102A43]">Practise</h3>
              <p className="text-sm text-[#627D98] leading-relaxed">
                Register for community evacuation drills, training sessions, and interactive 3D WebGL disaster scenarios.
              </p>
              <Link href="/events" className="text-xs font-semibold text-[#B45309] flex items-center gap-1 hover:underline">
                Find mock drills <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Step 4 */}
            <div className="relative p-6 rounded-2xl border border-[#D9E2EC] bg-[#F5F7FA] space-y-4 hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DC3545] text-white font-bold text-lg shadow-sm">
                4
              </div>
              <h3 className="text-xl font-bold text-[#102A43]">Respond</h3>
              <p className="text-sm text-[#627D98] leading-relaxed">
                Locate verified safe shelters on interactive maps and report localized incidents directly to authorities.
              </p>
              <Link href="/resources" className="text-xs font-semibold text-[#DC3545] flex items-center gap-1 hover:underline">
                Open shelter map <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. DISASTER CATEGORIES
          ======================================================== */}
      <section className="py-20 bg-[#F5F7FA] border-y border-[#D9E2EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <Badge variant="brand" className="mb-2">Disaster Awareness Hub</Badge>
              <h2 className="text-3xl font-extrabold text-[#102A43]">
                Knowledge is the First Line of Defense
              </h2>
              <p className="text-base text-[#627D98] mt-1 max-w-2xl">
                Explore standardized emergency procedures, warning signs, and life-saving checklists across major natural and human-induced hazards.
              </p>
            </div>
            <Link href="/awareness">
              <Button variant="outline" size="sm" className="gap-2">
                Browse All Guides <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {disasterCategories.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`h-11 w-11 rounded-lg ${item.color} flex items-center justify-center text-white shadow-xs`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#102A43]">{item.title}</h3>
                      <p className="text-xs text-[#627D98] mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-3 text-xs text-[#102A43]">
                      <span className="font-bold text-[#1769AA] block mb-0.5">Core Rule:</span>
                      {item.rule}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#D9E2EC]">
                    <Link
                      href="/awareness"
                      className="text-xs font-semibold text-[#1769AA] hover:text-[#125386] flex items-center gap-1"
                    >
                      Read full safety guide <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          5. UPCOMING DRILLS & EVENTS PREVIEW
          ======================================================== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <Badge variant="warning" className="mb-2">Practical Training</Badge>
              <h2 className="text-3xl font-extrabold text-[#102A43]">
                Upcoming Mock Drills & Community Workshops
              </h2>
              <p className="text-base text-[#627D98] mt-1 max-w-2xl">
                Join certified first-responder training, school safety drills, and evacuation simulations organised by local disaster authorities.
              </p>
            </div>
            <Link href="/events">
              <Button variant="outline" size="sm" className="gap-2">
                View All Events <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((evt) => (
                <Card key={evt.id} className="flex flex-col justify-between hover:border-[#1769AA] transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="brand">{evt.status}</Badge>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(evt.startDate)}
                      </span>
                    </div>
                    <CardTitle className="text-base line-clamp-1">{evt.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {evt.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-[#627D98]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#1769AA] shrink-0" />
                      <span className="line-clamp-1">{evt.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        Capacity: {evt.registrationCount ?? 0}
                        {evt.capacity ? ` / ${evt.capacity} registered` : ' participants'}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-[#D9E2EC] pt-4">
                    <Link href={`/events/${evt.id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full justify-center">
                        View Drill Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-dashed border-[#D9E2EC] text-center bg-[#F5F7FA]">
              <Calendar className="h-8 w-8 text-[#627D98] mx-auto mb-2" />
              <h4 className="font-bold text-sm text-[#102A43]">No Scheduled Public Drills at this Moment</h4>
              <p className="text-xs text-[#627D98] max-w-md mx-auto mt-1">
                Authorities post new mock drills periodically. Check back soon or register to receive notifications.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          6. EMERGENCY RESOURCES PREVIEW
          ======================================================== */}
      <section className="py-20 bg-[#F5F7FA] border-t border-[#D9E2EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <Badge variant="emergency">Geospatial Locator</Badge>
              <h2 className="text-3xl font-extrabold text-[#102A43] sm:text-4xl">
                Locate Verified Safe Shelters & Emergency Resources
              </h2>
              <p className="text-base text-[#627D98] leading-relaxed">
                When a catastrophe strikes, knowing where to take shelter can save your family. DisasterReady maps verified relief centers, medical facilities, fire stations, and supply distribution corridors.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1769AA] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="text-sm">
                    <strong className="text-[#102A43] block">Community Safe Shelters</strong>
                    Reinforced structures equipped for multi-day habitation during storms and quakes.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-[#DC3545] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="text-sm">
                    <strong className="text-[#102A43] block">Trauma & Emergency Care Units</strong>
                    Hospital locator with direct phone contact and operational capacity tracking.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[#16A34A] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="text-sm">
                    <strong className="text-[#102A43] block">Supply & Corridors Hubs</strong>
                    Designated water distribution points, first-aid posts, and safe evacuation corridors.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/resources">
                  <Button variant="primary" size="lg" className="gap-2">
                    <MapPin className="h-5 w-5" />
                    Open Interactive Emergency Map
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick list preview card */}
            <div className="lg:col-span-6">
              <Card className="shadow-md">
                <CardHeader className="border-b border-[#D9E2EC] bg-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#1769AA]" />
                      Verified Emergency Facilities
                    </CardTitle>
                    <Link href="/resources" className="text-xs text-[#1769AA] hover:underline font-semibold">
                      Full Directory &rarr;
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-[#D9E2EC]">
                  {resourcesLoading ? (
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : resources.length > 0 ? (
                    resources.slice(0, 3).map((res) => (
                      <div key={res.id} className="p-4 hover:bg-[#F5F7FA] transition-colors flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {res.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-emerald-600 font-semibold">Active</span>
                          </div>
                          <h4 className="font-bold text-sm text-[#102A43]">{res.name}</h4>
                          <p className="text-xs text-[#627D98] flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {res.address}
                          </p>
                        </div>
                        {res.phone && (
                          <a
                            href={`tel:${res.phone}`}
                            className="px-3 py-1.5 rounded-lg border border-[#D9E2EC] text-xs font-semibold text-[#1769AA] hover:bg-white shrink-0"
                          >
                            Call
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-[#627D98]">
                      Resources directory is being updated by emergency services.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. ABOUT DISASTERREADY SECTION & CTA
          ======================================================== */}
      <section className="py-20 bg-[#102A43] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <Badge variant="brand" className="bg-white/10 text-blue-200 border-white/20">
            About Our Mission
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold max-w-3xl mx-auto leading-tight">
            Building Resilient Communities Through Technology and Shared Preparedness
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            DisasterReady is an open digital initiative created to minimize loss of life and panic during hazards. By providing verified checklists, location-based alerts, and community training, we help every citizen become an informed first responder.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link href="/about">
              <Button variant="outline" size="lg" className="text-white border-white/30 bg-white/10 hover:bg-white/20">
                Learn About Our Framework
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="lg" className="shadow-lg">
                Create Free Citizen Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
