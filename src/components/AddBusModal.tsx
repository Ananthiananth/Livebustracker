import React, { useState } from 'react';
import { Bus, Route, DistrictConfig } from '../types';
import { Bus as BusIcon, X, Check, Gauge, Fuel, Users, Phone, User, Shield, MapPin, Hash } from 'lucide-react';

interface AddBusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (busData: Partial<Bus>) => void;
  routes: Route[];
  districts: DistrictConfig[];
  selectedDistrict: DistrictConfig;
}

export const AddBusModal: React.FC<AddBusModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  routes = [],
  districts = [],
  selectedDistrict
}) => {
  const [busNumber, setBusNumber] = useState<string>('Bus #16');
  const [plateNumber, setPlateNumber] = useState<string>('TN-72-AZ-9988');
  const [model, setModel] = useState<string>('Tata Starbus Ultra 52-Seater (BS-VI)');
  const [capacity, setCapacity] = useState<number>(52);
  const [fuelType, setFuelType] = useState<'Diesel' | 'EV' | 'CNG'>('Diesel');
  const [driverName, setDriverName] = useState<string>('S. Natarajan');
  const [driverPhone, setDriverPhone] = useState<string>('+91 98421 55667');
  const [assignedRouteId, setAssignedRouteId] = useState<string>(routes[0]?.id || '');
  const [districtId, setDistrictId] = useState<string>(selectedDistrict?.id || 'tirunelveli');
  const [expectedEfficiencyKmpl, setExpectedEfficiencyKmpl] = useState<number>(4.8);
  const [fuelTankCapacity, setFuelTankCapacity] = useState<number>(120);
  const [currentFuelLevel, setCurrentFuelLevel] = useState<number>(95);
  const [currentOdometer, setCurrentOdometer] = useState<number>(42500);
  const [year, setYear] = useState<number>(2024);
  const [status, setStatus] = useState<Bus['status']>('idle');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      busNumber,
      plateNumber,
      model,
      capacity: Number(capacity),
      currentPassengers: 0,
      fuelType,
      driverName,
      driverPhone,
      driverId: `drv-${Date.now().toString().slice(-4)}`,
      assignedRouteId: assignedRouteId || undefined,
      districtId,
      expectedEfficiencyKmpl: Number(expectedEfficiencyKmpl),
      fuelEfficiencyKmpl: Number(expectedEfficiencyKmpl),
      fuelTankCapacity: Number(fuelTankCapacity),
      currentFuelLevel: Number(currentFuelLevel),
      currentOdometer: Number(currentOdometer),
      year: Number(year),
      status,
      lastServiceDate: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <BusIcon className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 font-display">
                Add New College Bus to Fleet
              </h2>
              <p className="text-xs text-slate-400">
                Register bus unit, seat capacity, driver allocation, and fuel efficiency benchmark
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
          {/* Row 1: Bus Number, Plate & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Bus Callout / Number *
              </label>
              <input
                type="text"
                required
                value={busNumber}
                onChange={e => setBusNumber(e.target.value)}
                placeholder="e.g. Bus #16"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Registration / Plate Number *
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={e => setPlateNumber(e.target.value)}
                placeholder="e.g. TN-72-AZ-9988"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-amber-300 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Total Seat Capacity *
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min={10}
                  max={90}
                  value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  placeholder="52"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Vehicle Model, Fuel Type & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Vehicle Model & Make
              </label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="e.g. Ashok Leyland Viking / Tata Starbus"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={e => setFuelType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Diesel">Diesel (HSD)</option>
                <option value="EV">Electric (EV)</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
          </div>

          {/* Row 3: Driver Details */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Driver Allocation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Driver Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  placeholder="e.g. S. Natarajan"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Driver Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={driverPhone}
                    onChange={e => setDriverPhone(e.target.value)}
                    placeholder="+91 98421 55667"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Route, District & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Assigned Route
              </label>
              <select
                value={assignedRouteId}
                onChange={e => setAssignedRouteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">Unassigned / Standby Unit</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Operating District
              </label>
              <select
                value={districtId}
                onChange={e => setDistrictId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {districts.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.state})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Initial Operational Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="idle">Idle / Ready</option>
                <option value="on-route">On-Route (Active)</option>
                <option value="special-trip">Special Venue Trip</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Row 5: Fuel & Mileage Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Expected Mileage (km/l)
              </label>
              <input
                type="number"
                step="0.1"
                value={expectedEfficiencyKmpl}
                onChange={e => setExpectedEfficiencyKmpl(Number(e.target.value))}
                placeholder="4.8"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Fuel Tank Capacity (Liters)
              </label>
              <input
                type="number"
                value={fuelTankCapacity}
                onChange={e => setFuelTankCapacity(Number(e.target.value))}
                placeholder="120"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Current Odometer (km)
              </label>
              <input
                type="number"
                value={currentOdometer}
                onChange={e => setCurrentOdometer(Number(e.target.value))}
                placeholder="42500"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
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
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>Register Bus in Fleet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
