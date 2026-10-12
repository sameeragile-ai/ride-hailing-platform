import { PlatformConfig, VehicleClassId, FareBreakdown } from '../lib/types';

export function calculateFareEstimate(
  config: PlatformConfig,
  vehicleClassId: VehicleClassId,
  distanceKm: number,
  durationMinutes: number,
  waitingMinutes = 0,
  promoDiscountPercent = 0
): FareBreakdown {
  const vClass = config.vehicleClasses[vehicleClassId] || config.vehicleClasses.economy;
  const surge = config.surgeMultiplier || 1.0;

  const baseFare = vClass.baseFare;
  const distanceFare = Math.round(distanceKm * vClass.perKm * 100) / 100;
  const durationFare = Math.round(durationMinutes * vClass.perMinute * 100) / 100;
  const waitingCharge = Math.round(waitingMinutes * vClass.waitingChargePerMin * 100) / 100;

  const standardSubtotal = Math.round((baseFare + distanceFare + durationFare + waitingCharge) * 100) / 100;
  const surgedSubtotal = Math.round(standardSubtotal * surge * 100) / 100;
  const subtotal = Math.max(vClass.minimumFare, surgedSubtotal);

  const discount = promoDiscountPercent > 0 
    ? Math.round(subtotal * (promoDiscountPercent / 100) * 100) / 100 
    : 0;

  const total = Math.round((subtotal - discount) * 100) / 100;
  const commissionRate = config.commissionRates[vehicleClassId] ?? vClass.commissionRate ?? 0.20;
  const platformFee = Math.round(total * commissionRate * 100) / 100;
  const driverShare = Math.round((total - platformFee) * 100) / 100;

  return {
    baseFare,
    distanceKm: Math.round(distanceKm * 100) / 100,
    distanceFare,
    durationMinutes: Math.round(durationMinutes),
    durationFare,
    waitingCharge,
    surgeMultiplier: surge,
    discount,
    subtotal,
    platformFee,
    driverShare,
    total,
  };
}

export function calculateRentalFare(
  config: PlatformConfig,
  packageId: string,
  extraKm = 0,
  extraHours = 0
): FareBreakdown {
  const pkg = config.rentalPackages.find((p) => p.id === packageId) || config.rentalPackages[0];
  const base = pkg.price;
  const extraKmCost = Math.round(extraKm * pkg.extraKmRate * 100) / 100;
  const extraHourCost = Math.round(extraHours * pkg.extraHourRate * 100) / 100;
  const total = Math.round((base + extraKmCost + extraHourCost) * 100) / 100;
  const platformFee = Math.round(total * 0.20 * 100) / 100;
  const driverShare = Math.round((total - platformFee) * 100) / 100;

  return {
    baseFare: base,
    distanceKm: pkg.includedKm + extraKm,
    distanceFare: extraKmCost,
    durationMinutes: (pkg.durationHours + extraHours) * 60,
    durationFare: extraHourCost,
    waitingCharge: 0,
    surgeMultiplier: 1.0,
    discount: 0,
    subtotal: total,
    platformFee,
    driverShare,
    total,
  };
}

export function calculateOutstationFare(
  config: PlatformConfig,
  distanceKm: number,
  isRoundTrip: boolean
): FareBreakdown {
  const effectiveDistance = isRoundTrip ? distanceKm * 2 : distanceKm;
  const kmFare = Math.round(effectiveDistance * config.outstationRules.baseRatePerKm * 100) / 100;
  const driverAllowance = config.outstationRules.driverAllowancePerDay;
  const toll = config.outstationRules.tollEstimate;
  const subtotal = Math.round((kmFare + driverAllowance + toll) * 100) / 100;
  const total = subtotal;
  const platformFee = Math.round(total * 0.18 * 100) / 100;
  const driverShare = Math.round((total - platformFee) * 100) / 100;

  return {
    baseFare: driverAllowance + toll,
    distanceKm: effectiveDistance,
    distanceFare: kmFare,
    durationMinutes: Math.round(effectiveDistance * 1.5),
    durationFare: 0,
    waitingCharge: 0,
    surgeMultiplier: 1.0,
    discount: 0,
    subtotal,
    platformFee,
    driverShare,
    total,
  };
}
