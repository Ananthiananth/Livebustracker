import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface StudentQRCodeProps {
  studentId: string;
  studentName: string;
}

export default function StudentQRCode({
  studentId,
  studentName,
}: StudentQRCodeProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900">
        Student QR Code
      </h3>

      <QRCodeCanvas
        value={studentId}
        size={200}
        includeMargin={true}
      />

      <p className="text-sm font-medium text-slate-700">
        {studentName}
      </p>

      <p className="text-xs text-slate-500">
        Student ID: {studentId}
      </p>
    </div>
  );
}