import React, { useState } from 'react';
import { DemoHub } from './components/DemoHub';
import { LiveView } from './components/LiveView';
import { RiderApp } from './apps/rider/RiderApp';
import { DriverApp } from './apps/driver/DriverApp';
import { AdminConsole } from './apps/admin/AdminConsole';
import { AgentConsole } from './apps/agent/AgentConsole';
import { PhoneFrame } from './components/ui/PhoneFrame';
import { useMovoStore, movoStore } from './services/movoStore';
import { RotateCcw, Columns, Smartphone, Car, LayoutDashboard, PhoneCall } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'hub' | 'live' | 'rider' | 'driver' | 'admin' | 'agent'
  >('hub');

  const store = useMovoStore();
  const activeTrip = store.activeTrip;

  return (
    <div className="min-h-screen w-full bg-[#F7F7F4] text-[#0E1116] flex flex-col">
      {/* Top Bar Navigation (Top Bar Contract) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E7E7E2] px-4 lg:px-8 py-3.5 flex items-center justify-between gap-8 shrink-0">
        {/* Zone 1: Single text element brand wordmark */}
        <div
          onClick={() => setCurrentView('hub')}
          className="flex items-center gap-2 cursor-pointer select-none shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-sunrise flex items-center justify-center text-white font-heading font-black text-xs shadow-xs">
            M
          </div>
          <span className="font-heading font-black text-lg tracking-tight text-[#0E1116] whitespace-nowrap">
            MOVO
          </span>
        </div>

        {/* Zone 2: 4-5 single-line clean navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs font-semibold text-slate-600 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCurrentView('hub')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'hub' ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:text-slate-900'
            }`}
          >
            Demo Hub
          </button>
          <button
            onClick={() => setCurrentView('live')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              currentView === 'live'
                ? 'bg-gradient-sunrise text-white font-bold shadow-xs'
                : 'text-[#FF5A36] font-bold hover:bg-orange-50'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Live Side-by-Side</span>
          </button>
          <button
            onClick={() => setCurrentView('rider')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'rider' ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:text-slate-900'
            }`}
          >
            Rider App
          </button>
          <button
            onClick={() => setCurrentView('driver')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'driver' ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:text-slate-900'
            }`}
          >
            Driver App
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'admin' ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:text-slate-900'
            }`}
          >
            Admin Console
          </button>
          <button
            onClick={() => setCurrentView('agent')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'agent' ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:text-slate-900'
            }`}
          >
            Agent Console
          </button>
        </nav>

        {/* Zone 3: 1 Primary contextual action & trip telemetry pill */}
        <div className="flex items-center gap-3 shrink-0">
          {activeTrip && (
            <div
              onClick={() => setCurrentView('live')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold cursor-pointer hover:bg-teal-100 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>Trip {activeTrip.id} Active</span>
            </div>
          )}

          <button
            onClick={() => movoStore.resetDemoData()}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Reset to default seed state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </header>

      {/* Main View Render */}
      <div className="flex-1 flex flex-col">
        {currentView === 'hub' && <DemoHub onSelectView={setCurrentView} />}
        {currentView === 'live' && <LiveView />}

        {currentView === 'rider' && (
          <div className="flex-1 flex items-center justify-center py-8 px-4 bg-[#ecece8]">
            <PhoneFrame
              type="ios"
              title="Rider Experience (Standalone)"
              badge="iPhone 16 Pro"
            >
              <RiderApp />
            </PhoneFrame>
          </div>
        )}

        {currentView === 'driver' && (
          <div className="flex-1 flex items-center justify-center py-8 px-4 bg-[#ecece8]">
            <PhoneFrame
              type="android"
              title="Driver Terminal (Standalone)"
              badge="Galaxy S25"
            >
              <DriverApp />
            </PhoneFrame>
          </div>
        )}

        {currentView === 'admin' && <AdminConsole />}
        {currentView === 'agent' && <AgentConsole />}
      </div>
    </div>
  );
}
