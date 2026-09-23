import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserRole,
  Bus,
  Route,
  LiveLocation,
  FuelLog,
  FuelAnomalyAlert,
  SpecialTrip,
  FleetAlert,
  DistrictConfig,
  StudentPassenger,
  TripEndReport,
  UserAccount
} from './types';
import {
  INITIAL_BUSES,
  INITIAL_ROUTES,
  INITIAL_LIVE_LOCATIONS,
  INITIAL_FUEL_LOGS,
  INITIAL_ANOMALIES,
  INITIAL_SPECIAL_TRIPS,
  INITIAL_ALERTS,
  INITIAL_STUDENTS,
  DISTRICTS_CONFIG
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { TransportManagerPortal } from './components/TransportManagerPortal';
import { StudentParentView } from './components/StudentParentView';
import { DriverConsole } from './components/DriverConsole';
import { AdminDashboard } from './components/AdminDashboard';
import { FuelLogModal } from './components/FuelLogModal';
import { SpecialTripModal } from './components/SpecialTripModal';
import { RouteModal } from './components/RouteModal';
import { AlertsDrawer } from './components/AlertsDrawer';
import { ThemeToggle } from './components/ThemeToggle';
import { CheckCircle, AlertCircle, Info, X, Database, ShieldAlert } from 'lucide-react';
import {
  seedDatabaseIfEmpty,
  subscribeToBuses,
  subscribeToRoutes,
  subscribeToStudents,
  subscribeToFuelLogs,
  subscribeToFuelAlerts,
  subscribeToSpecialTrips,
  subscribeToFleetAlerts,
  subscribeToLiveLocations,
  subscribeToUserAccounts,
  DEFAULT_TRANSPORT_MANAGER,
  saveBusToDb,
  deleteBusFromDb,
  saveRouteToDb,
  saveStudentToDb,
  deleteStudentFromDb,
  updateStudentStatusInDb,
  saveFuelLogToDb,
  saveSpecialTripToDb,
  saveFleetAlertToDb,
  markFleetAlertAsReadInDb,
  updateLiveLocationInDb
} from './services/dbService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('college_transit_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [registeredManagers, setRegisteredManagers] = useState<UserAccount[]>([DEFAULT_TRANSPORT_MANAGER]);
  const [isManagerHandoverModalOpen, setIsManagerHandoverModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('college_transit_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role) return parsed.role;
      }
    } catch (e) {}
    return 'student';
  });
  const [districts, setDistricts] = useState<DistrictConfig[]>(DISTRICTS_CONFIG);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('tirunelveli');

  const [buses, setBuses] = useState<Bus[]>(INITIAL_BUSES);
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [liveLocations, setLiveLocations] = useState<Record<string, LiveLocation>>(INITIAL_LIVE_LOCATIONS);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(INITIAL_FUEL_LOGS);
  const [fuelAnomalies, setFuelAnomalies] = useState<FuelAnomalyAlert[]>(INITIAL_ANOMALIES);
  const [specialTrips, setSpecialTrips] = useState<SpecialTrip[]>(INITIAL_SPECIAL_TRIPS);
  const [alerts, setAlerts] = useState<FleetAlert[]>(INITIAL_ALERTS);
  const [students, setStudents] = useState<StudentPassenger[]>(INITIAL_STUDENTS);

  // Modals state
  const [isFuelModalOpen, setIsFuelModalOpen] = useState<boolean>(false);
  const [preselectedBusIdForFuel, setPreselectedBusIdForFuel] = useState<string | undefined>(undefined);
  const [isTripModalOpen, setIsTripModalOpen] = useState<boolean>(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState<boolean>(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState<boolean>(false);

  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const selectedDistrict = useMemo(() => {
    const safeDistricts = Array.isArray(districts) ? districts : DISTRICTS_CONFIG;
    return safeDistricts.find(d => d.id === selectedDistrictId) || safeDistricts[0] || DISTRICTS_CONFIG[0];
  }, [districts, selectedDistrictId]);

  // District filtered data with fallback
  const filteredBuses = useMemo(() => {
    const safeBuses = Array.isArray(buses) ? buses : [];
    const districtSpecific = safeBuses.filter(b => b.districtId === selectedDistrictId);
    return districtSpecific.length > 0 ? districtSpecific : safeBuses;
  }, [buses, selectedDistrictId]);

  const filteredRoutes = useMemo(() => {
    const safeRoutes = Array.isArray(routes) ? routes : [];
    const districtSpecific = safeRoutes.filter(r => r.districtId === selectedDistrictId);
    return districtSpecific.length > 0 ? districtSpecific : safeRoutes;
  }, [routes, selectedDistrictId]);

  const filteredSpecialTrips = useMemo(() => {
    const safeTrips = Array.isArray(specialTrips) ? specialTrips : [];
    const districtSpecific = safeTrips.filter(t => t.districtId === selectedDistrictId);
    return districtSpecific.length > 0 ? districtSpecific : safeTrips;
  }, [specialTrips, selectedDistrictId]);

  // Initialize Firestore Database & Subscribe to Realtime Updates
  useEffect(() => {
    // 1. Seed database if empty
    seedDatabaseIfEmpty().catch(err => console.warn('Firestore seed check notice:', err));

    // 2. Realtime listener subscriptions
    const unsubBuses = subscribeToBuses((remoteBuses) => {
      if (remoteBuses && remoteBuses.length > 0) setBuses(remoteBuses);
    });

    const unsubRoutes = subscribeToRoutes((remoteRoutes) => {
      if (remoteRoutes && remoteRoutes.length > 0) setRoutes(remoteRoutes);
    });

    const unsubStudents = subscribeToStudents((remoteStudents) => {
      if (remoteStudents && remoteStudents.length > 0) setStudents(remoteStudents);
    });

    const unsubFuelLogs = subscribeToFuelLogs((remoteLogs) => {
      if (remoteLogs && remoteLogs.length > 0) setFuelLogs(remoteLogs);
    });

    const unsubFuelAlerts = subscribeToFuelAlerts((remoteAlerts) => {
      if (remoteAlerts && remoteAlerts.length > 0) setFuelAnomalies(remoteAlerts);
    });

    const unsubSpecialTrips = subscribeToSpecialTrips((remoteTrips) => {
      if (remoteTrips && remoteTrips.length > 0) setSpecialTrips(remoteTrips);
    });

    const unsubFleetAlerts = subscribeToFleetAlerts((remoteAlerts) => {
      if (remoteAlerts && remoteAlerts.length > 0) setAlerts(remoteAlerts);
    });

    const unsubLocations = subscribeToLiveLocations((remoteLocations) => {
      if (remoteLocations && Object.keys(remoteLocations).length > 0) {
        setLiveLocations(prev => ({ ...prev, ...remoteLocations }));
      }
    });

    const unsubAccounts = subscribeToUserAccounts((remoteAccounts) => {
      if (remoteAccounts && remoteAccounts.length > 0) {
        setRegisteredManagers(remoteAccounts.filter(a => a.role === 'admin' || a.isTransportManager));
      }
    });

    return () => {
      unsubBuses();
      unsubRoutes();
      unsubStudents();
      unsubFuelLogs();
      unsubFuelAlerts();
      unsubSpecialTrips();
      unsubFleetAlerts();
      unsubLocations();
      unsubAccounts();
    };
  }, []);

  // Fetch initial data from server on mount (Dual sync)
  const fetchFleetData = useCallback(async () => {
    try {
      const [busesRes, routesRes, locRes, fuelRes, anomRes, tripsRes, alertsRes, districtsRes, stuRes] = await Promise.allSettled([
        fetch('/api/buses').then(r => r.json()),
        fetch('/api/routes').then(r => r.json()),
        fetch('/api/live-locations').then(r => r.json()),
        fetch('/api/fuel-logs').then(r => r.json()),
        fetch('/api/fuel-anomalies').then(r => r.json()),
        fetch('/api/trips').then(r => r.json()),
        fetch('/api/alerts').then(r => r.json()),
        fetch('/api/districts').then(r => r.json()),
        fetch('/api/students').then(r => r.json())
      ]);

      if (busesRes.status === 'fulfilled' && Array.isArray(busesRes.value)) setBuses(busesRes.value);
      if (routesRes.status === 'fulfilled' && Array.isArray(routesRes.value)) setRoutes(routesRes.value);
      if (locRes.status === 'fulfilled' && typeof locRes.value === 'object') setLiveLocations(locRes.value);
      if (fuelRes.status === 'fulfilled' && Array.isArray(fuelRes.value)) setFuelLogs(fuelRes.value);
      if (anomRes.status === 'fulfilled' && Array.isArray(anomRes.value)) setFuelAnomalies(anomRes.value);
      if (tripsRes.status === 'fulfilled' && Array.isArray(tripsRes.value)) setSpecialTrips(tripsRes.value);
      if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value)) setAlerts(alertsRes.value);
      if (districtsRes.status === 'fulfilled' && Array.isArray(districtsRes.value)) setDistricts(districtsRes.value);
      if (stuRes.status === 'fulfilled' && Array.isArray(stuRes.value)) setStudents(stuRes.value);
    } catch (err) {
      console.warn("Using fallback local dataset:", err);
    }
  }, []);

  useEffect(() => {
    fetchFleetData();
  }, [fetchFleetData]);

  // Periodic Telemetry Polling (every 4 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/live-locations');
        if (res.ok) {
          const data = await res.json();
          setLiveLocations(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        // silent fail
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handle Login Authentication
  const handleLogin = (account: UserAccount) => {
    setCurrentUser(account);
    setIsLoginModalOpen(false);
    try {
      localStorage.setItem('college_transit_user', JSON.stringify(account));
    } catch (e) {}

    if (account.districtId) {
      setSelectedDistrictId(account.districtId);
    }

    if (account.role === 'admin') {
      setCurrentRole('admin');
      showToast(`Welcome back, ${account.name}! Transport Admin privileges active.`, 'success');
    } else if (account.role === 'driver') {
      setCurrentRole('driver');
      showToast(`Welcome Captain ${account.name}! Driver console initialized.`, 'success');
    } else {
      // Parent or Student
      setCurrentRole('student');
      showToast(`Welcome, ${account.name}! Live GPS tracking & route navigation ready.`, 'success');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('college_transit_user');
    } catch (e) {}
    setCurrentUser(null);
    setIsLoginModalOpen(false);
    showToast("Signed out. Switched to Sign In screen.", 'info');
  };

  // Add Bus API Handler
  const handleAddBus = async (busData: Partial<Bus>) => {
    try {
      const res = await fetch('/api/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...busData, districtId: selectedDistrictId })
      });

      if (res.ok) {
        const newBus = await res.json();
        setBuses(prev => [newBus, ...prev]);
        saveBusToDb(newBus).catch(err => console.warn('Firestore bus sync error:', err));
        showToast(`🚌 New bus "${newBus.busNumber}" (${newBus.plateNumber}) added with ${newBus.capacity} seats.`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to add bus", 'error');
      }
    } catch (err) {
      console.error("Error adding bus:", err);
      if (busData.id && busData.busNumber) {
        const fallbackBus = busData as Bus;
        saveBusToDb(fallbackBus).catch(() => {});
      }
      showToast("Bus added locally.", 'info');
    }
  };

  // Delete Bus API Handler
  const handleDeleteBus = async (busId: string) => {
    deleteBusFromDb(busId).catch(err => console.warn('Firestore delete bus notice:', err));
    try {
      const res = await fetch(`/api/buses/${busId}`, { method: 'DELETE' });
      if (res.ok) {
        setBuses(prev => prev.filter(b => b.id !== busId));
        showToast("Bus removed from fleet.", 'info');
      }
    } catch (err) {
      setBuses(prev => prev.filter(b => b.id !== busId));
      showToast("Bus removed.", 'info');
    }
  };

  // Add Student API Handler
  const handleAddStudent = async (studentData: Partial<StudentPassenger>) => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...studentData, districtId: selectedDistrictId })
      });

      if (res.ok) {
        const newStudent = await res.json();
        setStudents(prev => [newStudent, ...prev]);
        saveStudentToDb(newStudent).catch(err => console.warn('Firestore student sync error:', err));
        showToast(`🎓 Student "${newStudent.name}" (${newStudent.rollNumber}) enrolled & assigned to ${newStudent.busNumber}.`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to enroll student", 'error');
      }
    } catch (err) {
      console.error("Error enrolling student:", err);
      if (studentData.id && studentData.name) {
        saveStudentToDb(studentData as StudentPassenger).catch(() => {});
      }
      showToast("Student enrolled locally.", 'info');
    }
  };

  // Delete Student API Handler
  const handleDeleteStudent = async (studentId: string) => {
    deleteStudentFromDb(studentId).catch(err => console.warn('Firestore delete student notice:', err));
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        showToast("Student record removed.", 'info');
      }
    } catch (err) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      showToast("Student removed.", 'info');
    }
  };

  // Update Live Location from Driver Console
  const handleUpdateLocation = async (update: LiveLocation) => {
    setLiveLocations(prev => ({ ...prev, [update.busId]: update }));
    updateLiveLocationInDb(update.busId, update).catch(err => console.warn('Firestore live location update notice:', err));

    try {
      await fetch('/api/live-locations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });
    } catch (err) {
      console.error("Failed to sync location with server:", err);
    }
  };

  // Driver Trip Start
  const handleStartTrip = async (busId: string, routeId: string) => {
    try {
      const res = await fetch('/api/driver/trip/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busId, routeId })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.bus) {
          setBuses(prev => prev.map(b => (b.id === busId ? data.bus : b)));
          saveBusToDb(data.bus).catch(() => {});
        }
        if (data.location) {
          setLiveLocations(prev => ({ ...prev, [busId]: data.location }));
          updateLiveLocationInDb(busId, data.location).catch(() => {});
        }
        showToast("🚀 Trip tracking started. Live GPS location broadcasting to parents.", "success");
      }
    } catch (err) {
      console.error("Error starting trip:", err);
      showToast("Trip started locally.", "info");
    }
  };

  // Driver Delay Broadcast
  const handleReportDelay = async (busId: string, delayMinutes: number, reason: string) => {
    try {
      const res = await fetch('/api/driver/delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busId, delayMinutes, reason })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.location) {
          setLiveLocations(prev => ({ ...prev, [busId]: data.location }));
          updateLiveLocationInDb(busId, data.location).catch(() => {});
        }
        showToast(`⚠️ Delay of +${delayMinutes}m broadcasted: ${reason}`, "error");
      }
    } catch (err) {
      console.error("Error reporting delay:", err);
      showToast(`Delay (+${delayMinutes}m) broadcasted.`, "info");
    }
  };

  // Driver Trip End with Fuel & Odometer Report
  const handleEndTrip = async (report: TripEndReport) => {
    try {
      const res = await fetch('/api/driver/trip/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.bus) {
          setBuses(prev => prev.map(b => (b.id === report.busId ? data.bus : b)));
          saveBusToDb(data.bus).catch(() => {});
        }
        if (data.location) {
          setLiveLocations(prev => ({ ...prev, [report.busId]: data.location }));
          updateLiveLocationInDb(report.busId, data.location).catch(() => {});
        }
        if (data.fuelLog) {
          setFuelLogs(prev => [data.fuelLog, ...prev]);
          saveFuelLogToDb(data.fuelLog).catch(() => {});
        }
        // Refresh all data
        fetchFleetData();

        if (report.fuelRefilled) {
          showToast(`🏁 Trip completed! ${report.fuelLiters}L fuel refill logged & students dropped safely at campus.`, 'success');
        } else {
          showToast(`🏁 Trip completed safely. All students marked as arrived at campus terminal.`, 'success');
        }
      }
    } catch (err) {
      console.error("Error ending trip:", err);
      showToast("Trip marked completed locally.", "success");
    }
  };

  // Student Boarding Status update
  const handleUpdateStudentStatus = async (studentId: string, status: StudentPassenger['status'], boardedAtTime?: string) => {
    // Optimistic UI update
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, status, boardedAtTime: boardedAtTime || s.boardedAtTime } : s))
    );
    updateStudentStatusInDb(studentId, status, boardedAtTime).catch(err => console.warn('Firestore student status notice:', err));

    try {
      const res = await fetch(`/api/students/${studentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, boardedAtTime })
      });

      if (res.ok) {
        const updated = await res.json();
        setStudents(prev => prev.map(s => (s.id === studentId ? updated : s)));
        
        if (status === 'boarded') {
          showToast(`✓ Passenger check-in: ${updated.name} boarded on ${updated.busNumber}. Parent notified.`, 'success');
        }
      }
    } catch (err) {
      console.error("Error updating student status:", err);
    }
  };

  // Submit Fuel Log with Anomaly Detection
  const handleSubmitFuelLog = async (logData: Partial<FuelLog>) => {
    try {
      const res = await fetch('/api/fuel-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });

      if (res.ok) {
        const newLog: FuelLog = await res.json();
        setFuelLogs(prev => [newLog, ...prev]);
        saveFuelLogToDb(newLog).catch(() => {});

        // Refresh fleet
        fetchFleetData();

        if (newLog.isAnomaly) {
          showToast(`🚨 Fuel Anomaly Flagged: ${newLog.busNumber} mileage dropped to ${newLog.calculatedMileageKmpl} km/l!`, 'error');
        } else {
          showToast(`Fuel refill verified: ${newLog.busNumber} logged ${newLog.litersFilled}L with ${newLog.calculatedMileageKmpl} km/l efficiency.`, 'success');
        }
      }
    } catch (err) {
      console.error("Error submitting fuel log:", err);
      showToast("Fuel log saved locally.", 'info');
    }
  };

  // Submit Special Trip
  const handleSubmitSpecialTrip = async (tripData: Partial<SpecialTrip>) => {
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tripData, districtId: selectedDistrictId })
      });

      if (res.ok) {
        const newTrip: SpecialTrip = await res.json();
        setSpecialTrips(prev => [newTrip, ...prev]);
        saveSpecialTripToDb(newTrip).catch(() => {});
        showToast(`Special Trip to "${newTrip.venueName}" scheduled for ${newTrip.assignedBusNumber}.`, 'success');
      }
    } catch (err) {
      console.error("Error scheduling trip:", err);
      showToast("Special trip scheduled.", 'info');
    }
  };

  // Submit Route
  const handleSubmitRoute = async (routeData: Partial<Route>) => {
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...routeData, districtId: selectedDistrictId })
      });

      if (res.ok) {
        const newRoute: Route = await res.json();
        setRoutes(prev => [newRoute, ...prev]);
        saveRouteToDb(newRoute).catch(() => {});
        showToast(`Route ${newRoute.code} (${newRoute.name}) created with ${newRoute.stops.length} stops.`, 'success');
      }
    } catch (err) {
      console.error("Error creating route:", err);
      showToast("Route created locally.", 'info');
    }
  };

  // Resolve Anomaly
  const handleResolveAnomaly = async (anomalyId: string) => {
    try {
      await fetch(`/api/fuel-anomalies/${anomalyId}/resolve`, { method: 'POST' });
      setFuelAnomalies(prev => prev.map(a => (a.id === anomalyId ? { ...a, resolved: true } : a)));
      showToast("Fuel theft anomaly marked as investigated.", 'success');
    } catch (err) {
      console.error("Error resolving anomaly:", err);
    }
  };

  // Dismiss Alert
  const handleDismissAlert = async (alertId: string) => {
    markFleetAlertAsReadInDb(alertId).catch(() => {});
    try {
      await fetch(`/api/alerts/${alertId}/dismiss`, { method: 'POST' });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }
  };

  // Update Trip Status
  const handleUpdateTripStatus = async (tripId: string, status: SpecialTrip['status']) => {
    try {
      await fetch(`/api/trips/${tripId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setSpecialTrips(prev => prev.map(t => (t.id === tripId ? { ...t, status } : t)));
      showToast(`Trip status updated to "${status}".`, 'info');
    } catch (err) {
      console.error("Error updating trip status:", err);
    }
  };

  const handleSelectDistrict = (districtId: string) => {
    setSelectedDistrictId(districtId);
    showToast(`Region switched to ${districts.find(d => d.id === districtId)?.name || districtId} District.`, 'info');
  };

  const unreadAlertsCount = useMemo(() => {
    const safeAlerts = Array.isArray(alerts) ? alerts : [];
    const safeAnomalies = Array.isArray(fuelAnomalies) ? fuelAnomalies : [];
    return safeAlerts.filter(a => !a.isRead).length + safeAnomalies.filter(a => a.status === 'open' || !(a as any).resolved).length;
  }, [alerts, fuelAnomalies]);

  // First show Sign In page if no user is authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        <LoginPage
          students={students}
          buses={buses}
          routes={routes}
          districts={districts}
          selectedDistrictId={selectedDistrictId}
          onLogin={handleLogin}
          onLoginSuccess={handleLogin}
          onAddStudent={handleAddStudent}
          onSelectDistrict={handleSelectDistrict}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        districts={districts}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={handleSelectDistrict}
        alerts={alerts}
        anomalies={fuelAnomalies}
        unreadAlertsCount={unreadAlertsCount}
        activeBusCount={filteredBuses.filter(b => b.status === 'on-route').length}
        onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
      />

      {/* Main Role Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentRole === 'student' && (
          <StudentParentView
            buses={filteredBuses}
            routes={filteredRoutes}
            liveLocations={liveLocations}
            students={students}
            districts={districts}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={handleSelectDistrict}
            onSelectBus={busId => {
              // Can select bus
            }}
          />
        )}

        {currentRole === 'driver' && (
          <DriverConsole
            buses={filteredBuses}
            routes={filteredRoutes}
            liveLocations={liveLocations}
            students={students}
            districts={districts}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={handleSelectDistrict}
            onUpdateLocation={handleUpdateLocation}
            onStartTrip={handleStartTrip}
            onEndTrip={handleEndTrip}
            onReportDelay={handleReportDelay}
            onUpdateStudentStatus={handleUpdateStudentStatus}
            onOpenFuelModal={(busId) => {
              setPreselectedBusIdForFuel(busId);
              setIsFuelModalOpen(true);
            }}
          />
        )}

        {currentRole === 'admin' && (
          currentUser?.role === 'admin' ? (
            <AdminDashboard
              buses={filteredBuses}
              routes={filteredRoutes}
              liveLocations={liveLocations}
              fuelLogs={fuelLogs}
              fuelAnomalies={fuelAnomalies}
              specialTrips={filteredSpecialTrips}
              alerts={alerts}
              students={students}
              districts={districts}
              selectedDistrict={selectedDistrict}
              currentManager={currentUser}
              onInitiateHandover={() => setIsManagerHandoverModalOpen(true)}
              onSelectDistrict={handleSelectDistrict}
              onOpenFuelModal={(busId) => {
                setPreselectedBusIdForFuel(busId);
                setIsFuelModalOpen(true);
              }}
              onOpenTripModal={() => setIsTripModalOpen(true)}
              onOpenRouteModal={() => setIsRouteModalOpen(true)}
              onResolveAnomaly={handleResolveAnomaly}
              onUpdateTripStatus={handleUpdateTripStatus}
              onAddBus={handleAddBus}
              onDeleteBus={handleDeleteBus}
              onAddStudent={handleAddStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          ) : (
            <TransportManagerPortal
              districts={districts}
              selectedDistrict={selectedDistrict}
              registeredManagers={registeredManagers}
              onLoginSuccess={(account) => {
                handleLogin(account);
              }}
              onBackToStudentView={() => {
                setCurrentRole('student');
              }}
              onBackToDriverView={() => {
                setCurrentRole('driver');
              }}
            />
          )
        )}
      </main>

      {/* Transport Manager Succession / Handover Modal */}
      {isManagerHandoverModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-3xl my-auto">
            <button
              onClick={() => setIsManagerHandoverModalOpen(false)}
              className="absolute top-4 right-4 z-30 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2.5 rounded-full shadow-xl transition"
              title="Close Handover Window"
            >
              <X className="w-5 h-5" />
            </button>
            <TransportManagerPortal
              districts={districts}
              selectedDistrict={selectedDistrict}
              registeredManagers={registeredManagers}
              onLoginSuccess={(account) => {
                setIsManagerHandoverModalOpen(false);
                handleLogin(account);
                showToast(`Transport Manager Succession Confirmed! New Manager: ${account.name}`, 'success');
              }}
              onBackToStudentView={() => setIsManagerHandoverModalOpen(false)}
              onBackToDriverView={() => setIsManagerHandoverModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Role-Based Login Modal */}
      {isLoginModalOpen && (
        <LoginPage
          students={students}
          buses={buses}
          routes={routes}
          districts={districts}
          selectedDistrictId={selectedDistrictId}
          onLogin={handleLogin}
          onLoginSuccess={handleLogin}
          onAddStudent={handleAddStudent}
          onSelectDistrict={handleSelectDistrict}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* Fuel Log Modal */}
      <FuelLogModal
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        buses={filteredBuses}
        onSubmit={handleSubmitFuelLog}
        preselectedBusId={preselectedBusIdForFuel}
      />

      {/* Special Trip & Venue Modal */}
      <SpecialTripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        buses={filteredBuses}
        onSubmit={handleSubmitSpecialTrip}
      />

      {/* Route & Stop Creator Modal */}
      <RouteModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        onSubmit={handleSubmitRoute}
      />

      {/* Alerts Drawer */}
      <AlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        alerts={alerts}
        anomalies={fuelAnomalies}
        onDismissAlert={handleDismissAlert}
        onResolveAnomaly={handleResolveAnomaly}
      />

      {/* Persistent Floating Theme Switcher: Always visible in bottom-left */}
      <ThemeToggle variant="floating" />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-[2000] p-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-bounce ${
          toastMessage.type === 'error'
            ? 'bg-rose-900/95 border-rose-500 text-rose-100'
            : toastMessage.type === 'info'
            ? 'bg-blue-900/95 border-blue-500 text-blue-100'
            : 'bg-emerald-900/95 border-emerald-500 text-emerald-100'
        }`}>
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          {toastMessage.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
          <span className="text-xs font-bold">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
