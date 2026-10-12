export type VehicleClassId = 'economy' | 'comfort' | 'xl' | 'premium';
export type ServiceTypeId = 'ride' | 'bid' | 'rental' | 'outstation';

export type TripStatus =
  | 'requested'
  | 'bidding'
  | 'matching'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type DriverStatus = 'online' | 'busy' | 'offline';
export type DocumentStatus = 'approved' | 'pending' | 'rejected';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationPoint {
  address: string;
  name: string;
  lat: number;
  lng: number;
}

export interface VehicleClassConfig {
  id: VehicleClassId;
  name: string;
  description: string;
  capacity: number;
  baseFare: number; // EUR
  perKm: number;    // EUR / km
  perMinute: number;// EUR / min
  minimumFare: number;
  waitingChargePerMin: number;
  commissionRate: number; // e.g. 0.18 = 18%
  iconName: string;
}

export interface PlatformConfig {
  city: string;
  country: string;
  currency: string;
  currencySymbol: string;
  centerCoordinates: Coordinates;
  surgeMultiplier: number;
  commissionRates: Record<VehicleClassId, number>;
  vehicleClasses: Record<VehicleClassId, VehicleClassConfig>;
  rentalPackages: {
    id: string;
    durationHours: number;
    includedKm: number;
    price: number;
    extraKmRate: number;
    extraHourRate: number;
  }[];
  outstationRules: {
    baseRatePerKm: number;
    driverAllowancePerDay: number;
    tollEstimate: number;
  };
}

export interface DriverDocument {
  id: string;
  name: string;
  type: 'driving_license' | 'national_id' | 'commercial_insurance' | 'vehicle_registration';
  status: DocumentStatus;
  uploadedAt: string;
  fileUrl?: string;
  rejectionReason?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  status: DriverStatus;
  location: Coordinates;
  heading: number; // 0-360 degrees for car marker rotation
  vehicle: {
    make: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    vehicleClass: VehicleClassId;
  };
  documents: DriverDocument[];
  acceptanceRate: number;
  todayEarnings: number;
  weeklyEarnings: number;
  fleetId?: string;
  isVerified: boolean;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  walletBalance: number;
  savedPlaces: {
    id: string;
    label: string;
    name: string;
    address: string;
    coords: Coordinates;
  }[];
  paymentMethods: {
    id: string;
    type: 'card' | 'wallet' | 'cash';
    brand?: 'visa' | 'mastercard' | 'amex';
    last4?: string;
    expiry?: string;
    isDefault?: boolean;
  }[];
  isBlocked?: boolean;
}

export interface FareBreakdown {
  baseFare: number;
  distanceKm: number;
  distanceFare: number;
  durationMinutes: number;
  durationFare: number;
  waitingCharge: number;
  surgeMultiplier: number;
  discount: number;
  subtotal: number;
  platformFee: number;
  driverShare: number;
  total: number;
}

export interface BidOffer {
  id: string;
  tripId: string;
  driverId: string;
  driverName: string;
  driverAvatar: string;
  driverRating: number;
  driverCar: string;
  driverPlate: string;
  etaMinutes: number;
  offeredFare: number;
  proposedFareByRider: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  tripId: string;
  sender: 'rider' | 'driver' | 'system';
  text: string;
  timestamp: number;
}

export interface Trip {
  id: string;
  serviceType: ServiceTypeId;
  vehicleClass: VehicleClassId;
  status: TripStatus;
  riderId: string;
  riderName: string;
  riderPhone: string;
  driverId?: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  routePolyline: [number, number][]; // lat, lng points
  currentProgressIndex?: number; // index or fraction along routePolyline
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  actualDistanceKm?: number;
  actualDurationMin?: number;
  fareBreakdown: FareBreakdown;
  paymentMethod: 'card' | 'wallet' | 'cash';
  requestedAt: number;
  matchedAt?: number;
  startedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  cancellationReason?: string;
  rating?: number;
  ratingTags?: string[];
  tip?: number;
  riderFeedback?: string;
  proposedFare?: number; // for Bid your fare
  rentalHours?: number;  // for Rental
  isOutstationRoundTrip?: boolean; // for Outstation
  agentId?: string;
}

export interface Dispute {
  id: string;
  tripId: string;
  riderId: string;
  riderName: string;
  driverId: string;
  driverName: string;
  reason: 'overcharged' | 'driver_route' | 'safety' | 'cancelled_incorrectly' | 'lost_item';
  description: string;
  claimedAmount: number;
  refundAmount?: number;
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  adminNotes?: string;
}

export interface Agent {
  id: string;
  name: string;
  company: string;
  phone: string;
  totalBookings: number;
  commissionEarned: number;
  activeFleetSize: number;
}

export interface PromoCode {
  code: string;
  discountPercentage: number;
  maxDiscount: number;
  validUntil: string;
  isActive: boolean;
  timesUsed: number;
}
