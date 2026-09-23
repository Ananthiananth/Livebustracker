import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Bus, 
  Route, 
  StudentPassenger, 
  FuelLog, 
  FuelAnomalyAlert, 
  SpecialTrip, 
  FleetAlert, 
  LiveLocation, 
  UserAccount ,
  AttendanceRecord,
  SeatAssignment
} from '../types';
import { 
  INITIAL_BUSES, 
  INITIAL_ROUTES, 
  INITIAL_STUDENTS, 
  INITIAL_FUEL_LOGS, 
  INITIAL_ANOMALIES, 
  INITIAL_SPECIAL_TRIPS, 
  INITIAL_ALERTS,
  INITIAL_LIVE_LOCATIONS
} from '../data/mockData';

// Collection references
const BUSES_COL = 'buses';
const ROUTES_COL = 'routes';
const STUDENTS_COL = 'students';
const FUEL_LOGS_COL = 'fuelLogs';
const FUEL_ALERTS_COL = 'fuelAlerts';
const SPECIAL_TRIPS_COL = 'specialTrips';
const FLEET_ALERTS_COL = 'fleetAlerts';
const LIVE_LOCATIONS_COL = 'liveLocations';
const USER_ACCOUNTS_COL = 'userAccounts';
const ATTENDANCE_COL = 'attendance';
const SEAT_ASSIGNMENTS_COL = 'seatAssignments';

export const DEFAULT_TRANSPORT_MANAGER: UserAccount = {
  id: 'usr-admin-default',
  name: 'Dr. R. Ramanathan',
  role: 'admin',
  isTransportManager: true,
  email: 'manager.transport@college.edu',
  officialEmail: 'manager.transport@college.edu',
  employeeId: 'TM-2024-001',
  designation: 'Chief Transport Director',
  department: 'Campus Fleet & Transit Operations Command',
  phone: '+91 94431 22890',
  collegeName: 'Government College of Engineering, Tirunelveli',
  districtId: 'tirunelveli',
  campusAddress: 'Tirunelveli - Nagercoil Highway, Palayamkottai, Tirunelveli - 627007',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  password: 'Manager@2026#Secure',
  handoverDate: '2025-06-01'
};

/**
 * Deeply strips undefined properties and transforms nested arrays (forbidden by Firestore)
 * into Firestore-safe object representations.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => {
      // Firestore does not allow arrays nested directly inside arrays (e.g. [[lat, lng], [lat, lng]])
      if (Array.isArray(item)) {
        if (item.length === 2 && typeof item[0] === 'number' && typeof item[1] === 'number') {
          return { lat: item[0], lng: item[1] };
        }
        return { values: item.map(sub => cleanForFirestore(sub)) };
      }
      return cleanForFirestore(item);
    }) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Deserializes a Route from Firestore, converting stored object coordinates back into [lat, lng] tuples.
 */
export function deserializeRoute(docData: any): Route {
  if (!docData) return docData;
  let pathCoordinates: [number, number][] = [];
  if (Array.isArray(docData.pathCoordinates)) {
    pathCoordinates = docData.pathCoordinates.map((coord: any) => {
      if (Array.isArray(coord)) {
        return [Number(coord[0]), Number(coord[1])] as [number, number];
      } else if (coord && typeof coord === 'object' && 'lat' in coord && 'lng' in coord) {
        return [Number(coord.lat), Number(coord.lng)] as [number, number];
      }
      return [0, 0] as [number, number];
    });
  }
  return {
    ...docData,
    pathCoordinates
  } as Route;
}

/**
 * Seed initial mock datasets into Cloud Firestore if collections are empty.
 */
export async function seedDatabaseIfEmpty(): Promise<boolean> {
  try {
    const busSnap = await getDocs(collection(db, BUSES_COL));
    if (!busSnap.empty) {
      console.log('⚡ Firestore database already seeded with data.');
      return false;
    }

    console.log('🌱 Seeding initial college fleet data into Firestore...');
    const batch = writeBatch(db);

    // 1. Seed Buses
    INITIAL_BUSES.forEach((bus) => {
      const ref = doc(db, BUSES_COL, bus.id);
      batch.set(ref, cleanForFirestore({
        ...bus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    });

    // 2. Seed Routes
    INITIAL_ROUTES.forEach((route) => {
      const ref = doc(db, ROUTES_COL, route.id);
      batch.set(ref, cleanForFirestore({
        ...route,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    });

    // 3. Seed Students
    INITIAL_STUDENTS.forEach((student) => {
      const ref = doc(db, STUDENTS_COL, student.id);
      batch.set(ref, cleanForFirestore({
        ...student,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    });

    // 4. Seed Fuel Logs
    INITIAL_FUEL_LOGS.forEach((log) => {
      const ref = doc(db, FUEL_LOGS_COL, log.id);
      batch.set(ref, cleanForFirestore(log));
    });

    // 5. Seed Fuel Alerts
    INITIAL_ANOMALIES.forEach((alert) => {
      const ref = doc(db, FUEL_ALERTS_COL, alert.id);
      batch.set(ref, cleanForFirestore(alert));
    });

    // 6. Seed Special Trips
    INITIAL_SPECIAL_TRIPS.forEach((trip) => {
      const ref = doc(db, SPECIAL_TRIPS_COL, trip.id);
      batch.set(ref, cleanForFirestore(trip));
    });

    // 7. Seed Fleet Alerts
    INITIAL_ALERTS.forEach((alert) => {
      const ref = doc(db, FLEET_ALERTS_COL, alert.id);
      batch.set(ref, cleanForFirestore(alert));
    });

    // 8. Seed Live Locations
    Object.entries(INITIAL_LIVE_LOCATIONS).forEach(([busId, loc]) => {
      const ref = doc(db, LIVE_LOCATIONS_COL, busId);
      batch.set(ref, cleanForFirestore({ ...loc, busId }));
    });

    await batch.commit();
    console.log('✅ Firestore successfully initialized with college fleet dataset.');
    return true;
  } catch (error) {
    console.error('Error seeding initial Firestore database:', error);
    return false;
  }
}

// -------------------------------------------------------------
// Realtime Subscriptions
// -------------------------------------------------------------

export function subscribeToBuses(callback: (buses: Bus[]) => void): () => void {
  const q = collection(db, BUSES_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const buses: Bus[] = [];
        snapshot.forEach((doc) => buses.push(doc.data() as Bus));
        callback(buses);
      }
    },
    (err) => {
      console.warn('Firestore buses subscription notice:', err.message);
    }
  );
}

export function subscribeToRoutes(callback: (routes: Route[]) => void): () => void {
  const q = collection(db, ROUTES_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const routes: Route[] = [];
        snapshot.forEach((doc) => routes.push(deserializeRoute(doc.data())));
        callback(routes);
      }
    },
    (err) => {
      console.warn('Firestore routes subscription notice:', err.message);
    }
  );
}

export function subscribeToStudents(callback: (students: StudentPassenger[]) => void): () => void {
  const q = collection(db, STUDENTS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const students: StudentPassenger[] = [];
        snapshot.forEach((doc) => students.push(doc.data() as StudentPassenger));
        callback(students);
      }
    },
    (err) => {
      console.warn('Firestore students subscription notice:', err.message);
    }
  );
}

export function subscribeToFuelLogs(callback: (logs: FuelLog[]) => void): () => void {
  const q = collection(db, FUEL_LOGS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const logs: FuelLog[] = [];
        snapshot.forEach((doc) => logs.push(doc.data() as FuelLog));
        callback(logs);
      }
    },
    (err) => {
      console.warn('Firestore fuel logs subscription notice:', err.message);
    }
  );
}

export function subscribeToFuelAlerts(callback: (alerts: FuelAnomalyAlert[]) => void): () => void {
  const q = collection(db, FUEL_ALERTS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const alerts: FuelAnomalyAlert[] = [];
        snapshot.forEach((doc) => alerts.push(doc.data() as FuelAnomalyAlert));
        callback(alerts);
      }
    },
    (err) => {
      console.warn('Firestore fuel alerts subscription notice:', err.message);
    }
  );
}

export function subscribeToSpecialTrips(callback: (trips: SpecialTrip[]) => void): () => void {
  const q = collection(db, SPECIAL_TRIPS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const trips: SpecialTrip[] = [];
        snapshot.forEach((doc) => trips.push(doc.data() as SpecialTrip));
        callback(trips);
      }
    },
    (err) => {
      console.warn('Firestore special trips subscription notice:', err.message);
    }
  );
}

export function subscribeToFleetAlerts(callback: (alerts: FleetAlert[]) => void): () => void {
  const q = collection(db, FLEET_ALERTS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const alerts: FleetAlert[] = [];
        snapshot.forEach((doc) => alerts.push(doc.data() as FleetAlert));
        callback(alerts);
      }
    },
    (err) => {
      console.warn('Firestore fleet alerts subscription notice:', err.message);
    }
  );
}

export function subscribeToLiveLocations(callback: (locations: Record<string, LiveLocation>) => void): () => void {
  const q = collection(db, LIVE_LOCATIONS_COL);
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const map: Record<string, LiveLocation> = {};
        snapshot.forEach((doc) => {
          const data = doc.data() as LiveLocation;
          if (data && data.busId) {
            map[data.busId] = data;
          }
        });
        callback(map);
      }
    },
    (err) => {
      console.warn('Firestore live locations subscription notice:', err.message);
    }
  );
}

// -------------------------------------------------------------
// Database Mutations (Create, Update, Delete)
// -------------------------------------------------------------

export async function saveBusToDb(bus: Bus): Promise<void> {
  const ref = doc(db, BUSES_COL, bus.id);
  await setDoc(ref, cleanForFirestore({
    ...bus,
    updatedAt: new Date().toISOString()
  }), { merge: true });
}

export async function deleteBusFromDb(busId: string): Promise<void> {
  const ref = doc(db, BUSES_COL, busId);
  await deleteDoc(ref);
}

export async function saveRouteToDb(route: Route): Promise<void> {
  const ref = doc(db, ROUTES_COL, route.id);
  await setDoc(ref, cleanForFirestore({
    ...route,
    updatedAt: new Date().toISOString()
  }), { merge: true });
}

export async function deleteRouteFromDb(routeId: string): Promise<void> {
  const ref = doc(db, ROUTES_COL, routeId);
  await deleteDoc(ref);
}

export async function saveStudentToDb(student: StudentPassenger): Promise<void> {
  const ref = doc(db, STUDENTS_COL, student.id);
  await setDoc(ref, cleanForFirestore({
    ...student,
    updatedAt: new Date().toISOString()
  }), { merge: true });
}

export async function deleteStudentFromDb(studentId: string): Promise<void> {
  const ref = doc(db, STUDENTS_COL, studentId);
  await deleteDoc(ref);
}

export async function updateStudentStatusInDb(studentId: string, status: StudentPassenger['status'], boardedAtTime?: string): Promise<void> {
  const ref = doc(db, STUDENTS_COL, studentId);
  const updatePayload: Record<string, any> = {
    status,
    updatedAt: new Date().toISOString()
  };
  if (boardedAtTime !== undefined) {
    updatePayload.boardedAtTime = boardedAtTime;
  }
  await updateDoc(ref, cleanForFirestore(updatePayload));
}

export async function saveFuelLogToDb(log: FuelLog): Promise<void> {
  const ref = doc(db, FUEL_LOGS_COL, log.id);
  await setDoc(ref, cleanForFirestore(log), { merge: true });
}

export async function saveSpecialTripToDb(trip: SpecialTrip): Promise<void> {
  const ref = doc(db, SPECIAL_TRIPS_COL, trip.id);
  await setDoc(ref, cleanForFirestore(trip), { merge: true });
}

export async function saveFleetAlertToDb(alert: FleetAlert): Promise<void> {
  const ref = doc(db, FLEET_ALERTS_COL, alert.id);
  await setDoc(ref, cleanForFirestore(alert), { merge: true });
}

export async function markFleetAlertAsReadInDb(alertId: string): Promise<void> {
  const ref = doc(db, FLEET_ALERTS_COL, alertId);
  await updateDoc(ref, { read: true });
}

export async function updateLiveLocationInDb(busId: string, loc: LiveLocation): Promise<void> {
  const ref = doc(db, LIVE_LOCATIONS_COL, busId);
  await setDoc(ref, cleanForFirestore({
    ...loc,
    busId,
    lastUpdated: new Date().toLocaleTimeString()
  }), { merge: true });
}

export async function saveUserAccountToDb(account: UserAccount): Promise<void> {
  const ref = doc(db, USER_ACCOUNTS_COL, account.id);
  await setDoc(ref, cleanForFirestore({
    ...account,
    createdAt: account.handoverDate || new Date().toISOString()
  }), { merge: true });
}

export async function getUserAccountsFromDb(): Promise<UserAccount[]> {
  try {
    const snap = await getDocs(collection(db, USER_ACCOUNTS_COL));
    if (snap.empty) {
      return [DEFAULT_TRANSPORT_MANAGER];
    }
    const accounts: UserAccount[] = [];
    snap.forEach((d) => {
      accounts.push({ id: d.id, ...d.data() } as UserAccount);
    });
    // Ensure default manager is present if not in db
    if (!accounts.some(a => a.email.toLowerCase() === DEFAULT_TRANSPORT_MANAGER.email.toLowerCase())) {
      accounts.push(DEFAULT_TRANSPORT_MANAGER);
    }
    return accounts;
  } catch (err) {
    console.warn('Error fetching user accounts from Firestore, using fallback:', err);
    return [DEFAULT_TRANSPORT_MANAGER];
  }
}

export function subscribeToUserAccounts(callback: (accounts: UserAccount[]) => void): () => void {
  try {
    const colRef = collection(db, USER_ACCOUNTS_COL);
    const unsub = onSnapshot(colRef, (snapshot) => {
      const accounts: UserAccount[] = [];
      snapshot.forEach((doc) => {
        accounts.push({ id: doc.id, ...doc.data() } as UserAccount);
      });
      if (!accounts.some(a => a.email.toLowerCase() === DEFAULT_TRANSPORT_MANAGER.email.toLowerCase())) {
        accounts.push(DEFAULT_TRANSPORT_MANAGER);
      }
      callback(accounts);
    }, (err) => {
      console.warn('Realtime subscription error for user accounts:', err);
      callback([DEFAULT_TRANSPORT_MANAGER]);
    });
    return unsub;
  } catch (err) {
    console.warn('Failed to attach user accounts listener:', err);
    callback([DEFAULT_TRANSPORT_MANAGER]);
    return () => {};
  }
}

// -------------------------------------------------------------
// QR Attendance & Seat Assignment
// -------------------------------------------------------------

export async function saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
  const ref = doc(db, ATTENDANCE_COL, record.id);

  await setDoc(ref, cleanForFirestore(record), { merge: true });
}

export async function saveSeatAssignment(assignment: SeatAssignment): Promise<void> {
  const ref = doc(db, SEAT_ASSIGNMENTS_COL, assignment.id);

  await setDoc(ref, cleanForFirestore(assignment), { merge: true });
}

export async function getAttendanceForTrip(
  tripId: string
): Promise<AttendanceRecord[]> {
  const snapshot = await getDocs(collection(db, ATTENDANCE_COL));

  return snapshot.docs
    .map(doc => doc.data() as AttendanceRecord)
    .filter(record => record.tripId === tripId);
}
export async function getSeatAssignmentsForTrip(
  tripId: string
): Promise<SeatAssignment[]> {
  const snapshot = await getDocs(collection(db, SEAT_ASSIGNMENTS_COL));

  return snapshot.docs
    .map(doc => doc.data() as SeatAssignment)
    .filter(assignment => assignment.tripId === tripId);
}
