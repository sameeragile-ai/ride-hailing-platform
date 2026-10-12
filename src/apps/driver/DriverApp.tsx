import React, { useState, useEffect } from 'react';
import {
  Power,
  Navigation,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  FileText,
  User,
  Car,
  ShieldCheck,
  ChevronRight,
  Phone,
  MessageSquare,
  DollarSign,
  AlertCircle,
  Upload,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMovoStore, movoStore } from '../../services/movoStore';
import { MapComponent } from '../../components/ui/MapComponent';
import { ChatModal } from '../rider/ChatModal';

export function DriverApp() {
  const store = useMovoStore();
  const driver = store.drivers.find((d) => d.id === store.currentDriverId) || store.drivers[0];

  const [activeTab, setActiveTab] = useState<'home' | 'earnings' | 'reviews' | 'profile'>('home');
  const [countdownSeconds, setCountdownSeconds] = useState(15);
  const [showChatModal, setShowChatModal] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [docUploadModal, setDocUploadModal] = useState<string | null>(null);

  const activeTrip = store.activeTrip;
  const isTripAssignedToMe = activeTrip && activeTrip.driverId === driver.id;

  // Incoming request pending driver response
  const isIncomingRequest =
    activeTrip &&
    activeTrip.status === 'matching' &&
    driver.status === 'online' &&
    !isTripAssignedToMe;

  // 15s Countdown timer for incoming request
  useEffect(() => {
    let timer: any;
    if (isIncomingRequest) {
      setCountdownSeconds(15);
      timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto decline if timed out
            if (activeTrip) {
              movoStore.driverDeclineTrip(activeTrip.id);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isIncomingRequest, activeTrip?.id]);

  // Weekly earnings mock data for Recharts
  const weeklyData = [
    { day: 'Mon', amount: 145 },
    { day: 'Tue', amount: 168 },
    { day: 'Wed', amount: 132 },
    { day: 'Thu', amount: 195 },
    { day: 'Fri', amount: 240 },
    { day: 'Sat', amount: 280 },
    { day: 'Sun', amount: driver.todayEarnings || 154 },
  ];

  const isOnline = driver.status === 'online' || driver.status === 'busy';

  return (
    <div className="relative h-full w-full bg-[#F7F7F4] flex flex-col overflow-hidden text-[#0E1116] phone-map">
      {/* Driver Top Navigation Bar */}
      <div className="absolute top-2 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Driver identity */}
        <div className="pointer-events-auto px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E7E7E2] shadow-sm flex items-center gap-2">
          <img
            src={driver.avatar}
            alt={driver.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <div className="leading-tight">
            <span className="text-[11px] font-bold text-slate-900 block truncate max-w-[100px]">
              {driver.name.split(' ')[0]}
            </span>
            <span className="text-[9px] font-semibold text-amber-500">★ {driver.rating.toFixed(2)}</span>
          </div>
        </div>

        {/* Go Online / Offline Toggle */}
        <button
          onClick={() => movoStore.driverToggleOnline(driver.id)}
          className={`pointer-events-auto px-3.5 py-1.5 rounded-2xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95 ${
            isOnline
              ? 'bg-[#0F766E] text-white hover:bg-[#0c5e58]'
              : 'bg-slate-800 text-white hover:bg-slate-900'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </button>
      </div>

      {/* Main View Area based on Bottom Tab */}
      {activeTab === 'home' && (
        <div className="relative flex-1 w-full overflow-hidden flex flex-col">
          {/* Map View */}
          <div className="relative flex-1 w-full overflow-hidden">
            <MapComponent
              center={driver.location}
              zoom={14}
              drivers={[driver]}
              assignedDriverId={driver.id}
              pickup={isTripAssignedToMe ? activeTrip.pickup : undefined}
              dropoff={isTripAssignedToMe ? activeTrip.dropoff : undefined}
              routePolyline={isTripAssignedToMe ? activeTrip.routePolyline : undefined}
              className="h-full w-full"
            />

            {/* Demand Zone Overlay Badge when idle online */}
            {isOnline && !isTripAssignedToMe && (
              <div className="absolute top-14 left-3 z-20 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#E7E7E2] shadow-sm text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-semibold text-slate-800">Berlin Mitte: High Demand (1.4x)</span>
              </div>
            )}
          </div>

          {/* ---------------- DRIVER HOME SHEET STATES ---------------- */}

          {/* STATE A: IDLE / ONLINE OVERVIEW */}
          {!isTripAssignedToMe && !isIncomingRequest && (
            <div className="relative z-30 bg-white rounded-t-3xl border-t border-[#E7E7E2] p-4 shadow-2xl space-y-3">
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-1" />

              {/* Today's Earnings Summary */}
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                    Today's Earnings
                  </span>
                  <p className="text-xl font-heading font-black text-teal-950 tabular-nums">
                    €{driver.todayEarnings.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-teal-700">8 trips completed today</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Acceptance</span>
                  <span className="text-sm font-bold text-slate-800">{driver.acceptanceRate}%</span>
                </div>
              </div>

              {!isOnline && (
                <div className="p-2.5 rounded-xl bg-slate-100 text-center text-xs text-slate-600">
                  You are currently offline. Tap <strong>Go Online</strong> to receive trip dispatches.
                </div>
              )}
            </div>
          )}

          {/* STATE B: INCOMING TRIP REQUEST MODAL (15s Countdown Ring) */}
          {isIncomingRequest && activeTrip && (
            <div className="relative z-30 bg-white rounded-t-3xl border-t-2 border-[#FF5A36] p-4 shadow-2xl space-y-3 animate-in slide-in-from-bottom-5">
              {/* Header with countdown */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5A36]">
                    New Trip Request
                  </span>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    €{activeTrip.fareBreakdown.driverShare.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-500">(Net Earning)</span>
                  </h3>
                </div>

                {/* 15s Countdown Circular Ring */}
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full border-4 border-slate-100 flex items-center justify-center font-bold text-xs text-[#FF5A36] tabular-nums">
                    {countdownSeconds}s
                  </div>
                </div>
              </div>

              {/* Trip Route Details */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mt-1 shrink-0" />
                  <div className="truncate">
                    <p className="font-bold text-slate-900 truncate">{activeTrip.pickup.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{activeTrip.pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5A36] mt-1 shrink-0" />
                  <div className="truncate">
                    <p className="font-bold text-slate-900 truncate">{activeTrip.dropoff.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{activeTrip.dropoff.address}</p>
                  </div>
                </div>
                <div className="border-t border-slate-200/80 pt-1.5 flex justify-between text-[11px] text-slate-500">
                  <span>Est. Distance: {activeTrip.estimatedDistanceKm} km</span>
                  <span>Est. Time: {activeTrip.estimatedDurationMin} mins</span>
                </div>
              </div>

              {/* Accept or Decline buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => movoStore.driverDeclineTrip(activeTrip.id)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => movoStore.driverAcceptTrip(activeTrip.id)}
                  className="flex-2 py-3 rounded-xl bg-[#0F766E] text-white font-bold text-xs hover:bg-[#0c5e58] shadow-md transition-colors"
                >
                  Accept Ride ({countdownSeconds}s)
                </button>
              </div>
            </div>
          )}

          {/* STATE C: ACTIVE TRIP PROGRESSION (Arrived, Start, Complete) */}
          {isTripAssignedToMe && activeTrip && (
            <div className="relative z-30 bg-white rounded-t-3xl border-t border-[#E7E7E2] p-4 shadow-2xl space-y-3">
              {/* Trip Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                    {activeTrip.status === 'driver_arriving'
                      ? 'Navigating to Pickup'
                      : activeTrip.status === 'driver_arrived'
                      ? 'Arrived at Pickup Curb'
                      : 'Trip in Progress'}
                  </span>
                  <h3 className="font-heading font-bold text-sm text-slate-900">
                    {activeTrip.status === 'in_progress'
                      ? activeTrip.dropoff.name
                      : activeTrip.pickup.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Earning</span>
                  <span className="text-sm font-bold text-teal-700 tabular-nums">
                    €{activeTrip.fareBreakdown.driverShare.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Rider card */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{activeTrip.riderName}</p>
                  <p className="text-[11px] text-slate-500">{activeTrip.riderPhone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowChatModal(true)}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <a
                    href={`tel:${activeTrip.riderPhone}`}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Action Buttons based on status */}
              {activeTrip.status === 'driver_arriving' && (
                <button
                  onClick={() => movoStore.driverArrivedAtPickup()}
                  className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
                >
                  I Have Arrived at Pickup Curb
                </button>
              )}

              {activeTrip.status === 'driver_arrived' && (
                <button
                  onClick={() => movoStore.startTrip()}
                  className="w-full py-3.5 rounded-xl bg-gradient-sunrise text-white font-bold text-xs hover:opacity-95 transition-opacity shadow-sm"
                >
                  Start Trip with Passenger
                </button>
              )}

              {activeTrip.status === 'in_progress' && (
                <button
                  onClick={() => movoStore.completeTrip()}
                  className="w-full py-3.5 rounded-xl bg-[#0F766E] text-white font-bold text-xs hover:bg-[#0c5e58] transition-colors shadow-sm"
                >
                  Complete Trip & Collect Fare
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EARNINGS & PAYOUTS */}
      {activeTab === 'earnings' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Weekly Gross Earning
            </span>
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-heading font-black text-slate-900 tabular-nums">
                €{driver.weeklyEarnings.toFixed(2)}
              </h2>
              <span className="text-xs font-semibold text-teal-700">+14% vs last week</span>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-36 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="amount" fill="#0F766E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Commission & Deduction breakdown */}
          <div className="p-4 rounded-2xl bg-white border border-[#E7E7E2] text-xs space-y-2">
            <h4 className="font-bold text-slate-900 mb-2">Earnings Breakdown</h4>
            <div className="flex justify-between text-slate-600">
              <span>Gross Passenger Fares</span>
              <span className="tabular-nums">€{(driver.weeklyEarnings * 1.22).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Movo Platform Commission (18%)</span>
              <span className="tabular-nums text-rose-600">
                -€{(driver.weeklyEarnings * 0.22).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Toll & Fuel Surcharges</span>
              <span className="tabular-nums">€18.50</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900">
              <span>Net Take-Home Pay</span>
              <span className="tabular-nums text-teal-700">€{driver.weeklyEarnings.toFixed(2)}</span>
            </div>
          </div>

          {/* Instant Payout Button */}
          <button
            onClick={() => {
              setPayoutSuccess(true);
              setTimeout(() => setPayoutSuccess(false), 3000);
            }}
            className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
          >
            Instant Payout to Bank (SEPA Instant)
          </button>

          {payoutSuccess && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
              <span>€{driver.todayEarnings.toFixed(2)} transferred to Deutsche Bank IBAN DE89...</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RATINGS & REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E7E7E2] text-center shadow-xs">
            <h2 className="text-3xl font-heading font-black text-slate-900">
              {driver.rating.toFixed(2)}
            </h2>
            <div className="flex items-center justify-center gap-1 text-amber-400 my-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Award key={s} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-500">Based on {driver.totalTrips} verified trips in Berlin</p>
          </div>

          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Recent Rider Compliments
            </span>
            {[
              { text: 'Extremely courteous driver, immaculate electric vehicle.', author: 'Clara Z.', date: 'Yesterday' },
              { text: 'Fast route choices avoiding the Mitte traffic.', author: 'Maximilian K.', date: '3 days ago' },
              { text: 'Great music and super smooth driving.', author: 'Zoe N.', date: 'Last week' },
            ].map((review, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-white border border-[#E7E7E2] text-xs">
                <p className="text-slate-800 italic">"{review.text}"</p>
                <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                  <span>{review.author}</span>
                  <span>{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROFILE & DOCUMENTS */}
      {activeTab === 'profile' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E7E7E2] shadow-xs flex items-center gap-3">
            <img
              src={driver.avatar}
              alt={driver.name}
              className="w-14 h-14 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900">{driver.name}</h3>
              <p className="text-xs text-slate-500">{driver.email}</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-teal-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Movo Verified Partner</span>
              </div>
            </div>
          </div>

          {/* Vehicle info */}
          <div className="p-4 rounded-2xl bg-white border border-[#E7E7E2] text-xs space-y-2">
            <h4 className="font-bold text-slate-900 mb-1">Registered Vehicle</h4>
            <div className="flex justify-between text-slate-600">
              <span>Vehicle</span>
              <span className="font-semibold text-slate-900">
                {driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.year})
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>License Plate</span>
              <span className="font-mono font-bold text-slate-900">{driver.vehicle.plate}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Class Tier</span>
              <span className="font-semibold text-[#0F766E] uppercase">
                {driver.vehicle.vehicleClass}
              </span>
            </div>
          </div>

          {/* Documents with status */}
          <div className="p-4 rounded-2xl bg-white border border-[#E7E7E2] space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900">Compliance Documents</h4>
              <span className="text-[10px] text-teal-700 font-medium">All current</span>
            </div>

            {driver.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-medium text-slate-800">{doc.name}</p>
                  <p className="text-[10px] text-slate-400">Uploaded {doc.uploadedAt}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    doc.status === 'approved'
                      ? 'bg-teal-100 text-teal-800'
                      : doc.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Driver Bottom App Navigation Bar */}
      <div className="relative z-40 bg-white border-t border-[#E7E7E2] grid grid-cols-4 h-14 shrink-0">
        {[
          { id: 'home', label: 'Map', icon: Navigation },
          { id: 'earnings', label: 'Earnings', icon: TrendingUp },
          { id: 'reviews', label: 'Reviews', icon: Award },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center transition-colors ${
                isActive ? 'text-[#0F766E]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat modal for Driver */}
      {showChatModal && (
        <ChatModal
          driver={driver}
          messages={store.chatMessages}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
}
