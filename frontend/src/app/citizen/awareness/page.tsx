'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Search,
  ArrowRight,
  ShieldCheck,
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

export default function CitizenAwarenessPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['citizen-disasters', selectedType, searchTerm],
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Disaster Preparedness Knowledge Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#627D98] mt-1">
            Standard operating protocols, early warning signs, and survival steps for 10+ disaster categories.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1]" />
            <Input
              placeholder="Search guides by disaster name or guidelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedType === type
                    ? 'bg-[#1769AA] text-white shadow-xs'
                    : 'bg-[#F5F7FA] text-[#172B4D] hover:bg-[#E3F2FD]'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disasters Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-14 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load disaster guides"
          message="Failed to retrieve disaster education records. Please verify the backend connection."
          onRetry={() => refetch()}
        />
      ) : disasters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {disasters.map((disaster) => {
            const Icon = disasterTypeIcons[disaster.type] || Compass;
            return (
              <Card key={disaster.id} className="flex flex-col justify-between hover:border-[#1769AA] transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-9 w-9 rounded-lg bg-[#E3F2FD] text-[#1769AA] flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="brand">{disaster.type.replace('_', ' ')}</Badge>
                  </div>
                  <CardTitle className="text-base text-[#102A43]">{disaster.name}</CardTitle>
                  <CardDescription className="line-clamp-3 text-xs mt-1">
                    {disaster.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {disaster.guidelines && (
                    <div className="p-2.5 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC] text-[11px] text-[#102A43] line-clamp-2">
                      <strong className="text-[#1769AA]">Directive: </strong>
                      {disaster.guidelines}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t border-[#D9E2EC] pt-4">
                  <Link href={`/awareness/${disaster.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full justify-center gap-1.5 text-xs">
                      <span>View Survival Checklist</span>
                      <ArrowRight className="h-3.5 w-3.5" />
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
          title="No Guides Found"
          description="No disaster guides match your search term. Try resetting your filter."
          actionLabel="Reset Search"
          onAction={() => {
            setSearchTerm('');
            setSelectedType('ALL');
          }}
        />
      )}
    </div>
  );
}
