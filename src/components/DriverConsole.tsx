import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bus, Route, LiveLocation, Stop, DistrictConfig, StudentPassenger, TripEndReport } from '../types';
import { LeafletBusMap } from './LeafletBusMap';
import { TripEndModal } from './TripEndModal';
import QRScanner from './QRScanner';
import SeatSelector from './SeatSelector';
import {
  getSeatAssignmentsForTrip,
  saveSeatAssignment,
  saveAttendanceRecord
} from '../services/dbService';
import {
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Fuel,
  Users,
  Navigation,
  Gauge,
  Radio,
  MapPin,
  Clock,
  Compass,
  Zap,
  Volume2,
  Flag,
  Check,
  Phone,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Armchair,
  CheckCircle2,
  Info,
  Plus,
  Minus
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DriverConsoleProps {
  buses: Bus[];
  routes: Route[];
  liveLocations: Record<string, LiveLocation>;
  students?: StudentPassenger[];
  districts?: DistrictConfig[];
  selectedDistrict?: DistrictConfig;
  onSelectDistrict?: (districtId: string) => void;
  onUpdateLocation: (update: LiveLocation) => Promise<void>;
  onOpenFuelModal: (busId: string) => void;
  onStartTrip?: (busId: string, routeId: string) => Promise<void>;
  onEndTrip?: (report: TripEndReport) => Promise<void>;
  onReportDelay?: (busId: string, delayMinutes: number, reason: string) => Promise<void>;
  onUpdateStudentStatus?: (studentId: string, status: StudentPassenger['status'], boardedAtTime?: string) => Promise<void>;
}

export const DriverConsole: React.FC<DriverConsoleProps> = ({
  buses = [],
  routes = [],
  liveLocations = {},
  students = [],
  districts = [],
  selectedDistrict,
  onSelectDistrict,
  onUpdateLocation,
  onOpenFuelModal,
  onStartTrip,
  onEndTrip,
  onReportDelay,
  onUpdateStudentStatus
}) => {
  const safeBuses = Array.isArray(buses) ? buses : [];
  const safeRoutes = Array.isArray(routes) ? routes : [];
  const safeStudents = Array.isArray(students) ? students : [];

  const [selectedBusId, setSelectedBusId] = useState<string>(safeBuses[0]?.id || 'bus-04');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<StudentPassenger | null>(null);
  const [occupiedSeatNumbers, setOccupiedSeatNumbers] = useState<number[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string>('');
  useEffect(() => {
  if (!currentTripId) return;

  const loadOccupiedSeats = async () => {
    try {
      const assignments = await getSeatAssignmentsForTrip(currentTripId);

      setOccupiedSeatNumbers(
        assignments.map((assignment) => assignment.seatNumber)
      );
    } catch (error) {
      console.error('Failed to load occupied seats:', error);
    }
  };

  loadOccupiedSeats();
}, [currentTripId]);
  const [isDriving, setIsDriving] = useState<boolean>(true);
  const [gpsMode, setGpsMode] = useState<'simulated' | 'device'>('simulated');
  const [reportedDelay, setReportedDelay] = useState<number>(0);
  const [delayReason, setDelayReason] = useState<string>('');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [incidentReported, setIncidentReported] = useState<string | null>(null);
  const [isTripEndModalOpen, setIsTripEndModalOpen] = useState<boolean>(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState<boolean>(false);
  const [customDelayReason, setCustomDelayReason] = useState<string>('');
  const [extraUnlistedPassengers, setExtraUnlistedPassengers] = useState<number>(0);

  const selectedBus = safeBuses.find(b => b.id === selectedBusId) || safeBuses[0];
  const assignedRoute = safeRoutes.find(r => r.id === selectedBus?.assignedRouteId) || safeRoutes[0];

  // Filter students assigned to this bus and route
  const assignedStudents = safeStudents.filter(s => s.busId === selectedBus?.id || s.routeId === assignedRoute?.id);
  const registeredBoardedCount = assignedStudents.filter(s => s.status === 'boarded' || s.status === 'arrived-campus').length;
  
  // Real-time Total Seats, Occupied Seats & Vacant Seats calculation
  const totalSeats = selectedBus?.capacity || 52;
 const occupiedSeats = Math.min(
  totalSeats,
  Math.max(registeredBoardedCount, occupiedSeatNumbers.length) + extraUnlistedPassengers
);
  const vacantSeats = Math.max(0, totalSeats - occupiedSeats);
  const occupancyPercent = Math.min(100, Math.round((occupiedSeats / totalSeats) * 100));

  const currentLoc = liveLocations[selectedBusId] || {
    busId: selectedBusId,
    busNumber: selectedBus?.busNumber || 'Bus #04',
    lat: 8.7302,
    lng: 77.7280,
    speedKmph: 38,
    headingDeg: 35,
    timestamp: new Date().toISOString(),
    currentStopIndex: 1,
    nextStopName: "Vannarpettai Chellapandian Roundana",
    etaNextStopMin: 3,
    distanceToNextStopKm: 0.8,
    delayMinutes: 0,
    isOffRoute: false,
    offRouteDistanceMeters: 8,
    ignitionStatus: "ON",
    driverStatusMessage: "En route to designated stops"
  };

  const polylineIndexRef = useRef<number>(1);

  // Simulated GPS Movement along assigned route coordinates
  useEffect(() => {
    if (!isDriving || gpsMode !== 'simulated' || !assignedRoute || !assignedRoute.pathCoordinates.length) {
      return;
    }

    const interval = setInterval(() => {
      polylineIndexRef.current = (polylineIndexRef.current + 1) % assignedRoute.pathCoordinates.length;
      const nextCoord = assignedRoute.pathCoordinates[polylineIndexRef.current];
      
      const currentStopIdx = Math.min(
        Math.floor((polylineIndexRef.current / assignedRoute.pathCoordinates.length) * assignedRoute.stops.length),
        assignedRoute.stops.length - 1
      );
      const nextStop = assignedRoute.stops[Math.min(currentStopIdx + 1, assignedRoute.stops.length - 1)];

      const speed = Math.floor(34 + Math.sin(Date.now() / 3000) * 10);
      const heading = (polylineIndexRef.current * 45) % 360;

      const update: LiveLocation = {
        busId: selectedBus.id,
        busNumber: selectedBus.busNumber,
        routeId: assignedRoute.id,
        lat: nextCoord[0],
        lng: nextCoord[1],
        speedKmph: speed,
        headingDeg: heading,
        timestamp: new Date().toISOString(),
        currentStopIndex: currentStopIdx,
        nextStopName: nextStop ? nextStop.name : 'Central Campus Terminal Hub',
        etaNextStopMin: Math.max(1, Math.floor((assignedRoute.stops.length - currentStopIdx) * 3)),
        distanceToNextStopKm: Number((0.5 + (Math.random() * 0.4)).toFixed(1)),
        delayMinutes: reportedDelay,
        isOffRoute: false,
        offRouteDistanceMeters: 6,
        ignitionStatus: 'ON',
        driverStatusMessage: incidentReported ? `⚠️ ${incidentReported}` : `En route to ${nextStop ? nextStop.name : 'Campus'}`
      };

      onUpdateLocation(update);
    }, 3000 / speedMultiplier);

    return () => clearInterval(interval);
  }, [isDriving, gpsMode, assignedRoute, selectedBus, speedMultiplier, reportedDelay, incidentReported]);

  // Real Device Geolocation
  useEffect(() => {
    if (gpsMode !== 'device' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const update: LiveLocation = {
          busId: selectedBus.id,
          busNumber: selectedBus.busNumber,
          routeId: assignedRoute?.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speedKmph: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : (isDriving ? 32 : 0),
          headingDeg: pos.coords.heading || 0,
          timestamp: new Date().toISOString(),
          currentStopIndex: currentLoc.currentStopIndex || 0,
          nextStopName: currentLoc.nextStopName || 'En route',
          etaNextStopMin: currentLoc.etaNextStopMin || 3,
          distanceToNextStopKm: currentLoc.distanceToNextStopKm || 0.8,
          delayMinutes: reportedDelay,
          isOffRoute: false,
          offRouteDistanceMeters: 5,
          ignitionStatus: isDriving ? 'ON' : 'IDLE',
          driverStatusMessage: incidentReported || "Real device GPS broadcasting active"
        };
        onUpdateLocation(update);
      },
      err => {
        console.warn("Device GPS error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [gpsMode, isDriving, selectedBus, assignedRoute, reportedDelay, incidentReported]);

  // Start Trip Tracking
  const handleStartTripTracking = async () => {
    setIsDriving(true);
    polylineIndexRef.current = 0;
    setReportedDelay(0);
    setIncidentReported(null);
    const tripId = `${selectedBus.id}-${new Date().toISOString().slice(0, 10)}`;
    setCurrentTripId(tripId);

    if (onStartTrip) {
      await onStartTrip(selectedBus.id, assignedRoute.id);
    } else {
      await onUpdateLocation({
        ...currentLoc,
        ignitionStatus: 'ON',
        speedKmph: 35,
        delayMinutes: 0,
        driverStatusMessage: 'Trip started. Live GPS tracking active.'
      });
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  // Report Delay Handler
  const handleReportDelay = async (mins: number, reason: string) => {
    setReportedDelay(mins);
    setIncidentReported(reason);
    setIsDelayModalOpen(false);

    if (onReportDelay) {
      await onReportDelay(selectedBus.id, mins, reason);
    } else {
      await onUpdateLocation({
        ...currentLoc,
        delayMinutes: mins,
        driverStatusMessage: `⚠️ ${reason} (+${mins}m delay broadcasted)`
      });
    }
  };

  // Student Boarding check-in
  const handleToggleStudentBoarding = async (student: StudentPassenger) => {
    if (!onUpdateStudentStatus) return;
    const newStatus = student.status === 'boarded' ? 'waiting-at-stop' : 'boarded';
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await onUpdateStudentStatus(student.id, newStatus, newStatus === 'boarded' ? timeNow : undefined);
  };

  // Mark all students at current stop as boarded
  const handleMarkAllAtStop = async (stopId: string) => {
    if (!onUpdateStudentStatus) return;
    const studentsAtStop = assignedStudents.filter(s => s.stopId === stopId && s.status === 'waiting-at-stop');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    for (const student of studentsAtStop) {
      await onUpdateStudentStatus(student.id, 'boarded', timeNow);
    }
  };
 const handleQRScan = async (studentId: string) => {
  const student = safeStudents.find(s => s.id === studentId);

  if (!student) {
    alert('Student not found');
    return;
  }

  if (student.busId !== selectedBusId) {
    alert('This student is not assigned to this bus');
    return;
  }

  if (student.status === 'boarded') {
    alert(`${student.name} is already boarded`);
    return;
  }

  setScannedStudent(student);
  setShowQRScanner(false);
};

  return (
  <div className="space-y-6 animate-fadeIn pb-12">

    {showQRScanner && (
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Scan Student QR Code
          </h2>

          <button
            onClick={() => setShowQRScanner(false)}
            className="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-medium"
          >
            Close
          </button>
        </div>

        <QRScanner onScan={handleQRScan} />
      </div>
    )}
    {scannedStudent && (
  <SeatSelector
    totalSeats={totalSeats}
    occupiedSeats={occupiedSeatNumbers}
    onConfirm={async (seatNumber) => {
  if (!currentTripId) {
    alert('Please start the trip before assigning a seat.');
    return;
  }

  const now = new Date().toISOString();

  try {
    await saveSeatAssignment({
      id: `${currentTripId}-${seatNumber}`,
      busId: selectedBusId,
      tripId: currentTripId,
      seatNumber,
      studentId: scannedStudent.id,
      studentName: scannedStudent.name,
      rollNumber: scannedStudent.rollNumber,
      assignedAt: now,
    });

    await saveAttendanceRecord({
      id: `${currentTripId}-${scannedStudent.id}`,
      studentId: scannedStudent.id,
      studentName: scannedStudent.name,
      rollNumber: scannedStudent.rollNumber,
      busId: selectedBusId,
      tripId: currentTripId,
      date: new Date().toISOString().slice(0, 10),
      scanTime: now,
      seatNumber,
      status: 'present',
    });

    setOccupiedSeatNumbers((prev) => [...prev, seatNumber]);

    if (onUpdateStudentStatus) {
      await onUpdateStudentStatus(
        scannedStudent.id,
        'boarded',
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }

    alert(`Seat ${seatNumber} assigned to ${scannedStudent.name}`);

    setScannedStudent(null);
  } catch (error) {
    console.error('Failed to save seat and attendance:', error);
    alert('Failed to save seat assignment. Please try again.');
  }
}}

  />
)}

    {/* Driver Active Trip Controller Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-lg ${
            isDriving ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30' : 'bg-slate-800 text-slate-400'
          }`}>
            <Radio className={`w-6 h-6 ${isDriving ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-lg text-slate-100 font-display">
                Driver Telemetry & Live Tracking Hub
              </h2>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                isDriving
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isDriving ? '● LIVE TRACKING ACTIVE' : 'TRIP STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Assigned Driver: <strong className="text-slate-200">{selectedBus?.driverName}</strong> • Bus: <span className="font-mono text-amber-300 font-bold">{selectedBus?.busNumber}</span> ({selectedBus?.plateNumber})
            </p>
          </div>
        </div>

        {/* Action Buttons: Start Trip / Stop Tracking / Select Bus */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedBusId}
            onChange={e => setSelectedBusId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            {buses.map(b => (
              <option key={b.id} value={b.id}>
                {b.busNumber} ({b.driverName})
              </option>
            ))}
          </select>

          {!isDriving ? (
            <button
              onClick={handleStartTripTracking}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-lg hover:shadow-emerald-600/30 flex items-center gap-2 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Live Tracking</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDriving(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
              <button
                onClick={() => setIsTripEndModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-lg hover:shadow-rose-600/30 flex items-center gap-1.5 transition"
              >
                <Flag className="w-4 h-4" />
                <span>End Trip & Stop Tracking</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left (Gauges, Delays, Fuel & Student Boarding List) | Right (Live Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Real-time Telemetry & Speedometer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-amber-400" /> Live Telemetry Feed
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setGpsMode('simulated')}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    gpsMode === 'simulated' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Simulation
                </button>
                <button
                  onClick={() => setGpsMode('device')}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    gpsMode === 'device' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Device GPS
                </button>
              </div>
            </div>

            {/* Speed Gauge */}
            <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 text-center relative overflow-hidden">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl font-black text-amber-400 font-display tracking-tight">
                  {isDriving ? currentLoc.speedKmph : 0}
                </span>
                <span className="text-lg font-bold text-slate-400 font-mono">KM/H</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                <span>Heading: <strong>{currentLoc.headingDeg}° NNE</strong></span>
                <span>•</span>
                <span>Ignition: <strong className={isDriving ? "text-emerald-400" : "text-slate-400"}>{isDriving ? "ACTIVE" : "STANDBY"}</strong></span>
                <span>•</span>
                <span>Odo: <strong className="text-slate-200">{selectedBus?.currentOdometer} km</strong></span>
              </div>
            </div>

            {/* Next Stop Target */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Next Approaching Stop:</span>
                <span className="font-mono font-bold text-emerald-400">ETA ~{currentLoc.etaNextStopMin} MINS</span>
              </div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{currentLoc.nextStopName}</span>
              </h4>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Distance: <strong className="text-slate-200">{currentLoc.distanceToNextStopKm} km</strong></span>
                {reportedDelay > 0 && (
                  <span className="text-rose-400 font-bold font-mono">+{reportedDelay}m delay active</span>
                )}
              </div>
            </div>

            {/* Core Driver Actions: Fuel Refill & Report Delay */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => onOpenFuelModal(selectedBus.id)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Fuel className="w-4 h-4" />
                <span>Log Fuel Refill</span>
              </button>

              <button
                onClick={() => setIsDelayModalOpen(true)}
                className="bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 border border-rose-800/80 p-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Report Delay ({reportedDelay > 0 ? `+${reportedDelay}m` : 'Traffic'})</span>
              </button>
            </div>

            {incidentReported && (
              <div className="bg-rose-950/80 border border-rose-700 text-rose-200 p-3 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span><strong>Delay Broadcast:</strong> {incidentReported} (+{reportedDelay} mins)</span>
                </div>
                <button
                  onClick={() => handleReportDelay(0, 'Normal traffic resumed')}
                  className="text-rose-300 hover:text-white underline text-[11px] ml-2"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Seat Capacity, Boarded Occupancy & Number of Seats Vacant Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Armchair className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100 font-display">
                    Bus Seat Capacity & Vacancy Live Status
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time passenger count vs total seating capacity
                  </p>
                </div>
              </div>

              <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                vacantSeats > 10
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : vacantSeats > 0
                  ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                  : 'bg-rose-950/80 text-rose-300 border-rose-700 animate-pulse'
              }`}>
                {vacantSeats > 10 ? 'SEATS AVAILABLE' : vacantSeats > 0 ? 'NEAR CAPACITY' : 'FULL OCCUPANCY'}
              </span>
            </div>

            {/* 3 Core Seat KPI Metric Badges */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Total Seats */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  Total Seats
                </span>
                <span className="text-2xl font-black text-slate-100 font-display mt-0.5 block">
                  {totalSeats}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Max Capacity</span>
              </div>

              {/* Occupied / Boarded Seats */}
              <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 block">
                  Occupied
                </span>
                <span className="text-2xl font-black text-cyan-300 font-display mt-0.5 block">
                  {occupiedSeats}
                </span>
                <span className="text-[10px] text-cyan-400/70 font-mono">{occupancyPercent}% Loaded</span>
              </div>

              {/* Number of Seats Vacant */}
              <div className={`border rounded-xl p-3 text-center ${
                vacantSeats > 0 
                  ? 'bg-emerald-950/40 border-emerald-700/60' 
                  : 'bg-rose-950/40 border-rose-700/60'
              }`}>
                <span className={`text-[10px] uppercase tracking-wider font-extrabold block ${
                  vacantSeats > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  Seats Vacant
                </span>
                <span className={`text-2xl font-black font-display mt-0.5 block ${
                  vacantSeats > 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {vacantSeats}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {vacantSeats > 0 ? 'Empty Seats' : '0 Vacant'}
                </span>
              </div>
            </div>

            {/* Visual Occupancy Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Passenger Load Distribution:</span>
                <span className="font-mono font-bold text-slate-200">
                  {occupiedSeats} / {totalSeats} Seats Occupied ({vacantSeats} Vacant)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5 flex">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    occupancyPercent > 90
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : occupancyPercent > 65
                      ? 'bg-gradient-to-r from-cyan-500 to-amber-400'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                  }`}
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Unlisted Passenger / Staff Tally Override */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Unlisted / Staff Hop-on Tally:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExtraUnlistedPassengers(Math.max(0, extraUnlistedPassengers - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold transition disabled:opacity-50"
                  disabled={extraUnlistedPassengers <= 0}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-amber-300 px-1.5 min-w-[20px] text-center">
                  +{extraUnlistedPassengers}
                </span>
                <button
                  onClick={() => setExtraUnlistedPassengers(Math.min(totalSeats - registeredBoardedCount, extraUnlistedPassengers + 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold transition disabled:opacity-50"
                  disabled={vacantSeats <= 0}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Student Passenger Boarding Roster */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="font-extrabold text-sm text-slate-200 font-display">Student Boarding Check-in</h3>
              </div>
              <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-0.5 rounded-full">
                {registeredBoardedCount} / {assignedStudents.length} Boarded
              </span>
              <button
  onClick={() => setShowQRScanner(true)}
  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
>
  📷 Scan QR
</button>
            </div>

            <p className="text-[11px] text-slate-400">
              Tap student to mark boarded. Parents receive instant notification upon boarding.
            </p>

            {/* List of stops with registered students */}
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {assignedRoute.stops.map((stop, sIdx) => {
                const stopStudents = assignedStudents.filter(s => s.stopId === stop.id);
                const allBoardedAtStop = stopStudents.length > 0 && stopStudents.every(s => s.status === 'boarded');

                return (
                  <div key={stop.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-amber-400">
                          {sIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
                          {stop.name}
                        </span>
                      </div>
                      {stopStudents.length > 0 && !allBoardedAtStop && (
                        <button
                          onClick={() => handleMarkAllAtStop(stop.id)}
                          className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 transition"
                        >
                          Check All
                        </button>
                      )}
                    </div>

                    {stopStudents.length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic pl-7">No registered students at this stop.</div>
                    ) : (
                      <div className="space-y-1.5 pl-7">
                        {stopStudents.map(student => {
                          const isBoarded = student.status === 'boarded' || student.status === 'arrived-campus';

                          return (
                            <div
                              key={student.id}
                              className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800"
                            >
                              <div>
                                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                  <span>{student.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400">({student.rollNumber})</span>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Parent: {student.parentName} ({student.parentPhone})
                                </div>
                              </div>

                              <button
                                onClick={() => handleToggleStudentBoarding(student)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 transition ${
                                  isBoarded
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-cyan-900/40 hover:text-cyan-300'
                                }`}
                              >
                                {isBoarded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Boarded</span>
                                  </>
                                ) : (
                                  <span>+ Board</span>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Live Route Map */}
        <div className="lg:col-span-7 h-[620px] flex flex-col space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-200 font-display">Assigned Transit Route</h3>
              <span className="text-[11px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded-lg border border-slate-700 font-mono font-bold">
                {assignedRoute?.code}: {assignedRoute?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Simulation:</span>
              <button
                onClick={() => setSpeedMultiplier(prev => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
                className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-mono text-xs font-bold px-2.5 py-1 rounded-lg"
              >
                {speedMultiplier}x Speed
              </button>
            </div>
          </div>

          <div className="flex-1 h-full min-h-[540px]">
            <LeafletBusMap
              buses={buses}
              routes={routes}
              liveLocations={liveLocations}
              selectedBusId={selectedBus.id}
              selectedRouteId={assignedRoute?.id}
              districtCenter={selectedDistrict?.center}
              districtZoom={selectedDistrict?.zoom}
              campusLocation={selectedDistrict?.campusLocation}
              showAllRoutes={false}
              className="w-full h-full min-h-[540px]"
            />
          </div>
        </div>
      </div>

      {/* Quick Delay Reporting Modal */}
      {isDelayModalOpen && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Broadcast Trip Delay</span>
              </h3>
              <button
                onClick={() => setIsDelayModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select estimated delay and reason. This immediately revises ETA for all parents & students.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Delay Duration (Minutes):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 25].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setReportedDelay(mins)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      reportedDelay === mins
                        ? 'bg-rose-600 text-white border-rose-500 shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    +{mins} mins
                  </button>
                ))}
              </div>

              <label className="block text-xs font-bold text-slate-300 pt-2">
                Quick Reason Presets:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Heavy Traffic at Junction',
                  'Railway Crossing Gate Closed',
                  'Heavy Rain & Waterlogging',
                  'Vehicle Technical Check'
                ].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomDelayReason(preset)}
                    className="p-2 text-[11px] text-left bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition"
                  >
                    • {preset}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={customDelayReason}
                onChange={e => setCustomDelayReason(e.target.value)}
                placeholder="Or type custom reason here..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDelayModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReportDelay(reportedDelay || 5, customDelayReason || 'Traffic delay')}
                className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg"
              >
                Broadcast to Parents
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End of Trip Modal with Fuel Refilling & Delay Audit */}
      {isTripEndModalOpen && (
        <TripEndModal
          isOpen={isTripEndModalOpen}
          onClose={() => setIsTripEndModalOpen(false)}
          bus={selectedBus}
          route={assignedRoute}
          currentDelay={reportedDelay}
          incidentReason={incidentReported}
          boardedStudentCount={registeredBoardedCount}
          onSubmit={async (report) => {
            if (onEndTrip) {
              await onEndTrip(report);
            }
            setIsDriving(false);
          }}
        />
      )}
    </div>
  );
};
