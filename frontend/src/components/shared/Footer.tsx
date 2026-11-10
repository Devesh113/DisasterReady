import React from 'react';
import Link from 'next/link';
import { ShieldAlert, PhoneCall, AlertTriangle, ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#D9E2EC] bg-[#102A43] text-white">
      {/* Emergency Advisory Strip */}
      <div className="bg-[#0B1F33] border-b border-[#243B53] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-red-400 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>DISCLAIMER: DisasterReady provides educational preparedness resources and community coordination tools.</span>
          </div>
          <div className="text-slate-300">
            For active life-threatening emergencies, always dial your local emergency services (e.g. 911 / 112 / local dispatch) immediately.
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1769AA] text-white">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Disaster<span className="text-[#64B5F6]">Ready</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Empowering citizens, communities, and disaster response authorities with real-time hazard alerts, structured emergency preparedness guides, and drill coordination.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/awareness" className="hover:text-white transition-colors">
                  Disaster Awareness Hub
                </Link>
              </li>
              <li>
                <Link href="/alerts" className="hover:text-white transition-colors">
                  Live Emergency Alerts
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  Mock Drills & Training
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition-colors">
                  Safe Shelters & Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Disaster Guidelines */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Disaster Types
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/awareness" className="hover:text-white transition-colors">
                  Earthquake Safety
                </Link>
              </li>
              <li>
                <Link href="/awareness" className="hover:text-white transition-colors">
                  Flood Response & Evacuation
                </Link>
              </li>
              <li>
                <Link href="/awareness" className="hover:text-white transition-colors">
                  Cyclone & Severe Storms
                </Link>
              </li>
              <li>
                <Link href="/awareness" className="hover:text-white transition-colors">
                  Wildfire Preparedness
                </Link>
              </li>
              <li>
                <Link href="/awareness" className="hover:text-white transition-colors">
                  Industrial Hazards
                </Link>
              </li>
            </ul>
          </div>

          {/* About & Standards */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Organization
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About DisasterReady
                </Link>
              </li>
              <li>
                <Link href="/about#guidelines" className="hover:text-white transition-colors">
                  Scientific Guidelines Reference
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Authority Command Portal
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Join as Community Volunteer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-[#243B53] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} DisasterReady Platform. Built for community resilience and safety.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-slate-200">
              Privacy Policy
            </Link>
            <Link href="/about" className="hover:text-slate-200">
              Terms of Service
            </Link>
            <Link href="/about" className="hover:text-slate-200">
              Attribution & Data Sources
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
