'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Flame,
  Activity,
  Waves,
  Wind,
  Mountain,
  Factory,
  Compass,
  ListChecks,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { disasterService } from '@/services/disasterService';
import { getDisasterCurriculum, DISASTER_CURRICULUM } from '@/lib/disasterCurriculum';
import { Disaster, DisasterType } from '@/types/disaster';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import ErrorState from '@/components/shared/ErrorState';

const disasterTypeIcons: Record<string, React.ElementType> = {
  EARTHQUAKE: Activity,
  FLOOD: Waves,
  CYCLONE: Wind,
  TSUNAMI: Waves,
  WILDFIRE: Flame,
  LANDSLIDE: Mountain,
  INDUSTRIAL_ACCIDENT: Factory,
  OTHER: Compass,
};

export default function DisasterDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');

  const normalizedSlug = id ? id.toUpperCase().replace(/-/g, '_') : '';
  const slugCurriculum =
    DISASTER_CURRICULUM[normalizedSlug] ||
    (normalizedSlug === 'HURRICANE' ? DISASTER_CURRICULUM.CYCLONE : null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['disaster-detail', id],
    queryFn: () => disasterService.getDisasterById(id),
    enabled: Boolean(id) && isUUID,
  });

  // If fetched from backend, use it; otherwise, if id matches a curriculum slug, synthesize disaster record
  const disaster: Disaster | undefined =
    data?.disaster ||
    (slugCurriculum
      ? {
          id: id,
          name: slugCurriculum.title,
          type: slugCurriculum.type,
          description: slugCurriculum.overview,
          guidelines: slugCurriculum.checklist.join('; '),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : undefined);

  // Get scientific educational curriculum tailored to this disaster type
  const curriculum = getDisasterCurriculum(disaster?.type || slugCurriculum?.type);
  const Icon = disaster ? (disasterTypeIcons[disaster.type] || Compass) : Compass;

  if (isLoading && isUUID) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !disaster) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/awareness">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Disaster Hub
            </Button>
          </Link>
        </div>
        <ErrorState
          title="Disaster Guide Not Found"
          message={`Unable to locate disaster record for ID: '${id}'. It may have been modified or deleted by an administrator.`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation Breadcrumb */}
        <div>
          <Link href="/awareness">
            <Button variant="outline" size="sm" className="gap-2 text-[#172B4D] hover:bg-white">
              <ArrowLeft className="h-4 w-4" /> Back to All Disaster Guides
            </Button>
          </Link>
        </div>

        {/* Hero Guide Card */}
        <div className="rounded-2xl border border-[#D9E2EC] bg-white p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#E3F2FD] text-[#1769AA] flex items-center justify-center font-bold shadow-xs">
                <Icon className="h-8 w-8" />
              </div>
              <div>
                <Badge variant="brand" className="mb-1">{disaster.type.replace('_', ' ')}</Badge>
                <h1 className="text-3xl font-extrabold text-[#102A43] tracking-tight">{disaster.name}</h1>
              </div>
            </div>

            <Link href="/alerts">
              <Button variant="emergency" size="sm" className="gap-1.5 shadow-xs">
                <AlertTriangle className="h-4 w-4" />
                Check Active Alerts
              </Button>
            </Link>
          </div>

          <div className="border-t border-[#D9E2EC] pt-6 space-y-4">
            <h3 className="text-lg font-bold text-[#102A43]">Overview & Hazard Description</h3>
            <p className="text-base text-[#172B4D] leading-relaxed">
              {disaster.description}
            </p>
            {disaster.guidelines && (
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-sm text-[#102A43] space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#1769AA]">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>Authority Guidelines Summary:</span>
                </div>
                <p className="pl-6 text-[#172B4D]">{disaster.guidelines}</p>
              </div>
            )}
          </div>
        </div>

        {/* 2-Column: Causes & Warning Signs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Causes */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#102A43]">
                <HelpCircle className="h-5 w-5 text-[#1769AA]" />
                Underlying Causes & Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {curriculum.causes.map((cause, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-[#172B4D]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{cause}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Warning Signs */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#B45309]">
                <AlertCircle className="h-5 w-5 text-[#F59E0B]" />
                Early Warning Signs to Watch For
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {curriculum.warningSigns.map((sign, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-[#172B4D]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold shrink-0 mt-0.5">
                    ⚠️
                  </span>
                  <span>{sign}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Three Action Stages: BEFORE, DURING, AFTER */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="brand">Standard Operating Protocols</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
              What to Do: Before, During, and After
            </h2>
            <p className="text-sm text-[#627D98]">
              Standardized civil defense action sequences proven to maximize personal safety and reduce panic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stage 1: BEFORE */}
            <div className="rounded-xl border border-blue-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5 pb-3 border-b border-blue-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#1769AA] font-bold text-sm">
                  1
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#102A43]">BEFORE</h3>
                  <span className="text-xs text-[#627D98] block">Mitigation & Preparedness</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-[#172B4D]">
                {curriculum.before.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-[#1769AA] font-bold text-base leading-none">•</span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stage 2: DURING */}
            <div className="rounded-xl border border-red-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5 pb-3 border-b border-red-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-[#DC3545] font-bold text-sm">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#102A43]">DURING</h3>
                  <span className="text-xs text-[#DC3545] font-semibold block">Immediate Survival Actions</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-[#172B4D]">
                {curriculum.during.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-[#DC3545] font-bold text-base leading-none">•</span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stage 3: AFTER */}
            <div className="rounded-xl border border-emerald-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5 pb-3 border-b border-emerald-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[#16A34A] font-bold text-sm">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#102A43]">AFTER</h3>
                  <span className="text-xs text-[#627D98] block">Recovery & Safety Checks</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-[#172B4D]">
                {curriculum.after.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-[#16A34A] font-bold text-base leading-none">•</span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Emergency Checklist Card */}
        <Card className="border-[#1769AA]/30 bg-white shadow-sm">
          <CardHeader className="bg-[#E3F2FD]/50 border-b border-[#D9E2EC]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1769AA] text-white">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Recommended 72-Hour Survival Checklist</CardTitle>
                  <p className="text-xs text-[#627D98] mt-0.5">
                    Essential emergency kit items to pack specifically for this disaster category.
                  </p>
                </div>
              </div>
              <Link href="/register">
                <Button variant="primary" size="sm" className="hidden sm:flex">
                  Build Your Digital Kit
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {curriculum.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#D9E2EC] bg-[#F5F7FA]"
                >
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
                  <span className="text-sm font-medium text-[#172B4D]">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attribution & Official Guidance Notice */}
        <div className="rounded-xl border border-slate-300 bg-slate-100/70 p-5 text-xs text-[#627D98] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#102A43]">
            <ShieldCheck className="h-4 w-4 text-[#1769AA]" />
            <span>Educational Material Attribution & Advisory Note</span>
          </div>
          <p className="leading-relaxed">
            {curriculum.attribution}
          </p>
          <p className="text-[11px] text-slate-500 italic">
            Notice: In the event of an active disaster declaration in your municipality, official emergency orders issued via civil defense, police, or local government authorities supersede all general educational guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
