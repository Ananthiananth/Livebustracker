import React, { useState } from 'react';
import { Bus, SpecialTrip } from '../types';
import { Calendar, MapPin, Building2, Users, BusFront, Phone, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpecialTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  buses: Bus[];
  onSubmit: (tripData: Partial<SpecialTrip>) => Promise<void>;
}

export const SpecialTripModal: React.FC<SpecialTripModalProps> = ({
  isOpen,
  onClose,
  buses,
  onSubmit
}) => {
  const [tripName, setTripName] = useState<string>('Electronics Dept - ISRO Satellite Center Visit');
  const [purpose, setPurpose] = useState<SpecialTrip['purpose']>('Industrial Visit');
  const [department, setDepartment] = useState<string>('Department of Electronics & Communication');
  const [venueName, setVenueName] = useState<string>('ISRO Telemetry Tracking & Command Network (ISTRAC)');
  const [venueAddress, setVenueAddress] = useState<string>('Plot 12, Ring Road Industrial Zone, Peenya');
  const [venueLat, setVenueLat] = useState<number>(13.0250);
  const [venueLng, setVenueLng] = useState<number>(77.5250);
  const [startDateTime, setStartDateTime] = useState<string>('2026-08-22T08:00');
  const [endDateTime, setEndDateTime] = useState<string>('2026-08-22T17:30');
  const [passengerCount, setPassengerCount] = useState<number>(40);
  const [assignedBusId, setAssignedBusId] = useState<string>(buses.find(b => b.status !== 'on-route')?.id || buses[0]?.id || '');
  const [contactPerson, setContactPerson] = useState<string>('Dr. Aruna Sharma (Prof. ECE)');
  const [contactPhone, setContactPhone] = useState<string>('+91 98450 77889');
  const [estimatedDistanceKm, setEstimatedDistanceKm] = useState<number>(55);
  const [budgetAllocated, setBudgetAllocated] = useState<number>(6800);
  const [notes, setNotes] = useState<string>('Security clearance approved. Students to report at Campus Bay 2 by 7:45 AM.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const assignedBus = buses.find(b => b.id === assignedBusId) || buses[0];

  const handlePresetSelect = (preset: {
    name: string;
    venue: string;
    addr: string;
    lat: number;
    lng: number;
    purpose: SpecialTrip['purpose'];
    dept: string;
    dist: number;
  }) => {
    setTripName(preset.name);
    setVenueName(preset.venue);
    setVenueAddress(preset.addr);
    setVenueLat(preset.lat);
    setVenueLng(preset.lng);
    setPurpose(preset.purpose);
    setDepartment(preset.dept);
    setEstimatedDistanceKm(preset.dist);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        tripName,
        purpose,
        department,
        venueName,
        venueAddress,
        venueLat: Number(venueLat),
        venueLng: Number(venueLng),
        startDateTime,
        endDateTime,
        passengerCount: Number(passengerCount),
        assignedBusId: assignedBus.id,
        assignedBusNumber: assignedBus.busNumber,
        driverId: assignedBus.driverId,
        driverName: assignedBus.driverName,
        driverPhone: assignedBus.driverPhone,
        contactPerson,
        contactPhone,
        status: 'scheduled',
        estimatedDistanceKm: Number(estimatedDistanceKm),
        budgetAllocated: Number(budgetAllocated),
        notes
      });

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onClose();
    } catch (err) {
      console.error("Error scheduling special trip:", err);
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
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100 font-display">Schedule Special Trip & Venue</h3>
              <p className="text-xs text-slate-400">Industrial visits, sports tournaments, hackathons & outstation excursions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800 bg-slate-950/40">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1 mb-2">
            <Sparkles className="w-3 h-3" /> Quick Venue Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handlePresetSelect({
                name: "ISRO Space Center Technical Tour",
                venue: "ISRO Telemetry Tracking & Command Network",
                addr: "Plot 12, Ring Road Industrial Zone",
                lat: 13.0250,
                lng: 77.5250,
                purpose: "Industrial Visit",
                dept: "Department of Electronics & Communication",
                dist: 55
              })}
              className="text-[11px] bg-slate-800 hover:bg-purple-900/50 hover:border-purple-600 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg transition"
            >
              🚀 ISRO Space Center
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect({
                name: "Inter-Collegiate Football Finals",
                venue: "Kanteerava Multi-Purpose Sports Stadium",
                addr: "Kasturba Road, Sampangi Rama Nagara",
                lat: 12.9698,
                lng: 77.5926,
                purpose: "Sports Meet",
                dept: "Sports & Athletics Department",
                dist: 34
              })}
              className="text-[11px] bg-slate-800 hover:bg-purple-900/50 hover:border-purple-600 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg transition"
            >
              ⚽ Kanteerava Sports Stadium
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect({
                name: "National Science & Robotics Expo 2026",
                venue: "Bangalore International Exhibition Centre (BIEC)",
                addr: "10th Mile, Tumkur Road, Madavara",
                lat: 13.0630,
                lng: 77.4750,
                purpose: "Academic Conference",
                dept: "Department of Computer Science & Robotics",
                dist: 76
              })}
              className="text-[11px] bg-slate-800 hover:bg-purple-900/50 hover:border-purple-600 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg transition"
            >
              🏛️ BIEC Exhibition Grounds
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Trip Name & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Trip Name *
              </label>
              <input
                type="text"
                value={tripName}
                onChange={e => setTripName(e.target.value)}
                placeholder="e.g. Mechanical Industrial Visit"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Trip Purpose *
              </label>
              <select
                value={purpose}
                onChange={e => setPurpose(e.target.value as SpecialTrip['purpose'])}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="Industrial Visit">Industrial Visit</option>
                <option value="Sports Meet">Sports Meet / Tournament</option>
                <option value="Cultural Fest">Cultural Fest & Youth Competition</option>
                <option value="Academic Conference">Academic Conference / Hackathon</option>
                <option value="Special Event">Special Campus Transit Event</option>
              </select>
            </div>
          </div>

          {/* Department & Venue Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Organizing Department *
              </label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. Department of Mechanical Engg"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Venue Destination Name *
              </label>
              <input
                type="text"
                value={venueName}
                onChange={e => setVenueName(e.target.value)}
                placeholder="e.g. BOSCH Tech Plant Phase 2"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-purple-300"
                required
              />
            </div>
          </div>

          {/* Venue Address & Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Venue Address
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={e => setVenueAddress(e.target.value)}
                placeholder="Address / Landmark"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={venueLat}
                onChange={e => setVenueLat(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={venueLng}
                onChange={e => setVenueLng(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Date & Time Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Departure Date & Time *
              </label>
              <input
                type="datetime-local"
                value={startDateTime}
                onChange={e => setStartDateTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Expected Return Date & Time *
              </label>
              <input
                type="datetime-local"
                value={endDateTime}
                onChange={e => setEndDateTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Bus & Driver Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <BusFront className="w-3.5 h-3.5 text-amber-400" /> Assigned Bus *
              </label>
              <select
                value={assignedBusId}
                onChange={e => setAssignedBusId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {buses.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.busNumber} ({b.capacity} seats) - {b.status === 'on-route' ? '⚠️ On Active Route' : '✅ Available'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" /> Passenger Headcount *
              </label>
              <input
                type="number"
                min="1"
                max={assignedBus.capacity}
                value={passengerCount}
                onChange={e => setPassengerCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Max Capacity: {assignedBus.capacity} passengers
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Trip Budget (Fuel/Toll)
              </label>
              <input
                type="number"
                value={budgetAllocated}
                onChange={e => setBudgetAllocated(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* Contact Person & Driver Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Faculty Coordinator Name & Dept *
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                placeholder="Prof. Name"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" /> Coordinator Contact Phone *
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+91 98450 XXXXX"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Special Instructions / Gate Pass Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Entry passes sent to venue security..."
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
            />
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
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg flex items-center gap-2 transition"
            >
              <Calendar className="w-4 h-4" />
              {isSubmitting ? 'Scheduling...' : 'Dispatch & Schedule Special Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
