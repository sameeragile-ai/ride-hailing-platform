import React, { useState } from 'react';
import {
  PhoneCall,
  Car,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useMovoStore, movoStore } from '../../services/movoStore';
import { BERLIN_LOCATIONS } from '../../data/seedData';
import { VehicleClassId, LocationPoint } from '../../lib/types';

export function AgentConsole() {
  const store = useMovoStore();
  const currentAgent = store.agents[0]; // Berlin North Fleet & Dispatch Hub

  // Dispatch booking form state
  const [callerName, setCallerName] = useState('Helena Weber');
  const [callerPhone, setCallerPhone] = useState('+49 171 4920194');
  const [pickupIndex, setPickupIndex] = useState(0);
  const [dropoffIndex, setDropoffIndex] = useState(1);
  const [selectedClass, setSelectedClass] = useState<VehicleClassId>('comfort');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'cash'>('cash');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'fleet' | 'history'>('dispatch');

  // Agent's fleet drivers
  const fleetDrivers = store.drivers.filter(
    (d) => d.fleetId === 'fleet-north' || d.fleetId === 'fleet-mitte'
  );

  const handleBookRide = (e: React.FormEvent) => {
    e.preventDefault();
    const pickup = BERLIN_LOCATIONS[pickupIndex];
    const dropoff = BERLIN_LOCATIONS[dropoffIndex];

    movoStore.agentBookRide({
      callerName,
      callerPhone,
      pickup,
      dropoff,
      vehicleClass: selectedClass,
      agentId: currentAgent.id,
      paymentMethod,
    });

    setDispatchSuccess(true);
    setTimeout(() => setDispatchSuccess(false), 4000);
  };

  return (
    <div className="flex h-screen w-full bg-[#F7F7F4] text-[#0E1116] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E7E7E2] flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-[#E7E7E2]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white font-heading font-black text-sm shadow-xs">
                A
              </div>
              <div>
                <span className="font-heading font-black text-base tracking-tight text-[#0E1116] block">
                  Agent Dispatch
                </span>
                <span className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider block">
                  {currentAgent.company}
                </span>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {[
              { id: 'dispatch', label: 'Phone Dispatcher', icon: PhoneCall },
              { id: 'fleet', label: 'Fleet Overview', icon: Car, badge: fleetDrivers.length },
              { id: 'history', label: 'Dispatch History', icon: Clock },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isActive ? 'bg-white text-teal-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Agent metrics */}
        <div className="p-4 border-t border-[#E7E7E2] space-y-3">
          <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/60 text-xs">
            <span className="text-[10px] font-bold uppercase text-teal-800 block">
              Dispatcher Commission
            </span>
            <p className="text-base font-black text-teal-950 mt-0.5 tabular-nums">
              €{currentAgent.commissionEarned.toFixed(2)}
            </p>
            <span className="text-[10px] text-teal-700">{currentAgent.totalBookings} booked rides</span>
          </div>

          <button
            onClick={() => movoStore.resetDemoData()}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-[#E7E7E2] px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-heading font-black text-lg text-slate-900 tracking-tight">
              Call-Center Dispatch & Concierge Terminal
            </h1>
            <p className="text-xs text-slate-500">
              Agent ID: {currentAgent.id} · Dispatching in Berlin Metropolitan Area
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              Dispatcher: {currentAgent.name}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {/* TAB 1: PHONE DISPATCHER */}
          {activeTab === 'dispatch' && (
            <div className="max-w-3xl space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Book Ride on Behalf of Caller
                  </h3>
                  <p className="text-xs text-slate-500">
                    Instantly creates an active trip in the Movo ecosystem and dispatches the nearest fleet driver.
                  </p>
                </div>

                {dispatchSuccess && (
                  <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>
                      Trip dispatched successfully! Assigned driver notified. Caller received confirmation SMS with live tracking.
                    </span>
                  </div>
                )}

                <form onSubmit={handleBookRide} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Caller Full Name
                      </label>
                      <input
                        type="text"
                        value={callerName}
                        onChange={(e) => setCallerName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Caller Phone Number
                      </label>
                      <input
                        type="tel"
                        value={callerPhone}
                        onChange={(e) => setCallerPhone(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Pickup Location
                      </label>
                      <select
                        value={pickupIndex}
                        onChange={(e) => setPickupIndex(parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
                      >
                        {BERLIN_LOCATIONS.map((loc, idx) => (
                          <option key={idx} value={idx}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Destination Dropoff
                      </label>
                      <select
                        value={dropoffIndex}
                        onChange={(e) => setDropoffIndex(parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
                      >
                        {BERLIN_LOCATIONS.map((loc, idx) => (
                          <option key={idx} value={idx}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Vehicle Tier Class
                      </label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 uppercase"
                      >
                        <option value="economy">Economy (Sedan / EV)</option>
                        <option value="comfort">Comfort (Mercedes / BMW)</option>
                        <option value="xl">Movo XL (Van up to 6 seats)</option>
                        <option value="premium">Black VIP (Executive Chauffeur)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Payment Collection
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
                      >
                        <option value="cash">Cash to Driver at Curb</option>
                        <option value="card">Bill Corporate Agency Account</option>
                        <option value="wallet">Pre-Authorized Traveler Card</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-teal-800 text-white font-bold text-xs hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Dispatch Ride Now & Notify Driver</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: FLEET OVERVIEW */}
          {activeTab === 'fleet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Affiliated Fleet Drivers ({fleetDrivers.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live driver telematics and commission split overview.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fleetDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="p-4 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={driver.avatar}
                          alt={driver.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{driver.name}</h4>
                          <span className="text-[10px] text-amber-500 font-semibold">
                            ★ {driver.rating.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          driver.status === 'online'
                            ? 'bg-teal-100 text-teal-800'
                            : driver.status === 'busy'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {driver.status}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Vehicle:</span>
                        <span className="font-semibold text-slate-800">
                          {driver.vehicle.make} {driver.vehicle.model}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>License Plate:</span>
                        <span className="font-mono text-slate-800">{driver.vehicle.plate}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Today's Net:</span>
                        <span className="font-bold text-teal-700 tabular-nums">
                          €{driver.todayEarnings.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DISPATCH HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Agent Bookings Log
              </h3>
              <div className="rounded-2xl bg-white border border-[#E7E7E2] shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#E7E7E2] text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Trip ID</th>
                      <th className="p-3.5">Caller / Passenger</th>
                      <th className="p-3.5">Route</th>
                      <th className="p-3.5">Class</th>
                      <th className="p-3.5">Total Fare</th>
                      <th className="p-3.5">Agent Commission</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {store.pastTrips.slice(0, 10).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="p-3.5 font-mono text-slate-900">{t.id}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{t.riderName}</p>
                          <p className="text-[10px] text-slate-400">{t.riderPhone}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-medium text-slate-800">{t.pickup.name}</p>
                          <p className="text-[10px] text-slate-400">→ {t.dropoff.name}</p>
                        </td>
                        <td className="p-3.5 uppercase font-semibold text-slate-600">
                          {t.vehicleClass}
                        </td>
                        <td className="p-3.5 font-bold tabular-nums text-slate-900">
                          €{t.fareBreakdown.total.toFixed(2)}
                        </td>
                        <td className="p-3.5 font-bold tabular-nums text-teal-700">
                          €{(t.fareBreakdown.platformFee * 0.4).toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
