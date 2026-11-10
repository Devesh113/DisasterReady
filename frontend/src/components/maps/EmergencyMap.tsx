'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { EmergencyResource } from '@/types/resource';
import { Skeleton } from '@/components/ui/Skeleton';
import { MapPin } from 'lucide-react';

const DynamicLeafletMap = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] rounded-xl border border-[#D9E2EC] bg-[#F5F7FA] flex flex-col items-center justify-center gap-3">
      <div className="p-3 bg-white rounded-full shadow-xs">
        <MapPin className="h-8 w-8 text-[#1769AA] animate-bounce" />
      </div>
      <p className="text-sm font-medium text-[#627D98]">Loading interactive emergency map...</p>
      <Skeleton className="w-48 h-3" />
    </div>
  ),
});

interface EmergencyMapProps {
  resources: EmergencyResource[];
  center?: [number, number];
  zoom?: number;
  userCoords?: [number, number] | null;
  radiusKm?: number;
}

export default function EmergencyMap(props: EmergencyMapProps) {
  return <DynamicLeafletMap {...props} />;
}
