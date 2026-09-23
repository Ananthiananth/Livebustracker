import React, { useState, useEffect } from 'react';
import { StudentPassenger, Bus, Route, DistrictConfig } from '../types';
import { UserPlus, X, Check, Users, MapPin, Bus as BusIcon, GraduationCap, Phone, Mail, User } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentData: Partial<StudentPassenger>) => void;
  buses: Bus[];
  routes: Route[];
  districts: DistrictConfig[];
  selectedDistrict: DistrictConfig;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  buses = [],
  routes = [],
  districts = [],
  selectedDistrict
}) => {
  const [name, setName] = useState<string>('Kavitha Sundaram');
  const [rollNumber, setRollNumber] = useState<string>('24CS108');
  const [department, setDepartment] = useState<string>('Computer Science & Engineering');
  const [year, setYear] = useState<string>('2nd Year B.E.');
  const [busId, setBusId] = useState<string>(buses[0]?.id || 'bus-04');
  const [routeId, setRouteId] = useState<string>(routes[0]?.id || 'route-01');
  const [stopId, setStopId] = useState<string>('');
  const [stopName, setStopName] = useState<string>('Vannarpettai Chellapandian Roundana');
  const [parentName, setParentName] = useState<string>('K. Sundaram');
  const [parentPhone, setParentPhone] = useState<string>('+91 98421 11223');
  const [parentEmail, setParentEmail] = useState<string>('parent.sundaram@gmail.com');
  const [districtId, setDistrictId] = useState<string>(selectedDistrict?.id || 'tirunelveli');

  // Auto update route and stops when bus is selected
  useEffect(() => {
    const selectedBus = buses.find(b => b.id === busId);
    if (selectedBus?.assignedRouteId) {
      setRouteId(selectedBus.assignedRouteId);
    }
  }, [busId, buses]);

  const activeRoute = routes.find(r => r.id === routeId) || routes[0];

  useEffect(() => {
    if (activeRoute?.stops && activeRoute.stops.length > 0) {
      if (!stopId || !activeRoute.stops.some(s => s.id === stopId)) {
        setStopId(activeRoute.stops[0].id);
        setStopName(activeRoute.stops[0].name);
      }
    }
  }, [activeRoute, stopId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedBus = buses.find(b => b.id === busId);
    const chosenStop = activeRoute?.stops.find(s => s.id === stopId);

    onSubmit({
      name,
      rollNumber,
      department,
      year,
      busId,
      busNumber: assignedBus?.busNumber || 'Bus #04',
      routeId: activeRoute?.id || 'route-01',
      stopId: stopId || (chosenStop?.id || 'stop-01'),
      stopName: stopName || (chosenStop?.name || 'Vannarpettai Chellapandian Roundana'),
      parentName,
      parentPhone,
      parentEmail: parentEmail || undefined,
      districtId,
      status: 'waiting-at-stop',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 font-display">
                Enroll Student for Bus Transit
              </h2>
              <p className="text-xs text-slate-400">
                Register student credentials, assign bus seat & pickup stop, and configure parent SMS alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Student Name, Roll Number & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Kavitha Sundaram"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Roll / Register Number *
              </label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={e => setRollNumber(e.target.value)}
                placeholder="e.g. 24CS108"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-300 font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Academic Year *
              </label>
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="1st Year B.E.">1st Year B.E.</option>
                <option value="2nd Year B.E.">2nd Year B.E.</option>
                <option value="3rd Year B.E.">3rd Year B.E.</option>
                <option value="Final Year B.E.">Final Year B.E.</option>
                <option value="Postgraduate (M.E./MBA)">Postgraduate (M.E./MBA)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Department */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Department / Discipline *
            </label>
            <input
              type="text"
              required
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {/* Row 3: Bus, Route & Pickup Stop Allocation */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <BusIcon className="w-4 h-4" /> Transit Route & Boarding Allocation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Assigned Bus Unit *
                </label>
                <select
                  value={busId}
                  onChange={e => setBusId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.busNumber} ({b.plateNumber}) • {b.driverName} ({b.capacity} Seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Assigned Route
                </label>
                <select
                  value={routeId}
                  onChange={e => setRouteId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.code} - {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-300">
                Designated Morning Pickup Stop *
              </label>
              {activeRoute?.stops && activeRoute.stops.length > 0 ? (
                <select
                  value={stopId}
                  onChange={e => {
                    setStopId(e.target.value);
                    const st = activeRoute.stops.find(s => s.id === e.target.value);
                    if (st) setStopName(st.name);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none font-semibold text-amber-300"
                >
                  {activeRoute.stops.map(st => (
                    <option key={st.id} value={st.id}>
                      Stop {st.sequence}: {st.name} (Scheduled: {st.scheduledTime})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={stopName}
                  onChange={e => setStopName(e.target.value)}
                  placeholder="e.g. Vannarpettai Roundana"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Row 4: Parent / Guardian Emergency Contact Details */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> Parent & Guardian Emergency Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Parent / Guardian Name *
                </label>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                  placeholder="e.g. K. Sundaram"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Parent Mobile (SMS Alerts) *
                </label>
                <input
                  type="text"
                  required
                  value={parentPhone}
                  onChange={e => setParentPhone(e.target.value)}
                  placeholder="+91 98421 11223"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-emerald-300 font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Parent Email Address
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={e => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>Enroll & Assign Student</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
