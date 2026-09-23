import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Building2, Navigation, Crosshair } from 'lucide-react';
import { Bus, Route, Stop, LiveLocation, SpecialTrip } from '../types';
import { COLLEGE_CAMPUS_LOCATION } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';

interface LeafletBusMapProps {
  buses: Bus[];
  routes: Route[];
  liveLocations: Record<string, LiveLocation>;
  selectedBusId?: string;
  selectedRouteId?: string;
  selectedStopId?: string;
  specialTrips?: SpecialTrip[];
  userLocation?: { lat: number; lng: number } | null;
  studentLocation?: {
    lat: number;
    lng: number;
    name: string;
    rollNumber?: string;
    stopName: string;
    status: string;
    avatar?: string;
  } | null;
  campusLocation?: { lat: number; lng: number; name?: string; address?: string };
  districtCenter?: [number, number];
  districtZoom?: number;
  onSelectBus?: (busId: string) => void;
  onSelectStop?: (stop: Stop) => void;
  showAllRoutes?: boolean;
  className?: string;
  etaBadge?: {
    etaMin: number;
    distKm: number;
    stopName?: string;
    busNumber?: string;
    isPassed?: boolean;
    clockTime?: string;
  };
}

export const LeafletBusMap: React.FC<LeafletBusMapProps> = ({
  buses,
  routes,
  liveLocations,
  selectedBusId,
  selectedRouteId,
  selectedStopId,
  specialTrips = [],
  userLocation,
  studentLocation,
  campusLocation = COLLEGE_CAMPUS_LOCATION,
  districtCenter,
  districtZoom = 13,
  onSelectBus,
  onSelectStop,
  showAllRoutes = true,
  className = "w-full h-full min-h-[450px]",
  etaBadge
}) => {
  const { isDark } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const polylinesGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const activeCampus = campusLocation || COLLEGE_CAMPUS_LOCATION;
  const currentCenter = districtCenter || [activeCampus.lat, activeCampus.lng];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: currentCenter,
      zoom: districtZoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    markersGroupRef.current = L.layerGroup().addTo(map);
    polylinesGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Dynamically update tile layer when theme toggles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const newLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [isDark]);

  // Pan to new district center when district center changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (districtCenter) {
      map.flyTo(districtCenter, districtZoom, { duration: 1.2 });
    } else if (campusLocation) {
      map.flyTo([campusLocation.lat, campusLocation.lng], districtZoom, { duration: 1.2 });
    }
  }, [districtCenter?.[0], districtCenter?.[1], campusLocation?.lat, campusLocation?.lng, districtZoom]);

  // Update Markers & Polylines whenever state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const polylinesGroup = polylinesGroupRef.current;

    if (!map || !markersGroup || !polylinesGroup) return;

    markersGroup.clearLayers();
    polylinesGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Plot College Campus Base Anchor
    const campusIcon = L.divIcon({
      className: 'custom-campus-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xl border-2 border-white ring-4 ring-amber-500/30">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="absolute -bottom-6 bg-slate-900/90 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap">
            Campus Terminal Hub
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const campusMarker = L.marker([activeCampus.lat, activeCampus.lng], { icon: campusIcon });
    campusMarker.bindPopup(`
      <div class="p-2 text-slate-100 min-w-[200px]">
        <h4 class="font-bold text-amber-400 text-sm">${activeCampus.name || 'Central Campus Terminal'}</h4>
        <p class="text-xs text-slate-300 mt-1">${activeCampus.address || 'Regional Transit Terminal Hub'}</p>
        <div class="mt-2 text-[11px] bg-slate-800 p-1.5 rounded text-slate-300 font-medium">
          Central Dispatch & Transit Terminal Hub
        </div>
      </div>
    `);
    markersGroup.addLayer(campusMarker);
    bounds.extend([activeCampus.lat, activeCampus.lng]);

    // 2. Draw Routes & Stops
    const routesToDisplay = showAllRoutes
      ? routes
      : routes.filter(r => r.id === selectedRouteId || (selectedBusId && r.assignedBusId === selectedBusId));

    routesToDisplay.forEach(route => {
      const isSelectedRoute = route.id === selectedRouteId;
      const routeColor = route.color || '#3b82f6';

      // Draw Polyline Path
      if (route.pathCoordinates && route.pathCoordinates.length > 0) {
        const polyline = L.polyline(route.pathCoordinates, {
          color: routeColor,
          weight: isSelectedRoute ? 6 : 4,
          opacity: isSelectedRoute ? 0.95 : 0.65,
          dashArray: isSelectedRoute ? undefined : '6, 6',
          lineCap: 'round',
          lineJoin: 'round'
        });

        polyline.bindPopup(`
          <div class="p-1.5 text-slate-100">
            <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style="background-color: ${routeColor}25; color: ${routeColor};">
              ${route.code}
            </span>
            <h4 class="font-semibold text-xs mt-1 text-slate-200">${route.name}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5">${route.stops.length} Stops • ${route.totalDistanceKm} km • ~${route.estimatedDurationMin} mins</p>
          </div>
        `);
        polylinesGroup.addLayer(polyline);

        route.pathCoordinates.forEach(coord => bounds.extend(coord));
      }

      // Draw Stops
      route.stops.forEach(stop => {
        const isSelectedStop = stop.id === selectedStopId;
        const isCompleted = stop.isCompleted;

        const stopIcon = L.divIcon({
          className: 'custom-stop-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group">
              ${isSelectedStop ? '<div class="absolute w-8 h-8 rounded-full bg-amber-400/40 animate-ping"></div>' : ''}
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all transform hover:scale-125 shadow-md ${
                isSelectedStop
                  ? 'bg-amber-500 border-white text-slate-950 ring-4 ring-amber-400/50 z-30'
                  : isCompleted
                  ? 'bg-emerald-600 border-emerald-300 text-white'
                  : 'bg-slate-900 border-slate-300 text-slate-200'
              }">
                ${isCompleted ? '✓' : stop.sequence}
              </div>
              <div class="absolute left-7 bg-slate-950/90 text-slate-200 border border-slate-800 text-[10px] font-medium px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-40">
                ${stop.name} (${stop.scheduledTime})
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon });

        stopMarker.on('click', () => {
          if (onSelectStop) onSelectStop(stop);
        });

        stopMarker.bindPopup(`
          <div class="p-2 text-slate-100 min-w-[200px]">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                Stop #${stop.sequence}
              </span>
              <span class="text-[11px] text-amber-400 font-semibold">
                Scheduled: ${stop.scheduledTime}
              </span>
            </div>
            <h4 class="font-bold text-sm text-slate-100 mt-1.5">${stop.name}</h4>
            <div class="flex items-center justify-between text-xs text-slate-300 mt-2 bg-slate-800/80 p-1.5 rounded">
              <span>Students Boarding:</span>
              <span class="font-bold text-emerald-400">${stop.studentsRegistered} registered</span>
            </div>
            <div class="mt-2.5">
              <button id="btn-select-stop-${stop.id}" class="w-full text-center text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 py-1.5 rounded transition">
                Set as My Pickup Point
              </button>
            </div>
          </div>
        `);

        stopMarker.on('popupopen', () => {
          const btn = document.getElementById(`btn-select-stop-${stop.id}`);
          if (btn) {
            btn.onclick = () => {
              if (onSelectStop) onSelectStop(stop);
              map.closePopup();
            };
          }
        });

        markersGroup.addLayer(stopMarker);
        bounds.extend([stop.lat, stop.lng]);
      });
    });

    // 3. Draw Special Trip Venues
    specialTrips.forEach(trip => {
      if (trip.status !== 'completed' && trip.status !== 'cancelled') {
        const venueIcon = L.divIcon({
          className: 'custom-venue-pin',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-lg border-2 border-purple-300 ring-4 ring-purple-500/30 animate-bounce">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div class="absolute -bottom-6 bg-slate-900 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded shadow border border-purple-800 whitespace-nowrap">
                ${trip.venueName.slice(0, 22)}...
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const venueMarker = L.marker([trip.venueLat, trip.venueLng], { icon: venueIcon });
        venueMarker.bindPopup(`
          <div class="p-2 text-slate-100 min-w-[200px]">
            <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700">
              ${trip.purpose}
            </span>
            <h4 class="font-bold text-sm text-purple-200 mt-1">${trip.venueName}</h4>
            <p class="text-xs text-slate-300 mt-1">${trip.venueAddress}</p>
            <div class="mt-2 text-xs text-slate-300 bg-slate-800 p-1.5 rounded space-y-1">
              <div><strong>Trip:</strong> ${trip.tripName}</div>
              <div><strong>Dept:</strong> ${trip.department}</div>
              <div><strong>Date:</strong> ${new Date(trip.startDateTime).toLocaleDateString()}</div>
              <div><strong>Assigned Bus:</strong> ${trip.assignedBusNumber}</div>
            </div>
          </div>
        `);
        markersGroup.addLayer(venueMarker);
        bounds.extend([trip.venueLat, trip.venueLng]);
      }
    });

    // 4. Draw Live Moving Buses
    buses.forEach(bus => {
      const loc = liveLocations[bus.id];
      if (!loc) return;

      const isSelectedBus = bus.id === selectedBusId;
      const isDelayed = loc.delayMinutes > 0;
      const isOffRoute = loc.isOffRoute;

      const busIcon = L.divIcon({
        className: 'custom-bus-pin',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <!-- Pulsing Halo -->
            <div class="absolute w-12 h-12 rounded-full ${isOffRoute ? 'bg-rose-500/40 animate-ping' : isSelectedBus ? 'bg-amber-400/50 bus-pulse-ring' : 'bg-blue-500/30'}"></div>
            
            <!-- Bus Body -->
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all transform ${
              isSelectedBus
                ? 'bg-amber-500 border-white text-slate-950 scale-110 ring-4 ring-amber-400/60 z-50'
                : isOffRoute
                ? 'bg-rose-600 border-white text-white z-40'
                : 'bg-slate-900 border-amber-400 text-amber-400 hover:scale-105 z-30'
            }">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" style="transform: rotate(${loc.headingDeg || 0}deg); transition: transform 0.5s ease-out;">
                <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
              </svg>
            </div>

            <!-- Bus Number / Speed Tag -->
            <div class="absolute -bottom-6 flex items-center gap-1 bg-slate-950/95 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap text-slate-100">
              <span class="w-2 h-2 rounded-full ${loc.speedKmph > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}"></span>
              <span>${bus.busNumber.split('-')[0].trim()}</span>
              <span class="text-amber-400 font-mono">${loc.speedKmph} km/h</span>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const busMarker = L.marker([loc.lat, loc.lng], { icon: busIcon });

      busMarker.on('click', () => {
        if (onSelectBus) onSelectBus(bus.id);
      });

      busMarker.bindPopup(`
        <div class="p-2 text-slate-100 min-w-[220px]">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-400">${bus.busNumber}</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded ${
              loc.speedKmph > 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
            }">
              ${loc.speedKmph > 0 ? `${loc.speedKmph} km/h` : 'Stopped'}
            </span>
          </div>

          <div class="text-xs text-slate-300 mt-2 space-y-1 bg-slate-800/80 p-2 rounded">
            <div class="flex justify-between">
              <span class="text-slate-400">Plate No:</span>
              <span class="font-mono text-slate-200">${bus.plateNumber}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Driver:</span>
              <span class="font-medium text-slate-200">${bus.driverName}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Next Stop:</span>
              <span class="font-medium text-amber-300">${loc.nextStopName || 'Approaching Stop'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Next Stop ETA:</span>
              <span class="font-bold text-emerald-400">~${loc.etaNextStopMin} mins (${loc.distanceToNextStopKm} km)</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Passengers:</span>
              <span class="font-medium text-slate-200">${bus.currentPassengers} / ${bus.capacity} seats</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Mileage Avg:</span>
              <span class="font-medium text-cyan-400">${bus.fuelEfficiencyKmpl} km/l</span>
            </div>
          </div>

          ${isOffRoute ? `
            <div class="mt-2 text-[11px] bg-rose-950/80 border border-rose-700 text-rose-300 p-1.5 rounded flex items-center gap-1 font-medium">
              ⚠️ Off-Route Alert: Deviated by ${loc.offRouteDistanceMeters}m
            </div>
          ` : ''}

          ${isDelayed ? `
            <div class="mt-1.5 text-[11px] bg-amber-950/80 border border-amber-700 text-amber-300 p-1.5 rounded flex items-center gap-1">
              ⏱️ Running ${loc.delayMinutes} mins behind schedule
            </div>
          ` : ''}

          <div class="mt-2.5">
            <button id="btn-track-bus-${bus.id}" class="w-full text-center text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 py-1.5 rounded transition">
              Focus & Live Track Bus
            </button>
          </div>
        </div>
      `);

      busMarker.on('popupopen', () => {
        const btn = document.getElementById(`btn-track-bus-${bus.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectBus) onSelectBus(bus.id);
            map.closePopup();
          };
        }
      });

      markersGroup.addLayer(busMarker);
      bounds.extend([loc.lat, loc.lng]);
    });

    // 5. User live location if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white ring-4 ring-cyan-500/40 animate-pulse"></div>
            <div class="absolute -bottom-5 bg-slate-900 text-cyan-300 text-[9px] font-bold px-1.5 py-0.2 rounded whitespace-nowrap">
              You (Current Location)
            </div>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      userMarker.bindPopup('<div class="p-1 text-xs text-slate-100">Your Current GPS Location</div>');
      markersGroup.addLayer(userMarker);
      bounds.extend([userLocation.lat, userLocation.lng]);
    }

    // 6. Student pickup & boarding live pin if available
    if (studentLocation) {
      const isBoarded = studentLocation.status === 'boarded';
      const isArrived = studentLocation.status === 'arrived-campus';

      const studentIcon = L.divIcon({
        className: 'custom-student-pin',
        html: `
          <div class="relative flex flex-col items-center justify-center cursor-pointer group">
            <div class="w-10 h-10 rounded-full border-2 ${
              isArrived
                ? 'border-emerald-400 bg-emerald-950 ring-4 ring-emerald-500/40'
                : isBoarded
                ? 'border-amber-400 bg-amber-950 ring-4 ring-amber-500/40'
                : 'border-blue-400 bg-blue-950 ring-4 ring-blue-500/40'
            } flex items-center justify-center overflow-hidden shadow-2xl animate-pulse">
              ${
                studentLocation.avatar
                  ? `<img src="${studentLocation.avatar}" class="w-full h-full object-cover" />`
                  : `<span class="text-xs font-black text-white">${studentLocation.name.slice(0, 2).toUpperCase()}</span>`
              }
            </div>
            <div class="mt-1 bg-slate-900/95 border ${
              isArrived ? 'border-emerald-700 text-emerald-300' : isBoarded ? 'border-amber-700 text-amber-300' : 'border-blue-700 text-blue-300'
            } text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1">
              <span>👤 ${studentLocation.name.split(' ')[0]}</span>
              <span class="text-[9px] opacity-80 font-normal">(${isArrived ? 'At Campus' : isBoarded ? 'On Bus' : 'At Stop'})</span>
            </div>
          </div>
        `,
        iconSize: [40, 48],
        iconAnchor: [20, 24]
      });

      const studentMarker = L.marker([studentLocation.lat, studentLocation.lng], { icon: studentIcon });
      studentMarker.bindPopup(`
        <div class="p-2 text-slate-100 min-w-[210px]">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 border border-slate-700">
              👤
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-100">${studentLocation.name}</h4>
              <p class="text-[11px] text-slate-400 font-mono">${studentLocation.rollNumber || 'Student'}</p>
            </div>
          </div>
          <div class="mt-2 text-xs bg-slate-800/80 p-2 rounded space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-400">Designated Stop:</span>
              <span class="font-medium text-amber-300">${studentLocation.stopName}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Current Status:</span>
              <span class="font-bold ${isArrived ? 'text-emerald-400' : isBoarded ? 'text-amber-400' : 'text-blue-400'}">
                ${isArrived ? '🎓 Safely at Campus' : isBoarded ? '🚌 Boarded on Bus' : '📍 Waiting at Stop'}
              </span>
            </div>
          </div>
        </div>
      `);
      markersGroup.addLayer(studentMarker);
      bounds.extend([studentLocation.lat, studentLocation.lng]);
    }

    // Auto fit bounds or pan to selected bus
    if (bounds.isValid()) {
      if (selectedBusId && liveLocations[selectedBusId]) {
        const selectedLoc = liveLocations[selectedBusId];
        map.panTo([selectedLoc.lat, selectedLoc.lng], { animate: true });
      }
    }
  }, [buses, routes, liveLocations, selectedBusId, selectedRouteId, selectedStopId, specialTrips, userLocation, studentLocation, showAllRoutes, activeCampus]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 transition-colors duration-200">
      <div ref={mapContainerRef} className={className} id="college-fleet-map" />
      
      {/* Map Overlay: Floating ETA Telemetry Card */}
      {etaBadge && (
        <div className="absolute top-4 left-4 z-[400] max-w-[280px] sm:max-w-xs bg-slate-950/90 text-slate-100 backdrop-blur-md border border-amber-500/50 rounded-2xl p-3 sm:p-3.5 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                LIVE ETA TELEMETRY
              </span>
            </div>
            {etaBadge.busNumber && (
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                {etaBadge.busNumber}
              </span>
            )}
          </div>

          <div className="pt-2">
            {etaBadge.isPassed ? (
              <div className="text-xs font-bold text-slate-300">
                <span className="text-emerald-400 font-black">✓ Passed</span> {etaBadge.stopName || 'your stop'}
                <div className="text-[10px] text-slate-400 mt-0.5">En route to College Campus Terminal</div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 font-display">
                      ~{etaBadge.etaMin}
                    </span>
                    <span className="text-xs font-extrabold text-slate-300">MINS</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 font-mono">
                    {etaBadge.distKm} km
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
                  To: <span className="text-amber-300">{etaBadge.stopName || 'Selected Stop'}</span>
                </div>

                {etaBadge.clockTime && (
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>Est. Arrival:</span>
                    <span className="font-mono font-bold text-amber-400">{etaBadge.clockTime}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Overlay Quick Controls */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([activeCampus.lat, activeCampus.lng], districtZoom, { animate: true });
            }
          }}
          className="bg-white/95 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-md transition"
          title="Center on Campus Terminal"
        >
          <Building2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          Campus Center
        </button>

        {selectedBusId && liveLocations[selectedBusId] && (
          <button
            onClick={() => {
              if (mapInstanceRef.current && liveLocations[selectedBusId]) {
                const loc = liveLocations[selectedBusId];
                mapInstanceRef.current.setView([loc.lat, loc.lng], 15, { animate: true });
              }
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition"
            title="Snap to Bus"
          >
            <Crosshair className="w-4 h-4" />
            Follow Bus
          </button>
        )}
      </div>

      {/* Map Legend Footer */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 dark:bg-slate-950/85 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xl text-[11px] text-slate-700 dark:text-slate-300 flex flex-wrap items-center gap-3 transition-colors duration-200">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="font-medium">Campus Terminal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-500"></span>
          <span className="font-medium">Live Bus (Moving)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="font-medium">Completed Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-400"></span>
          <span className="font-medium">Upcoming Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-500"></span>
          <span className="font-medium">Special Venue</span>
        </div>
      </div>
    </div>
  );
};
