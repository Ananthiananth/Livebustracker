import React, { useState, useEffect } from 'react';
import { Bus, Route, Stop, LiveLocation, DistrictConfig, StudentPassenger, UserAccount } from '../types';
import { LeafletBusMap } from './LeafletBusMap';
import {
  MapPin,
  Clock,
  Navigation,
  Phone,
  ShieldCheck,
  BellRing,
  AlertCircle,
  Bus as BusIcon,
  CheckCircle2,
  Users,
  Volume2,
  VolumeX,
  Sparkles,
  Share2,
  Compass,
  Building2,
  Info,
  UserCheck,
  GraduationCap,
  MessageSquare,
  AlertTriangle,
  Radio,
  Timer,
  Gauge,
  Copy,
  Check
} from 'lucide-react';

interface StudentParentViewProps {
  currentUser?: UserAccount | null;
  buses: Bus[];
  routes: Route[];
  liveLocations: Record<string, LiveLocation>;
  students?: StudentPassenger[];
  onSelectBus: (busId: string) => void;
  districts: DistrictConfig[];
  selectedDistrict: DistrictConfig;
  onSelectDistrict: (districtId: string) => void;
}

export const StudentParentView: React.FC<StudentParentViewProps> = ({
  currentUser,
  buses = [],
  routes = [],
  liveLocations = {},
  students = [],
  onSelectBus,
  districts = [],
  selectedDistrict,
  onSelectDistrict
}) => {
  const safeBuses = Array.isArray(buses) ? buses : [];
  const safeRoutes = Array.isArray(routes) ? routes : [];
  const safeStudents = Array.isArray(students) ? students : [];

  const [activeTab, setActiveTab] = useState<'bus-tracker' | 'child-tracker'>('child-tracker');
  
  // Find initial student matching currentUser if available
  const initialStudent = currentUser?.studentId 
    ? safeStudents.find(s => s.id === currentUser.studentId)
    : currentUser?.rollNumber 
      ? safeStudents.find(s => s.rollNumber.toLowerCase() === currentUser.rollNumber?.toLowerCase())
      : safeStudents[0];

  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent?.id || safeStudents[0]?.id || 'stu-01');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(safeRoutes[0]?.id || 'route-01');
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [proximityAlertEnabled, setProximityAlertEnabled] = useState<boolean>(true);
  const [proximityAlertTriggered, setProximityAlertTriggered] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [copiedShareMessage, setCopiedShareMessage] = useState<boolean>(false);

  // Auto-sync student ID if currentUser changes
  useEffect(() => {
    if (currentUser?.studentId) {
      setSelectedStudentId(currentUser.studentId);
    } else if (currentUser?.rollNumber) {
      const found = safeStudents.find(s => s.rollNumber.toLowerCase() === currentUser.rollNumber?.toLowerCase());
      if (found) setSelectedStudentId(found.id);
    }
  }, [currentUser, safeStudents]);

  // Find active student
  const selectedStudent = safeStudents.find(s => s.id === selectedStudentId) || safeStudents[0];

  // Sync route and stop when student or district changes
  useEffect(() => {
    if (selectedStudent && activeTab === 'child-tracker') {
      if (selectedStudent.routeId) setSelectedRouteId(selectedStudent.routeId);
      if (selectedStudent.stopId) setSelectedStopId(selectedStudent.stopId);
    } else if (safeRoutes.length > 0) {
      const currentRouteExists = safeRoutes.some(r => r.id === selectedRouteId);
      const targetRoute = currentRouteExists ? safeRoutes.find(r => r.id === selectedRouteId)! : safeRoutes[0];
      setSelectedRouteId(targetRoute.id);

      if (targetRoute?.stops?.length > 0 && !selectedStopId) {
        const defaultStop = targetRoute.stops[Math.min(1, targetRoute.stops.length - 1)];
        setSelectedStopId(defaultStop.id);
      }
    }
  }, [selectedStudentId, activeTab, safeRoutes, selectedDistrict?.id]);

  const selectedRoute = safeRoutes.find(r => r.id === selectedRouteId) || safeRoutes[0];
  const assignedBus = safeBuses.find(b => b.id === selectedRoute?.assignedBusId) || safeBuses.find(b => b.assignedRouteId === selectedRoute?.id) || safeBuses[0];
  const busLocation = assignedBus ? liveLocations[assignedBus.id] : undefined;
  const myStop = selectedRoute?.stops?.find(s => s.id === selectedStopId) || selectedRoute?.stops?.[0];

  // Helper to format clock arrival time
  const formatClockTime = (minutesFromNow: number) => {
    const now = new Date();
    const target = new Date(now.getTime() + minutesFromNow * 60000);
    return target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Play proximity chime when sound is enabled
  const playArrivalChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Ignore audio restrictions
    }
  };

  // Calculate dynamic ETA to user's selected stop
  const calculateEtaToMyStop = () => {
    if (!busLocation || !myStop || !selectedRoute || !selectedRoute.stops) {
      return { etaMin: 5, distKm: 1.2, isPassed: false, clockTime: formatClockTime(5) };
    }

    const myStopIndex = selectedRoute.stops.findIndex(s => s.id === myStop.id);
    const currentStopIndex = busLocation.currentStopIndex;

    if (myStopIndex < 0) {
      return { etaMin: 5, distKm: 1.2, isPassed: false, clockTime: formatClockTime(5) };
    }

    if (myStopIndex < currentStopIndex) {
      return { etaMin: 0, distKm: 0, isPassed: true, clockTime: formatClockTime(0) };
    }

    if (myStopIndex === currentStopIndex) {
      const min = Math.max(1, busLocation.etaNextStopMin);
      return {
        etaMin: min,
        distKm: busLocation.distanceToNextStopKm || 0.8,
        isPassed: false,
        clockTime: formatClockTime(min)
      };
    }

    const remainingStops = myStopIndex - currentStopIndex;
    const additionalMin = remainingStops * 5;
    const additionalKm = Number((remainingStops * 2.8).toFixed(1));
    const totalMin = busLocation.etaNextStopMin + additionalMin;

    return {
      etaMin: totalMin,
      distKm: Number((busLocation.distanceToNextStopKm + additionalKm).toFixed(1)),
      isPassed: false,
      clockTime: formatClockTime(totalMin)
    };
  };

  const etaInfo = calculateEtaToMyStop();

  // Calculate ETA to campus terminal (final destination)
  const calculateEtaToCampus = () => {
    if (!busLocation || !selectedRoute || !selectedRoute.stops) {
      return { etaMin: 18, distKm: 6.4, clockTime: formatClockTime(18) };
    }
    const totalStops = selectedRoute.stops.length;
    const currentStopIndex = busLocation.currentStopIndex;
    const remainingStops = Math.max(1, totalStops - currentStopIndex);
    const etaMin = busLocation.etaNextStopMin + (remainingStops - 1) * 5;
    const distKm = Number((busLocation.distanceToNextStopKm + (remainingStops - 1) * 2.5).toFixed(1));
    return { etaMin, distKm, clockTime: formatClockTime(etaMin) };
  };

  const campusEta = calculateEtaToCampus();

  // Dynamic ETA for each stop along the route
  const getStopEta = (stopIndex: number) => {
    if (!busLocation) return null;
    const currentStopIndex = busLocation.currentStopIndex;
    if (stopIndex < currentStopIndex) {
      return { status: 'passed' as const, text: 'Departed' };
    }
    if (stopIndex === currentStopIndex) {
      return {
        status: 'arriving' as const,
        text: `~${busLocation.etaNextStopMin} min`,
        clockTime: formatClockTime(busLocation.etaNextStopMin)
      };
    }
    const diff = stopIndex - currentStopIndex;
    const minutes = busLocation.etaNextStopMin + diff * 5;
    return {
      status: 'upcoming' as const,
      text: `~${minutes} min`,
      clockTime: formatClockTime(minutes)
    };
  };

  // Trigger Proximity notification if bus is close (< 1.2 km or < 4 min)
  useEffect(() => {
    if (proximityAlertEnabled && !etaInfo.isPassed && etaInfo.distKm <= 1.2 && etaInfo.etaMin <= 4) {
      if (!proximityAlertTriggered && soundEnabled) {
        playArrivalChime();
      }
      setProximityAlertTriggered(true);
    } else {
      setProximityAlertTriggered(false);
    }
  }, [etaInfo.distKm, etaInfo.etaMin, etaInfo.isPassed, proximityAlertEnabled, proximityAlertTriggered, soundEnabled]);

  // Copy / Share ETA with Parent or Student
  const handleShareEta = () => {
    const isParentView = activeTab === 'child-tracker';
    const contextTitle = isParentView ? 'Student Transit Update for Parent' : 'Bus Transit Arrival Update';
    const targetDesc = isParentView && selectedStudent.status === 'boarded'
      ? `College Main Campus (ETA: ~${campusEta.etaMin} mins at ${campusEta.clockTime})`
      : `${myStop?.name || 'Assigned Stop'} (ETA: ~${etaInfo.etaMin} mins at ${etaInfo.clockTime})`;

    const text = `🚌 ${contextTitle} • ${selectedDistrict.name}\n` +
      `• Bus: ${assignedBus?.busNumber || 'Fleet Bus'} (${assignedBus?.plateNumber || ''})\n` +
      `• Target Destination: ${targetDesc}\n` +
      `• Distance Remaining: ~${etaInfo.distKm} km\n` +
      `• Driver: ${assignedBus?.driverName || 'Driver'} (${assignedBus?.driverPhone || ''})\n` +
      `• Current Speed: ${busLocation?.speedKmph || 35} km/h\n` +
      (selectedStudent ? `• Student: ${selectedStudent.name} (${selectedStudent.rollNumber})\n` : '') +
      `Track Live in Real-Time: ${window.location.origin}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShareMessage(true);
      setTimeout(() => setCopiedShareMessage(false), 3500);
    }
  };

  // Student Map Marker data
  const studentMapLocation = selectedStudent && myStop ? {
    lat: selectedStudent.status === 'boarded' && busLocation ? busLocation.lat : myStop.lat,
    lng: selectedStudent.status === 'boarded' && busLocation ? busLocation.lng : myStop.lng,
    name: selectedStudent.name,
    rollNumber: selectedStudent.rollNumber,
    stopName: myStop.name,
    status: selectedStudent.status,
    avatar: selectedStudent.avatar
  } : null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* District Location Banner & Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-100 font-display">
                {selectedDistrict.name} Transit Region
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {selectedDistrict.code}
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                • {selectedDistrict.tagline}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{selectedDistrict.campusName}</span>
            </p>
          </div>
        </div>

        {/* Quick District Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 w-full sm:w-auto">
            District:
          </span>
          {districts.map(d => {
            const isSelected = d.id === selectedDistrict.id;
            return (
              <button
                key={d.id}
                onClick={() => onSelectDistrict(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                }`}
              >
                <span>{d.name}</span>
                {d.id === 'tirunelveli' && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-black ${isSelected ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    Default
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Official Student / Parent Access Authority Banner with Tag */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 flex items-center justify-center font-black shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {/* User Requested Tag */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  Student / Parent Access
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Verified Admin Fleet Roster
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Authorized Student: <strong className="text-white font-bold">{selectedStudent.name}</strong>
                </span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-cyan-300 font-bold">
                  Roll No: {selectedStudent.rollNumber}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">
                  Assigned: <strong className="text-amber-400 font-bold">{assignedBus?.busNumber || 'Bus #04'}</strong> ({assignedBus?.plateNumber || ''})
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  Stop: <strong className="text-slate-200">{selectedStudent.stopName}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 shrink-0">
            <Users className="w-4 h-4 text-cyan-400" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block leading-tight">Guardian / Parent Contact</span>
              <span className="text-xs font-bold text-slate-200 block">
                {selectedStudent.parentName} ({selectedStudent.parentPhone})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher: Parent Portal (Child Location) vs General Route Tracker */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-2xl gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('child-tracker')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex-1 sm:flex-initial ${
              activeTab === 'child-tracker'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Parent Portal (Child ETA & Boarding)</span>
          </button>

          <button
            onClick={() => setActiveTab('bus-tracker')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex-1 sm:flex-initial ${
              activeTab === 'bus-tracker'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BusIcon className="w-4 h-4" />
            <span>Student View (Stop & Route ETA)</span>
          </button>
        </div>

        {/* Action Controls: Sound Chime & Proximity Alerts Toggle */}
        <div className="flex items-center justify-end gap-2 pr-1">
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playArrivalChime();
            }}
            title="Toggle audio alert chime on bus approach"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{soundEnabled ? 'Chime: ON' : 'Chime: OFF'}</span>
          </button>

          <button
            onClick={() => setProximityAlertEnabled(!proximityAlertEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              proximityAlertEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>{proximityAlertEnabled ? 'Live Alerts: ON' : 'Alerts: OFF'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 HERO COCKPIT: ESTIMATED TIME OF ARRIVAL (SEEN BY STUDENT & PARENT)      */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle accent backdrop blur */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-blue-500" />

        {/* Cockpit Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
                REAL-TIME ESTIMATED TIME OF ARRIVAL (ETA)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                {activeTab === 'child-tracker' ? 'Parent Guardian Live Feed' : 'Student Transit Passenger View'}
              </span>
            </div>
          </div>

          {/* Share ETA Button & Copied Notification */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareEta}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-amber-400/60 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
              title="Copy formatted ETA update to send to parent or student"
            >
              {copiedShareMessage ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">ETA Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share ETA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary ETA Telemetry Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-5 relative z-10">
          {/* Main Giant Countdown Display (5 Cols) */}
          <div className="md:col-span-5 bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  {activeTab === 'child-tracker' && selectedStudent.status === 'boarded'
                    ? 'ETA to Campus Terminal (Drop-off)'
                    : `ETA to Stop: ${myStop?.name || 'Selected Stop'}`}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  Live GPS
                </span>
              </div>

              {/* Status Conditional Display */}
              {activeTab === 'child-tracker' && selectedStudent.status === 'arrived-campus' ? (
                <div className="py-5 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2 font-black">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="text-2xl font-black text-slate-100 font-display">
                    Safely Arrived at Campus
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Student has been dropped off at the College Main Campus Gate.
                  </p>
                </div>
              ) : etaInfo.isPassed && activeTab !== 'child-tracker' ? (
                <div className="py-5 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="text-xl font-bold text-slate-200">
                    Bus Has Departed Your Stop
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    En-route to remaining stops and final College Campus Terminal.
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-black text-amber-400 font-display tracking-tight drop-shadow-sm">
                      ~{activeTab === 'child-tracker' && selectedStudent.status === 'boarded' ? campusEta.etaMin : etaInfo.etaMin}
                    </span>
                    <span className="text-2xl font-extrabold text-slate-200 font-display">
                      MINUTES
                    </span>
                  </div>

                  {/* Estimated Clock Arrival */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Expected Clock Arrival:{' '}
                      <strong className="text-amber-300 font-mono text-sm">
                        {activeTab === 'child-tracker' && selectedStudent.status === 'boarded'
                          ? campusEta.clockTime
                          : etaInfo.clockTime}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Context message based on student status */}
            <div className="pt-3 mt-2 border-t border-slate-800/80 text-xs">
              {activeTab === 'child-tracker' ? (
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-300">
                    Student: <strong className="text-slate-100">{selectedStudent.name}</strong> ({selectedStudent.rollNumber})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-slate-300">
                    Pickup Stop: <strong className="text-slate-100">{myStop?.name}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Telemetry Metrics & Trip Progression (7 Cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            {/* 4 Micro Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Distance Remaining */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Navigation className="w-3 h-3 text-cyan-400" />
                  <span>Distance</span>
                </div>
                <div className="text-lg font-black text-slate-100 font-mono mt-1">
                  {activeTab === 'child-tracker' && selectedStudent.status === 'boarded'
                    ? `${campusEta.distKm} km`
                    : `${etaInfo.distKm} km`}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  To {activeTab === 'child-tracker' && selectedStudent.status === 'boarded' ? 'Campus' : 'Your Stop'}
                </div>
              </div>

              {/* Current Speed */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  <span>Live Speed</span>
                </div>
                <div className="text-lg font-black text-slate-100 font-mono mt-1">
                  {busLocation?.speedKmph || 35} <span className="text-xs text-slate-400 font-normal">km/h</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-medium truncate">
                  GPS Transit Link
                </div>
              </div>

              {/* Traffic & Delay Factor */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Timer className="w-3 h-3 text-emerald-400" />
                  <span>Traffic Status</span>
                </div>
                <div className="text-sm font-black text-slate-100 mt-1 truncate">
                  {busLocation?.delayMinutes && busLocation.delayMinutes > 0 ? (
                    <span className="text-rose-400">+{busLocation.delayMinutes} min delay</span>
                  ) : (
                    <span className="text-emerald-400">On Schedule</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {busLocation?.delayMinutes ? 'Moderate Traffic' : 'Normal Flow'}
                </div>
              </div>

              {/* Assigned Bus & Driver */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <BusIcon className="w-3 h-3 text-amber-400" />
                  <span>Bus Fleet</span>
                </div>
                <div className="text-sm font-black text-slate-100 mt-1 truncate">
                  {assignedBus?.busNumber || 'Bus #04'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {assignedBus?.driverName?.split(' ')[0] || 'Driver'}
                </div>
              </div>
            </div>

            {/* Visual Route Progression Bar */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-200">Route Progression:</span>
                  <span className="text-amber-400 font-mono font-semibold">
                    Stop {(busLocation?.currentStopIndex || 0) + 1} of {selectedRoute?.stops?.length || 5}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Current: <strong className="text-slate-200">{selectedRoute?.stops[busLocation?.currentStopIndex || 0]?.name || 'En route'}</strong>
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                <div
                  className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        10,
                        (((busLocation?.currentStopIndex || 0) + 0.6) / Math.max(1, selectedRoute?.stops?.length || 5)) * 100
                      )
                    )}%`
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Start: {selectedRoute?.stops[0]?.name || 'Depot'}</span>
                <span className="text-emerald-400 font-medium">Destination: College Campus Gate</span>
              </div>
            </div>

            {/* Quick Driver Contact Strip */}
            <div className="flex flex-wrap items-center justify-between bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-xs gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-amber-400">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-slate-400">Driver Contact: </span>
                  <span className="font-bold text-slate-200">{assignedBus?.driverName}</span>
                  <span className="font-mono text-slate-400 ml-1.5 hidden sm:inline">({assignedBus?.driverPhone})</span>
                </div>
              </div>
              <a
                href={`tel:${assignedBus?.driverPhone}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition"
              >
                <Phone className="w-3 h-3" />
                <span>Call Driver</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Proximity Urgent Banner when Bus is Near (< 1.2 km or < 4 min) */}
      {proximityAlertTriggered && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black">
              <BusIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                🔔 BUS IS ARRIVING SHORTLY AT {myStop?.name.toUpperCase()}!
              </h3>
              <p className="text-xs font-bold text-slate-900">
                {assignedBus?.busNumber} is just {etaInfo.distKm} km away (~{etaInfo.etaMin} minutes, arriving at {etaInfo.clockTime}). Please proceed to the bus shelter now.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block bg-slate-950 text-amber-400 font-mono font-bold text-xs px-3 py-1.5 rounded-xl border border-amber-300">
            ETA: ~{etaInfo.etaMin} MINS ({etaInfo.clockTime})
          </span>
        </div>
      )}

      {/* Driver Delay Notification Banner if delay broadcasted */}
      {busLocation && busLocation.delayMinutes > 0 && (
        <div className="bg-rose-950/80 border border-rose-700/90 text-rose-200 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-900/60 flex items-center justify-center font-bold text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-rose-300">
                Driver Delay Broadcast ({busLocation.busNumber})
              </h4>
              <p className="text-xs text-rose-100 font-medium mt-0.5">
                {busLocation.driverStatusMessage || `Estimated delay of +${busLocation.delayMinutes} minutes due to traffic.`}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold font-mono px-3 py-1 rounded-xl bg-rose-900 text-rose-200 border border-rose-600">
            +{busLocation.delayMinutes} MINS
          </span>
        </div>
      )}

      {/* Main Grid: Left Status Cards & Right Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {activeTab === 'child-tracker' ? (
            /* PARENT CHILD TRACKING CARD */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
              {/* Select Student / Child */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Enrolled Student / Child
                </label>
                <select
                  value={selectedStudentId}
                  onChange={e => {
                    setSelectedStudentId(e.target.value);
                    const stu = students.find(s => s.id === e.target.value);
                    if (stu) {
                      setSelectedRouteId(stu.routeId);
                      setSelectedStopId(stu.stopId);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rollNumber}) • {s.busNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Profile & Live Status Header */}
              {selectedStudent && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full border-2 border-amber-400 overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-amber-300 shrink-0">
                      {selectedStudent.avatar ? (
                        <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{selectedStudent.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-base text-slate-100 truncate">
                          {selectedStudent.name}
                        </h3>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {selectedStudent.rollNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {selectedStudent.department} • Year {selectedStudent.year}
                      </p>
                    </div>
                  </div>

                  {/* 3-Stage Progress Timeline with Real-Time ETA */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Live Transit Journey Status
                    </div>

                    <div className="space-y-2.5">
                      {/* Stage 1: Waiting */}
                      <div className={`flex items-start gap-3 p-2.5 rounded-xl border transition ${
                        selectedStudent.status === 'waiting-at-stop'
                          ? 'bg-blue-950/40 border-blue-700/60'
                          : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                          selectedStudent.status === 'waiting-at-stop'
                            ? 'bg-blue-500 text-slate-950 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          1
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="font-bold text-slate-200 flex items-center justify-between">
                            <span>Waiting at Pickup Stop</span>
                            <span className="text-amber-400 font-mono font-bold">
                              ETA ~{etaInfo.etaMin} mins ({etaInfo.clockTime})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {selectedStudent.stopName} • Distance ~{etaInfo.distKm} km
                          </div>
                        </div>
                      </div>

                      {/* Stage 2: Boarded */}
                      <div className={`flex items-start gap-3 p-2.5 rounded-xl border transition ${
                        selectedStudent.status === 'boarded'
                          ? 'bg-amber-950/40 border-amber-700/60'
                          : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                          selectedStudent.status === 'boarded'
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          2
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="font-bold text-slate-200 flex items-center justify-between">
                            <span>✓ Boarded on Bus ({selectedStudent.busNumber})</span>
                            <span className="text-emerald-400 font-mono font-bold">
                              Campus ETA ~{campusEta.etaMin} mins ({campusEta.clockTime})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {selectedStudent.boardedAtTime ? `Boarded at ${selectedStudent.boardedAtTime}` : 'In transit with driver'} • Live Speed: {busLocation?.speedKmph || 35} km/h
                          </div>
                        </div>
                      </div>

                      {/* Stage 3: Arrived */}
                      <div className={`flex items-start gap-3 p-2.5 rounded-xl border transition ${
                        selectedStudent.status === 'arrived-campus'
                          ? 'bg-emerald-950/40 border-emerald-700/60'
                          : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                          selectedStudent.status === 'arrived-campus'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          3
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="font-bold text-slate-200">
                            🎓 Safely Dropped at Campus
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Central College Terminal • Campus Main Gate
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* GENERAL BUS TRACKER & ETA CARD */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
              {/* Route & Stop Dropdowns */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Select Bus Route
                  </label>
                  <select
                    value={selectedRouteId}
                    onChange={e => {
                      const newRouteId = e.target.value;
                      setSelectedRouteId(newRouteId);
                      const route = routes.find(r => r.id === newRouteId);
                      if (route && route.assignedBusId) {
                        onSelectBus(route.assignedBusId);
                        if (route.stops.length > 0) {
                          setSelectedStopId(route.stops[Math.min(1, route.stops.length - 1)].id);
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.code}: {route.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Your Pickup Stop (For Live ETA Calculation)
                  </label>
                  <select
                    value={selectedStopId}
                    onChange={e => setSelectedStopId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-amber-300 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {selectedRoute?.stops.map(stop => (
                      <option key={stop.id} value={stop.id}>
                        Stop #{stop.sequence}: {stop.name} (Scheduled: {stop.scheduledTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Big ETA Countdown in Student View */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-blue-500"></div>
                
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Estimated Time of Arrival at {myStop?.name}
                </p>

                {etaInfo.isPassed ? (
                  <div className="py-3 text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-1" />
                    <span className="text-lg font-bold text-slate-200">Bus Departed Your Stop</span>
                    <p className="text-xs text-slate-400">Next destination: College Main Gate Terminal</p>
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-black text-amber-400 font-display tracking-tight">
                        {etaInfo.etaMin}
                      </span>
                      <span className="text-xl font-bold text-slate-300">MINS</span>
                    </div>
                    <p className="text-xs text-amber-300 font-mono font-bold mt-1">
                      Expected Clock Arrival: {etaInfo.clockTime}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Approximately <strong>{etaInfo.distKm} km</strong> away • Speed <strong>{busLocation?.speedKmph || 0} km/h</strong></span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stop-by-Stop Progress Timeline with Calculated Live ETA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 font-display">
                <MapPin className="w-4 h-4 text-blue-400" />
                {selectedRoute?.name || 'Route'} Stop Timeline & ETA
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Click any stop to calculate ETA
              </span>
            </div>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {selectedRoute?.stops.map((stop, idx) => {
                const isSelected = stop.id === selectedStopId;
                const isCompleted = stop.isCompleted;
                const isCurrent = busLocation?.currentStopIndex === idx;
                const stopEta = getStopEta(idx);

                return (
                  <div
                    key={stop.id}
                    onClick={() => setSelectedStopId(stop.id)}
                    className={`relative pl-8 flex items-center justify-between cursor-pointer group p-2 rounded-xl transition ${
                      isSelected
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Circle Node */}
                    <div className={`absolute left-1.5 w-3.5 h-3.5 rounded-full border-2 transform -translate-x-1/2 transition ${
                      isCurrent
                        ? 'bg-amber-500 border-white ring-4 ring-amber-400/40 animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-500 border-emerald-300'
                        : 'bg-slate-800 border-slate-600'
                    }`} />

                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                          {stop.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                            Target Stop
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Scheduled: {stop.scheduledTime} • {stop.studentsRegistered} students
                      </span>
                    </div>

                    {/* ETA badge on every stop */}
                    <div className="text-right">
                      {stopEta?.status === 'passed' ? (
                        <span className="text-[11px] font-mono text-slate-500">Departed</span>
                      ) : stopEta?.status === 'arriving' ? (
                        <div>
                          <span className="text-[11px] font-mono font-bold text-amber-400 animate-pulse">
                            Arriving ({stopEta.clockTime})
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[11px] font-mono font-bold text-emerald-400">
                            {stopEta?.clockTime || stop.scheduledTime}
                          </span>
                          <div className="text-[9px] text-slate-400 font-mono">{stopEta?.text}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Live Map with Floating ETA overlay */}
        <div className="lg:col-span-7 h-[640px] flex flex-col space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-200 font-display">
                Live Transit Map • {selectedDistrict.name}
              </h3>
              <span className="text-[11px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded-lg border border-slate-700 font-mono">
                {selectedDistrict.code}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              GPS Sync: <span className="font-mono text-emerald-400">Live (2s)</span>
            </span>
          </div>

          <div className="flex-1 h-full min-h-[500px]">
            <LeafletBusMap
              buses={buses}
              routes={routes}
              liveLocations={liveLocations}
              selectedBusId={assignedBus?.id}
              selectedRouteId={selectedRouteId}
              selectedStopId={selectedStopId}
              studentLocation={studentMapLocation}
              districtCenter={selectedDistrict.center}
              districtZoom={selectedDistrict.zoom}
              campusLocation={selectedDistrict.campusLocation}
              onSelectBus={busId => onSelectBus(busId)}
              onSelectStop={stop => setSelectedStopId(stop.id)}
              showAllRoutes={false}
              className="w-full h-full min-h-[540px]"
              etaBadge={{
                etaMin: activeTab === 'child-tracker' && selectedStudent.status === 'boarded' ? campusEta.etaMin : etaInfo.etaMin,
                distKm: activeTab === 'child-tracker' && selectedStudent.status === 'boarded' ? campusEta.distKm : etaInfo.distKm,
                stopName: activeTab === 'child-tracker' && selectedStudent.status === 'boarded' ? 'Campus Terminal' : myStop?.name,
                busNumber: assignedBus?.busNumber,
                isPassed: etaInfo.isPassed,
                clockTime: activeTab === 'child-tracker' && selectedStudent.status === 'boarded' ? campusEta.clockTime : etaInfo.clockTime
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

