import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  Car,
  Users,
  DollarSign,
  AlertTriangle,
  FileCheck,
  Tag,
  Briefcase,
  Search,
  Filter,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Save,
  RotateCcw,
  Eye,
  Sliders,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMovoStore, movoStore } from '../../services/movoStore';
import { Driver, Trip, Dispute, VehicleClassId, PlatformConfig } from '../../lib/types';
import { MapComponent } from '../../components/ui/MapComponent';

export function AdminConsole() {
  const store = useMovoStore();
  const [activeNav, setActiveNav] = useState<
    'dashboard' | 'live_map' | 'trips' | 'pricing' | 'verification' | 'riders' | 'disputes' | 'fleet'
  >('dashboard');

  // Selected trip drawer for inspection
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Pricing config form state
  const [pricingConfig, setPricingConfig] = useState<PlatformConfig>(store.config);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Trips filters
  const [tripStatusFilter, setTripStatusFilter] = useState<string>('all');
  const [tripSearch, setTripSearch] = useState<string>('');

  // Disputes action state
  const [refundInputs, setRefundInputs] = useState<Record<string, number>>({});
  const [adminNoteInputs, setAdminNoteInputs] = useState<Record<string, string>>({});

  // Synchronize local pricing config if external state changes
  React.useEffect(() => {
    setPricingConfig(store.config);
  }, [store.config]);

  // Derived KPI metrics
  const activeTripsCount = store.activeTrip ? 1 : 0;
  const onlineDriversCount = store.drivers.filter((d) => d.status === 'online').length;
  const busyDriversCount = store.drivers.filter((d) => d.status === 'busy').length;
  const totalRevenueToday = useMemo(() => {
    const tripRev = store.pastTrips.slice(0, 15).reduce((acc, t) => acc + t.fareBreakdown.platformFee, 0);
    return Math.round(tripRev * 100) / 100;
  }, [store.pastTrips]);

  // Hourly demand trend chart data
  const demandData = [
    { hour: '06:00', trips: 42, revenue: 380 },
    { hour: '08:00', trips: 110, revenue: 1240 },
    { hour: '10:00', trips: 85, revenue: 910 },
    { hour: '12:00', trips: 92, revenue: 1020 },
    { hour: '14:00', trips: 78, revenue: 860 },
    { hour: '16:00', trips: 135, revenue: 1540 },
    { hour: '18:00', trips: 168, revenue: 1980 },
    { hour: '20:00', trips: 122, revenue: 1410 },
    { hour: '22:00', trips: 95, revenue: 1100 },
  ];

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return store.pastTrips.filter((t) => {
      const matchesStatus = tripStatusFilter === 'all' || t.status === tripStatusFilter;
      const matchesSearch =
        tripSearch === '' ||
        t.id.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.riderName.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.pickup.name.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.dropoff.name.toLowerCase().includes(tripSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [store.pastTrips, tripStatusFilter, tripSearch]);

  // Pending documents across all drivers
  const pendingVerifications = useMemo(() => {
    const list: { driver: Driver; doc: any }[] = [];
    store.drivers.forEach((d) => {
      d.documents.forEach((doc) => {
        if (doc.status === 'pending') {
          list.push({ driver: d, doc });
        }
      });
    });
    return list;
  }, [store.drivers]);

  // Save pricing changes to central store (instantly updates rider app!)
  const handleSavePricing = () => {
    movoStore.adminUpdateConfig(pricingConfig);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  return (
    <div className="flex h-screen w-full bg-[#F7F7F4] text-[#0E1116] overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E7E7E2] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Branding */}
          <div className="p-6 border-b border-[#E7E7E2] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-sunrise flex items-center justify-center text-white font-heading font-black text-sm shadow-xs">
                M
              </div>
              <div>
                <span className="font-heading font-black text-base tracking-tight text-[#0E1116] block">
                  MOVO HQ
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Berlin Admin Portal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'live_map', label: 'Live Fleet Map', icon: MapIcon },
              { id: 'trips', label: 'Trips & Replay', icon: Car },
              { id: 'pricing', label: 'Fare & Commission', icon: Sliders },
              {
                id: 'verification',
                label: 'Driver Verification',
                icon: FileCheck,
                badge: pendingVerifications.length,
              },
              { id: 'riders', label: 'Riders & Accounts', icon: Users },
              {
                id: 'disputes',
                label: 'Disputes Queue',
                icon: AlertTriangle,
                badge: store.disputes.filter((d) => d.status === 'open').length,
              },
              { id: 'fleet', label: 'Fleet & Promos', icon: Briefcase },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isActive ? 'bg-[#FF5A36] text-white' : 'bg-rose-100 text-rose-800'
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

        {/* Footer info & Reset */}
        <div className="p-4 border-t border-[#E7E7E2] space-y-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-800">Berlin Operations</span>
            <p className="text-[10px] mt-0.5">Surge Status: {store.config.surgeMultiplier}x Base</p>
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

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#E7E7E2] px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-heading font-black text-lg text-slate-900 tracking-tight capitalize">
              {activeNav.replace('_', ' ')}
            </h1>
            <p className="text-xs text-slate-500">
              City Zone: Berlin Central (52.5200° N, 13.4050° E) · Sync: Active
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span>{onlineDriversCount} Drivers Online</span>
              <span className="text-slate-400">·</span>
              <span className="text-amber-600 font-bold">{busyDriversCount} on Trip</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
              AD
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* VIEW 1: DASHBOARD */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              {/* 5 KPI Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Active Trips Right Now', val: activeTripsCount, sub: 'Live on Berlin map', trend: '+2 vs avg' },
                  { label: 'Online Fleet Drivers', val: onlineDriversCount, sub: `${store.drivers.length} registered`, trend: '94% ready' },
                  { label: 'Platform Revenue Today', val: `€${totalRevenueToday.toFixed(2)}`, sub: '18% - 25% take-rate', trend: '+18.4% today' },
                  { label: 'Avg Match Dispatch Time', val: '4.2s', sub: 'Target < 10.0s', trend: 'Optimal' },
                  { label: 'Trip Cancellation Rate', val: '1.8%', sub: 'Target < 4.0%', trend: '-0.4% MoM' },
                ].map((kpi, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      {kpi.label}
                    </span>
                    <h3 className="text-2xl font-heading font-black text-slate-900 tabular-nums">
                      {kpi.val}
                    </h3>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">{kpi.sub}</span>
                      <span className="font-semibold text-teal-700">{kpi.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Demand Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-heading font-bold text-base text-slate-900">
                        Hourly Demand & Ride Volume (Berlin)
                      </h3>
                      <p className="text-xs text-slate-500">Real-time trip completed volume across time slots</p>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={demandData}>
                        <defs>
                          <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF5A36" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#FF5A36" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="trips"
                          stroke="#FF5A36"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorDemand)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Fleet Class Distribution */}
                <div className="p-6 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs space-y-4">
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Fleet Class Utilization
                  </h3>
                  <div className="space-y-3 text-xs">
                    {[
                      { name: 'Economy', count: 8, share: '40%', color: 'bg-teal-500' },
                      { name: 'Comfort', count: 6, share: '30%', color: 'bg-blue-500' },
                      { name: 'Movo XL', count: 3, share: '15%', color: 'bg-amber-500' },
                      { name: 'Black VIP', count: 3, share: '15%', color: 'bg-slate-900' },
                    ].map((c) => (
                      <div key={c.name} className="space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-800">{c.name}</span>
                          <span className="text-slate-500">{c.count} vehicles ({c.share})</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${c.color}`} style={{ width: c.share }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 block mb-1 font-medium">Quick Actions</span>
                    <button
                      onClick={() => setActiveNav('pricing')}
                      className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
                    >
                      Adjust Surge & Pricing Rules
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: LIVE FLEET MAP */}
          {activeNav === 'live_map' && (
            <div className="h-[750px] rounded-2xl bg-white border border-[#E7E7E2] shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 border-b border-[#E7E7E2] flex items-center justify-between bg-white z-20">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-slate-900">Berlin Telematics Radar</span>
                  <span className="text-xs text-slate-500">
                    Showing {store.drivers.length} drivers drifting in real time
                  </span>
                </div>
                {selectedDriver && (
                  <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <span className="font-bold text-slate-900">{selectedDriver.name}</span>
                    <span className="text-slate-500">{selectedDriver.vehicle.plate}</span>
                    <span className="text-[#0F766E] uppercase font-bold text-[10px]">
                      {selectedDriver.status}
                    </span>
                    <button
                      onClick={() => setSelectedDriver(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 w-full relative">
                <MapComponent
                  center={{ lat: 52.5200, lng: 13.4050 }}
                  zoom={13}
                  drivers={store.drivers}
                  pickup={store.activeTrip?.pickup}
                  dropoff={store.activeTrip?.dropoff}
                  routePolyline={store.activeTrip?.routePolyline}
                  onDriverClick={(d) => setSelectedDriver(d)}
                  className="h-full w-full"
                />
              </div>
            </div>
          )}

          {/* VIEW 3: TRIPS TABLE & ROUTE REPLAY */}
          {activeNav === 'trips' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="p-4 rounded-2xl bg-white border border-[#E7E7E2] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={tripSearch}
                      onChange={(e) => setTripSearch(e.target.value)}
                      placeholder="Search by Trip ID, passenger, or address..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF5A36]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {['all', 'completed', 'in_progress', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setTripStatusFilter(st)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                        tripStatusFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl bg-white border border-[#E7E7E2] shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#E7E7E2] text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Trip ID</th>
                      <th className="p-3.5">Service / Class</th>
                      <th className="p-3.5">Rider</th>
                      <th className="p-3.5">Pickup → Dropoff</th>
                      <th className="p-3.5">Distance</th>
                      <th className="p-3.5">Total Fare</th>
                      <th className="p-3.5">Platform Fee</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTrips.slice(0, 15).map((trip) => (
                      <tr key={trip.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-medium text-slate-900">{trip.id}</td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800 capitalize">
                            {trip.serviceType}
                          </span>{' '}
                          <span className="text-[10px] text-slate-500 uppercase">
                            · {trip.vehicleClass}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-900">{trip.riderName}</p>
                          <p className="text-[10px] text-slate-400">{trip.riderPhone}</p>
                        </td>
                        <td className="p-3.5 max-w-[200px] truncate">
                          <p className="font-medium text-slate-800 truncate">{trip.pickup.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">→ {trip.dropoff.name}</p>
                        </td>
                        <td className="p-3.5 tabular-nums text-slate-600">
                          {trip.estimatedDistanceKm} km
                        </td>
                        <td className="p-3.5 font-bold tabular-nums text-slate-900">
                          €{trip.fareBreakdown.total.toFixed(2)}
                        </td>
                        <td className="p-3.5 font-semibold tabular-nums text-teal-700">
                          €{trip.fareBreakdown.platformFee.toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              trip.status === 'completed'
                                ? 'bg-teal-100 text-teal-800'
                                : trip.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {trip.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedTrip(trip)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                          >
                            Replay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Trip Replay & Receipt Drawer */}
              {selectedTrip && (
                <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-[#E7E7E2] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E2]">
                      <div>
                        <h3 className="font-heading font-bold text-base text-slate-900">
                          Trip Telematics Replay
                        </h3>
                        <p className="font-mono text-xs text-slate-500">{selectedTrip.id}</p>
                      </div>
                      <button
                        onClick={() => setSelectedTrip(null)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Replay Map view */}
                    <div className="h-56 rounded-xl overflow-hidden border border-slate-200">
                      <MapComponent
                        center={selectedTrip.pickup}
                        zoom={13}
                        pickup={selectedTrip.pickup}
                        dropoff={selectedTrip.dropoff}
                        routePolyline={selectedTrip.routePolyline}
                        showAllDrivers={false}
                        className="h-full w-full"
                      />
                    </div>

                    {/* Breakdown */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <h4 className="font-bold text-slate-900 mb-1">Financial Reconciliation</h4>
                      <div className="flex justify-between text-slate-600">
                        <span>Base Fare</span>
                        <span className="tabular-nums">€{selectedTrip.fareBreakdown.baseFare.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Distance Fare ({selectedTrip.fareBreakdown.distanceKm} km)</span>
                        <span className="tabular-nums">€{selectedTrip.fareBreakdown.distanceFare.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Duration Fare ({selectedTrip.fareBreakdown.durationMinutes} min)</span>
                        <span className="tabular-nums">€{selectedTrip.fareBreakdown.durationFare.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                        <span>Gross Fare</span>
                        <span className="tabular-nums">€{selectedTrip.fareBreakdown.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-teal-700">
                        <span>Platform Commission</span>
                        <span className="tabular-nums">€{selectedTrip.fareBreakdown.platformFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Driver Net Payout</span>
                        <span className="tabular-nums">€{selectedTrip.fareBreakdown.driverShare.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTrip(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
                  >
                    Close Replay
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: FARE & COMMISSION MANAGEMENT (Live dynamic configuration!) */}
          {activeNav === 'pricing' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-900">
                    Pricing & Commission Rules Engine
                  </h2>
                  <p className="text-xs text-slate-500">
                    Edits made here immediately propagate to rider fare estimates in real time.
                  </p>
                </div>
                <button
                  onClick={handleSavePricing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-sunrise text-white font-bold text-xs flex items-center gap-2 shadow-md hover:opacity-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Deploy Rates</span>
                </button>
              </div>

              {configSavedToast && (
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    New pricing rules active! All rider clients now calculate with updated base and km rates.
                  </span>
                </div>
              )}

              {/* Surge Multiplier Slider */}
              <div className="p-5 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">City-Wide Surge Multiplier</h3>
                    <p className="text-xs text-slate-500">Dynamic multiplier applied during peak Berlin hours</p>
                  </div>
                  <span className="text-xl font-heading font-black text-[#FF5A36] tabular-nums">
                    {pricingConfig.surgeMultiplier.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={pricingConfig.surgeMultiplier}
                  onChange={(e) =>
                    setPricingConfig({ ...pricingConfig, surgeMultiplier: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#FF5A36] cursor-pointer"
                />
              </div>

              {/* Per-Class Fare Rates */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Vehicle Classes & Base Rates (EUR)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['economy', 'comfort', 'xl', 'premium'] as VehicleClassId[]).map((vId) => {
                    const cfg = pricingConfig.vehicleClasses[vId];
                    return (
                      <div
                        key={vId}
                        className="p-4 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-xs text-slate-900">{cfg.name}</span>
                          <span className="text-[10px] uppercase font-bold text-[#FF5A36]">{vId}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                              Base Fare (€)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={cfg.baseFare}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPricingConfig({
                                  ...pricingConfig,
                                  vehicleClasses: {
                                    ...pricingConfig.vehicleClasses,
                                    [vId]: { ...cfg, baseFare: val },
                                  },
                                });
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#FF5A36]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                              Per Km Rate (€)
                            </label>
                            <input
                              type="number"
                              step="0.05"
                              value={cfg.perKm}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPricingConfig({
                                  ...pricingConfig,
                                  vehicleClasses: {
                                    ...pricingConfig.vehicleClasses,
                                    [vId]: { ...cfg, perKm: val },
                                  },
                                });
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#FF5A36]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                              Per Minute (€)
                            </label>
                            <input
                              type="number"
                              step="0.05"
                              value={cfg.perMinute}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPricingConfig({
                                  ...pricingConfig,
                                  vehicleClasses: {
                                    ...pricingConfig.vehicleClasses,
                                    [vId]: { ...cfg, perMinute: val },
                                  },
                                });
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#FF5A36]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                              Commission (%)
                            </label>
                            <input
                              type="number"
                              step="1"
                              value={Math.round(cfg.commissionRate * 100)}
                              onChange={(e) => {
                                const val = (parseFloat(e.target.value) || 0) / 100;
                                setPricingConfig({
                                  ...pricingConfig,
                                  commissionRates: {
                                    ...pricingConfig.commissionRates,
                                    [vId]: val,
                                  },
                                  vehicleClasses: {
                                    ...pricingConfig.vehicleClasses,
                                    [vId]: { ...cfg, commissionRate: val },
                                  },
                                });
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#FF5A36]"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: DRIVER DOCUMENT VERIFICATION QUEUE */}
          {activeNav === 'verification' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-900">
                    Driver Verification & Compliance Queue
                  </h2>
                  <p className="text-xs text-slate-500">
                    Review and approve submitted driver licenses, passenger insurance, and registration documents.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                  {pendingVerifications.length} Documents Pending
                </span>
              </div>

              <div className="rounded-2xl bg-white border border-[#E7E7E2] shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#E7E7E2] text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Driver Name</th>
                      <th className="p-3.5">Vehicle</th>
                      <th className="p-3.5">Document Name</th>
                      <th className="p-3.5">Uploaded Date</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingVerifications.map(({ driver, doc }) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={driver.avatar}
                              alt={driver.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{driver.name}</p>
                              <p className="text-[10px] text-slate-400">{driver.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-800">
                            {driver.vehicle.make} {driver.vehicle.model}
                          </p>
                          <p className="text-[10px] text-slate-400">{driver.vehicle.plate}</p>
                        </td>
                        <td className="p-3.5 font-medium text-slate-800">{doc.name}</td>
                        <td className="p-3.5 text-slate-500">{doc.uploadedAt}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                            Pending Review
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                movoStore.adminVerifyDocument(
                                  driver.id,
                                  doc.id,
                                  'rejected',
                                  'Document image expired or invalid'
                                )
                              }
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() =>
                                movoStore.adminVerifyDocument(driver.id, doc.id, 'approved')
                              }
                              className="px-3 py-1 text-[11px] font-semibold text-white bg-[#0F766E] hover:bg-[#0c5e58] rounded-lg shadow-xs"
                            >
                              Approve
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingVerifications.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          <Check className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                          All driver compliance documents are up to date!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 6: RIDERS LIST */}
          {activeNav === 'riders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-900">Rider Accounts</h2>
                  <p className="text-xs text-slate-500">Manage registered riders, wallet balances, and account access.</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-[#E7E7E2] shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#E7E7E2] text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Rider</th>
                      <th className="p-3.5">Rating</th>
                      <th className="p-3.5">Wallet Balance</th>
                      <th className="p-3.5">Payment Methods</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Access Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {store.riders.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <img src={r.avatar} alt={r.name} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <p className="font-bold text-slate-900">{r.name}</p>
                              <p className="text-[10px] text-slate-400">{r.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-amber-500">★ {r.rating.toFixed(2)}</td>
                        <td className="p-3.5 font-bold tabular-nums text-teal-700">
                          €{r.walletBalance.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {r.paymentMethods.map((pm) => pm.brand || pm.type).join(', ')}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              r.isBlocked ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {r.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => movoStore.adminToggleRiderBlock(r.id)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                              r.isBlocked
                                ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            {r.isBlocked ? 'Unblock Rider' : 'Suspend Account'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 7: DISPUTES QUEUE */}
          {activeNav === 'disputes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-lg text-slate-900">
                    Customer Support & Disputes Queue
                  </h2>
                  <p className="text-xs text-slate-500">
                    Investigate rider complaints, review telematics, and authorize partial/full wallet refunds.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {store.disputes.map((disp) => {
                  const currentRefund = refundInputs[disp.id] ?? disp.claimedAmount;
                  const currentNote = adminNoteInputs[disp.id] ?? '';

                  return (
                    <div
                      key={disp.id}
                      className="p-5 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {disp.id}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-xs font-semibold text-slate-700">
                            Trip {disp.tripId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              disp.status === 'open'
                                ? 'bg-amber-100 text-amber-800'
                                : disp.status === 'resolved'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {disp.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Filed {new Date(disp.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Passenger
                          </span>
                          <p className="font-bold text-slate-900">{disp.riderName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Driver Partner
                          </span>
                          <p className="font-bold text-slate-900">{disp.driverName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Claimed Refund Amount
                          </span>
                          <p className="font-bold tabular-nums text-[#FF5A36]">
                            €{disp.claimedAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <strong>Reason: {disp.reason.replace('_', ' ')}</strong>
                        <p className="mt-1">{disp.description}</p>
                      </div>

                      {disp.status === 'open' && (
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                            <input
                              type="text"
                              placeholder="Add admin audit notes..."
                              value={currentNote}
                              onChange={(e) =>
                                setAdminNoteInputs({ ...adminNoteInputs, [disp.id]: e.target.value })
                              }
                              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5A36]"
                            />
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-slate-500">Refund:</span>
                              <input
                                type="number"
                                step="0.5"
                                value={currentRefund}
                                onChange={(e) =>
                                  setRefundInputs({
                                    ...refundInputs,
                                    [disp.id]: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-16 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                movoStore.adminRejectDispute(disp.id, currentNote || 'Claim rejected after telematics audit')
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100"
                            >
                              Reject Dispute
                            </button>
                            <button
                              onClick={() =>
                                movoStore.adminResolveDispute(
                                  disp.id,
                                  currentRefund,
                                  currentNote || 'Approved refund to passenger wallet'
                                )
                              }
                              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0c5e58] shadow-xs"
                            >
                              Approve Refund (€{currentRefund.toFixed(2)})
                            </button>
                          </div>
                        </div>
                      )}

                      {disp.status === 'resolved' && (
                        <p className="text-xs text-teal-700 font-medium">
                          Resolved: €{disp.refundAmount?.toFixed(2)} refunded to passenger wallet.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 8: FLEET PARTNERS & PROMO CODES */}
          {activeNav === 'fleet' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Fleet Partners & Dispatch Centers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {store.agents.map((ag) => (
                    <div key={ag.id} className="p-4 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900">{ag.company}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{ag.id}</span>
                      </div>
                      <p className="text-xs text-slate-500">Contact Dispatcher: {ag.name} ({ag.phone})</p>
                      <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                        <div className="p-2 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-400 block">Fleet Size</span>
                          <span className="font-bold text-slate-800">{ag.activeFleetSize} vehicles</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-400 block">Total Dispatches</span>
                          <span className="font-bold text-slate-800">{ag.totalBookings}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-400 block">Commission</span>
                          <span className="font-bold text-teal-700 tabular-nums">€{ag.commissionEarned.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promo Codes */}
              <div className="space-y-4">
                <h3 className="font-heading font-bold text-base text-slate-900">Active Promo Codes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {store.promoCodes.map((promo) => (
                    <div key={promo.code} className="p-4 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-[#FF5A36]">{promo.code}</span>
                        <span className="text-[10px] font-bold text-teal-700">{promo.discountPercentage}% OFF</span>
                      </div>
                      <p className="text-xs text-slate-500">Max Cap: €{promo.maxDiscount.toFixed(2)} · Valid {promo.validUntil}</p>
                      <p className="text-[11px] text-slate-400 pt-1">Redeemed {promo.timesUsed} times</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
