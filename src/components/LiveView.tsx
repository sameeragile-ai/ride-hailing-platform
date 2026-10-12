import React, { useState } from 'react';
import { PhoneFrame } from './ui/PhoneFrame';
import { RiderApp } from '../apps/rider/RiderApp';
import { DriverApp } from '../apps/driver/DriverApp';
import { MapComponent } from './ui/MapComponent';
import { useMovoStore, movoStore } from '../services/movoStore';
import { BERLIN_LOCATIONS } from '../data/seedData';
import { Play, RotateCcw, Sparkles, Check, ArrowRight } from 'lucide-react';

export function LiveView() {
  const store = useMovoStore();
  const [simulationRunning, setSimulationRunning] = useState(false);

  // Trigger automated demonstration flow for the client!
  const runAutoSimulation = () => {
    if (simulationRunning) return;
    setSimulationRunning(true);

    // 1. Reset state
    movoStore.resetDemoData();

    // 2. Rider requests ride after 800ms
    setTimeout(() => {
      movoStore.requestRide({
        serviceType: 'ride',
        vehicleClass: 'economy',
        pickup: BERLIN_LOCATIONS[0], // Alexanderplatz
        dropoff: BERLIN_LOCATIONS[2], // Potsdamer Platz
        paymentMethod: 'card',
      });
    }, 800);

    // 3. Driver accepts after 4.5s
    setTimeout(() => {
      if (movoStore.getState().activeTrip) {
        const tripId = movoStore.getState().activeTrip!.id;
        movoStore.driverAcceptTrip(tripId);
      }
    }, 4500);

    // 4. Driver arrives at pickup after 9s
    setTimeout(() => {
      movoStore.driverArrivedAtPickup();
    }, 9000);

    // 5. Driver starts trip after 12s
    setTimeout(() => {
      movoStore.startTrip();
    }, 12000);

    // 6. Complete after 22s
    setTimeout(() => {
      movoStore.completeTrip();
      setSimulationRunning(false);
    }, 24000);
  };

  const activeTrip = store.activeTrip;

  return (
    <div className="min-h-full w-full bg-[#F7F7F4] p-4 lg:p-8 space-y-8">
      {/* Simulation Command Strip */}
      <div className="max-w-7xl mx-auto p-4 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <h2 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wide">
              Movo Synchronized Live View Mode
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rider (iOS) and Driver (Android) synced via in-memory event bus and BroadcastChannel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runAutoSimulation}
            disabled={simulationRunning}
            className="px-4 py-2 rounded-xl bg-gradient-sunrise text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:opacity-95 disabled:opacity-40 transition-opacity"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{simulationRunning ? 'Running Live Demo Flow...' : '1-Click Auto Demo Tour'}</span>
          </button>

          <button
            onClick={() => movoStore.resetDemoData()}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Realistic Phone Frames */}
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-center gap-8 lg:gap-14">
        {/* Rider Phone Frame (iPhone) */}
        <PhoneFrame
          type="ios"
          title="Passenger Experience"
          badge="iPhone 16 Pro · iOS 18"
        >
          <RiderApp />
        </PhoneFrame>

        {/* Driver Phone Frame (Android) */}
        <PhoneFrame
          type="android"
          title="Driver Partner Terminal"
          badge="Galaxy S25 · One UI 7"
        >
          <DriverApp />
        </PhoneFrame>
      </div>

      {/* Synchronized Admin Live Radar Map Below */}
      <div className="max-w-7xl mx-auto rounded-3xl bg-white border border-[#E7E7E2] shadow-md overflow-hidden">
        <div className="p-4 border-b border-[#E7E7E2] flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <span className="font-heading font-bold text-sm text-slate-900">
              Admin Live Telematics Stream
            </span>
            <span className="text-xs text-slate-500">
              {activeTrip
                ? `Tracking ${activeTrip.id}: ${activeTrip.status.toUpperCase()}`
                : 'All 20 Berlin fleet drivers online & drifting'}
            </span>
          </div>

          {activeTrip && (
            <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="font-bold text-slate-900">{activeTrip.riderName}</span>
              <span className="text-slate-400">→</span>
              <span className="font-bold text-teal-700">
                €{activeTrip.fareBreakdown.total.toFixed(2)}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                {activeTrip.status}
              </span>
            </div>
          )}
        </div>

        <div className="h-80 w-full relative">
          <MapComponent
            center={{ lat: 52.5200, lng: 13.4050 }}
            zoom={13}
            drivers={store.drivers}
            pickup={activeTrip?.pickup}
            dropoff={activeTrip?.dropoff}
            routePolyline={activeTrip?.routePolyline}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
