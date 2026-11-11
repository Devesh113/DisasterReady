'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Compass,
  Users,
  Target,
  BookOpen,
  Award,
  Globe,
  Radio,
  Building2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hero Section */}
        <div className="rounded-2xl bg-[#102A43] text-white p-8 sm:p-12 shadow-lg space-y-4 text-center">
          <Badge variant="brand" className="bg-white/10 text-blue-200 border-white/20 mx-auto">
            About DisasterReady
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            Empowering Public Awareness, Community Preparedness & Disaster Coordination
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            DisasterReady is an integrated digital platform built to bridge the critical gap between early hazard warnings, personal citizen readiness, and disaster authority emergency management.
          </p>
        </div>

        {/* Problem Statement & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <Card className="h-full border-[#D9E2EC]">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-red-100 text-[#DC3545] flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">The Challenge</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#172B4D] leading-relaxed">
              <p>
                During severe natural and technological hazards (earthquakes, flash floods, cyclones, and industrial spills), widespread panic and casualties often arise not solely from the event itself, but from:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#627D98]">
                <li>A lack of prior awareness and standardized drill practice among citizens.</li>
                <li>Delayed or fragmented hazard alert dissemination across communities.</li>
                <li>Information asymmetry regarding the real-time locations of verified shelters, hospitals, and safe corridors.</li>
                <li>Ad-hoc emergency reporting that overwhelms first responders with duplicate calls.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="h-full border-[#D9E2EC]">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-blue-100 text-[#1769AA] flex items-center justify-center">
                  <Target className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Our Solution</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#172B4D] leading-relaxed">
              <p>
                DisasterReady provides a unified, role-based architecture that coordinates citizens and authorities in one secure ecosystem:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#627D98]">
                <li><strong>Educate:</strong> Scientific safety guides, causes, and warning signs for 10+ disaster types.</li>
                <li><strong>Alert:</strong> Authority-issued, geofenced hazard alerts with severity categorization.</li>
                <li><strong>Prepare:</strong> Personal 72-hour emergency preparedness checklist and mock drill registration.</li>
                <li><strong>Coordinate:</strong> Interactive safe shelter locator and citizen ground incident reporting.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Five Architectural Pillars */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="brand">Platform Architecture</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
              Five Pillars of Community Resilience
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-[#1769AA] flex items-center justify-center font-bold">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#102A43]">1. Disaster Hub</h3>
              <p className="text-xs text-[#627D98] leading-relaxed">
                Comprehensive step-by-step guidance for what to do before, during, and after earthquakes, floods, wildfires, cyclones, and landslides.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-lg bg-red-50 text-[#DC3545] flex items-center justify-center font-bold">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#102A43]">2. Live Alert Center</h3>
              <p className="text-xs text-[#627D98] leading-relaxed">
                Direct public hazard broadcast system supporting severity tiers (Low to Critical) and GPS-radius proximity calculation.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#102A43]">3. Preparedness Kit</h3>
              <p className="text-xs text-[#627D98] leading-relaxed">
                Personal emergency supply checklists across food, water, first aid, and documents with instant readiness percentage indicators.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-lg bg-amber-50 text-[#B45309] flex items-center justify-center font-bold">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#102A43]">4. Mock Drills & Events</h3>
              <p className="text-xs text-[#627D98] leading-relaxed">
                Community safety workshops and realistic evacuation drills organized by local emergency authorities with capacity caps.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#102A43]">5. Safe Shelter Locator</h3>
              <p className="text-xs text-[#627D98] leading-relaxed">
                Geospatial finder for verified safe shelters, trauma hospitals, fire stations, and relief supply distribution corridors.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#D9E2EC] bg-white space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-[#102A43] flex items-center justify-center font-bold">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#102A43]">6. Unified Coordination</h3>
              <p className="text-xs text-[#627D98] leading-relaxed">
                Integrated Authority Command Center enabling emergency officials to triage citizen ground reports and update shelter availability.
              </p>
            </div>
          </div>
        </div>

        {/* Scientific Guidelines & Institutional Attribution */}
        <div id="guidelines" className="rounded-2xl border border-[#D9E2EC] bg-white p-8 space-y-4">
          <div className="flex items-center gap-3 border-b border-[#D9E2EC] pb-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 text-[#16A34A] flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#102A43]">
                Scientific Attribution & Guidelines Reference
              </h3>
              <p className="text-xs text-[#627D98]">
                DisasterReady educational modules synthesize research and standard operating procedures from premier international disaster agencies:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-[#172B4D] pt-2">
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC]">
              <strong className="text-[#102A43] block">NDMA India</strong>
              National Disaster Management Authority guidelines on seismic, cyclone, and flood mitigation.
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC]">
              <strong className="text-[#102A43] block">FEMA / Ready.gov</strong>
              Federal Emergency Management Agency standard 72-hour family emergency preparedness protocols.
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC]">
              <strong className="text-[#102A43] block">USGS Earthquake Hazards</strong>
              United States Geological Survey tectonic and liquefaction mitigation directives.
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC]">
              <strong className="text-[#102A43] block">WMO / NOAA</strong>
              World Meteorological Organization cyclone, severe storm, and convective advisory standards.
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC]">
              <strong className="text-[#102A43] block">IOC-UNESCO</strong>
              Intergovernmental Oceanographic Commission global tsunami warning and evacuation frameworks.
            </div>
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#D9E2EC]">
              <strong className="text-[#102A43] block">Red Cross / Red Crescent</strong>
              Community first aid, CPR basics, and family emergency reuniting strategies.
            </div>
          </div>
        </div>

        {/* Emergency Disclaimer & Terms */}
        <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-6 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            <span>Official Emergency Notice & Terms of Use</span>
          </div>
          <p className="leading-relaxed">
            DisasterReady is a supplementary technological tool intended to foster citizen preparedness and support civil coordination. It does not replace direct telephone communication with certified national emergency rescue services. During an imminent crisis, always dial your jurisdiction’s official emergency dispatch number (e.g. 112 / 911 / 100).
          </p>
        </div>
      </div>
    </div>
  );
}
