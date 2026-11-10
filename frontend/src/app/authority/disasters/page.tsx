'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Search,
  Filter,
  ShieldAlert,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
  Layers,
  FileText,
} from 'lucide-react';
import { disasterService } from '@/services/disasterService';
import { Disaster, DisasterType } from '@/types/disaster';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';

const DISASTER_TYPES: (DisasterType | 'ALL')[] = [
  'ALL',
  'EARTHQUAKE',
  'FLOOD',
  'CYCLONE',
  'TSUNAMI',
  'WILDFIRE',
  'LANDSLIDE',
  'DROUGHT',
  'VOLCANIC_ERUPTION',
  'TORNADO',
  'INDUSTRIAL_ACCIDENT',
  'OTHER',
];

export default function AuthorityDisastersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [inspectingDisaster, setInspectingDisaster] = useState<Disaster | null>(null);

  // Query disaster catalog
  const { data: disastersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['authority-disasters-catalog', page, selectedType, searchTerm],
    queryFn: () =>
      disasterService.getDisasters({
        page,
        limit: 12,
        type: selectedType === 'ALL' ? undefined : (selectedType as DisasterType),
        search: searchTerm.trim() || undefined,
      }),
  });

  const disasters = disastersData?.disasters || [];
  const pagination = disastersData?.pagination;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ========================================================
          1. HEADER
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#1769AA] mb-2">
            <BookOpen className="h-4 w-4" />
            Civil Defense Tactical Taxonomy
          </div>
          <h1 className="text-2xl font-extrabold text-[#102A43] tracking-tight">
            Disaster Protocols & Hazard Catalog
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Reference standard operational guidelines, hazard taxonomy, and scientific mitigation protocols.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            Catalog Edit: Administrator Only
          </span>
        </div>
      </div>

      {/* Permission Notice Banner */}
      <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-4 text-xs flex items-start gap-3">
        <Info className="h-5 w-5 text-[#1769AA] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="font-bold text-[#102A43]">
            Standard Operating Procedure (SOP) Reference
          </h4>
          <p className="text-slate-600 leading-relaxed">
            Per national civil defense guidelines (NDMA & FEMA), hazard classifications and core scientific parameters are curated centrally by System Administrators. Responding authority officers have full access to inspect protocols and associate them with live broadcasts.
          </p>
        </div>
      </div>

      {/* ========================================================
          2. SEARCH & FILTER TOOLBAR
          ======================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search hazard protocols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-50 text-xs"
          />
        </div>

        {/* Disaster Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {DISASTER_TYPES.slice(0, 7).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setSelectedType(t);
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                selectedType === t
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All' : t.replace('_', ' ')}
            </button>
          ))}
          {/* Dropdown for remaining types */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700"
          >
            <option value="ALL">More Types...</option>
            {DISASTER_TYPES.slice(7).map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================
          3. DISASTER CATALOG GRID
          ======================================================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load disaster catalog"
          message="Failed to retrieve disaster types from the server."
          onRetry={() => refetch()}
        />
      ) : disasters.length === 0 ? (
        <EmptyState
          title="No disaster records found"
          description="Try adjusting your search criteria or type filter."
          icon={BookOpen}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {disasters.map((d) => (
            <Card
              key={d.id}
              className="border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] font-bold border-blue-200 text-[#1769AA]">
                    {d.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-400">
                    #{d.id.slice(0, 8)}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-[#102A43]">
                  {d.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-3 text-xs">
                <p className="text-slate-600 line-clamp-3 leading-relaxed">
                  {d.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInspectingDisaster(d)}
                    className="text-xs text-[#1769AA] border-blue-200 hover:bg-blue-50 gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Inspect SOP
                  </Button>

                  <Link href={`/awareness/${d.id}`} target="_blank">
                    <Button size="sm" variant="ghost" className="text-xs text-slate-500 hover:text-slate-900 gap-1">
                      Public Guide <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================
          4. PAGINATION
          ======================================================== */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
          <div>
            Showing Page <span className="font-bold text-[#102A43]">{pagination.page}</span> of{' '}
            <span className="font-bold text-[#102A43]">{pagination.totalPages}</span> ({pagination.total} total)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage((prev) => prev + 1)}
              className="gap-1 text-xs"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================
          5. SOP INSPECTION MODAL
          ======================================================== */}
      {inspectingDisaster && (
        <Dialog
          isOpen={inspectingDisaster !== null}
          onClose={() => setInspectingDisaster(null)}
          title={inspectingDisaster.name}
          description={`Standard Operating Procedure (SOP) • Category: ${inspectingDisaster.type.replace('_', ' ')}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Hazard Overview:</span>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {inspectingDisaster.description}
              </p>
            </div>

            {inspectingDisaster.guidelines && (
              <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                <span className="font-bold text-[#102A43] block mb-1">
                  Tactical Guidelines & Emergency Directives:
                </span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line font-mono text-[11px]">
                  {inspectingDisaster.guidelines}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Link href={`/awareness/${inspectingDisaster.id}`} target="_blank">
                <Button size="sm" variant="outline" className="text-xs text-[#1769AA] gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Public Safety Handbook
                </Button>
              </Link>
              <Button size="sm" onClick={() => setInspectingDisaster(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
