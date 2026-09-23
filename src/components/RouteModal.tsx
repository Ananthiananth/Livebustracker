import React, { useState } from 'react';
import { Route, Stop } from '../types';
import { Route as RouteIcon, Plus, Trash2, MapPin, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (routeData: Partial<Route>) => Promise<void>;
}

export const RouteModal: React.FC<RouteModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [code, setCode] = useState<string>('R-04');
  const [name, setName] = useState<string>('Route 4: North Industrial Corridor to Campus');
  const [shift, setShift] = useState<Route['shift']>('Morning Pickup');
  const [color, setColor] = useState<string>('#f59e0b');
  const [totalDistanceKm, setTotalDistanceKm] = useState<number>(19.5);
  const [estimatedDurationMin, setEstimatedDurationMin] = useState<number>(45);
  const [stops, setStops] = useState<Array<{ name: string; scheduledTime: string; dwellTimeMin: number; studentsRegistered: number; lat: number; lng: number }>>([
    { name: 'Peenya Metro Station Gate 1', scheduledTime: '07:15 AM', dwellTimeMin: 3, studentsRegistered: 14, lat: 13.0320, lng: 77.5250 },
    { name: 'Yeshwantpur Circle Bus Bay', scheduledTime: '07:30 AM', dwellTimeMin: 3, studentsRegistered: 18, lat: 13.0220, lng: 77.5500 },
    { name: 'Malleswaram 8th Cross', scheduledTime: '07:42 AM', dwellTimeMin: 2, studentsRegistered: 11, lat: 13.0020, lng: 77.5700 },
    { name: 'Apex College Main Gate (Terminal)', scheduledTime: '08:00 AM', dwellTimeMin: 5, studentsRegistered: 43, lat: 12.9780, lng: 77.6400 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAddStop = () => {
    setStops([
      ...stops,
      {
        name: `Stop #${stops.length + 1} New Point`,
        scheduledTime: '07:50 AM',
        dwellTimeMin: 2,
        studentsRegistered: 5,
        lat: 12.9800,
        lng: 77.6000
      }
    ]);
  };

  const handleRemoveStop = (idx: number) => {
    setStops(stops.filter((_, i) => i !== idx));
  };

  const handleStopChange = (idx: number, field: string, value: any) => {
    const updated = [...stops];
    updated[idx] = { ...updated[idx], [field]: value };
    setStops(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const generatedStops: Stop[] = stops.map((s, idx) => ({
        id: `stop-new-${Date.now()}-${idx}`,
        routeId: '',
        sequence: idx + 1,
        name: s.name,
        lat: Number(s.lat),
        lng: Number(s.lng),
        scheduledTime: s.scheduledTime,
        dwellTimeMin: Number(s.dwellTimeMin),
        studentsRegistered: Number(s.studentsRegistered),
        isCompleted: false
      }));

      const pathCoords: [number, number][] = stops.map(s => [Number(s.lat), Number(s.lng)]);

      await onSubmit({
        code,
        name,
        shift,
        color,
        totalDistanceKm: Number(totalDistanceKm),
        estimatedDurationMin: Number(estimatedDurationMin),
        status: 'active',
        stops: generatedStops,
        pathCoordinates: pathCoords
      });

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onClose();
    } catch (err) {
      console.error("Error creating route:", err);
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
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <RouteIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100 font-display">Create Bus Route & Stops</h3>
              <p className="text-xs text-slate-400">Configure route path, student pickup stops & schedules</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Route Code *
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="R-04"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Route Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Route 4: North Industrial to Campus"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Shift *
              </label>
              <select
                value={shift}
                onChange={e => setShift(e.target.value as Route['shift'])}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Morning Pickup">Morning Pickup</option>
                <option value="Evening Drop">Evening Drop</option>
                <option value="Midday Transit">Midday Transit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                value={totalDistanceKm}
                onChange={e => setTotalDistanceKm(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Route Color Tag
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs rounded-xl px-2.5 py-2.5 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Stops List */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Pickup Stops & Schedule Sequence ({stops.length} Stops)
                </h4>
                <p className="text-[11px] text-slate-400">Order stops sequentially from first pickup to campus gate</p>
              </div>
              <button
                type="button"
                onClick={handleAddStop}
                className="bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500 text-blue-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Stop
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {stops.map((stop, idx) => (
                <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-500/30 text-blue-300 font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={stop.name}
                    onChange={e => handleStopChange(idx, 'name', e.target.value)}
                    placeholder="Stop Name"
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={stop.scheduledTime}
                    onChange={e => handleStopChange(idx, 'scheduledTime', e.target.value)}
                    placeholder="07:30 AM"
                    className="w-24 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2 py-1.5 text-center focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  <input
                    type="number"
                    value={stop.studentsRegistered}
                    onChange={e => handleStopChange(idx, 'studentsRegistered', Number(e.target.value))}
                    title="Registered Students"
                    placeholder="Students"
                    className="w-16 bg-slate-800 border border-slate-700 text-emerald-400 font-bold rounded-lg px-2 py-1.5 text-center focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  {stops.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                      title="Remove stop"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
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
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center gap-2 transition"
            >
              <RouteIcon className="w-4 h-4" />
              {isSubmitting ? 'Creating Route...' : 'Save & Publish Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
