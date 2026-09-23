import React, { useState } from 'react';
import { Bus, Route, TripEndReport } from '../types';
import {
  Flag,
  Fuel,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Gauge,
  Receipt,
  Building2,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TripEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  bus: Bus;
  route: Route;
  currentDelay: number;
  incidentReason?: string | null;
  boardedStudentCount: number;
  onSubmit: (report: TripEndReport) => Promise<void>;
}

export const TripEndModal: React.FC<TripEndModalProps> = ({
  isOpen,
  onClose,
  bus,
  route,
  currentDelay,
  incidentReason,
  boardedStudentCount,
  onSubmit
}) => {
  const [fuelRefilled, setFuelRefilled] = useState<boolean>(false);
  const [fuelLiters, setFuelLiters] = useState<number>(40);
  const [fuelCostPerLiter, setFuelCostPerLiter] = useState<number>(96.5);
  const [fuelStationName, setFuelStationName] = useState<string>('Tirunelveli Central Highway HP Petrol Pump');
  const [receiptNumber, setReceiptNumber] = useState<string>(`REC-${Date.now().toString().slice(-5)}`);
  const [endingOdometer, setEndingOdometer] = useState<number>(bus.currentOdometer + (route.totalDistanceKm || 32));
  const [delayMinutes, setDelayMinutes] = useState<number>(currentDelay || 0);
  const [delayReason, setDelayReason] = useState<string>(incidentReason || (currentDelay > 0 ? 'Traffic signal congestion' : 'On-time delivery'));
  const [notes, setNotes] = useState<string>('Morning shift completed safely. All students dropped at Campus Terminal.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalCost = Number((fuelLiters * fuelCostPerLiter).toFixed(2));
  const distanceCovered = Math.max(1, endingOdometer - bus.currentOdometer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const report: TripEndReport = {
        busId: bus.id,
        routeId: route.id,
        driverId: bus.driverId,
        driverName: bus.driverName,
        totalDistanceKm: distanceCovered,
        endingOdometer,
        fuelRefilled,
        fuelLiters: fuelRefilled ? Number(fuelLiters) : undefined,
        fuelCostPerLiter: fuelRefilled ? Number(fuelCostPerLiter) : undefined,
        fuelStationName: fuelRefilled ? fuelStationName : undefined,
        receiptNumber: fuelRefilled ? receiptNumber : undefined,
        totalDelayMinutes: delayMinutes,
        delayReason,
        studentsBoardedCount: boardedStudentCount,
        notes,
        completedAt: new Date().toISOString()
      };

      await onSubmit(report);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onClose();
    } catch (err) {
      console.error("Failed to complete trip:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950/30 flex items-center justify-center font-bold">
              <Flag className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">End Trip & Submit Driver Log</h3>
              <p className="text-xs text-amber-100 opacity-90">
                {bus.busNumber} • {route.code}: {route.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-slate-100 max-h-[80vh] overflow-y-auto">
          {/* Trip Summary Quick Strip */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Driver</div>
              <div className="text-xs font-bold text-slate-200 truncate">{bus.driverName}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Est. Distance</div>
              <div className="text-xs font-bold text-amber-400">{distanceCovered} km</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Students Dropped</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{boardedStudentCount || bus.currentPassengers} Boarded</span>
              </div>
            </div>
          </div>

          {/* Odometer Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Final Odometer Reading (km) *</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={endingOdometer}
                onChange={e => setEndingOdometer(Number(e.target.value))}
                required
                min={bus.currentOdometer}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
              />
              <span className="text-xs text-slate-400 whitespace-nowrap font-mono">
                Start: {bus.currentOdometer} km
              </span>
            </div>
          </div>

          {/* Fuel Refill Question / Toggle */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Fuel Refilling Verification</div>
                  <div className="text-[11px] text-slate-400">Did you refill diesel during/after this shift?</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFuelRefilled(!fuelRefilled)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
                  fuelRefilled
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {fuelRefilled ? '✓ REFILLED' : 'NO REFILL'}
              </button>
            </div>

            {fuelRefilled && (
              <div className="space-y-3 pt-3 border-t border-slate-800 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Liters Filled (L) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={fuelLiters}
                      onChange={e => setFuelLiters(Number(e.target.value))}
                      required={fuelRefilled}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Rate per Liter (₹)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={fuelCostPerLiter}
                      onChange={e => setFuelCostPerLiter(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-lg text-amber-200 font-mono">
                  <span>Total Refill Amount:</span>
                  <span className="font-bold text-sm text-amber-300">₹{totalCost.toLocaleString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Fuel Pump Depot Name
                    </label>
                    <input
                      type="text"
                      value={fuelStationName}
                      onChange={e => setFuelStationName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Receipt / Bill Number
                    </label>
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={e => setReceiptNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delay & Incident Section */}
          <div className="space-y-3 bg-slate-950/90 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-400" />
                <span>Trip Delay Reporting</span>
              </label>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                delayMinutes > 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {delayMinutes > 0 ? `+${delayMinutes} MINS DELAY` : 'ON-TIME (0 MIN)'}
              </span>
            </div>

            {/* Quick Delay Presets */}
            <div className="flex flex-wrap gap-2">
              {[0, 5, 10, 15, 20].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDelayMinutes(mins)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                    delayMinutes === mins
                      ? 'bg-rose-600 text-white border-rose-500 shadow'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {mins === 0 ? 'No Delay' : `+${mins}m`}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Delay Reason / Traffic Explanation
              </label>
              <input
                type="text"
                value={delayReason}
                onChange={e => setDelayReason(e.target.value)}
                placeholder="e.g., Heavy rain, Samathanapuram signal delay, Railway gate closed"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* General Remarks / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Trip Remarks & Safety Handover
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel / Keep Tracking
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg hover:shadow-emerald-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Finalizing Trip...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm & Complete Trip</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
