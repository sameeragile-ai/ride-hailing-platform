import { useState, useEffect } from 'react';
import {
  Driver,
  Rider,
  Trip,
  Dispute,
  Agent,
  PromoCode,
  PlatformConfig,
  VehicleClassId,
  ServiceTypeId,
  BidOffer,
  ChatMessage,
  LocationPoint,
} from '../lib/types';
import { DEFAULT_PLATFORM_CONFIG } from '../lib/config';
import {
  INITIAL_DRIVERS,
  INITIAL_RIDERS,
  INITIAL_PAST_TRIPS,
  INITIAL_DISPUTES,
  INITIAL_AGENTS,
  INITIAL_PROMO_CODES,
  BERLIN_LOCATIONS,
  generateRoutePoints,
} from '../data/seedData';
import { calculateFareEstimate } from './pricingEngine';

interface MovoState {
  config: PlatformConfig;
  drivers: Driver[];
  riders: Rider[];
  currentRiderId: string;
  currentDriverId: string;
  activeTrip: Trip | null;
  pastTrips: Trip[];
  disputes: Dispute[];
  agents: Agent[];
  promoCodes: PromoCode[];
  bidOffers: BidOffer[];
  chatMessages: ChatMessage[];
  waitingTimeSeconds: number;
  tripElapsedSeconds: number;
}

// Local storage key for persistence across refreshes
const STORAGE_KEY = 'movo_demo_state_v1';

// Initial state builder
function getInitialState(): MovoState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate essentials
      if (parsed.drivers && parsed.pastTrips && parsed.config) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore error and fallback
  }

  return {
    config: DEFAULT_PLATFORM_CONFIG,
    drivers: INITIAL_DRIVERS,
    riders: INITIAL_RIDERS,
    currentRiderId: 'r1',
    currentDriverId: 'd1',
    activeTrip: null,
    pastTrips: INITIAL_PAST_TRIPS,
    disputes: INITIAL_DISPUTES,
    agents: INITIAL_AGENTS,
    promoCodes: INITIAL_PROMO_CODES,
    bidOffers: [],
    chatMessages: [],
    waitingTimeSeconds: 0,
    tripElapsedSeconds: 0,
  };
}

let state: MovoState = getInitialState();
const listeners = new Set<() => void>();

// Setup BroadcastChannel for cross-tab communication
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('movo_platform_channel');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'SYNC_STATE' && event.data?.payload) {
        state = event.data.payload;
        notify();
      }
    };
  }
} catch (e) {
  // Safe fallback if blocked
}

function notify(broadcast = true) {
  listeners.forEach((listener) => listener());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (broadcast && broadcastChannel) {
      broadcastChannel.postMessage({ type: 'SYNC_STATE', payload: state });
    }
  } catch (e) {
    // Ignore storage errors
  }
}

// Background driver drift & trip progression engine
if (typeof window !== 'undefined') {
  setInterval(() => {
    let changed = false;

    // 1. Drift idle online drivers smoothly
    state.drivers = state.drivers.map((d) => {
      if (d.status === 'online' && (!state.activeTrip || state.activeTrip.driverId !== d.id)) {
        // Subtle drift ~20-50m
        const angle = Math.random() * Math.PI * 2;
        const dist = 0.00015 + Math.random() * 0.00015;
        const newLat = d.location.lat + Math.sin(angle) * dist;
        const newLng = d.location.lng + Math.cos(angle) * dist;
        const heading = (Math.round((angle * 180) / Math.PI) + 360) % 360;
        changed = true;
        return {
          ...d,
          location: { lat: newLat, lng: newLng },
          heading,
        };
      }
      return d;
    });

    // 2. Active Trip movement interpolation
    if (state.activeTrip) {
      const trip = state.activeTrip;
      if (trip.status === 'driver_arriving') {
        const assignedDriver = state.drivers.find((d) => d.id === trip.driverId);
        if (assignedDriver) {
          // Move driver towards pickup
          const pickup = trip.pickup;
          const dLat = pickup.lat - assignedDriver.location.lat;
          const dLng = pickup.lng - assignedDriver.location.lng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);

          if (dist < 0.0005) {
            // Arrived at pickup!
            state.activeTrip = { ...trip, status: 'driver_arrived' };
            state.drivers = state.drivers.map((d) =>
              d.id === assignedDriver.id ? { ...d, location: { lat: pickup.lat, lng: pickup.lng } } : d
            );
            changed = true;
          } else {
            const step = Math.min(dist, 0.0006);
            const nextLat = assignedDriver.location.lat + (dLat / dist) * step;
            const nextLng = assignedDriver.location.lng + (dLng / dist) * step;
            const heading = (Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI) + 360) % 360;
            state.drivers = state.drivers.map((d) =>
              d.id === assignedDriver.id ? { ...d, location: { lat: nextLat, lng: nextLng }, heading } : d
            );
            changed = true;
          }
        }
      } else if (trip.status === 'in_progress') {
        // Move car along polyline
        state.tripElapsedSeconds += 1;
        const totalPoints = trip.routePolyline.length;
        const currentIdx = trip.currentProgressIndex ?? 0;

        if (currentIdx < totalPoints - 1) {
          const nextIdx = currentIdx + 0.12; // smooth fractional progress
          const floorIdx = Math.floor(nextIdx);
          const ceilIdx = Math.min(floorIdx + 1, totalPoints - 1);
          const fraction = nextIdx - floorIdx;

          const p1 = trip.routePolyline[floorIdx];
          const p2 = trip.routePolyline[ceilIdx];

          const curLat = p1[0] + (p2[0] - p1[0]) * fraction;
          const curLng = p1[1] + (p2[1] - p1[1]) * fraction;
          const heading =
            (Math.round((Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI) + 360) % 360;

          // Update driver position
          if (trip.driverId) {
            state.drivers = state.drivers.map((d) =>
              d.id === trip.driverId ? { ...d, location: { lat: curLat, lng: curLng }, heading } : d
            );
          }

          // Live dynamic fare meter ticking up precisely
          const progressRatio = nextIdx / (totalPoints - 1);
          const currentDistance = Math.round(trip.estimatedDistanceKm * progressRatio * 100) / 100;
          const currentMinutes = Math.round((state.tripElapsedSeconds / 60) * 100) / 100;

          const dynamicFare = calculateFareEstimate(
            state.config,
            trip.vehicleClass,
            currentDistance,
            currentMinutes,
            Math.floor(state.waitingTimeSeconds / 60)
          );

          state.activeTrip = {
            ...trip,
            currentProgressIndex: nextIdx,
            actualDistanceKm: currentDistance,
            actualDurationMin: currentMinutes,
            fareBreakdown: dynamicFare,
          };
          changed = true;
        } else {
          // Reached destination! Keep in progress until user completes or auto completes
          changed = true;
        }
      }
    }

    if (changed) {
      notify(false); // notify locally without broadcast flood
    }
  }, 1000);
}

// Store API & actions
export const movoStore = {
  getState() {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  setCurrentRider(riderId: string) {
    state.currentRiderId = riderId;
    notify();
  },

  setCurrentDriver(driverId: string) {
    state.currentDriverId = driverId;
    notify();
  },

  // 1. Rider requests a ride
  requestRide(params: {
    serviceType: ServiceTypeId;
    vehicleClass: VehicleClassId;
    pickup: LocationPoint;
    dropoff: LocationPoint;
    paymentMethod: 'card' | 'wallet' | 'cash';
    proposedFare?: number;
    rentalHours?: number;
    isOutstationRoundTrip?: boolean;
    agentId?: string;
  }) {
    const rider = state.riders.find((r) => r.id === state.currentRiderId) || state.riders[0];
    
    // Estimate distance & duration
    const dLat = params.dropoff.lat - params.pickup.lat;
    const dLng = params.dropoff.lng - params.pickup.lng;
    const directKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
    const estDistanceKm = Math.round(Math.max(1.5, directKm * 1.35) * 10) / 10;
    const estDurationMin = Math.round(estDistanceKm * 2.8 + 3);

    const initialFare = params.proposedFare
      ? {
          baseFare: 3.5,
          distanceKm: estDistanceKm,
          distanceFare: Math.round((params.proposedFare - 3.5) * 100) / 100,
          durationMinutes: estDurationMin,
          durationFare: 0,
          waitingCharge: 0,
          surgeMultiplier: 1.0,
          discount: 0,
          subtotal: params.proposedFare,
          platformFee: Math.round(params.proposedFare * 0.18 * 100) / 100,
          driverShare: Math.round((params.proposedFare - params.proposedFare * 0.18) * 100) / 100,
          total: params.proposedFare,
        }
      : calculateFareEstimate(state.config, params.vehicleClass, estDistanceKm, estDurationMin);

    const routePolyline = generateRoutePoints(params.pickup, params.dropoff, 24);

    const trip: Trip = {
      id: `TRIP-BER-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceType: params.serviceType,
      vehicleClass: params.vehicleClass,
      status: params.serviceType === 'bid' ? 'bidding' : 'matching',
      riderId: rider.id,
      riderName: rider.name,
      riderPhone: rider.phone,
      pickup: params.pickup,
      dropoff: params.dropoff,
      routePolyline,
      currentProgressIndex: 0,
      estimatedDistanceKm: estDistanceKm,
      estimatedDurationMin: estDurationMin,
      fareBreakdown: initialFare,
      paymentMethod: params.paymentMethod,
      requestedAt: Date.now(),
      proposedFare: params.proposedFare,
      rentalHours: params.rentalHours,
      isOutstationRoundTrip: params.isOutstationRoundTrip,
      agentId: params.agentId,
    };

    state.activeTrip = trip;
    state.bidOffers = [];
    state.chatMessages = [
      {
        id: `msg-sys-1`,
        tripId: trip.id,
        sender: 'system',
        text: `Trip requested. Looking for available ${trip.vehicleClass.toUpperCase()} drivers in Berlin...`,
        timestamp: Date.now(),
      },
    ];
    state.tripElapsedSeconds = 0;
    state.waitingTimeSeconds = 0;
    notify();

    // If "Bid Your Fare", spawn 4 driver counter-offers over 1-5 seconds!
    if (params.serviceType === 'bid' && params.proposedFare) {
      const availableDrivers = state.drivers.filter(
        (d) => d.status === 'online' && d.vehicle.vehicleClass === params.vehicleClass
      ).slice(0, 4);

      availableDrivers.forEach((driver, idx) => {
        setTimeout(() => {
          if (state.activeTrip?.status === 'bidding') {
            const fareVariance = (idx - 1.5) * 1.5;
            const offeredFare = Math.max(
              6.0,
              Math.round((params.proposedFare! + fareVariance) * 100) / 100
            );
            const bid: BidOffer = {
              id: `bid-${Date.now()}-${idx}`,
              tripId: trip.id,
              driverId: driver.id,
              driverName: driver.name,
              driverAvatar: driver.avatar,
              driverRating: driver.rating,
              driverCar: `${driver.vehicle.make} ${driver.vehicle.model}`,
              driverPlate: driver.vehicle.plate,
              etaMinutes: 2 + idx * 2,
              offeredFare,
              proposedFareByRider: params.proposedFare!,
              timestamp: Date.now(),
            };
            state.bidOffers = [...state.bidOffers, bid];
            notify();
          }
        }, 1200 + idx * 1100);
      });
      return;
    }

    // Normal matching: Match driver in under 10 seconds (e.g. 4 seconds)
    setTimeout(() => {
      if (state.activeTrip?.status === 'matching') {
        const matchingDriver =
          state.drivers.find(
            (d) => d.status === 'online' && d.vehicle.vehicleClass === params.vehicleClass
          ) || state.drivers.find((d) => d.status === 'online') || state.drivers[0];

        // Assign driver
        this.assignDriverToTrip(matchingDriver.id);
      }
    }, 4000);
  },

  // Accept a bid offer from a driver
  acceptBidOffer(bidId: string) {
    const bid = state.bidOffers.find((b) => b.id === bidId);
    if (!bid || !state.activeTrip) return;

    // Update trip with accepted bid fare
    const acceptedTotal = bid.offeredFare;
    const platformFee = Math.round(acceptedTotal * 0.18 * 100) / 100;
    const driverShare = Math.round((acceptedTotal - platformFee) * 100) / 100;

    state.activeTrip.fareBreakdown = {
      ...state.activeTrip.fareBreakdown,
      baseFare: 3.5,
      subtotal: acceptedTotal,
      platformFee,
      driverShare,
      total: acceptedTotal,
    };

    this.assignDriverToTrip(bid.driverId);
  },

  // Assign driver to trip
  assignDriverToTrip(driverId: string) {
    if (!state.activeTrip) return;

    const driver = state.drivers.find((d) => d.id === driverId) || state.drivers[0];

    // Set driver busy
    state.drivers = state.drivers.map((d) =>
      d.id === driver.id ? { ...d, status: 'busy' } : d
    );

    state.activeTrip = {
      ...state.activeTrip,
      driverId: driver.id,
      status: 'driver_arriving',
      matchedAt: Date.now(),
    };

    state.chatMessages.push({
      id: `msg-${Date.now()}`,
      tripId: state.activeTrip.id,
      sender: 'driver',
      text: `Hello! I'm on my way in a ${driver.vehicle.color} ${driver.vehicle.model}. ETA ~3 mins.`,
      timestamp: Date.now(),
    });

    notify();
  },

  // Driver explicitly accepts an incoming ride request (from Driver app UI)
  driverAcceptTrip(tripId: string) {
    if (!state.activeTrip || state.activeTrip.id !== tripId) return;
    this.assignDriverToTrip(state.currentDriverId);
  },

  // Driver declines incoming request
  driverDeclineTrip(tripId: string) {
    if (!state.activeTrip || state.activeTrip.id !== tripId) return;
    // Reroute to next driver
    const otherDriver = state.drivers.find(
      (d) => d.status === 'online' && d.id !== state.currentDriverId
    );
    if (otherDriver) {
      this.assignDriverToTrip(otherDriver.id);
    }
  },

  // Driver marks arrived at pickup
  driverArrivedAtPickup() {
    if (!state.activeTrip) return;
    state.activeTrip = {
      ...state.activeTrip,
      status: 'driver_arrived',
    };
    state.chatMessages.push({
      id: `msg-${Date.now()}`,
      tripId: state.activeTrip.id,
      sender: 'driver',
      text: `I have arrived at your pickup spot! Waiting by the curb.`,
      timestamp: Date.now(),
    });
    notify();
  },

  // Driver starts the trip
  startTrip() {
    if (!state.activeTrip) return;
    state.activeTrip = {
      ...state.activeTrip,
      status: 'in_progress',
      startedAt: Date.now(),
    };
    state.tripElapsedSeconds = 0;
    notify();
  },

  // Complete the trip
  completeTrip(paymentMethod?: 'card' | 'wallet' | 'cash') {
    if (!state.activeTrip) return;

    const finishedTrip: Trip = {
      ...state.activeTrip,
      status: 'completed',
      completedAt: Date.now(),
      paymentMethod: paymentMethod || state.activeTrip.paymentMethod,
    };

    // Update driver stats
    if (finishedTrip.driverId) {
      state.drivers = state.drivers.map((d) => {
        if (d.id === finishedTrip.driverId) {
          return {
            ...d,
            status: 'online',
            totalTrips: d.totalTrips + 1,
            todayEarnings: Math.round((d.todayEarnings + finishedTrip.fareBreakdown.driverShare) * 100) / 100,
            weeklyEarnings: Math.round((d.weeklyEarnings + finishedTrip.fareBreakdown.driverShare) * 100) / 100,
          };
        }
        return d;
      });
    }

    // Deduct rider wallet if payment was wallet
    if (finishedTrip.paymentMethod === 'wallet') {
      state.riders = state.riders.map((r) => {
        if (r.id === finishedTrip.riderId) {
          return {
            ...r,
            walletBalance: Math.max(0, Math.round((r.walletBalance - finishedTrip.fareBreakdown.total) * 100) / 100),
          };
        }
        return r;
      });
    }

    // Add to past trips
    state.pastTrips = [finishedTrip, ...state.pastTrips];
    state.activeTrip = finishedTrip; // keep as completed so receipt screen displays
    notify();
  },

  // Cancel trip
  cancelTrip(reason: string) {
    if (!state.activeTrip) return;

    if (state.activeTrip.driverId) {
      state.drivers = state.drivers.map((d) =>
        d.id === state.activeTrip?.driverId ? { ...d, status: 'online' } : d
      );
    }

    const cancelledTrip: Trip = {
      ...state.activeTrip,
      status: 'cancelled',
      cancelledAt: Date.now(),
      cancellationReason: reason,
    };

    state.pastTrips = [cancelledTrip, ...state.pastTrips];
    state.activeTrip = null;
    notify();
  },

  // Reset active trip back to idle
  dismissCompletedTrip() {
    state.activeTrip = null;
    state.bidOffers = [];
    state.chatMessages = [];
    notify();
  },

  // Rate driver
  rateDriver(tripId: string, rating: number, tags: string[], tip = 0, feedback = '') {
    state.pastTrips = state.pastTrips.map((t) => {
      if (t.id === tripId) {
        return {
          ...t,
          rating,
          ratingTags: tags,
          tip,
          riderFeedback: feedback,
        };
      }
      return t;
    });

    if (state.activeTrip?.id === tripId) {
      state.activeTrip = {
        ...state.activeTrip,
        rating,
        ratingTags: tags,
        tip,
        riderFeedback: feedback,
      };
    }
    notify();
  },

  // Raise dispute
  raiseDispute(tripId: string, reason: Dispute['reason'], description: string, claimedAmount: number) {
    const trip = state.pastTrips.find((t) => t.id === tripId);
    if (!trip) return;

    const dispute: Dispute = {
      id: `disp-${Date.now()}`,
      tripId: trip.id,
      riderId: trip.riderId,
      riderName: trip.riderName,
      driverId: trip.driverId || 'unknown',
      driverName: state.drivers.find((d) => d.id === trip.driverId)?.name || 'Driver',
      reason,
      description,
      claimedAmount,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    state.disputes = [dispute, ...state.disputes];
    notify();
  },

  // Admin resolves dispute with refund
  adminResolveDispute(disputeId: string, refundAmount: number, notes: string) {
    state.disputes = state.disputes.map((d) => {
      if (d.id === disputeId) {
        return {
          ...d,
          status: 'resolved',
          refundAmount,
          adminNotes: notes,
          resolvedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    // Credit rider wallet with refund amount
    const dispute = state.disputes.find((d) => d.id === disputeId);
    if (dispute && refundAmount > 0) {
      state.riders = state.riders.map((r) =>
        r.id === dispute.riderId
          ? { ...r, walletBalance: Math.round((r.walletBalance + refundAmount) * 100) / 100 }
          : r
      );
    }
    notify();
  },

  // Admin rejects dispute
  adminRejectDispute(disputeId: string, notes: string) {
    state.disputes = state.disputes.map((d) =>
      d.id === disputeId
        ? {
            ...d,
            status: 'rejected',
            adminNotes: notes,
            resolvedAt: new Date().toISOString(),
          }
        : d
    );
    notify();
  },

  // Admin verifies or rejects driver document
  adminVerifyDocument(driverId: string, docId: string, newStatus: 'approved' | 'rejected', reason?: string) {
    state.drivers = state.drivers.map((d) => {
      if (d.id === driverId) {
        const updatedDocs = d.documents.map((doc) =>
          doc.id === docId ? { ...doc, status: newStatus, rejectionReason: reason } : doc
        );
        const allApproved = updatedDocs.every((doc) => doc.status === 'approved');
        return {
          ...d,
          documents: updatedDocs,
          isVerified: allApproved,
        };
      }
      return d;
    });
    notify();
  },

  // Admin updates platform config (fare rules, base fares, commissions, surge)
  adminUpdateConfig(newConfig: PlatformConfig) {
    state.config = newConfig;
    notify();
  },

  // Admin toggle block rider
  adminToggleRiderBlock(riderId: string) {
    state.riders = state.riders.map((r) =>
      r.id === riderId ? { ...r, isBlocked: !r.isBlocked } : r
    );
    notify();
  },

  // Driver toggles online / offline
  driverToggleOnline(driverId?: string) {
    const id = driverId || state.currentDriverId;
    state.drivers = state.drivers.map((d) => {
      if (d.id === id) {
        const nextStatus = d.status === 'online' ? 'offline' : 'online';
        return { ...d, status: nextStatus };
      }
      return d;
    });
    notify();
  },

  // Driver uploads document
  driverUploadDocument(driverId: string, type: any, name: string) {
    state.drivers = state.drivers.map((d) => {
      if (d.id === driverId) {
        const newDoc = {
          id: `doc-${Date.now()}`,
          name,
          type,
          status: 'pending' as const,
          uploadedAt: new Date().toISOString().split('T')[0],
        };
        return {
          ...d,
          documents: [...d.documents, newDoc],
        };
      }
      return d;
    });
    notify();
  },

  // Rider top-up wallet
  topUpWallet(riderId: string, amount: number) {
    state.riders = state.riders.map((r) =>
      r.id === riderId
        ? { ...r, walletBalance: Math.round((r.walletBalance + amount) * 100) / 100 }
        : r
    );
    notify();
  },

  // Rider add payment card
  addPaymentCard(
    riderId: string,
    card: { brand: 'visa' | 'mastercard' | 'amex'; last4: string; expiry: string }
  ) {
    state.riders = state.riders.map((r) => {
      if (r.id === riderId) {
        const newCard = {
          id: `pm-${Date.now()}`,
          type: 'card' as const,
          brand: card.brand,
          last4: card.last4,
          expiry: card.expiry,
          isDefault: true,
        };
        const resetOldCards = r.paymentMethods.map((pm) => ({ ...pm, isDefault: false }));
        return {
          ...r,
          paymentMethods: [newCard, ...resetOldCards],
        };
      }
      return r;
    });
    notify();
  },

  // Agent books ride for caller
  agentBookRide(params: {
    callerName: string;
    callerPhone: string;
    pickup: LocationPoint;
    dropoff: LocationPoint;
    vehicleClass: VehicleClassId;
    agentId: string;
    paymentMethod: 'card' | 'wallet' | 'cash';
  }) {
    // Generate trip
    this.requestRide({
      serviceType: 'ride',
      vehicleClass: params.vehicleClass,
      pickup: params.pickup,
      dropoff: params.dropoff,
      paymentMethod: params.paymentMethod,
      agentId: params.agentId,
    });

    // Update agent bookings count
    state.agents = state.agents.map((ag) =>
      ag.id === params.agentId
        ? {
            ...ag,
            totalBookings: ag.totalBookings + 1,
            commissionEarned: Math.round((ag.commissionEarned + 4.50) * 100) / 100,
          }
        : ag
    );
    notify();
  },

  // Chat messaging
  sendChatMessage(text: string, sender: 'rider' | 'driver') {
    if (!state.activeTrip) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      tripId: state.activeTrip.id,
      sender,
      text,
      timestamp: Date.now(),
    };
    state.chatMessages = [...state.chatMessages, msg];
    notify();

    // Auto-reply simulated response
    if (sender === 'rider') {
      setTimeout(() => {
        if (state.activeTrip) {
          const replies = [
            `Got it! I see your location and I'm turning onto your street now.`,
            `No problem at all, I'll put my hazard lights on right in front of the entrance.`,
            `Sounds great! See you in just a minute.`,
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          const replyMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            tripId: state.activeTrip.id,
            sender: 'driver',
            text: randomReply,
            timestamp: Date.now(),
          };
          state.chatMessages = [...state.chatMessages, replyMsg];
          notify();
        }
      }, 1400);
    }
  },

  // Reset entire demo to seed state
  resetDemoData() {
    localStorage.removeItem(STORAGE_KEY);
    state = {
      config: DEFAULT_PLATFORM_CONFIG,
      drivers: INITIAL_DRIVERS,
      riders: INITIAL_RIDERS,
      currentRiderId: 'r1',
      currentDriverId: 'd1',
      activeTrip: null,
      pastTrips: INITIAL_PAST_TRIPS,
      disputes: INITIAL_DISPUTES,
      agents: INITIAL_AGENTS,
      promoCodes: INITIAL_PROMO_CODES,
      bidOffers: [],
      chatMessages: [],
      waitingTimeSeconds: 0,
      tripElapsedSeconds: 0,
    };
    notify();
  },
};

// React hook for consuming Movo store
export function useMovoStore() {
  const [snapshot, setSnapshot] = useState<MovoState>(() => movoStore.getState());

  useEffect(() => {
    return movoStore.subscribe(() => {
      setSnapshot({ ...movoStore.getState() });
    });
  }, []);

  return snapshot;
}
