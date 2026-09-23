import React, { useState, useEffect } from 'react';
import {
  Bus,
  Route,
  Stop,
  FuelLog,
  FuelAnomalyAlert,
  SpecialTrip,
  FleetAlert,
  LiveLocation,
  DistrictConfig,
  StudentPassenger,
  AttendanceRecord,
  SeatAssignment
} from '../types';
import { LeafletBusMap } from './LeafletBusMap';
import { AddBusModal } from './AddBusModal';
import { AddStudentModal } from './AddStudentModal';
import StudentQRCode from './StudentQRCode';
 import {
  getAttendanceForTrip,
  getSeatAssignmentsForTrip
 } from '../services/dbService';
import {
  Shield,
  Bus as BusIcon,
  Route as RouteIcon,
  Fuel,
  Calendar,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Building2,
  DollarSign,
  Compass,
  FileSpreadsheet,
  Radio,
  UserPlus,
  GraduationCap,
  Trash2,
  Phone,
  Mail,
  Armchair,
  CheckCircle2,
  Gauge,
  Navigation,
  Timer,
  Share2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';

interface AdminDashboardProps {
  buses: Bus[];
  routes: Route[];
  liveLocations: Record<string, LiveLocation>;
  fuelLogs: FuelLog[];
  fuelAnomalies: FuelAnomalyAlert[];
  specialTrips: SpecialTrip[];
  alerts: FleetAlert[];
  students?: StudentPassenger[];
  districts?: DistrictConfig[];
  selectedDistrict?: DistrictConfig;
  onSelectDistrict?: (districtId: string) => void;
  onOpenFuelModal: (busId?: string) => void;
  onOpenTripModal: () => void;
  onOpenRouteModal: () => void;
  onResolveAnomaly: (id: string, note?: string) => void;
  onUpdateTripStatus: (id: string, status: SpecialTrip['status']) => void;
  onAddBus?: (busData: Partial<Bus>) => Promise<void>;
  onDeleteBus?: (busId: string) => Promise<void>;
  onAddStudent?: (studentData: Partial<StudentPassenger>) => Promise<void>;
  onDeleteStudent?: (studentId: string) => Promise<void>;
  currentManager?: import('../types').UserAccount | null;
  onInitiateHandover?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  buses = [],
  routes = [],
  liveLocations = {},
  fuelLogs = [],
  fuelAnomalies = [],
  specialTrips = [],
  alerts = [],
  students = [],
  districts = [],
  selectedDistrict,
  onSelectDistrict,
  onOpenFuelModal,
  onOpenTripModal,
  onOpenRouteModal,
  onResolveAnomaly,
  onUpdateTripStatus,
  onAddBus,
  onDeleteBus,
  onAddStudent,
  onDeleteStudent,
  currentManager,
  onInitiateHandover
}) => {
 const [activeTab, setActiveTab] = useState<
  'map' | 'buses' | 'students' | 'routes' | 'fuel' | 'trips' | 'ai-optimizer' | 'attendance'
>('map');
  const [selectedBusId, setSelectedBusId] = useState<string | undefined>(undefined);
  const [fuelSearchQuery, setFuelSearchQuery] = useState<string>('');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [selectedStudentForQR, setSelectedStudentForQR] =
  useState<StudentPassenger | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
const [seatAssignments, setSeatAssignments] = useState<SeatAssignment[]>([]);
const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [studentBusFilter, setStudentBusFilter] = useState<string>('all');
  const [busSearchQuery, setBusSearchQuery] = useState<string>('');
  const [selectedRouteForAI, setSelectedRouteForAI] = useState<string>(routes[0]?.id || 'route-01');

  // Modals state
  const [isAddBusOpen, setIsAddBusOpen] = useState<boolean>(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState<boolean>(false);

  // AI Fuel Audit State
  const [isAuditingFuel, setIsAuditingFuel] = useState<boolean>(false);
  const [fuelAuditResult, setFuelAuditResult] = useState<any | null>(null);

  // AI Route Optimizer State
  const [isOptimizingRoute, setIsOptimizingRoute] = useState<boolean>(false);
  const [routeOptimizationResult, setRouteOptimizationResult] = useState<any | null>(null);

  const safeBuses = Array.isArray(buses) ? buses : [];
  const safeFuelLogs = Array.isArray(fuelLogs) ? fuelLogs : [];
  const safeFuelAnomalies = Array.isArray(fuelAnomalies) ? fuelAnomalies : [];
  const safeRoutes = Array.isArray(routes) ? routes : [];
  const safeSpecialTrips = Array.isArray(specialTrips) ? specialTrips : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeStudents = Array.isArray(students) ? students : [];

  // Compute Fleet KPI Metrics
  const activeBuses = safeBuses.filter(b => b.status === 'on-route').length;
  const specialTripBuses = safeBuses.filter(b => b.status === 'special-trip').length;
  const totalStudentsInTransit = safeBuses.reduce((acc, b) => acc + (b.currentPassengers || 0), 0);
  
  const totalFuelLiters = safeFuelLogs.reduce((acc, l) => acc + l.litersFilled, 0);
  const totalFuelCost = safeFuelLogs.reduce((acc, l) => acc + l.totalCost, 0);
  const totalDistance = safeFuelLogs.reduce((acc, l) => acc + l.distanceTravelledKm, 0);
  const fleetAvgMileage = totalFuelLiters > 0 ? Number((totalDistance / totalFuelLiters).toFixed(2)) : 4.45;
  const openAnomaliesCount = safeFuelAnomalies.filter(a => a.status === 'open' || !(a as any).resolved).length;

  // Chart Data for Fuel Mileage Comparison
  const fuelChartData = safeBuses.map(bus => {
    const busLogs = safeFuelLogs.filter(l => l.busId === bus.id);
    const latestLog = busLogs[0];
    const actualMileage = latestLog ? latestLog.calculatedMileageKmpl : bus.fuelEfficiencyKmpl;
    const expected = bus.expectedEfficiencyKmpl;
    const isAnomaly = actualMileage < (expected * 0.75);

    return {
      name: bus.busNumber.split('-')[0].trim(),
      plate: bus.plateNumber,
      actualMileage: actualMileage,
      expectedMileage: expected,
      isAnomaly: isAnomaly
    };
  });

  // Helper to format clock arrival time
  const formatClockTime = (minutesFromNow: number) => {
    const now = new Date();
    const target = new Date(now.getTime() + minutesFromNow * 60000);
    return target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to compute live ETA telemetry for a bus
  const getBusEtaTelemetry = (bus: Bus) => {
    const route = safeRoutes.find(r => r.id === bus.assignedRouteId);
    const loc = liveLocations[bus.id];
    if (!loc || !route || !route.stops || route.stops.length === 0) {
      return {
        nextStopName: 'Campus Depot',
        nextStopEtaMin: 0,
        nextStopClock: '--:--',
        campusEtaMin: 0,
        campusClock: '--:--',
        remainingKm: 0,
        currentStopIndex: 0,
        totalStops: route?.stops?.length || 0,
        isCompleted: false,
        speedKmph: loc?.speedKmph || 0,
        delayMinutes: loc?.delayMinutes || 0
      };
    }

    const currentStopIndex = loc.currentStopIndex;
    const totalStops = route.stops.length;
    const isCompleted = currentStopIndex >= totalStops;
    const nextStop = route.stops[Math.min(currentStopIndex, totalStops - 1)];
    const nextStopEtaMin = Math.max(1, loc.etaNextStopMin || 4);
    const remainingStops = Math.max(0, totalStops - currentStopIndex - 1);
    const campusEtaMin = nextStopEtaMin + remainingStops * 5;
    const remainingKm = Number(((loc.distanceToNextStopKm || 1.2) + remainingStops * 2.6).toFixed(1));

    return {
      nextStopName: nextStop ? nextStop.name : 'College Campus Terminal',
      nextStopEtaMin,
      nextStopClock: formatClockTime(nextStopEtaMin),
      campusEtaMin,
      campusClock: formatClockTime(campusEtaMin),
      remainingKm,
      currentStopIndex,
      totalStops,
      isCompleted,
      speedKmph: loc.speedKmph || 0,
      delayMinutes: loc.delayMinutes || 0
    };
  };

  // Currently active or selected bus for live map ETA badge
  const activeSelectedBus = safeBuses.find(b => b.id === (selectedBusId || safeBuses.find(b => b.status === 'on-route')?.id || safeBuses[0]?.id));
  const activeSelectedBusEta = activeSelectedBus ? getBusEtaTelemetry(activeSelectedBus) : null;

  // Run AI Fuel Audit
  const handleRunFuelAudit = async () => {
    setIsAuditingFuel(true);
    try {
      const res = await fetch('/api/ai/audit-fuel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setFuelAuditResult(data);
    } catch (err) {
      console.error("AI fuel audit error:", err);
    } finally {
      setIsAuditingFuel(false);
    }
  };

  // Run AI Route Optimization
  const handleRunRouteOptimizer = async () => {
    setIsOptimizingRoute(true);
    try {
      const res = await fetch('/api/ai/optimize-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId: selectedRouteForAI })
      });
      const data = await res.json();
      setRouteOptimizationResult(data);
    } catch (err) {
      console.error("AI route optimize error:", err);
    } finally {
      setIsOptimizingRoute(false);
    }
  };

  const filteredFuelLogs = safeFuelLogs.filter(log =>
    log.busNumber.toLowerCase().includes(fuelSearchQuery.toLowerCase()) ||
    log.driverName.toLowerCase().includes(fuelSearchQuery.toLowerCase()) ||
    log.fuelStationName.toLowerCase().includes(fuelSearchQuery.toLowerCase()) ||
    log.receiptNumber.toLowerCase().includes(fuelSearchQuery.toLowerCase())
  );
useEffect(() => {
  const loadAttendanceData = async () => {
    setAttendanceLoading(true);

    try {
      if (!selectedBusId) {
        setAttendanceRecords([]);
        setSeatAssignments([]);
        return;
      }

      const tripId = `${selectedBusId}-${new Date().toISOString().slice(0, 10)}`;

      const [attendance, seats] = await Promise.all([
        getAttendanceForTrip(tripId),
        getSeatAssignmentsForTrip(tripId),
      ]);

      setAttendanceRecords(attendance);
      setSeatAssignments(seats);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  loadAttendanceData();
}, [selectedBusId]);


  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Active Transport Manager Authority Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {currentManager?.avatar ? (
            <img
              src={currentManager.avatar}
              alt={currentManager.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-amber-400 shadow-md shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center border-2 border-amber-400 shadow-md shrink-0">
              {currentManager?.name?.charAt(0) || 'M'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                <Shield className="w-3 h-3" /> ACTIVE TRANSPORT MANAGER
              </span>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified Official Authority
              </span>
              {currentManager?.handoverDate && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Since {new Date(currentManager.handoverDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-100 mt-0.5">
              {currentManager?.name || 'Dr. R. Ramanathan'}
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              <span className="text-amber-300 font-semibold">{currentManager?.designation || 'Chief Transport Director'}</span>
              <span>•</span>
              <span className="font-mono text-slate-300">Staff ID: {currentManager?.employeeId || 'TM-2024-001'}</span>
              <span>•</span>
              <span className="text-slate-300">{currentManager?.officialEmail || currentManager?.email || 'manager.transport@college.edu'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          {onInitiateHandover && (
            <button
              onClick={onInitiateHandover}
              className="bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:border-amber-400 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
              title="Register New Transport Manager if leadership is transitioning"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Manager Succession / Handover</span>
            </button>
          )}
        </div>
      </div>

      {/* High-Level Fleet KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Active Fleet */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Status</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <BusIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-100 font-display">
                {activeBuses} / {safeBuses.length}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">Active</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {specialTripBuses} special trip • {safeBuses.filter(b => b.status === 'idle').length} standby
            </p>
          </div>
        </div>

        {/* KPI 2: Students in Transit */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students in Transit</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-400 font-display">
                {totalStudentsInTransit}
              </span>
              <span className="text-xs text-slate-400">Boarded</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across 3 Morning Pickup Routes</p>
          </div>
        </div>

        {/* KPI 3: Fleet Average Fuel Efficiency */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Avg Mileage</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-400 font-display">
                {fleetAvgMileage}
              </span>
              <span className="text-xs text-slate-300 font-mono">km/l</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Target benchmark: 4.70 km/l</p>
          </div>
        </div>

        {/* KPI 4: Fuel Theft & Anomaly Alerts */}
        <div className={`p-4 rounded-2xl border shadow-xl flex flex-col justify-between transition ${
          openAnomaliesCount > 0
            ? 'bg-rose-950/40 border-rose-700/80 text-rose-200'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300">Fuel Anomalies</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-400 font-display">
                {openAnomaliesCount}
              </span>
              <span className="text-xs text-rose-300 font-bold">Suspected Siphoning</span>
            </div>
            <p className="text-[11px] text-rose-300/80 mt-1">Bus #02 low mileage alert</p>
          </div>
        </div>

        {/* KPI 5: Special Trips Scheduled */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Special Trips</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-purple-300 font-display">
                {safeSpecialTrips.filter(t => t.status === 'scheduled' || t.status === 'in-progress').length}
              </span>
              <span className="text-xs text-slate-400">Scheduled</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Industrial visits & sports meets</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'map' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Live Fleet Map</span>
          </button>

          <button
            onClick={() => setActiveTab('buses')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'buses' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BusIcon className="w-3.5 h-3.5" />
            <span>Fleet Buses ({safeBuses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'students' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Students Directory ({safeStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('routes')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'routes' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RouteIcon className="w-3.5 h-3.5" />
            <span>Routes ({routes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('fuel')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap relative ${
              activeTab === 'fuel' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Fuel Audit</span>
            {openAnomaliesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'trips' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Special Trips ({specialTrips.length})</span>
          </button>
          <button
  onClick={() => setActiveTab('attendance')}
  className={`px-4 py-2 rounded-lg font-medium ${
    activeTab === 'attendance'
      ? 'bg-purple-600 text-white'
      : 'bg-slate-100 text-slate-700'
  }`}
>
  QR Attendance
</button>

          <button
            onClick={() => setActiveTab('ai-optimizer')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'ai-optimizer' ? 'bg-purple-600 text-white shadow' : 'text-purple-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Optimizer</span>
          </button>
        </div>

        {/* Primary Admin Action Buttons: Add Bus, Add Student, Log Fuel, Schedule Trip */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddBusOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bus</span>
          </button>

          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => onOpenFuelModal()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Fuel</span>
          </button>

          <button
            onClick={onOpenTripModal}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Trip</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE FLEET MAP OVERVIEW */}
      {activeTab === 'map' && (
        <div className="space-y-5">
          {/* FLEET-WIDE REAL-TIME ETA OPERATIONS MONITOR (ADMIN COCKPIT) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-blue-500" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
                  FLEET LIVE ESTIMATED TIME OF ARRIVAL (ETA) OPERATIONS MONITOR
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Admin Central Dispatch • Showing live projected stop arrivals & campus terminal ETAs
              </span>
            </div>

            {/* Active Buses ETA Strip Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 relative z-10">
              {safeBuses.filter(b => b.status === 'on-route').map(bus => {
                const eta = getBusEtaTelemetry(bus);
                const isSelected = bus.id === (selectedBusId || activeSelectedBus?.id);
                const loc = liveLocations[bus.id];

                return (
                  <div
                    key={bus.id}
                    onClick={() => setSelectedBusId(bus.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900/95 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <h4 className="font-extrabold text-sm text-slate-100 font-display">
                            {bus.busNumber}
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{bus.plateNumber}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {eta.speedKmph} km/h
                      </span>
                    </div>

                    {/* ETA Primary Breakdown */}
                    <div className="mt-2.5 grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block truncate">
                          Next: {eta.nextStopName}
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-black text-amber-400 font-mono">
                            ~{eta.nextStopEtaMin}m
                          </span>
                          <span className="text-[10px] text-amber-300/80 font-mono">
                            ({eta.nextStopClock})
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block truncate">
                          Campus Arrival
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-black text-emerald-400 font-mono">
                            ~{eta.campusEtaMin}m
                          </span>
                          <span className="text-[10px] text-emerald-300/80 font-mono">
                            ({eta.campusClock})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Remaining: <strong className="text-slate-200">{eta.remainingKm} km</strong></span>
                      <span className="text-amber-400 font-semibold hover:underline">
                        {isSelected ? '✓ Viewing on Map' : 'Click to Focus'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Map Area (8 Cols) */}
            <div className="lg:col-span-8 h-[600px] flex flex-col space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 font-display">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    Fleet Control Room — Multi-Bus Live Map
                  </h3>
                  {activeSelectedBus && (
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg font-bold">
                      Tracking {activeSelectedBus.busNumber} (Next ETA: ~{activeSelectedBusEta?.nextStopEtaMin} min at {activeSelectedBusEta?.nextStopClock})
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Displaying all routes, buses, and active special trips
                </span>
              </div>
              <div className="flex-1 min-h-[520px]">
                <LeafletBusMap
                  buses={buses}
                  routes={routes}
                  liveLocations={liveLocations}
                  selectedBusId={selectedBusId || activeSelectedBus?.id}
                  specialTrips={specialTrips}
                  districtCenter={selectedDistrict?.center}
                  districtZoom={selectedDistrict?.zoom}
                  campusLocation={selectedDistrict?.campusLocation}
                  onSelectBus={busId => setSelectedBusId(busId)}
                  showAllRoutes={true}
                  className="w-full h-full min-h-[520px]"
                  etaBadge={activeSelectedBusEta && activeSelectedBus?.status === 'on-route' ? {
                    etaMin: activeSelectedBusEta.nextStopEtaMin,
                    distKm: Number((liveLocations[activeSelectedBus.id]?.distanceToNextStopKm || 1.2).toFixed(1)),
                    stopName: activeSelectedBusEta.nextStopName,
                    busNumber: activeSelectedBus.busNumber,
                    clockTime: activeSelectedBusEta.nextStopClock
                  } : undefined}
                />
              </div>
            </div>

            {/* Fleet Status Sidebar (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="font-bold text-sm text-slate-200 font-display flex items-center justify-between">
                <span>Active Fleet Roster & Live ETAs ({buses.length})</span>
                <span className="text-xs text-slate-400 font-normal">Click bus to center</span>
              </h3>

              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                {buses.map(bus => {
                  const loc = liveLocations[bus.id];
                  const isSelected = bus.id === (selectedBusId || activeSelectedBus?.id);
                  const eta = getBusEtaTelemetry(bus);

                  return (
                    <div
                      key={bus.id}
                      onClick={() => setSelectedBusId(bus.id)}
                      className={`bg-slate-900 border rounded-2xl p-4 cursor-pointer transition ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-400/30 bg-slate-850'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${bus.status === 'on-route' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                            <h4 className="font-bold text-sm text-slate-100">{bus.busNumber}</h4>
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{bus.plateNumber}</p>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          bus.status === 'on-route'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : bus.status === 'special-trip'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {bus.status}
                        </span>
                      </div>

                      {/* Live ETA Telemetry for On-Route Buses */}
                      {bus.status === 'on-route' && (
                        <div className="mt-3 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-xl p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium truncate max-w-[150px]">
                              Next: <strong>{eta.nextStopName}</strong>
                            </span>
                            <span className="text-amber-400 font-mono font-bold">
                              ETA ~{eta.nextStopEtaMin} min ({eta.nextStopClock})
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-1">
                            <span className="text-slate-400">Campus Gate:</span>
                            <span className="text-emerald-400 font-mono font-bold">
                              ETA ~{eta.campusEtaMin} min ({eta.campusClock})
                            </span>
                          </div>

                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(15, (((eta.currentStopIndex + 0.6) / Math.max(1, eta.totalStops)) * 100)))}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 mt-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Speed:</span>
                          <span className="font-mono font-bold text-amber-400">{loc?.speedKmph || 0} km/h</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Passengers:</span>
                          <span className="font-bold text-emerald-400">{bus.currentPassengers} / {bus.capacity}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Mileage:</span>
                          <span className="font-mono font-bold text-cyan-400">{bus.fuelEfficiencyKmpl} km/l</span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
                        <span>Driver: <strong className="text-slate-200">{bus.driverName}</strong></span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFuelModal(bus.id);
                          }}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline"
                        >
                          + Fuel Refill
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTES & STOPS MANAGEMENT */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-100 font-display">Bus Routes & Scheduled Stops</h3>
              <p className="text-xs text-slate-400">Manage pickup waypoints, arrival timings, and assigned college buses</p>
            </div>
            <button
              onClick={onOpenRouteModal}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" /> Create New Route
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {routes.map(route => {
              const assignedBus = buses.find(b => b.id === route.assignedBusId);

              return (
                <div key={route.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg text-white font-mono" style={{ backgroundColor: route.color }}>
                        {route.code}
                      </span>
                      <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                        {route.shift}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-100 mt-2">{route.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {route.totalDistanceKm} km • ~{route.estimatedDurationMin} mins total transit time
                    </p>

                    <div className="mt-3 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-400">Assigned Bus:</span>
                      <span className="font-bold text-amber-300">{assignedBus ? assignedBus.busNumber : 'Unassigned'}</span>
                    </div>

                    {/* Stops List */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Stops ({route.stops.length})
                        </span>
                        {assignedBus?.status === 'on-route' && (
                          <span className="text-[10px] text-amber-400 font-mono font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live ETAs Active
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {route.stops.map((stop, idx) => {
                          const busLoc = assignedBus ? liveLocations[assignedBus.id] : null;
                          let liveEtaDisplay = null;

                          if (assignedBus?.status === 'on-route' && busLoc) {
                            const curIdx = busLoc.currentStopIndex;
                            if (idx < curIdx) {
                              liveEtaDisplay = <span className="text-[10px] text-slate-500 font-mono">Passed</span>;
                            } else if (idx === curIdx) {
                              const m = Math.max(1, busLoc.etaNextStopMin || 4);
                              liveEtaDisplay = (
                                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                                  ETA ~{m}m ({formatClockTime(m)})
                                </span>
                              );
                            } else {
                              const diff = idx - curIdx;
                              const m = (busLoc.etaNextStopMin || 4) + diff * 5;
                              liveEtaDisplay = (
                                <span className="text-[10px] text-emerald-400 font-mono font-medium">
                                  ~{m}m ({formatClockTime(m)})
                                </span>
                              );
                            }
                          }

                          return (
                            <div key={stop.id} className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="text-slate-200 font-medium truncate max-w-[130px]">{stop.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-right">
                                {liveEtaDisplay}
                                <span className="text-slate-400 font-mono text-[11px]">{stop.scheduledTime}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-semibold">
                      {route.stops.reduce((acc, s) => acc + s.studentsRegistered, 0)} Students Registered
                    </span>
                    <button
                      onClick={() => {
                        setSelectedRouteForAI(route.id);
                        setActiveTab('ai-optimizer');
                      }}
                      className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> AI Optimize
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: FUEL CHECKING & THEFT DETECTION HUB */}
      {activeTab === 'fuel' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-100 font-display">
                Fuel Management & Anomaly / Theft Detection Hub
              </h3>
              <p className="text-xs text-slate-400">
                Odometer differential mileage tracking, expense audit, and automated fuel drain anomaly alerts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRunFuelAudit}
                disabled={isAuditingFuel}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAuditingFuel ? 'Auditing with AI...' : 'Run Gemini Fuel Audit'}</span>
              </button>

              <button
                onClick={() => onOpenFuelModal()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
              >
                <Fuel className="w-4 h-4" />
                <span>+ Log Fuel Entry</span>
              </button>
            </div>
          </div>

          {/* AI Fuel Audit Results Banner if Run */}
          {fuelAuditResult && (
            <div className="bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-900 border border-purple-500/50 p-5 rounded-2xl shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-purple-200">Gemini Fleet Fuel & Siphoning Audit Report</h4>
                    <p className="text-xs text-slate-400">Fleet Health Score: <strong className="text-emerald-400">{fuelAuditResult.fleetHealthScore}/100</strong></p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-950 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-800">
                  Potential Savings: {fuelAuditResult.estimatedMonthlyCostSavings}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {fuelAuditResult.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    Anomaly & Theft Risk Analysis:
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    {fuelAuditResult.anomalyInsights?.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                    Actionable Supervisor Recommendations:
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    {fuelAuditResult.actionableRecommendations?.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Active Fuel Theft Anomaly Card */}
          {fuelAnomalies.filter(a => a.status === 'open').map(anom => (
            <div key={anom.id} className="bg-rose-950/40 border border-rose-600/80 rounded-2xl p-5 shadow-2xl space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-700">
                      CRITICAL ANOMALY ALERT
                    </span>
                    <h4 className="font-bold text-sm text-rose-100 mt-1">{anom.title}</h4>
                  </div>
                </div>

                <button
                  onClick={() => onResolveAnomaly(anom.id, "Transport In-charge conducted dipstick check. Odometer calibrated.")}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow"
                >
                  Investigate & Mark Resolved
                </button>
              </div>

              <p className="text-xs text-rose-200/90 leading-relaxed">{anom.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3 rounded-xl border border-rose-900/60 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Bus Involved:</span>
                  <span className="text-slate-200 font-bold">{anom.busNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Logged Mileage:</span>
                  <span className="text-rose-400 font-bold">{anom.calculatedMileage} km/l</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Expected Baseline:</span>
                  <span className="text-slate-300 font-bold">{anom.expectedMileage} km/l</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Estimated Fuel Loss:</span>
                  <span className="text-amber-400 font-bold">~{anom.estimatedFuelLossLiters} Liters (~₹3,150)</span>
                </div>
              </div>
            </div>
          ))}

          {/* Visual Mileage Comparison Chart */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-100 font-display">
                  Bus Mileage Comparison (Actual vs Expected km/l)
                </h4>
                <p className="text-xs text-slate-400">Red bar indicates drop &gt; 25% from benchmark</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                Fleet Target: 4.7 km/l
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 6]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Bar dataKey="actualMileage" name="Actual Mileage (km/l)">
                    {fuelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isAnomaly ? '#f43f5e' : '#10b981'} />
                    ))}
                  </Bar>
                  <Bar dataKey="expectedMileage" name="Expected Baseline (km/l)" fill="#3b82f6" opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fuel Logs History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h4 className="font-bold text-sm text-slate-100 font-display">Fuel Refill Logs & Mileage Records</h4>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={fuelSearchQuery}
                  onChange={e => setFuelSearchQuery(e.target.value)}
                  placeholder="Search receipt, bus, driver..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Bus Number</th>
                    <th className="py-3 px-3">Distance (km)</th>
                    <th className="py-3 px-3">Fuel Filled</th>
                    <th className="py-3 px-3">Mileage (km/l)</th>
                    <th className="py-3 px-3">Total Cost</th>
                    <th className="py-3 px-3">Station & Receipt</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredFuelLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono">
                        {log.date} <span className="text-slate-500">{log.time}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-100">{log.busNumber}</td>
                      <td className="py-3 px-3 font-mono">{log.distanceTravelledKm} km</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">{log.litersFilled} L</td>
                      <td className="py-3 px-3 font-mono">
                        <span className={`font-bold ${log.isAnomaly ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {log.calculatedMileageKmpl} km/l
                        </span>
                        <span className="text-[10px] text-slate-500 block">exp: {log.expectedMileageKmpl}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-200">₹{log.totalCost.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className="text-slate-300 block">{log.fuelStationName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{log.receiptNumber}</span>
                      </td>
                      <td className="py-3 px-3">
                        {log.isAnomaly ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                            ⚠️ Anomaly Flagged
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                            ✓ Verified Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SPECIAL TRIP & VENUE SCHEDULER */}
      {activeTab === 'trips' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-100 font-display">
                Special Excursion & Venue Destination Scheduler
              </h3>
              <p className="text-xs text-slate-400">
                Schedule industrial visits, athletics meets, symposiums, and outstation academic trips
              </p>
            </div>

            <button
              onClick={onOpenTripModal}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" /> Schedule New Venue Trip
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specialTrips.map(trip => (
              <div key={trip.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      {trip.purpose}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trip.status === 'scheduled'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : trip.status === 'in-progress'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {trip.status.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 mt-2.5">{trip.tripName}</h4>
                  <p className="text-xs text-purple-300 font-medium mt-0.5">{trip.department}</p>

                  <div className="mt-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-300 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span>{trip.venueName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-5">{trip.venueAddress}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300 pl-5 pt-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{new Date(trip.startDateTime).toLocaleDateString()} ({new Date(trip.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Assigned Bus:</span>
                      <span className="font-bold text-amber-300">{trip.assignedBusNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Passengers:</span>
                      <span className="font-bold text-emerald-400">{trip.passengerCount} Students/Staff</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Budget: <strong className="text-emerald-400">₹{trip.budgetAllocated.toLocaleString()}</strong>
                  </span>
                  
                  {trip.status === 'scheduled' && (
                    <button
                      onClick={() => onUpdateTripStatus(trip.id, 'in-progress')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
                    >
                      Start Trip
                    </button>
                  )}
                  {trip.status === 'in-progress' && (
                    <button
                      onClick={() => onUpdateTripStatus(trip.id, 'completed')}
                      className="bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            QR Attendance
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Student attendance and seat allocation
          </p>
        </div>

        <div className="text-sm font-semibold text-slate-600">
          Present: {attendanceRecords.length}
        </div>
      </div>

      {attendanceLoading ? (
        <div className="text-center py-10 text-slate-500">
          Loading attendance...
        </div>
      ) : attendanceRecords.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          No QR attendance records found for today.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="p-3">Student</th>
                <th className="p-3">Roll Number</th>
                <th className="p-3">Seat</th>
                <th className="p-3">Scan Time</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {attendanceRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-slate-100"
                >
                  <td className="p-3 font-medium text-slate-900">
                    {record.studentName}
                  </td>

                  <td className="p-3 text-slate-600">
                    {record.rollNumber}
                  </td>

                  <td className="p-3 font-semibold text-purple-600">
                    {record.seatNumber}
                  </td>

                  <td className="p-3 text-slate-600">
                    {new Date(record.scanTime).toLocaleTimeString()}
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      Present
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">
        Seat Allocation
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {seatAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="rounded-xl border border-purple-200 bg-purple-50 p-3"
          >
            <div className="text-xs text-slate-500">
              Seat
            </div>

            <div className="text-lg font-bold text-purple-700">
              {assignment.seatNumber}
            </div>

            <div className="text-xs font-medium text-slate-700 truncate">
              {assignment.studentName}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

      {/* TAB 5: AI ROUTE OPTIMIZER & FLEET DIAGNOSTICS */}
      {activeTab === 'ai-optimizer' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-100 font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Gemini AI Route & Stop Optimizer
              </h3>
              <p className="text-xs text-slate-400">
                Analyze student dwell times, road bottlenecks, and stop sequences to maximize fuel economy
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedRouteForAI}
                onChange={e => setSelectedRouteForAI(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.code}: {r.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleRunRouteOptimizer}
                disabled={isOptimizingRoute}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isOptimizingRoute ? 'Optimizing with AI...' : 'Run Route Optimization'}</span>
              </button>
            </div>
          </div>

          {/* Results Display */}
          {routeOptimizationResult ? (
            <div className="bg-slate-900 border border-purple-500/50 p-6 rounded-2xl shadow-2xl space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-sm text-purple-200">AI Route Optimization Output</h4>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-800">
                    ⏱️ Saved: ~{routeOptimizationResult.timeSavedMin} mins
                  </span>
                  <span className="bg-amber-950 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-800">
                    ⛽ Fuel Saved: ~{routeOptimizationResult.fuelSavedLiters} L / trip
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                {routeOptimizationResult.optimizationNotes}
              </p>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  🛡️ Safety & Traffic Bottleneck Advisory:
                </span>
                <p className="text-xs text-slate-300">{routeOptimizationResult.safetyAdvisory}</p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                  Suggested Optimal Stop Sequence:
                </span>
                <div className="flex flex-wrap gap-2">
                  {routeOptimizationResult.suggestedStopOrder?.map((stopName: string, i: number) => (
                    <span key={i} className="text-xs bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
                      <span className="w-4 h-4 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {i + 1}
                      </span>
                      {stopName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
              <Sparkles className="w-10 h-10 text-purple-400 mx-auto animate-bounce" />
              <h4 className="font-bold text-base text-slate-200 font-display">Ready to Analyze Route Logistics</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click "Run Route Optimization" above to query the Gemini intelligence model for real-time stop sequencing and fuel savings.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB: FLEET BUSES MANAGEMENT */}
      {activeTab === 'buses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-100 font-display flex items-center gap-2">
                <BusIcon className="w-5 h-5 text-amber-400" />
                <span>College Fleet Buses Directory ({safeBuses.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Register new buses, manage total seating capacity, driver assignments, and mileage benchmarks
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search bus, plate, driver..."
                  value={busSearchQuery}
                  onChange={e => setBusSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={() => setIsAddBusOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Bus to Fleet</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {safeBuses
              .filter(bus => 
                bus.busNumber.toLowerCase().includes(busSearchQuery.toLowerCase()) ||
                bus.plateNumber.toLowerCase().includes(busSearchQuery.toLowerCase()) ||
                bus.driverName.toLowerCase().includes(busSearchQuery.toLowerCase())
              )
              .map(bus => {
                const assignedRoute = safeRoutes.find(r => r.id === bus.assignedRouteId);
                const loc = liveLocations[bus.id];

                return (
                  <div
                    key={bus.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                            <BusIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-100 font-display">
                              {bus.busNumber}
                            </h4>
                            <span className="text-xs font-mono text-amber-400 font-semibold">
                              {bus.plateNumber}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          bus.status === 'on-route'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : bus.status === 'special-trip'
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : bus.status === 'maintenance'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {bus.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Seats</span>
                          <span className="text-sm font-black text-slate-100 font-display">{bus.capacity}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Occupancy</span>
                          <span className="text-sm font-black text-cyan-300 font-display">{bus.currentPassengers || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mileage</span>
                          <span className="text-sm font-black text-emerald-400 font-display">{bus.fuelEfficiencyKmpl} km/l</span>
                        </div>
                      </div>

                      <div className="space-y-2 mt-3 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Assigned Route:</span>
                          <span className="font-semibold text-slate-200">{assignedRoute?.name || 'Standby / Unassigned'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Driver Name:</span>
                          <span className="font-semibold text-slate-200">{bus.driverName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Driver Phone:</span>
                          <span className="font-mono text-slate-200">{bus.driverPhone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Model:</span>
                          <span className="text-slate-400 truncate max-w-[160px]">{bus.model}</span>
                        </div>
                      </div>

                      {/* Live ETA Telemetry */}
                      {bus.status === 'on-route' && (
                        <div className="mt-3 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-xl p-2.5 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-400 font-bold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> Next Stop ETA:
                            </span>
                            <span className="text-amber-300 font-mono font-bold">
                              ~{getBusEtaTelemetry(bus).nextStopEtaMin} min ({getBusEtaTelemetry(bus).nextStopClock})
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1">
                            <span>Campus Terminal:</span>
                            <span className="text-emerald-400 font-mono font-bold">
                              ~{getBusEtaTelemetry(bus).campusEtaMin} min ({getBusEtaTelemetry(bus).campusClock}) • {getBusEtaTelemetry(bus).remainingKm} km
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => onOpenFuelModal(bus.id)}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                      >
                        <Fuel className="w-3.5 h-3.5" />
                        <span>Log Fuel Refill</span>
                      </button>

                      {onDeleteBus && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${bus.busNumber} from the fleet?`)) {
                              onDeleteBus(bus.id);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          title="Remove Bus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB: STUDENT PASSENGER ENROLLMENT DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-100 font-display flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <span>Student Transit Directory & Rosters ({safeStudents.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Enroll students, assign college buses and designated pickup stops, and manage parent emergency SMS alerts
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, roll, parent..."
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <select
                value={studentBusFilter}
                onChange={e => setStudentBusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Buses ({safeBuses.length})</option>
                {safeBuses.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.busNumber}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsAddStudentOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Enroll Student</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {safeStudents
              .filter(stu => {
                const matchesSearch = 
                  stu.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                  stu.rollNumber.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                  stu.parentName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                  stu.stopName.toLowerCase().includes(studentSearchQuery.toLowerCase());
                const matchesBus = studentBusFilter === 'all' || stu.busId === studentBusFilter;
                return matchesSearch && matchesBus;
              })
              .map(student => {
                return (
                  <div
                    key={student.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                            alt={student.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-700 shadow"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-slate-100 font-display">
                              {student.name}
                            </h4>
                            <span className="text-xs font-mono text-cyan-400 font-bold">
                              {student.rollNumber} • {student.year}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          student.status === 'boarded'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : student.status === 'arrived-campus'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          {student.status.replace(/-/g, ' ')}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-slate-300 space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Department:</span>
                          <span className="font-semibold text-slate-200 truncate max-w-[170px]">{student.department}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Assigned Bus:</span>
                          <span className="font-bold text-amber-400">{student.busNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Pickup Stop:</span>
                          <span className="font-medium text-slate-200 truncate max-w-[170px]">{student.stopName}</span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
  <div className="flex items-center justify-between text-slate-400">
    <span>
      Parent: <strong className="text-slate-200">{student.parentName}</strong>
    </span>

    <span className="font-mono text-emerald-400">
      {student.parentPhone}
    </span>
  </div>
</div>

<button
  onClick={() => {
  alert("QR button clicked");
  setSelectedStudentForQR(student);
}}
  className="w-full mt-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2"
>
  Show Student QR
</button>

                      {/* Live ETA Telemetry for Student */}
                      {(() => {
                        const assignedBus = safeBuses.find(b => b.id === student.busId || b.busNumber === student.busNumber);
                        const busEta = assignedBus ? getBusEtaTelemetry(assignedBus) : null;
                        const assignedRoute = safeRoutes.find(r => r.id === assignedBus?.assignedRouteId);
                        const stopIdx = assignedRoute?.stops ? assignedRoute.stops.findIndex(s => s.id === student.stopId || s.name === student.stopName) : -1;

                        let etaLabel = '';
                        let etaColor = 'text-amber-300';
                        let isLive = false;

                        if (student.status === 'arrived-campus') {
                          etaLabel = '✓ Safely Arrived on Campus';
                          etaColor = 'text-cyan-300';
                        } else if (student.status === 'boarded') {
                          isLive = true;
                          etaLabel = busEta ? `Campus ETA: ~${busEta.campusEtaMin}m (${busEta.campusClock})` : 'En Route to Campus';
                          etaColor = 'text-emerald-300';
                        } else if (assignedBus?.status === 'on-route' && busEta) {
                          isLive = true;
                          const currentIdx = busEta.currentStopIndex;
                          if (stopIdx !== -1 && stopIdx < currentIdx) {
                            etaLabel = 'Bus departed pickup point';
                            etaColor = 'text-slate-400';
                          } else {
                            const stopsAway = stopIdx !== -1 ? Math.max(0, stopIdx - currentIdx) : 1;
                            const estMin = busEta.nextStopEtaMin + (stopsAway > 0 ? (stopsAway - 1) * 5 : 0);
                            etaLabel = `Stop Pickup ETA: ~${estMin}m (${formatClockTime(estMin)})`;
                            etaColor = 'text-amber-300';
                          }
                        } else {
                          etaLabel = 'Bus at terminal awaiting departure';
                          etaColor = 'text-slate-400';
                        }

                        return (
                          <div className="mt-3 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Live ETA:</span>
                            </span>
                            <span className={`font-mono font-bold text-[11px] ${etaColor}`}>
                              {etaLabel}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>SMS Alerts Active</span>
                      </span>

                      {onDeleteStudent && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${student.name} (${student.rollNumber})?`)) {
                              onDeleteStudent(student.id);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          title="Remove Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
                            })}
          </div>

          {/* QR POPUP - PASTE HERE */}

          {selectedStudentForQR && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    Student QR
                  </h3>

                  <button
                    onClick={() => setSelectedStudentForQR(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold"
                  >
                    Close
                  </button>
                </div>

                <StudentQRCode
                  studentId={selectedStudentForQR.id}
                  studentName={selectedStudentForQR.name}
                />

              </div>
            </div>
          
      )}

        </div>
      )}

      {/* Add Bus Modal */}
      <AddBusModal
        isOpen={isAddBusOpen}
        onClose={() => setIsAddBusOpen(false)}
        onSubmit={async (busData) => {
          if (onAddBus) await onAddBus(busData);
        }}
        routes={safeRoutes}
        districts={districts}
        selectedDistrict={selectedDistrict || districts[0]}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onSubmit={async (studentData) => {
          if (onAddStudent) await onAddStudent(studentData);
        }}
        buses={safeBuses}
        routes={safeRoutes}
        districts={districts}
        selectedDistrict={selectedDistrict || districts[0]}
      />
    </div>
  
      )}
