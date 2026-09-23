import React, { useState } from 'react';

interface SeatSelectorProps {
  totalSeats: number;
  occupiedSeats: number[];
  onConfirm: (seatNumber: number) => void;
}

export default function SeatSelector({
  totalSeats,
  occupiedSeats,
  onConfirm,
}: SeatSelectorProps) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedSeat === null) {
      alert('Please select a seat');
      return;
    }

    onConfirm(selectedSeat);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200">
      <h2 className="text-lg font-bold text-slate-900 mb-2">
        Select Your Seat
      </h2>

      <p className="text-sm text-slate-500 mb-4">
        Choose any available seat.
      </p>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {Array.from({ length: totalSeats }, (_, index) => {
          const seatNumber = index + 1;
          const isOccupied = occupiedSeats.includes(seatNumber);
          const isSelected = selectedSeat === seatNumber;

          return (
            <button
              key={seatNumber}
              disabled={isOccupied}
              onClick={() => setSelectedSeat(seatNumber)}
              className={`h-12 rounded-lg font-bold text-sm border-2 ${
                isOccupied
                  ? 'bg-red-100 border-red-300 text-red-500 cursor-not-allowed'
                  : isSelected
                  ? 'bg-cyan-500 border-cyan-600 text-white'
                  : 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
              }`}
            >
              {seatNumber}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mt-5 text-xs font-medium">
        <span>🟢 Available</span>
        <span>🔴 Occupied</span>
        <span>🔵 Selected</span>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full mt-5 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
      >
        Confirm Seat
      </button>
    </div>
  );
}