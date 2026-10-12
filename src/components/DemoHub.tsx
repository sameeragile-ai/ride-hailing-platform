import React from 'react';
import {
  Smartphone,
  Car,
  LayoutDashboard,
  PhoneCall,
  Columns,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  DollarSign,
  Radio,
} from 'lucide-react';

interface DemoHubProps {
  onSelectView: (
    view: 'hub' | 'live' | 'rider' | 'driver' | 'admin' | 'agent'
  ) => void;
}

export function DemoHub({ onSelectView }: DemoHubProps) {
  const cards = [
    {
      id: 'rider' as const,
      title: 'Rider Mobile App',
      tagline: 'Consumer Experience',
      device: 'iPhone 16 Pro Frame',
      description:
        'Complete passenger journey featuring 4 service modes (Ride, Bid Your Fare, Hourly Rental, Outstation), instant matching radar, live ticking fare meter, and card/wallet payments.',
      icon: Smartphone,
      accent: 'border-amber-200 hover:border-[#FF5A36]',
      badgeColor: 'text-[#FF5A36]',
      highlights: ['Bid Your Fare live counter-offers', 'Route polyline & car interpolation', 'Instant dispute resolution'],
    },
    {
      id: 'driver' as const,
      title: 'Driver Partner App',
      tagline: 'Fleet Driver Terminal',
      device: 'Android Galaxy S25 Frame',
      description:
        'Driver interface with online toggle, demand heatmap zones, 15-second countdown incoming request ring, turn-by-turn progression, and weekly earnings analytics.',
      icon: Car,
      accent: 'border-teal-200 hover:border-[#0F766E]',
      badgeColor: 'text-[#0F766E]',
      highlights: ['15s animated request ring', 'Instant SEPA bank payout', 'Document verification lifecycle'],
    },
    {
      id: 'admin' as const,
      title: 'Admin HQ Console',
      tagline: 'Enterprise Operations',
      device: 'Full Desktop Web',
      description:
        'Central control tower with real-time KPI dashboards, live city telematics radar map, trips table replay, live pricing & commission engine, and compliance queues.',
      icon: LayoutDashboard,
      accent: 'border-slate-300 hover:border-slate-900',
      badgeColor: 'text-slate-900',
      highlights: ['Live dynamic fare & commission editor', 'One-click driver document audit', 'Customer dispute refund center'],
    },
    {
      id: 'agent' as const,
      title: 'Agent Dispatch Console',
      tagline: 'Fleet & Call Center',
      device: 'Full Desktop Web',
      description:
        'Concierge interface for hotel front-desks and call centers to book rides on behalf of phone callers with automated matching and commission splits.',
      icon: PhoneCall,
      accent: 'border-blue-200 hover:border-blue-700',
      badgeColor: 'text-blue-700',
      highlights: ['Phone caller reservation dispatch', 'Fleet partner driver monitoring', 'Real-time booking revenue split'],
    },
  ];

  return (
    <div className="min-h-full w-full bg-[#F7F7F4] text-[#0E1116] py-10 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Presentation Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E7E7E2] shadow-xs text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-[#FF5A36] animate-pulse" />
          <span>Interactive Client Sales Demo · Berlin Fleet Simulation</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-[#0E1116] text-balance">
          Complete Enterprise Mobility Platform
        </h1>

        <p className="text-sm sm:text-base text-[#5B6170] max-w-2xl mx-auto leading-relaxed">
          Experience every stakeholder touchpoint in real time. Ride requests travel seamlessly from passenger to driver to admin control tower with zero placeholder data.
        </p>

        {/* Live View Hero CTA Button */}
        <div className="pt-2">
          <button
            onClick={() => onSelectView('live')}
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-sunrise text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:opacity-95 active:scale-98 transition-all"
          >
            <Columns className="w-5 h-5" />
            <span>Launch Live Synchronized View (Rider + Driver + Admin)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Interactive App Entry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              onClick={() => onSelectView(c.id)}
              className={`p-7 rounded-3xl bg-white border ${c.accent} shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${c.badgeColor}`}>
                    {c.tagline}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-heading font-bold text-slate-900 group-hover:text-[#FF5A36] transition-colors">
                    {c.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium block mt-0.5">
                    Frame: {c.device}
                  </span>
                  <p className="text-xs sm:text-sm text-[#5B6170] mt-3 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                {/* Highlights */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  {c.highlights.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-[#FF5A36]">
                <span>Launch {c.title}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise Architectural Capabilities Strip */}
      <div className="p-8 rounded-3xl bg-white border border-[#E7E7E2] shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="font-heading font-bold text-lg text-slate-900">
            Enterprise Architecture & Sales Demo Highlights
          </h3>
          <p className="text-xs text-slate-500">
            Engineered as a clean white-label mobility platform ready for European market deployment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Multi-Tab Broadcast Sync</span>
            </h4>
            <p className="leading-relaxed">
              Open the Rider app and Driver app in separate browser tabs or windows—all state changes, trips, and bids sync via native BroadcastChannel.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#FF5A36]" />
              <span>Live Fare Rules Engine</span>
            </h4>
            <p className="leading-relaxed">
              Adjust base fares, per-km rates, or surge multipliers in the Admin console, and watch new fare estimates immediately update in the rider app.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Closed-Loop Compliance</span>
            </h4>
            <p className="leading-relaxed">
              Driver document verification queue and rider dispute resolution with partial/full refunds credited straight into in-app wallets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
