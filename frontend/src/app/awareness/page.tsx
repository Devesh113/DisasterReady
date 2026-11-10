'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Activity,
  Waves,
  Wind,
  Flame,
  Mountain,
  Factory,
  Compass,
} from 'lucide-react';
import { disasterService } from '@/services/disasterService';
import { DisasterType } from '@/types/disaster';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
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

export default function AwarenessPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['awareness-disasters', selectedType, searchTerm],
    queryFn: () =>
      disasterService.getDisasters({
        type: selectedType !== 'ALL' ? (selectedType as DisasterType) : undefined,
        search: searchTerm.trim() || undefined,
        limit: 50,
      }),
  });

  const disasters = data?.disasters || [];

  const types = [
    'ALL',
    'EARTHQUAKE',
    'FLOOD',
    'CYCLONE',
    'TSUNAMI',
    'WILDFIRE',
    'LANDSLIDE',
    'INDUSTRIAL_ACCIDENT',
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Banner */}
        <div className="rounded-2xl bg-[#102A43] text-white p-8 sm:p-12 shadow-lg space-y-4">
          <Badge variant="brand" className="bg-white/10 text-blue-200 border-white/20">
            Educational Safety Hub
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Disaster Preparedness & Safety Guidelines
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            Standardized, science-backed emergency instructions for major natural and human-induced disasters.
            Review warning signs, pre-disaster safety kits, in-event survival rules, and recovery measures.
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
            <span>Content cross-referenced with NDMA, FEMA, and UN-Disaster Risk Reduction guidelines.</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
              <Input
                placeholder="Search disasters by name, symptoms or guidelines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              <span className="text-xs font-semibold text-[#627D98] mr-1 hidden sm:inline">
                Filter:
              </span>
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedType === type
                      ? 'bg-[#1769AA] text-white shadow-xs'
                      : 'bg-[#F5F7FA] text-[#172B4D] hover:bg-[#E3F2FD] hover:text-[#1769AA]'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Listing */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to Load Disaster Guidelines"
            message="Could not retrieve disaster taxonomy records from the DisasterReady API server. Please ensure the backend is running."
            onRetry={() => refetch()}
          />
        ) : disasters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disasters.map((disaster) => {
              const Icon = disasterTypeIcons[disaster.type] || Compass;
              return (
                <Card
                  key={disaster.id}
                  className="flex flex-col justify-between hover:border-[#1769AA] hover:shadow-md transition-all group"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-11 w-11 rounded-lg bg-[#E3F2FD] text-[#1769AA] flex items-center justify-center font-bold">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="brand">{disaster.type.replace('_', ' ')}</Badge>
                    </div>
                    <CardTitle className="text-xl group-hover:text-[#1769AA] transition-colors">
                      {disaster.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 mt-2 text-sm text-[#627D98] leading-relaxed">
                      {disaster.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {disaster.guidelines && (
                      <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC] text-xs text-[#172B4D] line-clamp-2">
                        <strong className="text-[#102A43] block mb-0.5">Primary Directive:</strong>
                        {disaster.guidelines}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="border-t border-[#D9E2EC] pt-4">
                    {/* The backend uses UUIDs; we pass the real UUID to /awareness/[id] */}
                    <Link href={`/awareness/${disaster.id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full justify-center gap-2 group-hover:bg-[#1769AA] group-hover:text-white transition-all">
                        <span>Read Comprehensive Safety Guide</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No Matching Disaster Guides Found"
            description="No disaster records matched your search filter criteria. Try resetting the filter to view all guides."
            actionLabel="Reset Search"
            onAction={() => {
              setSearchTerm('');
              setSelectedType('ALL');
            }}
          />
        )}
      </div>
    </div>
  );
}
