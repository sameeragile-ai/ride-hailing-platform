import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Coordinates, Driver, LocationPoint } from '../../lib/types';

// Fix standard leaflet icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Car SVG Icon generator with rotation heading
function createCarIcon(heading = 0, isAssigned = false, vehicleClass = 'economy') {
  const bgColor = isAssigned ? '#FF5A36' : vehicleClass === 'premium' ? '#0E1116' : '#0F766E';
  const size = isAssigned ? 38 : 32;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(${heading}deg);
      transition: transform 0.4s ease;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.18));
    ">
      <div style="
        width: 100%;
        height: 100%;
        border-radius: 9999px;
        background-color: ${bgColor};
        border: 2px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-car-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Pickup pin icon
function createPickupIcon() {
  const html = `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 9999px;
      background-color: #0E1116;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: #ffffff;"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-pickup-pin',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Dropoff pin icon
function createDropoffIcon() {
  const html = `
    <div style="
      width: 32px;
      height: 32px;
      border-radius: 9999px;
      background: linear-gradient(135deg, #FF5A36, #FFB020);
      border: 3px solid #ffffff;
      box-shadow: 0 4px 12px rgba(255, 90, 54, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
    ">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
        <line x1="4" y1="22" x2="4" y2="15"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-dropoff-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Recenter map helper component
function MapController({
  center,
  zoom,
  bounds,
}: {
  center?: Coordinates;
  zoom?: number;
  bounds?: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      try {
        const leafletBounds = L.latLngBounds(bounds);
        map.fitBounds(leafletBounds, { padding: [50, 50], maxZoom: 15, animate: true });
      } catch (e) {
        // ignore
      }
    } else if (center) {
      map.setView([center.lat, center.lng], zoom || 14, { animate: true });
    }
  }, [center?.lat, center?.lng, zoom, bounds, map]);

  return null;
}

export interface MapComponentProps {
  center?: Coordinates;
  zoom?: number;
  drivers?: Driver[];
  assignedDriverId?: string;
  pickup?: LocationPoint | null;
  dropoff?: LocationPoint | null;
  routePolyline?: [number, number][];
  onDriverClick?: (driver: Driver) => void;
  interactive?: boolean;
  className?: string;
  showAllDrivers?: boolean;
}

export function MapComponent({
  center = { lat: 52.5200, lng: 13.4050 },
  zoom = 13,
  drivers = [],
  assignedDriverId,
  pickup,
  dropoff,
  routePolyline,
  onDriverClick,
  interactive = true,
  className = 'h-full w-full',
  showAllDrivers = true,
}: MapComponentProps) {
  const pickupIcon = useMemo(() => createPickupIcon(), []);
  const dropoffIcon = useMemo(() => createDropoffIcon(), []);

  // Compute bounds if pickup & dropoff exist
  const bounds = useMemo(() => {
    if (pickup && dropoff) {
      return [
        [pickup.lat, pickup.lng] as [number, number],
        [dropoff.lat, dropoff.lng] as [number, number],
      ];
    }
    return undefined;
  }, [pickup, dropoff]);

  return (
    <div className={`relative ${className} overflow-hidden`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        attributionControl={false}
        className="h-full w-full"
      >
        {/* CartoDB Voyager muted light tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          subdomains="abcd"
          className="movo-map-tiles"
        />

        <MapController center={center} zoom={zoom} bounds={bounds} />

        {/* Route Polyline */}
        {routePolyline && routePolyline.length > 0 && (
          <>
            {/* Outer soft halo for contrast */}
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: '#FF5A36',
                opacity: 0.25,
                weight: 8,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Core vibrant polyline */}
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: '#FF5A36',
                opacity: 0.95,
                weight: 4.5,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        )}

        {/* Pickup Pin */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup className="font-sans text-xs">
              <strong>Pickup:</strong> {pickup.name}
            </Popup>
          </Marker>
        )}

        {/* Dropoff Pin */}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
            <Popup className="font-sans text-xs">
              <strong>Destination:</strong> {dropoff.name}
            </Popup>
          </Marker>
        )}

        {/* Drivers */}
        {showAllDrivers &&
          drivers.map((driver) => {
            const isAssigned = driver.id === assignedDriverId;
            return (
              <Marker
                key={driver.id}
                position={[driver.location.lat, driver.location.lng]}
                icon={createCarIcon(driver.heading, isAssigned, driver.vehicle.vehicleClass)}
                eventHandlers={{
                  click: () => onDriverClick && onDriverClick(driver),
                }}
              >
                <Popup className="font-sans text-xs">
                  <div className="p-1">
                    <p className="font-semibold text-slate-900">{driver.name}</p>
                    <p className="text-slate-500">
                      {driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.plate})
                    </p>
                    <p className="text-amber-500">★ {driver.rating.toFixed(2)}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
