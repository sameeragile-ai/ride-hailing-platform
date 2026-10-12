import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Car,
  Clock,
  ChevronRight,
  ShieldAlert,
  Share2,
  Phone,
  MessageSquare,
  Star,
  Search,
  Calendar,
  X,
  CreditCard,
  Menu,
  RotateCcw,
  AlertTriangle,
  History,
  Wallet,
  Sparkles,
  ArrowRight,
  Crown,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useMovoStore, movoStore } from '../../services/movoStore';
import {
  VehicleClassId,
  ServiceTypeId,
  LocationPoint,
  Trip,
  FareBreakdown,
} from '../../lib/types';
import { BERLIN_LOCATIONS } from '../../data/seedData';
import { MapComponent } from '../../components/ui/MapComponent';
import { PaymentModal } from './PaymentModal';
import { ChatModal } from './ChatModal';
import { DisputeModal } from './DisputeModal';
import { RiderOnboarding } from './RiderOnboarding';
import { calculateFareEstimate, calculateRentalFare, calculateOutstationFare } from '../../services/pricingEngine';

export function RiderApp() {
  const store = useMovoStore();
  const rider = store.riders.find((r) => r.id === store.currentRiderId) || store.riders[0];

  // UI state
  const [hasOnboarded, setHasOnboarded] = useState(true);
  const [activeTab, setActiveTab] = useState<ServiceTypeId>('ride');
  const [selectedPickup, setSelectedPickup] = useState<LocationPoint>(BERLIN_LOCATIONS[0]);
  const [selectedDropoff, setSelectedDropoff] = useState<LocationPoint | null>(null);
  const [selectedVehicleClass, setSelectedVehicleClass] = useState<VehicleClassId>('economy');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'wallet' | 'cash'>('card');
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [disputeTrip, setDisputeTrip] = useState<Trip | null>(null);
  const [shareToast, setShareToast] = useState(false);

  // Bid Your Fare inputs
  const [proposedBidFare, setProposedBidFare] = useState<number>(14);

  // Rental package inputs
  const [selectedRentalPkg, setSelectedRentalPkg] = useState<string>('rental_2h');

  // Outstation inputs
  const [outstationIsRoundTrip, setOutstationIsRoundTrip] = useState(false);
  const [outstationDestination, setOutstationDestination] = useState<string>('Potsdam Sanssouci Palace');

  // Rating state upon completion
  const [ratingStars, setRatingStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Smooth driving', 'Clean car']);
  const [tipAmount, setTipAmount] = useState<number>(2.0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const activeTrip = store.activeTrip;
  const isTripActive = activeTrip && activeTrip.status !== 'cancelled';
  const assignedDriver = activeTrip?.driverId
    ? store.drivers.find((d) => d.id === activeTrip.driverId)
    : null;

  // Filter locations
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return BERLIN_LOCATIONS;
    return BERLIN_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Handle destination select
  const handleSelectDestination = (loc: LocationPoint) => {
    setSelectedDropoff(loc);
    setIsSearchingDestination(false);
    setSearchQuery('');
  };

  // Dynamic fare calculations for display
  const currentFareBreakdown: FareBreakdown | null = useMemo(() => {
    if (!selectedDropoff) return null;
    const dLat = selectedDropoff.lat - selectedPickup.lat;
    const dLng = selectedDropoff.lng - selectedPickup.lng;
    const directKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
    const estKm = Math.max(1.8, Math.round(directKm * 1.35 * 10) / 10);
    const estMin = Math.round(estKm * 2.8 + 3);

    if (activeTab === 'rental') {
      return calculateRentalFare(store.config, selectedRentalPkg);
    }
    if (activeTab === 'outstation') {
      return calculateOutstationFare(store.config, 32, outstationIsRoundTrip);
    }

    return calculateFareEstimate(
      store.config,
      selectedVehicleClass,
      estKm,
      estMin
    );
  }, [selectedDropoff, selectedPickup, selectedVehicleClass, activeTab, selectedRentalPkg, outstationIsRoundTrip, store.config]);

  // Request Ride handler
  const handleRequestRide = () => {
    if (!selectedDropoff) {
      setIsSearchingDestination(true);
      return;
    }

    movoStore.requestRide({
      serviceType: activeTab,
      vehicleClass: selectedVehicleClass,
      pickup: selectedPickup,
      dropoff: selectedDropoff,
      paymentMethod: selectedPaymentMethod,
      proposedFare: activeTab === 'bid' ? proposedBidFare : undefined,
      rentalHours: activeTab === 'rental' ? (selectedRentalPkg === 'rental_2h' ? 2 : selectedRentalPkg === 'rental_4h' ? 4 : 8) : undefined,
      isOutstationRoundTrip: activeTab === 'outstation' ? outstationIsRoundTrip : undefined,
    });
  };

  if (!hasOnboarded) {
    return (
      <RiderOnboarding
        onComplete={() => setHasOnboarded(true)}
        onSkip={() => setHasOnboarded(true)}
      />
    );
  }

  return (
    <div className="relative h-full w-full bg-[#F7F7F4] flex flex-col overflow-hidden text-[#0E1116] phone-map">
      {/* Top Floating App Bar */}
      <div className="absolute top-2 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => setShowSideMenu(true)}
          className="pointer-events-auto w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E7E7E2] shadow-sm flex items-center justify-center text-slate-800 hover:bg-white active:scale-95 transition-transform"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Movo Logo Pill */}
        <div className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E7E7E2] shadow-sm flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-gradient-sunrise" />
          <span className="font-heading font-black text-xs tracking-tight text-[#0E1116]">MOVO</span>
        </div>

        <button
          onClick={() => setShowPaymentModal(true)}
          className="pointer-events-auto px-2.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E7E7E2] shadow-sm flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:bg-white active:scale-95 transition-transform"
        >
          <Wallet className="w-4 h-4 text-teal-700" />
          <span className="tabular-nums">€{rider.walletBalance.toFixed(0)}</span>
        </button>
      </div>

      {/* Main Map Viewport */}
      <div className="relative flex-1 w-full overflow-hidden">
        <MapComponent
          center={
            isTripActive && assignedDriver
              ? assignedDriver.location
              : selectedPickup
          }
          zoom={isTripActive ? 14 : 13}
          drivers={store.drivers}
          assignedDriverId={activeTrip?.driverId}
          pickup={activeTrip ? activeTrip.pickup : selectedPickup}
          dropoff={activeTrip ? activeTrip.dropoff : selectedDropoff}
          routePolyline={activeTrip ? activeTrip.routePolyline : (selectedDropoff ? store.activeTrip?.routePolyline : undefined)}
          className="h-full w-full"
        />
      </div>

      {/* ----------------- RIDER SCREEN STATES ----------------- */}

      {/* STATE 1: IDLE / DESTINATION SELECTION & SERVICE TABS */}
      {!isTripActive && (
        <div className="relative z-30 bg-white rounded-t-3xl border-t border-[#E7E7E2] shadow-2xl p-4 flex flex-col max-h-[56%] overflow-y-auto">
          {/* Draggable Handle Indicator */}
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />

          {/* Service Selector Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl mb-3 shrink-0">
            {(
              [
                { id: 'ride', label: 'Ride' },
                { id: 'bid', label: 'Bid Fare' },
                { id: 'rental', label: 'Rental' },
                { id: 'outstation', label: 'Outstation' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all text-center ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* "Where to?" Search Pill trigger */}
          <button
            onClick={() => setIsSearchingDestination(true)}
            className="w-full p-3 rounded-2xl bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/60 flex items-center justify-between text-left transition-colors mb-3 shrink-0"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-4 h-4 text-[#FF5A36] shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {selectedDropoff ? selectedDropoff.name : 'Where to in Berlin?'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {selectedDropoff ? selectedDropoff.address : 'Search airport, station, or landmark'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* TAB 1: STANDARD RIDE */}
          {activeTab === 'ride' && (
            <div className="space-y-3">
              {/* Vehicle Class Selector */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Available Classes
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'economy', label: 'Economy', eta: '3 min', price: '€11.20', cap: '4 seats' },
                      { id: 'comfort', label: 'Comfort', eta: '4 min', price: '€14.50', cap: 'Spacious' },
                      { id: 'xl', label: 'Movo XL', eta: '6 min', price: '€19.80', cap: '6 seats' },
                      { id: 'premium', label: 'Black VIP', eta: '5 min', price: '€27.00', cap: 'Luxury' },
                    ] as const
                  ).map((v) => {
                    const isSelected = selectedVehicleClass === v.id;
                    const calculatedPrice = currentFareBreakdown && selectedVehicleClass === v.id
                      ? `€${currentFareBreakdown.total.toFixed(2)}`
                      : v.price;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicleClass(v.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#FF5A36] bg-[#FF5A36]/5 ring-1 ring-[#FF5A36]'
                            : 'border-[#E7E7E2] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{v.label}</span>
                          <span className="text-xs font-bold text-slate-900 tabular-nums">
                            {calculatedPrice}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                          <span>{v.eta}</span>
                          <span>{v.cap}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fare Breakdown & Surge Indicator */}
              {selectedDropoff && currentFareBreakdown && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Est: {currentFareBreakdown.distanceKm} km · {currentFareBreakdown.durationMinutes} mins</span>
                  </div>
                  <button
                    onClick={() => setShowFareBreakdown(!showFareBreakdown)}
                    className="text-[11px] font-semibold text-[#FF5A36] hover:underline"
                  >
                    View Breakdown
                  </button>
                </div>
              )}

              {/* Collapsible Breakdown */}
              {showFareBreakdown && currentFareBreakdown && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Fare</span>
                    <span className="tabular-nums">€{currentFareBreakdown.baseFare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Distance ({currentFareBreakdown.distanceKm} km)</span>
                    <span className="tabular-nums">€{currentFareBreakdown.distanceFare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Duration</span>
                    <span className="tabular-nums">€{currentFareBreakdown.durationFare.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900">
                    <span>Total Fare</span>
                    <span className="tabular-nums text-[#FF5A36]">€{currentFareBreakdown.total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BID YOUR FARE */}
          {activeTab === 'bid' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Propose Your Price to Drivers</span>
                </div>
                <p className="text-[11px] text-amber-800 mt-1">
                  Nearby drivers will receive your offer and send live counter-proposals within seconds.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Your Proposed Fare
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">€</span>
                    <input
                      type="number"
                      step="1"
                      min="5"
                      max="100"
                      value={proposedBidFare}
                      onChange={(e) => setProposedBidFare(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl tabular-nums focus:outline-none focus:border-[#FF5A36]"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {[12, 14, 18].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setProposedBidFare(amt)}
                        className={`px-2.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                          proposedBidFare === amt
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        €{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOURLY RENTAL */}
          {activeTab === 'rental' && (
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Select Rental Package
              </span>
              <div className="space-y-2">
                {store.config.rentalPackages.map((pkg) => {
                  const isSelected = selectedRentalPkg === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedRentalPkg(pkg.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-[#FF5A36] bg-[#FF5A36]/5'
                          : 'border-[#E7E7E2] hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {pkg.durationHours} Hours · {pkg.includedKm} km Included
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Extra: €{pkg.extraKmRate.toFixed(2)}/km · €{pkg.extraHourRate.toFixed(2)}/hr
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 tabular-nums">
                        €{pkg.price.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: OUTSTATION */}
          {activeTab === 'outstation' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setOutstationIsRoundTrip(false)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    !outstationIsRoundTrip ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  One-Way
                </button>
                <button
                  onClick={() => setOutstationIsRoundTrip(true)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    outstationIsRoundTrip ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Round Trip
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Intercity Destination
                </label>
                <select
                  value={outstationDestination}
                  onChange={(e) => {
                    setOutstationDestination(e.target.value);
                    const found = BERLIN_LOCATIONS.find((l) => l.name === e.target.value);
                    if (found) setSelectedDropoff(found);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#FF5A36]"
                >
                  <option value="Potsdam Sanssouci Palace">Potsdam (32 km)</option>
                  <option value="Berlin BER Airport (Terminal 1)">Schönefeld Airport (28 km)</option>
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Driver Daily Allowance:</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    €{store.config.outstationRules.driverAllowancePerDay.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tolls:</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    €{store.config.outstationRules.tollEstimate.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="mt-4 pt-2 border-t border-[#E7E7E2]">
            <button
              onClick={handleRequestRide}
              className="w-full py-3.5 rounded-xl bg-gradient-sunrise text-white font-bold text-xs tracking-wide shadow-md hover:opacity-95 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <span>
                {activeTab === 'bid'
                  ? `Broadcast €${proposedBidFare} Offer`
                  : activeTab === 'rental'
                  ? 'Reserve Hourly Chauffeur'
                  : activeTab === 'outstation'
                  ? 'Book Intercity Trip'
                  : `Request Movo · €${currentFareBreakdown ? currentFareBreakdown.total.toFixed(2) : '11.20'}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: MATCHING RADAR SEARCH */}
      {activeTrip?.status === 'matching' && (
        <div className="relative z-30 bg-white rounded-t-3xl border-t border-[#E7E7E2] p-5 shadow-2xl flex flex-col items-center text-center">
          {/* Radar Animation */}
          <div className="relative w-24 h-24 my-2 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#FF5A36]/10 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-[#FF5A36]/20 animate-pulse" />
            <div className="w-12 h-12 rounded-full bg-gradient-sunrise text-white flex items-center justify-center shadow-md">
              <Car className="w-6 h-6 animate-bounce" />
            </div>
          </div>

          <h3 className="font-heading font-bold text-base text-slate-900 mt-2">
            Contacting Nearby Drivers...
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Matching with available {activeTrip.vehicleClass.toUpperCase()} drivers around{' '}
            {activeTrip.pickup.name}.
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Matching within 10s</span>
          </div>

          <button
            onClick={() => movoStore.cancelTrip('Rider cancelled during search')}
            className="mt-4 px-6 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            Cancel Request
          </button>
        </div>
      )}

      {/* STATE 3: BID YOUR FARE COUNTER-OFFERS */}
      {activeTrip?.status === 'bidding' && (
        <div className="relative z-30 bg-white rounded-t-3xl border-t border-[#E7E7E2] p-4 shadow-2xl flex flex-col max-h-[60%] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E2]">
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900">Driver Counter Offers</h3>
              <p className="text-[11px] text-slate-500">
                Your bid: <strong className="text-slate-900">€{activeTrip.proposedFare?.toFixed(2)}</strong>
              </p>
            </div>
            <button
              onClick={() => movoStore.cancelTrip('Cancelled bidding')}
              className="text-xs text-slate-400 hover:text-rose-600"
            >
              Cancel
            </button>
          </div>

          {store.bidOffers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-2" />
              Broadcasting your price to 12 nearby drivers...
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {store.bidOffers.map((bid) => (
                <div
                  key={bid.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-[#FF5A36] shadow-xs flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={bid.driverAvatar}
                      alt={bid.driverName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{bid.driverName}</span>
                        <span className="text-[10px] text-amber-500 font-semibold">★ {bid.driverRating.toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {bid.driverCar} · {bid.etaMinutes} min away
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-[#FF5A36] tabular-nums">
                      €{bid.offeredFare.toFixed(2)}
                    </span>
                    <button
                      onClick={() => movoStore.acceptBidOffer(bid.id)}
                      className="mt-1 px-3 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STATE 4: TRIP IN PROGRESS / DRIVER ARRIVING */}
      {activeTrip &&
        (activeTrip.status === 'driver_arriving' ||
          activeTrip.status === 'driver_arrived' ||
          activeTrip.status === 'in_progress') &&
        assignedDriver && (
          <div className="relative z-30 bg-white rounded-t-3xl border-t border-[#E7E7E2] p-4 shadow-2xl flex flex-col space-y-3">
            {/* Status Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  {activeTrip.status === 'driver_arriving'
                    ? 'Driver Arriving'
                    : activeTrip.status === 'driver_arrived'
                    ? 'Driver Arrived at Pickup'
                    : 'Trip in Progress'}
                </span>
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  {activeTrip.status === 'in_progress'
                    ? `Heading to ${activeTrip.dropoff.name}`
                    : `Meet at ${activeTrip.pickup.name}`}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Est. Arrival</span>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {activeTrip.status === 'in_progress' ? '6 mins' : '2 mins'}
                </span>
              </div>
            </div>

            {/* Driver Card */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={assignedDriver.avatar}
                  alt={assignedDriver.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{assignedDriver.name}</span>
                    <span className="text-[11px] font-semibold text-amber-500">
                      ★ {assignedDriver.rating.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    {assignedDriver.vehicle.make} {assignedDriver.vehicle.model}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    <strong className="text-slate-800">{assignedDriver.vehicle.plate}</strong> ·{' '}
                    {assignedDriver.vehicle.color}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Chat, Call */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChatModal(true)}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 shadow-xs relative"
                >
                  <MessageSquare className="w-4 h-4" />
                  {store.chatMessages.length > 1 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF5A36]" />
                  )}
                </button>
                <a
                  href={`tel:${assignedDriver.phone}`}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* LIVE FARE METER (Ticks up smoothly) */}
            <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">
                  Live Fare Meter
                </span>
                <p className="text-xs text-slate-300">
                  {activeTrip.fareBreakdown.distanceKm.toFixed(1)} km ·{' '}
                  {activeTrip.fareBreakdown.durationMinutes} min
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold tabular-nums text-white">
                  €{activeTrip.fareBreakdown.total.toFixed(2)}
                </span>
                <span className="block text-[9px] text-teal-400">Fixed rate lock</span>
              </div>
            </div>

            {/* Safety & Share bar */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={() => {
                  setShareToast(true);
                  setTimeout(() => setShareToast(false), 2500);
                }}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Trip</span>
              </button>

              <button
                onClick={() => setShowSOSModal(true)}
                className="flex items-center gap-1.5 text-rose-600 font-semibold hover:text-rose-700"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Emergency SOS</span>
              </button>
            </div>
          </div>
        )}

      {/* STATE 5: COMPLETED TRIP RECEIPT & RATING */}
      {activeTrip?.status === 'completed' && (
        <div className="relative z-30 bg-white rounded-t-3xl border-t border-[#E7E7E2] p-5 shadow-2xl flex flex-col max-h-[80%] overflow-y-auto space-y-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900">Trip Completed!</h3>
            <p className="text-xs text-slate-500">Receipt generated and charged to your {activeTrip.paymentMethod}.</p>
          </div>

          {/* Receipt Breakdown Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Trip ID</span>
              <span className="font-mono text-slate-800">{activeTrip.id}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Base Fare</span>
              <span className="tabular-nums text-slate-800">
                €{activeTrip.fareBreakdown.baseFare.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Distance ({activeTrip.fareBreakdown.distanceKm.toFixed(1)} km)</span>
              <span className="tabular-nums text-slate-800">
                €{activeTrip.fareBreakdown.distanceFare.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Duration ({activeTrip.fareBreakdown.durationMinutes} min)</span>
              <span className="tabular-nums text-slate-800">
                €{activeTrip.fareBreakdown.durationFare.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
              <span>Total Paid</span>
              <span className="tabular-nums text-[#FF5A36]">
                €{activeTrip.fareBreakdown.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Rating Driver */}
          {!ratingSubmitted ? (
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-xs font-semibold text-slate-700">
                  How was your ride with {assignedDriver?.name || 'your driver'}?
                </span>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRatingStars(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          s <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Compliments tags */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {['Smooth driving', 'Clean car', 'Polite chauffeur', 'Great music'].map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                        );
                      }}
                      className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Driver Tip */}
              <div className="text-center pt-1">
                <span className="text-[11px] font-medium text-slate-500 block mb-1.5">Add a Tip:</span>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 5].map((tip) => (
                    <button
                      key={tip}
                      onClick={() => setTipAmount(tip)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                        tipAmount === tip
                          ? 'bg-[#FF5A36] text-white border-[#FF5A36]'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {tip === 0 ? 'No tip' : `+€${tip}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDisputeTrip(activeTrip)}
                  className="flex-1 py-2.5 rounded-xl border border-rose-200 text-rose-700 font-semibold text-xs hover:bg-rose-50"
                >
                  Raise Dispute
                </button>
                <button
                  onClick={() => {
                    movoStore.rateDriver(activeTrip.id, ratingStars, selectedTags, tipAmount);
                    setRatingSubmitted(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
                >
                  Submit Review
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-center text-teal-700 font-medium">
                Thank you! Rating and tip recorded.
              </p>
              <button
                onClick={() => {
                  movoStore.dismissCompletedTrip();
                  setSelectedDropoff(null);
                  setRatingSubmitted(false);
                }}
                className="w-full py-3 rounded-xl bg-gradient-sunrise text-white font-bold text-xs hover:opacity-95"
              >
                Book Another Ride
              </button>
            </div>
          )}
        </div>
      )}

      {/* ----------------- MODALS & DRAWERS ----------------- */}

      {/* Destination Search Overlay */}
      {isSearchingDestination && (
        <div className="fixed inset-0 z-50 bg-[#F7F7F4] flex flex-col p-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E7E7E2]">
            <button
              onClick={() => setIsSearchingDestination(false)}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Berlin destination or address..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF5A36]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Saved Places Quick Chips */}
          <div className="py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {rider.savedPlaces.map((sp) => (
              <button
                key={sp.id}
                onClick={() =>
                  handleSelectDestination({
                    name: sp.name,
                    address: sp.address,
                    lat: sp.coords.lat,
                    lng: sp.coords.lng,
                  })
                }
                className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5 shrink-0 hover:border-slate-400"
              >
                <MapPin className="w-3.5 h-3.5 text-[#FF5A36]" />
                <span>{sp.label}</span>
              </button>
            ))}
          </div>

          {/* Location results list */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredLocations.map((loc, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectDestination(loc)}
                className="p-3 rounded-xl bg-white border border-[#E7E7E2] hover:border-slate-300 cursor-pointer flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{loc.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{loc.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side Menu Drawer */}
      {showSideMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-xs bg-white h-full p-5 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E7E7E2]">
                <div className="flex items-center gap-3">
                  <img
                    src={rider.avatar}
                    alt={rider.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{rider.name}</h4>
                    <span className="text-[11px] text-amber-500 font-semibold">★ {rider.rating.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSideMenu(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Menu links */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={() => {
                    setShowSideMenu(false);
                    setShowPaymentModal(true);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-teal-700" />
                    <span>Movo Wallet & Top-up</span>
                  </div>
                  <span className="text-teal-700 tabular-nums">€{rider.walletBalance.toFixed(2)}</span>
                </button>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                    Past Trips & Support
                  </span>
                  {store.pastTrips.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setShowSideMenu(false);
                        setDisputeTrip(t);
                      }}
                      className="p-2 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between text-[11px]"
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold text-slate-900 truncate">{t.dropoff.name}</p>
                        <p className="text-slate-400 text-[10px]">{new Date(t.requestedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="font-bold text-slate-800 tabular-nums shrink-0">
                        €{t.fareBreakdown.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7E7E2]">
              <button
                onClick={() => {
                  setShowSideMenu(false);
                  movoStore.resetDemoData();
                }}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo State</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          rider={rider}
          selectedMethod={selectedPaymentMethod}
          onSelectMethod={(m) => {
            setSelectedPaymentMethod(m);
            setShowPaymentModal(false);
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showChatModal && assignedDriver && (
        <ChatModal
          driver={assignedDriver}
          messages={store.chatMessages}
          onClose={() => setShowChatModal(false)}
        />
      )}

      {showSOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900">Emergency Protocol</h3>
            <p className="text-xs text-slate-600">
              Live telematics and vehicle location broadcast to Berlin Emergency Dispatch (112) and Movo 24/7 Security.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSOSModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Dismiss
              </button>
              <a
                href="tel:112"
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl flex items-center justify-center"
              >
                Call 112
              </a>
            </div>
          </div>
        </div>
      )}

      {disputeTrip && (
        <DisputeModal trip={disputeTrip} onClose={() => setDisputeTrip(null)} />
      )}

      {shareToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-xl">
          Live tracking link copied to clipboard!
        </div>
      )}
    </div>
  );
}
