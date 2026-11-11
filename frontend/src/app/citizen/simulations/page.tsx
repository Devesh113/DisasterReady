'use client';

import React, { useState } from 'react';
import {
  Gamepad2,
  Sparkles,
  ShieldAlert,
  Play,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Monitor,
  Flame,
  Droplets,
  Building,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { simulationService, SimulationScenarioDefinition } from '@/services/simulation.service';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import UnityPlayer from '../../../components/UnityPlayer';

export default function CitizenSimulationsPage() {
  const scenarios = simulationService.getStaticScenarios();
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenarioDefinition | null>(null);
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);
  const [activeSandboxScenario, setActiveSandboxScenario] = useState<SimulationScenarioDefinition | null>(null);

  const isEarthquake =
    activeSandboxScenario?.disasterType === 'EARTHQUAKE' ||
    activeSandboxScenario?.id === 'sim-eq-01';
  const isFlashFlood = activeSandboxScenario?.id === 'sim-fl-02';
  const isWildfire = activeSandboxScenario?.id === 'sim-wf-03';
  const isPlayable = isEarthquake || isFlashFlood;

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">Beginner</Badge>;
      case 'INTERMEDIATE':
        return <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold">Intermediate</Badge>;
      case 'ADVANCED':
        return <Badge className="bg-red-100 text-red-800 text-[10px] font-bold">Advanced</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  const getDisasterIcon = (type: string) => {
    switch (type) {
      case 'EARTHQUAKE':
        return <Building className="h-6 w-6 text-amber-600" />;
      case 'FLOOD':
        return <Droplets className="h-6 w-6 text-blue-600" />;
      case 'WILDFIRE':
        return <Flame className="h-6 w-6 text-red-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ========================================================
          1. HEADER
          ======================================================== */}
      <div className="pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-xs font-semibold text-purple-700 mb-2">
          <Gamepad2 className="h-4 w-4" />
          Interactive 3D Virtual Training
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
          Disaster Preparedness Simulations
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Immerse yourself in real-time disaster scenarios powered by our 3D engine. Master survival protocols through interactive decision-making.
        </p>
      </div>

      {/* ========================================================
          2. UNITY INTEGRATION PIPELINE BANNER
          ======================================================== */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#102A43] text-white flex-shrink-0">
              <Monitor className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#102A43]">
                  Unity 3D WebGL Simulation Engine (v2022.3 LTS)
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Unity WebGL Build Live
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                The interactive simulation engine is powered by Unity 3D WebGL. Both the Earthquake Evacuation and Flash Flood Inundation simulations are fully integrated and playable directly inside your browser. The Wildfire scenario is currently in active development.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveSandboxScenario(null);
                setIsSandboxModalOpen(true);
              }}
              className="text-xs font-bold gap-2 text-[#102A43] border-slate-300 hover:bg-slate-100"
            >
              <Gamepad2 className="h-4 w-4 text-[#1769AA]" />
              Simulation Pre-Flight Check
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. SCENARIO CATALOG
          ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#102A43] flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#1769AA]" />
              Available Training Scenarios
            </h2>
            <p className="text-xs text-slate-500">
              Select a scenario to review the briefing, objectives, and survival mechanics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scenarios.map((sc) => (
            <Card
              key={sc.id}
              className="border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    {getDisasterIcon(sc.disasterType)}
                  </div>
                  {getDifficultyBadge(sc.difficulty)}
                </div>

                <CardTitle className="text-base font-bold text-[#102A43] leading-snug">
                  {sc.title}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Est. Duration: {sc.estimatedMinutes} minutes</span>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4 text-xs">
                <p className="text-slate-600 line-clamp-3 leading-relaxed">
                  {sc.description}
                </p>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Key Competencies Tested
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sc.keySkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-3 border-t border-slate-100">
                <Button
                  size="sm"
                  onClick={() => setSelectedScenario(sc)}
                  className="w-full bg-[#102A43] hover:bg-[#172B4D] text-white font-bold gap-2 text-xs"
                >
                  <Play className="h-3.5 w-3.5" />
                  View Mission Briefing
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* ========================================================
          4. CONTROLS & SYSTEM REQUIREMENTS
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls Card */}
        <Card className="border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="font-bold text-base text-[#102A43] flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-[#1769AA]" />
            Default Simulation Controls
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600">Movement</span>
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800">
                W A S D
              </kbd>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600">Look / Aim</span>
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800">
                Mouse
              </kbd>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600">Drop & Cover / Crouch</span>
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800">
                C
              </kbd>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600">Interact / Grab</span>
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800">
                E
              </kbd>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600">Jump / Vault</span>
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800">
                Space
              </kbd>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600">Emergency Bag</span>
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800">
                Tab
              </kbd>
            </div>
          </div>
        </Card>

        {/* System Compatibility */}
        <Card className="border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="font-bold text-base text-[#102A43] flex items-center gap-2">
            <Monitor className="h-5 w-5 text-emerald-600" />
            Hardware & Browser Requirements
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Modern browser with <strong>WebGL 2.0</strong> enabled (Chrome 90+, Safari 15+, Firefox 88+).</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Hardware graphics acceleration turned ON in browser settings.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Recommended minimum 4GB RAM and dedicated or modern integrated GPU.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Keyboard & mouse setup recommended for precise tactical navigation.</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* ========================================================
          5. SCENARIO MISSION BRIEFING MODAL
          ======================================================== */}
      {selectedScenario && (
        <Dialog
          isOpen={selectedScenario !== null}
          onClose={() => setSelectedScenario(null)}
          title={selectedScenario.title}
          description={`Mission Scenario • ${selectedScenario.disasterType} • Est. ${selectedScenario.estimatedMinutes} Minutes`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
              <h4 className="font-bold text-[#102A43] mb-1">Mission Premise</h4>
              <p>{selectedScenario.description}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#102A43]">Evaluated Survival Competencies</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedScenario.keySkills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100 text-slate-800"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#1769AA] flex-shrink-0" />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedScenario.disasterType === 'EARTHQUAKE' ||
            selectedScenario.id === 'sim-eq-01' ||
            selectedScenario.id === 'sim-fl-02' ? (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Unity WebGL Simulation Ready:</strong> The 3D{' '}
                  {selectedScenario.disasterType === 'EARTHQUAKE' ||
                  selectedScenario.id === 'sim-eq-01'
                    ? 'earthquake evacuation'
                    : 'flash flood'}{' '}
                  simulation is deployed and ready to play. Click &quot;Open Sandbox Environment&quot; below to launch the simulation directly in your browser.
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <Info className="h-4 w-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Scenario in Development:</strong> The 3D simulation for this disaster scenario is currently in active development. The Earthquake and Flash Flood simulations are currently available to launch.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedScenario(null)}
              >
                Close Briefing
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setActiveSandboxScenario(selectedScenario);
                  setSelectedScenario(null);
                  setIsSandboxModalOpen(true);
                }}
                className="bg-[#102A43] hover:bg-[#172B4D] text-white font-bold"
              >
                Open Sandbox Environment
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ========================================================
          6. SANDBOX ENVIRONMENT / UNITY PLAYER MODAL
          ======================================================== */}
      <Dialog
        isOpen={isSandboxModalOpen}
        onClose={() => {
          setIsSandboxModalOpen(false);
          setActiveSandboxScenario(null);
        }}
        title={
          activeSandboxScenario
            ? activeSandboxScenario.title
            : 'Simulation Sandbox Environment'
        }
        description={
          activeSandboxScenario
            ? isEarthquake
              ? 'Interactive Earthquake Simulation'
              : isFlashFlood
                ? 'Interactive Flash Flood Simulation'
                : 'Coming Soon'
            : 'Hardware diagnostic and WebGL runtime verification container'
        }
        maxWidth="2xl"
        className={isPlayable ? 'max-w-5xl' : 'max-w-2xl'}
      >
        {isEarthquake ? (
          <div className="space-y-4">
            <UnityPlayer
              src="/unity/index.html"
              title="DisasterReady Earthquake Simulation"
            />
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                size="sm"
                onClick={() => {
                  setIsSandboxModalOpen(false);
                  setActiveSandboxScenario(null);
                }}
                className="bg-[#102A43] hover:bg-[#172B4D] text-white"
              >
                Close Simulation
              </Button>
            </div>
          </div>
        ) : isFlashFlood ? (
          <div className="space-y-4">
            <UnityPlayer
              src="/unity-flood/index.html"
              title="DisasterReady Flash Flood Simulation"
            />
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                size="sm"
                onClick={() => {
                  setIsSandboxModalOpen(false);
                  setActiveSandboxScenario(null);
                }}
                className="bg-[#102A43] hover:bg-[#172B4D] text-white"
              >
                Close Simulation
              </Button>
            </div>
          </div>
        ) : activeSandboxScenario ? (
          <div className="space-y-4 text-xs">
            <div className="aspect-video w-full rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <Flame className="h-8 w-8 text-red-400 animate-pulse" />
              </div>
              <h4 className="text-base font-bold">
                {activeSandboxScenario.title}
              </h4>
              <p className="text-xs text-slate-400 mt-2 max-w-md">
                This 3D simulation scenario is currently in active development and not yet available.
                Please launch the Earthquake or Flash Flood simulation to practice active disaster response protocols.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[11px]">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Status: Coming Soon
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
              <div className="font-bold">Playable Simulations Available</div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                The <strong>Earthquake: Multi-Story Office Evacuation</strong> and <strong>Flash Flood: Suburban Inundation Escape</strong> simulations are fully integrated and playable right now. You can launch them from the scenario catalog.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                size="sm"
                onClick={() => {
                  setIsSandboxModalOpen(false);
                  setActiveSandboxScenario(null);
                }}
                className="bg-[#102A43] hover:bg-[#172B4D] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="aspect-video w-full rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <Gamepad2 className="h-8 w-8 text-blue-400 animate-pulse" />
              </div>
              <h4 className="text-base font-bold">Unity WebGL 2.0 Viewport Host</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                WebGL 2.0 container for interactive 3D simulations. Unity WebGL builds are deployed at /unity/index.html and /unity-flood/index.html.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-[11px] text-slate-300 font-mono">
                  WebGL 2.0 Runtime Environment
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
              <div className="font-bold text-[#102A43]">Runtime Compatibility & Requirements</div>
              <p className="text-[11px] leading-relaxed">
                WebGL 2.0 support and hardware graphics acceleration in browser settings are recommended for running the interactive simulations. The Earthquake and Flash Flood simulations are deployed and available to launch.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                size="sm"
                onClick={() => {
                  setIsSandboxModalOpen(false);
                  setActiveSandboxScenario(null);
                }}
                className="bg-[#102A43] hover:bg-[#172B4D] text-white"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
