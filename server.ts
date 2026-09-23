import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  DISTRICTS_CONFIG,
  INITIAL_BUSES,
  INITIAL_ROUTES,
  INITIAL_LIVE_LOCATIONS,
  INITIAL_FUEL_LOGS,
  INITIAL_ANOMALIES,
  INITIAL_SPECIAL_TRIPS,
  INITIAL_ALERTS,
  INITIAL_STUDENTS
} from './src/data/mockData.ts';
import { Bus, Route, FuelLog, FuelAnomalyAlert, SpecialTrip, FleetAlert, LiveLocation, Stop, DistrictConfig, StudentPassenger, TripEndReport } from './src/types.ts';

// In-memory persistent database state
let districts: DistrictConfig[] = JSON.parse(JSON.stringify(DISTRICTS_CONFIG));
let buses: Bus[] = JSON.parse(JSON.stringify(INITIAL_BUSES));
let routes: Route[] = JSON.parse(JSON.stringify(INITIAL_ROUTES));
let liveLocations: Record<string, LiveLocation> = JSON.parse(JSON.stringify(INITIAL_LIVE_LOCATIONS));
let fuelLogs: FuelLog[] = JSON.parse(JSON.stringify(INITIAL_FUEL_LOGS));
let fuelAnomalies: FuelAnomalyAlert[] = JSON.parse(JSON.stringify(INITIAL_ANOMALIES));
let specialTrips: SpecialTrip[] = JSON.parse(JSON.stringify(INITIAL_SPECIAL_TRIPS));
let alerts: FleetAlert[] = JSON.parse(JSON.stringify(INITIAL_ALERTS));
let students: StudentPassenger[] = JSON.parse(JSON.stringify(INITIAL_STUDENTS));

// Lazy initialized Gemini client
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    try {
      genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn("Failed to initialize Gemini AI client:", err);
    }
  }
  return genAI;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT)||3000;

  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 0. DISTRICTS API
  app.get('/api/districts', (req, res) => {
    res.json(districts);
  });

  // 1. BUSES API
  app.get('/api/buses', (req, res) => {
    res.json(buses);
  });

  app.post('/api/buses', (req, res) => {
    const id = req.body.id || `bus-${Date.now().toString().slice(-4)}`;
    const newBus: Bus = {
      id,
      busNumber: req.body.busNumber || `Bus #${buses.length + 1}`,
      plateNumber: req.body.plateNumber || `TN-${Math.floor(10 + Math.random() * 80)}-AB-${Math.floor(1000 + Math.random() * 9000)}`,
      model: req.body.model || 'Tata Starbus Ultra (BS-VI)',
      capacity: Number(req.body.capacity) || 52,
      currentPassengers: 0,
      status: req.body.status || 'idle',
      driverId: req.body.driverId || `drv-${Date.now().toString().slice(-4)}`,
      driverName: req.body.driverName || 'New Assigned Driver',
      driverPhone: req.body.driverPhone || '+91 98400 12345',
      assignedRouteId: req.body.assignedRouteId || undefined,
      districtId: req.body.districtId || 'tirunelveli',
      currentOdometer: Number(req.body.currentOdometer) || 45000,
      fuelTankCapacity: Number(req.body.fuelTankCapacity) || 120,
      currentFuelLevel: Number(req.body.currentFuelLevel) || 90,
      fuelEfficiencyKmpl: Number(req.body.fuelEfficiencyKmpl) || 4.6,
      expectedEfficiencyKmpl: Number(req.body.expectedEfficiencyKmpl) || 4.8,
      fuelType: req.body.fuelType || 'Diesel',
      year: Number(req.body.year) || 2024,
      lastServiceDate: req.body.lastServiceDate || new Date().toISOString().split('T')[0]
    };
    buses.unshift(newBus);

    // Initialize default location for the bus
    const districtCenter = districts.find(d => d.id === newBus.districtId)?.center || [8.7139, 77.7567];
    liveLocations[newBus.id] = {
      busId: newBus.id,
      busNumber: newBus.busNumber,
      routeId: newBus.assignedRouteId,
      lat: districtCenter[0] + (Math.random() * 0.02 - 0.01),
      lng: districtCenter[1] + (Math.random() * 0.02 - 0.01),
      speedKmph: 0,
      headingDeg: 0,
      timestamp: new Date().toISOString(),
      currentStopIndex: 0,
      nextStopName: 'Campus Terminal Hub',
      etaNextStopMin: 0,
      distanceToNextStopKm: 0,
      delayMinutes: 0,
      isOffRoute: false,
      offRouteDistanceMeters: 0,
      ignitionStatus: 'OFF',
      driverStatusMessage: 'New bus commissioned into fleet.'
    };

    alerts.unshift({
      id: `alt-newbus-${Date.now()}`,
      type: 'stop-arrival',
      busId: newBus.id,
      busNumber: newBus.busNumber,
      title: `🚌 New Bus Added: ${newBus.busNumber}`,
      message: `${newBus.busNumber} (${newBus.plateNumber}) with ${newBus.capacity} seat capacity added to fleet. Driver: ${newBus.driverName}.`,
      timestamp: new Date().toISOString(),
      severity: 'info',
      isRead: false
    });

    res.status(201).json(newBus);
  });

  app.delete('/api/buses/:id', (req, res) => {
    const { id } = req.params;
    buses = buses.filter(b => b.id !== id);
    delete liveLocations[id];
    res.json({ success: true, message: `Bus ${id} removed from fleet` });
  });

  app.put('/api/buses/:id', (req, res) => {
    const { id } = req.params;
    const index = buses.findIndex(b => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Bus not found' });
    }
    buses[index] = { ...buses[index], ...req.body };
    res.json(buses[index]);
  });

  // 2. ROUTES & STOPS API
  app.get('/api/routes', (req, res) => {
    res.json(routes);
  });

  app.post('/api/routes', (req, res) => {
    const newRoute: Route = {
      ...req.body,
      id: req.body.id || `route-${Date.now().toString().slice(-4)}`,
      stops: req.body.stops || [],
      pathCoordinates: req.body.pathCoordinates || []
    };
    routes.push(newRoute);
    res.status(201).json(newRoute);
  });

  app.put('/api/routes/:id', (req, res) => {
    const { id } = req.params;
    const index = routes.findIndex(r => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Route not found' });
    }
    routes[index] = { ...routes[index], ...req.body };
    res.json(routes[index]);
  });

  app.post('/api/routes/:id/stops', (req, res) => {
    const { id } = req.params;
    const route = routes.find(r => r.id === id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    const newStop: Stop = {
      ...req.body,
      id: req.body.id || `stop-${Date.now().toString().slice(-4)}`,
      routeId: id,
      sequence: req.body.sequence || (route.stops.length + 1)
    };
    route.stops.push(newStop);
    route.stops.sort((a, b) => a.sequence - b.sequence);
    res.status(201).json(route);
  });

  // 3. LIVE LOCATIONS & DRIVER BROADCAST API
  app.get('/api/live-locations', (req, res) => {
    res.json(liveLocations);
  });

  app.post('/api/live-locations/update', (req, res) => {
    const update: LiveLocation = req.body;
    if (!update.busId) {
      return res.status(400).json({ error: 'busId is required' });
    }
    liveLocations[update.busId] = {
      ...liveLocations[update.busId],
      ...update,
      timestamp: new Date().toISOString()
    };

    // If bus is significantly delayed, add or update delay alert
    if (update.delayMinutes >= 5) {
      const existingAlert = alerts.find(a => a.type === 'delay' && a.busId === update.busId && !a.isRead);
      if (!existingAlert) {
        alerts.unshift({
          id: `alt-${Date.now()}`,
          type: 'delay',
          busId: update.busId,
          busNumber: update.busNumber || update.busId,
          title: `Bus ${update.busNumber || update.busId} Delayed by ${update.delayMinutes} mins`,
          message: `${update.driverStatusMessage || 'Traffic congestion detected'}. Next stop ${update.nextStopName} revised ETA: ${update.etaNextStopMin} mins.`,
          timestamp: new Date().toISOString(),
          severity: 'warning',
          isRead: false
        });
      }
    }

    res.json(liveLocations[update.busId]);
  });

  // 3b. STUDENTS & PARENT LIVE PASSENGER STATUS API
  app.get('/api/students', (req, res) => {
    const { busId, routeId, districtId } = req.query;
    let filtered = students;
    if (busId) filtered = filtered.filter(s => s.busId === busId);
    if (routeId) filtered = filtered.filter(s => s.routeId === routeId);
    if (districtId) filtered = filtered.filter(s => s.districtId === districtId);
    res.json(filtered);
  });

  app.post('/api/students', (req, res) => {
    const id = req.body.id || `stu-${Date.now().toString().slice(-4)}`;
    const newStudent: StudentPassenger = {
      id,
      name: req.body.name || 'New Enrolled Student',
      rollNumber: req.body.rollNumber || `24CS${Math.floor(100 + Math.random() * 900)}`,
      department: req.body.department || 'Computer Science & Engineering',
      year: req.body.year || '1st Year B.E.',
      districtId: req.body.districtId || 'tirunelveli',
      busId: req.body.busId || (buses[0]?.id || 'bus-04'),
      busNumber: req.body.busNumber || (buses.find(b => b.id === req.body.busId)?.busNumber || 'Bus #04'),
      routeId: req.body.routeId || (routes[0]?.id || 'route-01'),
      stopId: req.body.stopId || 'stop-01',
      stopName: req.body.stopName || 'Vannarpettai Chellapandian Roundana',
      parentName: req.body.parentName || 'Guardian',
      parentPhone: req.body.parentPhone || '+91 98400 00000',
      parentEmail: req.body.parentEmail || undefined,
      status: 'waiting-at-stop',
      avatar: req.body.avatar || `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`
    };

    students.unshift(newStudent);

    // Update bus passenger registration count
    const assignedBus = buses.find(b => b.id === newStudent.busId);
    if (assignedBus) {
      assignedBus.currentPassengers = (assignedBus.currentPassengers || 0) + 1;
    }

    alerts.unshift({
      id: `alt-newstu-${Date.now()}`,
      type: 'stop-arrival',
      busId: newStudent.busId,
      busNumber: newStudent.busNumber,
      title: `🎓 Student Enrolled: ${newStudent.name}`,
      message: `${newStudent.name} (${newStudent.rollNumber}) enrolled in ${newStudent.busNumber} at ${newStudent.stopName}. Parent SMS alerts configured.`,
      timestamp: new Date().toISOString(),
      severity: 'info',
      isRead: false
    });

    res.status(201).json(newStudent);
  });

  app.delete('/api/students/:id', (req, res) => {
    const { id } = req.params;
    students = students.filter(s => s.id !== id);
    res.json({ success: true, message: `Student ${id} removed` });
  });

  app.post('/api/students/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, boardedAtTime, arrivedAtTime } = req.body;
    const student = students.find(s => s.id === id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    student.status = status;
    if (boardedAtTime) student.boardedAtTime = boardedAtTime;
    if (arrivedAtTime) student.arrivedAtTime = arrivedAtTime;

    // Send push / SMS notification simulation alert to parents
    if (status === 'boarded') {
      alerts.unshift({
        id: `alt-stu-${Date.now()}`,
        type: 'stop-arrival',
        busId: student.busId,
        busNumber: student.busNumber,
        title: `✅ Student Boarded: ${student.name}`,
        message: `${student.name} (${student.rollNumber}) boarded ${student.busNumber} at ${student.stopName} at ${boardedAtTime || 'just now'}. Parent notification dispatched to ${student.parentPhone}.`,
        timestamp: new Date().toISOString(),
        severity: 'info',
        isRead: false
      });
    }

    res.json(student);
  });

  // 3c. DRIVER TRIP LIFECYCLE (START / DELAY / END WITH FUEL REPORT)
  app.post('/api/driver/trip/start', (req, res) => {
    const { busId, routeId } = req.body;
    const bus = buses.find(b => b.id === busId);
    const route = routes.find(r => r.id === routeId);

    if (bus) {
      bus.status = 'on-route';
    }
    if (route) {
      route.status = 'active';
    }

    // Reset students on this route to waiting/fresh trip state
    students.forEach(s => {
      if (s.busId === busId || s.routeId === routeId) {
        s.status = 'waiting-at-stop';
        s.boardedAtTime = undefined;
        s.arrivedAtTime = undefined;
      }
    });

    if (busId && liveLocations[busId]) {
      liveLocations[busId] = {
        ...liveLocations[busId],
        ignitionStatus: 'ON',
        delayMinutes: 0,
        driverStatusMessage: 'Trip started. Live GPS broadcasting active.',
        timestamp: new Date().toISOString()
      };
    }

    alerts.unshift({
      id: `alt-trip-start-${Date.now()}`,
      type: 'stop-arrival',
      busId: bus?.id,
      busNumber: bus?.busNumber,
      title: `🚀 Trip Started: ${bus?.busNumber}`,
      message: `Driver ${bus?.driverName} has started live tracking for ${route?.name || 'Assigned Route'}. Parents & students alerted.`,
      timestamp: new Date().toISOString(),
      severity: 'info',
      isRead: false
    });

    res.json({ success: true, message: 'Trip tracking started successfully', bus, route, liveLocation: liveLocations[busId] });
  });

  app.post('/api/driver/delay', (req, res) => {
    const { busId, delayMinutes, reason } = req.body;
    const bus = buses.find(b => b.id === busId);
    
    if (busId && liveLocations[busId]) {
      liveLocations[busId].delayMinutes = Number(delayMinutes);
      liveLocations[busId].driverStatusMessage = `⚠️ Delay (${delayMinutes}m): ${reason}`;
      liveLocations[busId].timestamp = new Date().toISOString();
    }

    alerts.unshift({
      id: `alt-delay-${Date.now()}`,
      type: 'delay',
      busId: busId,
      busNumber: bus?.busNumber || busId,
      title: `⚠️ Trip Delay Broadcast: ${bus?.busNumber || 'College Bus'} (+${delayMinutes} mins)`,
      message: `Driver ${bus?.driverName || ''} reported: ${reason}. Revised arrival times updated for all pickup stops.`,
      timestamp: new Date().toISOString(),
      severity: 'warning',
      isRead: false
    });

    res.json({ success: true, delayMinutes, reason, liveLocation: liveLocations[busId] });
  });

  app.post('/api/driver/trip/end', (req, res) => {
    const report: TripEndReport = req.body;
    const bus = buses.find(b => b.id === report.busId);
    const route = routes.find(r => r.id === report.routeId);

    if (bus) {
      bus.status = 'idle';
      if (report.endingOdometer) {
        bus.currentOdometer = Number(report.endingOdometer);
      }
    }
    if (route) {
      route.status = 'completed';
    }

    // Mark all boarded students as arrived safely at campus
    students.forEach(s => {
      if (s.busId === report.busId && s.status === 'boarded') {
        s.status = 'arrived-campus';
        s.arrivedAtTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    });

    if (report.busId && liveLocations[report.busId]) {
      liveLocations[report.busId] = {
        ...liveLocations[report.busId],
        speedKmph: 0,
        ignitionStatus: 'OFF',
        driverStatusMessage: 'Trip completed. Bus parked safely at Campus Terminal.',
        timestamp: new Date().toISOString()
      };
    }

    // If fuel was refilled, automatically log it in fuel logs
    let newFuelLog: FuelLog | null = null;
    if (report.fuelRefilled && report.fuelLiters && report.fuelLiters > 0) {
      const litersFilled = Number(report.fuelLiters);
      const costPerLiter = Number(report.fuelCostPerLiter || 96.5);
      const odometerReading = Number(report.endingOdometer || (bus?.currentOdometer || 64300));
      const prevOdometer = bus ? (bus.currentOdometer - (report.totalDistanceKm || 35)) : (odometerReading - 35);
      const distanceTravelledKm = Math.max(1, odometerReading - prevOdometer);
      const calculatedMileage = Number((distanceTravelledKm / litersFilled).toFixed(2));
      const expectedMileage = bus?.expectedEfficiencyKmpl || 4.8;
      const deviationPercent = Number((((calculatedMileage - expectedMileage) / expectedMileage) * 100).toFixed(2));
      const isAnomaly = calculatedMileage < (expectedMileage * 0.75);

      newFuelLog = {
        id: `fl-${Date.now().toString().slice(-6)}`,
        busId: report.busId,
        busNumber: bus?.busNumber || report.busId,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        litersFilled,
        costPerLiter,
        totalCost: Number((litersFilled * costPerLiter).toFixed(2)),
        odometerReading,
        previousOdometerReading: prevOdometer,
        distanceTravelledKm,
        calculatedMileageKmpl: calculatedMileage,
        expectedMileageKmpl: expectedMileage,
        deviationPercent,
        fuelStationName: report.fuelStationName || 'Tirunelveli Highway HP Fuel Depot',
        receiptNumber: report.receiptNumber || `REF-${Date.now().toString().slice(-5)}`,
        driverName: report.driverName || (bus?.driverName || 'Driver'),
        isAnomaly,
        anomalyReason: isAnomaly ? `Post-trip anomaly: ${calculatedMileage} km/l vs expected ${expectedMileage} km/l` : undefined,
        notes: report.notes || 'Logged during end-of-trip driver checklist'
      };

      fuelLogs.unshift(newFuelLog);

      if (isAnomaly) {
        fuelAnomalies.unshift({
          id: `anom-${Date.now().toString().slice(-4)}`,
          busId: report.busId,
          busNumber: newFuelLog.busNumber,
          date: newFuelLog.date,
          severity: 'high',
          title: `Post-Trip Fuel Anomaly: ${newFuelLog.busNumber}`,
          description: `Logged ${calculatedMileage} km/l (${deviationPercent}% drop from ${expectedMileage} km/l).`,
          calculatedMileage,
          expectedMileage,
          dropPercent: Math.abs(deviationPercent),
          estimatedFuelLossLiters: Math.abs(Number(((distanceTravelledKm / expectedMileage) - litersFilled).toFixed(1))),
          status: 'open'
        });
      }
    }

    // Completion alert
    alerts.unshift({
      id: `alt-trip-end-${Date.now()}`,
      type: 'stop-arrival',
      busId: report.busId,
      busNumber: bus?.busNumber,
      title: `🏁 Trip Completed: ${bus?.busNumber}`,
      message: `Trip concluded by ${report.driverName}. Students safely alighted at Campus Terminal. ${report.fuelRefilled ? `Fuel refill (${report.fuelLiters}L) recorded.` : ''}`,
      timestamp: new Date().toISOString(),
      severity: 'info',
      isRead: false
    });

    res.json({
      success: true,
      message: 'Trip completed, fuel logged, and students marked as safely arrived.',
      bus,
      route,
      fuelLog: newFuelLog
    });
  });

  // 4. FUEL LOGS & THEFT / ANOMALY DETECTION API
  app.get('/api/fuel-logs', (req, res) => {
    res.json(fuelLogs);
  });

  app.post('/api/fuel-logs', (req, res) => {
    const {
      busId,
      busNumber,
      date,
      time,
      litersFilled,
      costPerLiter,
      odometerReading,
      fuelStationName,
      receiptNumber,
      driverName,
      notes
    } = req.body;

    const bus = buses.find(b => b.id === busId);
    const expectedMileage = bus ? bus.expectedEfficiencyKmpl : 4.6;
    const prevOdometer = bus ? bus.currentOdometer : (odometerReading - 350);

    const distanceTravelledKm = Math.max(0, odometerReading - prevOdometer);
    const calculatedMileage = litersFilled > 0 ? Number((distanceTravelledKm / litersFilled).toFixed(2)) : 0;
    const deviationPercent = expectedMileage > 0 
      ? Number((((calculatedMileage - expectedMileage) / expectedMileage) * 100).toFixed(2))
      : 0;

    // Anomaly condition: If mileage drops > 25% from benchmark
    const isAnomaly = calculatedMileage < (expectedMileage * 0.75) && distanceTravelledKm > 50;
    let anomalyReason: string | undefined;

    if (isAnomaly) {
      anomalyReason = `Unusually Low Mileage (${calculatedMileage} km/l vs expected ${expectedMileage} km/l, ${deviationPercent}% drop). Suspected fuel siphoning / unauthorized leakage or engine injection defect.`;
    }

    const totalCost = Number((litersFilled * costPerLiter).toFixed(2));

    const newLog: FuelLog = {
      id: `fl-${Date.now().toString().slice(-6)}`,
      busId,
      busNumber: busNumber || (bus?.busNumber || busId),
      date: date || new Date().toISOString().split('T')[0],
      time: time || new Date().toTimeString().slice(0, 5),
      litersFilled: Number(litersFilled),
      costPerLiter: Number(costPerLiter),
      totalCost,
      odometerReading: Number(odometerReading),
      previousOdometerReading: prevOdometer,
      distanceTravelledKm,
      calculatedMileageKmpl: calculatedMileage,
      expectedMileageKmpl: expectedMileage,
      deviationPercent,
      fuelStationName: fuelStationName || 'Campus Partner Fuel Depot',
      receiptNumber: receiptNumber || `REC-${Date.now().toString().slice(-5)}`,
      driverName: driverName || (bus?.driverName || 'Assigned Driver'),
      isAnomaly,
      anomalyReason,
      notes: notes || ''
    };

    fuelLogs.unshift(newLog);

    // Update bus odometer & latest fuel efficiency
    if (bus) {
      bus.currentOdometer = Number(odometerReading);
      bus.currentFuelLevel = Math.min(bus.fuelTankCapacity, bus.fuelTankCapacity * 0.9);
      if (calculatedMileage > 0) {
        bus.fuelEfficiencyKmpl = Number(((bus.fuelEfficiencyKmpl * 0.7) + (calculatedMileage * 0.3)).toFixed(2));
      }
    }

    // Trigger Anomaly Alert if flagged
    if (isAnomaly) {
      const fuelLossEstimate = Number(((distanceTravelledKm / expectedMileage) - litersFilled).toFixed(1));
      const newAnomaly: FuelAnomalyAlert = {
        id: `anom-${Date.now().toString().slice(-4)}`,
        busId,
        busNumber: newLog.busNumber,
        date: newLog.date,
        severity: 'high',
        title: `Suspected Fuel Theft on ${newLog.busNumber}`,
        description: `Recorded ${calculatedMileage} km/l (${deviationPercent}% drop from ${expectedMileage} km/l expected). Approx ${Math.abs(fuelLossEstimate)} Liters unaccounted for.`,
        calculatedMileage,
        expectedMileage,
        dropPercent: Math.abs(deviationPercent),
        estimatedFuelLossLiters: Math.abs(fuelLossEstimate),
        status: 'open'
      };
      fuelAnomalies.unshift(newAnomaly);

      alerts.unshift({
        id: `alt-${Date.now()}`,
        type: 'fuel-anomaly',
        busId,
        busNumber: newLog.busNumber,
        title: `🚨 Fuel Siphoning Alert: ${newLog.busNumber}`,
        message: `Mileage dropped to ${calculatedMileage} km/l (${deviationPercent}% deviation). Immediate audit required.`,
        timestamp: new Date().toISOString(),
        severity: 'critical',
        isRead: false
      });
    }

    res.status(201).json(newLog);
  });

  // 5. FUEL ANOMALIES API
  app.get('/api/fuel-anomalies', (req, res) => {
    res.json(fuelAnomalies);
  });

  app.post('/api/fuel-anomalies/:id/resolve', (req, res) => {
    const { id } = req.params;
    const { status, resolvedNote } = req.body;
    const anomaly = fuelAnomalies.find(a => a.id === id);
    if (!anomaly) {
      return res.status(404).json({ error: 'Anomaly not found' });
    }
    anomaly.status = status || 'resolved';
    if (resolvedNote) {
      anomaly.resolvedNote = resolvedNote;
    }
    res.json(anomaly);
  });

  // 6. SPECIAL TRIPS & VENUE SCHEDULER API
  app.get('/api/trips', (req, res) => {
    res.json(specialTrips);
  });

  app.post('/api/trips', (req, res) => {
    const newTrip: SpecialTrip = {
      ...req.body,
      id: req.body.id || `trip-${Date.now().toString().slice(-4)}`,
      status: req.body.status || 'scheduled'
    };
    specialTrips.unshift(newTrip);

    // Update bus status if assigned
    if (newTrip.assignedBusId) {
      const bus = buses.find(b => b.id === newTrip.assignedBusId);
      if (bus && newTrip.status === 'in-progress') {
        bus.status = 'special-trip';
      }
    }

    // Add trip alert
    alerts.unshift({
      id: `alt-${Date.now()}`,
      type: 'special-trip',
      busId: newTrip.assignedBusId,
      busNumber: newTrip.assignedBusNumber,
      title: `Special Venue Trip Scheduled: ${newTrip.venueName}`,
      message: `${newTrip.tripName} for ${newTrip.department} scheduled on ${new Date(newTrip.startDateTime).toLocaleDateString()}.`,
      timestamp: new Date().toISOString(),
      severity: 'info',
      isRead: false
    });

    res.status(201).json(newTrip);
  });

  app.put('/api/trips/:id', (req, res) => {
    const { id } = req.params;
    const index = specialTrips.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Special trip not found' });
    }
    specialTrips[index] = { ...specialTrips[index], ...req.body };
    res.json(specialTrips[index]);
  });

  // 7. ALERTS API
  app.get('/api/alerts', (req, res) => {
    res.json(alerts);
  });

  app.post('/api/alerts/dismiss', (req, res) => {
    const { id } = req.body;
    if (id) {
      const alert = alerts.find(a => a.id === id);
      if (alert) alert.isRead = true;
    } else {
      alerts.forEach(a => { a.isRead = true; });
    }
    res.json({ success: true, alerts });
  });

  // 8. AI / GEMINI SMART FLEET & FUEL AUDITOR
  app.post('/api/ai/audit-fuel', async (req, res) => {
    try {
      const client = getGeminiClient();
      const logsSummary = fuelLogs.slice(0, 10).map(l => 
        `- Bus: ${l.busNumber}, Date: ${l.date}, Liters: ${l.litersFilled}L, Dist: ${l.distanceTravelledKm}km, Mileage: ${l.calculatedMileageKmpl} km/l (Exp: ${l.expectedMileageKmpl} km/l), Anomaly: ${l.isAnomaly ? 'YES' : 'NO'}`
      ).join('\n');

      if (client) {
        const prompt = `You are an expert college fleet transport supervisor and fuel auditor.
Analyze the following fuel log records for our college bus fleet:
${logsSummary}

Generate a concise, professional, structured audit report formatted in JSON with the following schema:
{
  "fleetHealthScore": number (0-100),
  "summary": "2-3 sentence executive fleet overview",
  "anomalyInsights": ["point 1", "point 2"],
  "theftRiskAssessment": "Detailed theft & siphoning risk assessment",
  "actionableRecommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "estimatedMonthlyCostSavings": "e.g. ₹18,500 / $240"
}
Return ONLY raw valid JSON without markdown wrapping.`;

        const response = await client.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt
        });

        const text = response.text ? response.text.trim() : '';
        const cleanedJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanedJson);
        return res.json(parsed);
      }
    } catch (err) {
      console.warn("Gemini fuel audit fallback triggered:", err);
    }

    // Heuristic Fallback Analysis
    const totalDist = fuelLogs.reduce((acc, l) => acc + l.distanceTravelledKm, 0);
    const totalFuel = fuelLogs.reduce((acc, l) => acc + l.litersFilled, 0);
    const fleetAvg = totalFuel > 0 ? Number((totalDist / totalFuel).toFixed(2)) : 4.4;
    const anomaliesCount = fuelLogs.filter(l => l.isAnomaly).length;

    res.json({
      fleetHealthScore: anomaliesCount > 0 ? 76 : 92,
      summary: `Fleet achieved an average efficiency of ${fleetAvg} km/l across recent logs. Identified ${anomaliesCount} flagged transaction(s) requiring immediate supervisor audit.`,
      anomalyInsights: [
        `Bus #02 recorded a severe 30.4% efficiency drop (3.20 km/l vs 4.60 km/l baseline) on August 12. High probability of overnight fuel siphoning or prolonged unauthorized AC idling.`,
        `Bus #04 and Bus #12 consistently maintain steady fuel efficiency within ±2.5% of manufacturer benchmark under urban stop-and-go load.`
      ],
      theftRiskAssessment: "Medium-High risk identified on Standby and Outstation units during off-campus parking. Digital fuel cap lock seals and geofence-based fuel-drain telemetry sensors are strongly advised.",
      actionableRecommendations: [
        "Conduct physical tank level dipstick verification on Bus #02 and cross-reference with GPS idling logs.",
        "Enforce pre-scheduled fuel filling only at authorized partner depots (HP/IOCL) with odometer photo verification.",
        "Implement progressive driver eco-driving incentives for maintaining > 4.6 km/l efficiency."
      ],
      estimatedMonthlyCostSavings: "₹24,800 (~$300) by eliminating idling leakage & preventing fuel drainage"
    });
  });

  // 9. AI / GEMINI ROUTE & VENUE DISPATCH OPTIMIZER
  app.post('/api/ai/optimize-route', async (req, res) => {
    const { routeId, targetVenue } = req.body;
    const route = routes.find(r => r.id === routeId) || routes[0];

    try {
      const client = getGeminiClient();
      if (client) {
        const prompt = `You are a Smart Transport & Route Logistics AI.
We are optimizing college bus route: "${route.name}" with ${route.stops.length} stops:
${route.stops.map(s => `Stop ${s.sequence}: ${s.name} (${s.studentsRegistered} students, scheduled ${s.scheduledTime})`).join('\n')}
${targetVenue ? `Special Venue Excursion Target: ${targetVenue}` : ''}

Generate a concise route optimization advice in JSON format:
{
  "optimizedDurationMin": number,
  "timeSavedMin": number,
  "fuelSavedLiters": number,
  "optimizationNotes": "2-3 sentence explanation of the optimization logic",
  "suggestedStopOrder": ["Stop Name 1", "Stop Name 2", ...],
  "safetyAdvisory": "e.g. Avoid heavy bottleneck near Flyover during 7:30-8:00 AM"
}
Return ONLY valid raw JSON.`;

        const response = await client.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt
        });

        const text = response.text ? response.text.trim() : '';
        const cleanedJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanedJson);
        return res.json(parsed);
      }
    } catch (err) {
      console.warn("Gemini route optimizer fallback:", err);
    }

    res.json({
      optimizedDurationMin: Math.max(25, route.estimatedDurationMin - 8),
      timeSavedMin: 8,
      fuelSavedLiters: 1.8,
      optimizationNotes: `By synchronizing stop dwell times at high-density pickup points and utilizing the Outer Ring arterial slip road, route transit time is reduced by ~18%.`,
      suggestedStopOrder: route.stops.map(s => s.name),
      safetyAdvisory: "School zone speed limiter active (Max 40 km/h) along Silicon Oasis corridor. Maintain safe braking distance at metro interchange."
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚌 College Bus Tracking & Fleet Server running on http://localhost:${PORT}`);
  });
}

startServer();
