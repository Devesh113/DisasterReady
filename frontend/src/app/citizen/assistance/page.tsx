'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  PhoneCall,
  ShieldAlert,
  AlertOctagon,
  Building2,
  HeartPulse,
  Flame,
  Shield,
  Home,
  MapPin,
  ExternalLink,
  Search,
  CheckCircle2,
  Copy,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { resourceService } from '@/services/resourceService';
import { EmergencyResource, ResourceType } from '@/types/resource';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { getStatusBadgeStyles } from '@/lib/utils';

interface HotlineItem {
  number: string;
  name: string;
  description: string;
  badge: string;
  isPrimary?: boolean;
}

const EMERGENCY_HOTLINES: HotlineItem[] = [
  {
    number: '112',
    name: 'National Emergency Helpline',
    description: 'All-in-one unified emergency response for police, fire, and medical dispatch.',
    badge: 'Unified 24/7',
    isPrimary: true,
  },
  {
    number: '108',
    name: 'Emergency Medical & Ambulance',
    description: 'Immediate trauma response, cardiac emergencies, and critical patient transit.',
    badge: 'Medical',
    isPrimary: true,
  },
  {
    number: '101',
    name: 'Fire & Rescue Services',
    description: 'Urban fires, chemical leaks, structural collapses, and entrapment rescues.',
    badge: 'Fire / Rescue',
  },
  {
    number: '100',
    name: 'Police Emergency',
    description: 'Law enforcement, perimeter security, civil unrest, and crowd control.',
    badge: 'Police',
  },
  {
    number: '1070',
    name: 'NDMA State Disaster Control Room',
    description: 'Official National Disaster Management Authority emergency coordination center.',
    badge: 'Disaster Ops',
  },
  {
    number: '1077',
    name: 'District Disaster Control Room',
    description: 'Local district administration coordination for evacuation orders and supplies.',
    badge: 'Local Control',
  },
  {
    number: '1091',
    name: 'Women Emergency Helpline',
    description: 'Dedicated 24/7 crisis response and assistance for women during disasters.',
    badge: 'Protection',
  },
  {
    number: '1906',
    name: 'LPG Gas Leak Helpline',
    description: 'Immediate pipeline or domestic gas leak intervention and HAZMAT response.',
    badge: 'Gas / HAZMAT',
  },
];

interface CrisisGuideItem {
  id: string;
  title: string;
  icon: React.ElementType;
  urgentRule: string;
  steps: string[];
}

const CRISIS_GUIDES: CrisisGuideItem[] = [
  {
    id: 'trapped',
    title: 'Trapped in Structural Debris or Collapse',
    icon: AlertOctagon,
    urgentRule: 'Do not panic or shout constantly; preserve oxygen and protect airways.',
    steps: [
      'Cover your nose and mouth with a cloth or clothing to avoid breathing in toxic dust.',
      'Tap rhythmically on metal pipes, beams, or walls using a hard object so acoustic search teams can locate you.',
      'Shout only when you hear rescue personnel actively clearing debris immediately above you.',
      'Avoid unnecessary movements to prevent kicking up dust or dislodging unstable overhead rubble.',
      'If you have a mobile phone, send a text or SOS with your last known location rather than calling to preserve battery.',
    ],
  },
  {
    id: 'flood',
    title: 'Flash Flood / Rapid Inundation',
    icon: AlertTriangle,
    urgentRule: 'Never walk or drive into moving floodwaters. Turn Around, Don’t Drown.',
    steps: [
      'Move immediately to the highest accessible floor or ground level; avoid closed attics without roof exits.',
      'Turn off the main electrical circuit breaker and main gas valve before floodwaters reach living quarters.',
      'Never touch electrical equipment, switches, or submerged appliances while standing in wet areas.',
      'Just 6 inches of rapid water can knock you down; 2 feet of water can float and carry away an SUV.',
      'Stay tuned to local emergency broadcast frequencies or live alerts on this platform.',
    ],
  },
  {
    id: 'medical',
    title: 'Severe Trauma / Heavy Bleeding',
    icon: HeartPulse,
    urgentRule: 'Apply firm, continuous direct pressure to the wound without releasing.',
    steps: [
      'Place a clean sterile dressing, cloth, or garment directly over the bleeding wound.',
      'Apply steady, heavy downward pressure with both hands until medical responders arrive.',
      'If blood soaks through, add another cloth on top; never pull off the initial clot-forming layer.',
      'Keep the injured person lying flat and warm with blankets to prevent hypothermia and shock.',
      'Do not attempt to remove deeply impaled foreign objects; stabilize them in place with rolled padding.',
    ],
  },
  {
    id: 'gas',
    title: 'Hazardous Gas Leak / Chemical Hazard',
    icon: Flame,
    urgentRule: 'Do not use electrical switches, doorbells, or phones near the leak zone.',
    steps: [
      'Extinguish all naked flames and cigarettes immediately.',
      'Do not flick electrical light switches or ring apartment doorbells; small sparks can ignite gas vapors.',
      'Evacuate immediately by walking upwind and uphill away from the odor or vapor plume.',
      'Alert neighbors by knocking firmly on doors rather than ringing electric doorbells.',
      'Call emergency hotline 1906 or 112 once you have reached a safe distance of at least 100 meters.',
    ],
  },
];

export default function CitizenAssistancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>('trapped');

  // Query nearby emergency resources
  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ['citizen-assistance-resources', selectedType],
    queryFn: () =>
      resourceService.getResources({
        type: selectedType === 'ALL' ? undefined : (selectedType as ResourceType),
        limit: 20,
      }),
  });

  const resources = resourcesData?.resources || [];

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (res.address && res.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (res.phone && res.phone.includes(searchTerm));
    return matchesSearch;
  });

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'HOSPITAL':
        return <HeartPulse className="h-4 w-4 text-[#DC3545]" />;
      case 'FIRE_STATION':
        return <Flame className="h-4 w-4 text-[#F59E0B]" />;
      case 'POLICE_STATION':
        return <Shield className="h-4 w-4 text-[#1769AA]" />;
      case 'SHELTER':
        return <Home className="h-4 w-4 text-[#16A34A]" />;
      default:
        return <Building2 className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ========================================================
          1. PAGE HEADER
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-xs font-semibold text-[#DC3545] mb-2">
            <ShieldAlert className="h-4 w-4" />
            Immediate Response Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
            Emergency Assistance & Helplines
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Access 24/7 verified emergency numbers, critical survival triage guides, and nearest operational response facilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/citizen/map">
            <Button variant="outline" size="sm" className="gap-2">
              <MapPin className="h-4 w-4 text-[#1769AA]" />
              View Live Facilities Map
            </Button>
          </Link>
          <a href="tel:112">
            <Button size="sm" className="bg-[#DC3545] hover:bg-red-700 text-white gap-2 font-bold shadow-md">
              <PhoneCall className="h-4 w-4" />
              Call 112 Now
            </Button>
          </a>
        </div>
      </div>

      {/* ========================================================
          2. OFFICIAL EMERGENCY HOTLINES
          ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#102A43] flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-[#DC3545]" />
              National & Regional Emergency Helplines
            </h2>
            <p className="text-xs text-slate-500">Toll-free 24/7 direct operator dispatch lines</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Toll-Free Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EMERGENCY_HOTLINES.map((hotline) => (
            <Card
              key={hotline.number}
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-md border ${
                hotline.isPrimary
                  ? 'border-red-200 bg-red-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-3xl font-black text-[#102A43] tracking-tight">
                      {hotline.number}
                    </span>
                    <Badge
                      className={
                        hotline.isPrimary
                          ? 'bg-[#DC3545] text-white'
                          : 'bg-slate-100 text-slate-700'
                      }
                    >
                      {hotline.badge}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-[#102A43] mb-1">
                    {hotline.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {hotline.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <a
                    href={`tel:${hotline.number}`}
                    className="flex-1"
                  >
                    <Button
                      size="sm"
                      className={`w-full font-bold gap-2 ${
                        hotline.isPrimary
                          ? 'bg-[#DC3545] hover:bg-red-700 text-white'
                          : 'bg-[#102A43] hover:bg-[#172B4D] text-white'
                      }`}
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      Dial {hotline.number}
                    </Button>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyNumber(hotline.number)}
                    title="Copy phone number"
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    {copiedNumber === hotline.number ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ========================================================
          3. CRITICAL CRISIS TRIAGE GUIDES (ACTIONABLE CARDS)
          ======================================================== */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#102A43] flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-[#F59E0B]" />
            Immediate Crisis Action Protocols
          </h2>
          <p className="text-xs text-slate-500">
            Vital survival actions to take before professional responders arrive on scene
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CRISIS_GUIDES.map((guide) => {
            const Icon = guide.icon;
            const isExpanded = expandedGuide === guide.id;

            return (
              <Card
                key={guide.id}
                className="border border-slate-200 bg-white hover:border-slate-300 transition-all"
              >
                <div
                  className="p-5 cursor-pointer select-none"
                  onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 text-[#102A43] mt-0.5">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#102A43]">
                          {guide.title}
                        </h3>
                        <p className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1">
                          Rule: {guide.urgentRule}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-700 p-1"
                      aria-label={isExpanded ? 'Collapse guide' : 'Expand guide'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                      {guide.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-50 text-[#1769AA] font-bold text-[11px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <p className="leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          4. NEARBY EMERGENCY FACILITIES DIRECTORY
          ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#102A43] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#1769AA]" />
              Nearby Emergency Response Facilities
            </h2>
            <p className="text-xs text-slate-500">
              Verified operational centers, hospitals, fire brigades, and designated shelters
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search facility by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {['ALL', 'HOSPITAL', 'FIRE_STATION', 'POLICE_STATION', 'SHELTER'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  selectedType === type
                    ? 'bg-[#102A43] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'ALL' ? 'All Types' : type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Facility Cards Grid */}
        {resourcesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-5 border border-slate-200 rounded-xl bg-white space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <EmptyState
            title="No emergency facilities found"
            description="Try adjusting your search criteria or facility category filter."
            icon={Building2}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((res: EmergencyResource) => (
              <Card
                key={res.id}
                className="border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold flex items-center gap-1">
                      {getResourceTypeIcon(res.type)}
                      {res.type.replace('_', ' ')}
                    </Badge>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        res.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {res.isActive ? 'OPERATIONAL' : 'INACTIVE'}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-[#102A43] line-clamp-1">
                    {res.name}
                  </CardTitle>
                  {res.address && (
                    <p className="text-xs text-slate-500 flex items-start gap-1 mt-1 line-clamp-2">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 mt-0.5" />
                      {res.address}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="p-4 pt-2 text-xs space-y-3">
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                        Capacity
                      </span>
                      <span className="font-bold text-slate-800">
                        {res.capacity !== null && res.capacity !== undefined
                          ? `${res.capacity} persons`
                          : 'Not listed'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                        Coordinates
                      </span>
                      <span className="font-medium text-slate-700">
                        {res.latitude?.toFixed(3)}, {res.longitude?.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {res.phone ? (
                      <a href={`tel:${res.phone}`} className="flex-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs font-semibold gap-1.5 border-slate-200 text-[#102A43] hover:bg-blue-50 hover:text-[#1769AA]"
                        >
                          <PhoneCall className="h-3 w-3 text-[#1769AA]" />
                          {res.phone}
                        </Button>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic flex-1">
                        No phone listed
                      </span>
                    )}

                    <Link href={`/citizen/map?resourceId=${res.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-2 text-slate-600 hover:text-[#1769AA]"
                        title="View on Map"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
