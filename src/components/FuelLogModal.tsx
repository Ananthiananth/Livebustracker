import React, { useState, useEffect } from 'react';
import { Bus, FuelLog } from '../types';
import { Fuel, AlertTriangle, CheckCircle2, X, Calculator, Receipt, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FuelLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  buses: Bus[];
  onSubmit: (logData: Partial<FuelLog>) => Promise<void>;
  preselectedBusId?: string;
}

export const FuelLogModal: React.FC<FuelLogModalProps> = ({
  isOpen,
  onClose,
  buses,
  onSubmit,
  preselectedBusId
}) => {
  const [selectedBusId, setSelectedBusId] = useState<string>(preselectedBusId || buses[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [litersFilled, setLitersFilled] = useState<number>(80);
  const [costPerLiter, setCostPerLiter] = useState<number>(94.20);
  const [odometerReading, setOdometerReading] = useState<number>(0);
  const [fuelStationName, setFuelStationName] = useState<string>('HP Auto Hub - ORR Junction');
  const [receiptNumber, setReceiptNumber] = useState<string>(`REC-${Date.now().toString().slice(-5)}`);
  const [driverName, setDriverName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedBus = buses.find(b => b.id === selectedBusId) || buses[0];

  useEffect(() => {
    if (selectedBus) {
      setOdometerReading(selectedBus.currentOdometer + 380);
      setDriverName(selectedBus.driverName);
    }
  }, [selectedBusId, selectedBus]);

  if (!isOpen || !selectedBus) return null;

  const prevOdometer = selectedBus.currentOdometer;
  const distanceTravelled = Math.max(0, odometerReading - prevOdometer);
  const calculatedMileage = litersFilled > 0 ? Number((distanceTravelled / litersFilled).toFixed(2)) : 0;
  const expectedMileage = selectedBus.expectedEfficiencyKmpl || 4.6;
  const deviationPercent = expectedMileage > 0
    ? Number((((calculatedMileage - expectedMileage) / expectedMileage) * 100).toFixed(2))
    : 0;

  const totalCost = Number((litersFilled * costPerLiter).toFixed(2));
  const isAnomaly = calculatedMileage < (expectedMileage * 0.75) && distanceTravelled > 40;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        busId: selectedBus.id,
        busNumber: selectedBus.busNumber,
        date,
        time,
        litersFilled: Number(litersFilled),
        costPerLiter: Number(costPerLiter),
        totalCost,
        odometerReading: Number(odometerReading),
        previousOdometerReading: prevOdometer,
        distanceTravelledKm: distanceTravelled,
        calculatedMileageKmpl: calculatedMileage,
        expectedMileageKmpl: expectedMileage,
        deviationPercent,
        fuelStationName,
        receiptNumber,
        driverName,
        isAnomaly,
        anomalyReason: isAnomaly
          ? `Mileage dropped to ${calculatedMileage} km/l vs expected ${expectedMileage} km/l (${deviationPercent}% drop). Suspected fuel siphoning / theft or leakage.`
          : undefined,
        notes
      });

      if (!isAnomaly) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
      onClose();
    } catch (err) {
      console.error("Error logging fuel:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100 font-display">Log Fuel Refill & Mileage Check</h3>
              <p className="text-xs text-slate-400">Automated odometer differential calculation & fuel theft detection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Bus Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Select Fleet Bus *
              </label>
              <select
                value={selectedBusId}
                onChange={e => setSelectedBusId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {buses.map(bus => (
                  <option key={bus.id} value={bus.id}>
                    {bus.busNumber} ({bus.plateNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Driver on Duty
              </label>
              <input
                type="text"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                placeholder="Driver Name"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Date, Time & Station */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Refill Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Refill Time
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Receipt / Invoice #
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={e => setReceiptNumber(e.target.value)}
                placeholder="HP-2026-XXXX"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Odometer & Liters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  New Odometer (km) *
                </label>
              </div>
              <input
                type="number"
                min={prevOdometer}
                value={odometerReading}
                onChange={e => setOdometerReading(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Last reading: <span className="font-mono text-slate-300">{prevOdometer} km</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Liters Filled *
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max={selectedBus.fuelTankCapacity}
                value={litersFilled}
                onChange={e => setLitersFilled(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-amber-400 font-mono text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Tank Capacity: {selectedBus.fuelTankCapacity} L
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Fuel Price / Liter
              </label>
              <input
                type="number"
                step="0.01"
                value={costPerLiter}
                onChange={e => setCostPerLiter(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-emerald-400 mt-1 block font-semibold">
                Total: ₹{totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Station & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Fuel Pump / Partner Station
              </label>
              <input
                type="text"
                value={fuelStationName}
                onChange={e => setFuelStationName(e.target.value)}
                placeholder="e.g. HP Auto Hub - ORR Junction"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Audit Notes / Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Full tank filled after outstation trip"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Real-time Mileage Computation Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            isAnomaly
              ? 'bg-rose-950/50 border-rose-600/80 text-rose-200'
              : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {isAnomaly ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                <span className="font-bold text-sm">
                  {isAnomaly ? '🚨 High Risk: Suspected Fuel Theft / Siphoning Detected' : 'Normal Efficiency Range Verified'}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-slate-900 border border-slate-700">
                {deviationPercent >= 0 ? `+${deviationPercent}%` : `${deviationPercent}%`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block">Distance Run:</span>
                <span className="font-mono font-bold text-slate-100 text-sm">{distanceTravelled} km</span>
              </div>
              <div>
                <span className="text-slate-400 block">Calculated Mileage:</span>
                <span className={`font-mono font-bold text-sm ${isAnomaly ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {calculatedMileage} km/l
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Vehicle Expected:</span>
                <span className="font-mono font-bold text-slate-300 text-sm">{expectedMileage} km/l</span>
              </div>
            </div>

            {isAnomaly && (
              <p className="text-xs text-rose-300 mt-2 font-medium">
                ⚠️ Warning: Calculated mileage is {Math.abs(deviationPercent)}% below baseline. Submitting this log will trigger an urgent fuel anomaly investigation alert in the Admin Transport room.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 transition ${
                isAnomaly
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              <Receipt className="w-4 h-4" />
              {isSubmitting ? 'Logging Fuel...' : isAnomaly ? 'Submit & Flag Anomaly' : 'Verify & Log Fuel Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
