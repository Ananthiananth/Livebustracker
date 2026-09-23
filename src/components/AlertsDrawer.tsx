import React from 'react';
import { FleetAlert, FuelAnomalyAlert } from '../types';
import { Bell, AlertTriangle, ShieldAlert, Clock, MapPin, CheckCircle, X, ShieldCheck } from 'lucide-react';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: FleetAlert[];
  anomalies: FuelAnomalyAlert[];
  onDismissAlert: (id?: string) => void;
  onResolveAnomaly: (id: string, note?: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts = [],
  anomalies = [],
  onDismissAlert,
  onResolveAnomaly
}) => {
  if (!isOpen) return null;

  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeAnomalies = Array.isArray(anomalies) ? anomalies : [];

  const unreadAlerts = safeAlerts.filter(a => !a.isRead);
  const openAnomalies = safeAnomalies.filter(a => a.status === 'open' || !(a as any).resolved);

  return (
    <div className="fixed inset-0 z-[1100] flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border-l border-slate-700 w-full max-w-md h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 font-display">Live Fleet Alerts & Dispatch Feed</h3>
              <p className="text-[11px] text-slate-400">
                {unreadAlerts.length} Unread Alerts • {openAnomalies.length} Fuel Theft Audits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Auto-refresh active</span>
          {unreadAlerts.length > 0 && (
            <button
              onClick={() => onDismissAlert()}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Mark All as Read
            </button>
          )}
        </div>

        {/* Alert Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Critical Fuel Siphoning Anomalies */}
          {openAnomalies.map(anom => (
            <div
              key={anom.id}
              className="bg-rose-950/40 border border-rose-700/80 rounded-xl p-3.5 space-y-2 shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                  <span>SUSPECTED FUEL THEFT / LEAKAGE</span>
                </div>
                <span className="text-[10px] bg-rose-900/80 text-rose-200 px-2 py-0.5 rounded-full font-bold">
                  High Severity
                </span>
              </div>

              <h4 className="font-bold text-xs text-rose-100">{anom.title}</h4>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">{anom.description}</p>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2 rounded-lg text-[11px] font-mono border border-rose-900/50">
                <div>
                  <span className="text-slate-400 block text-[10px]">Actual vs Exp:</span>
                  <span className="text-rose-400 font-bold">{anom.calculatedMileage} vs {anom.expectedMileage} km/l</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Est. Fuel Loss:</span>
                  <span className="text-amber-400 font-bold">~{anom.estimatedFuelLossLiters} Liters</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  onClick={() => onResolveAnomaly(anom.id, "Verified by Transport In-charge. Odometer and fuel dipstick audited.")}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Acknowledge & Audit
                </button>
              </div>
            </div>
          ))}

          {/* Standard Fleet Alerts */}
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`rounded-xl p-3.5 border transition ${
                alert.severity === 'critical'
                  ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                  : alert.severity === 'warning'
                  ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
              } ${alert.isRead ? 'opacity-60' : 'opacity-100'}`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 font-bold">
                  {alert.type === 'fuel-anomaly' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                  {alert.type === 'delay' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                  {alert.type === 'off-route' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  {alert.type === 'stop-arrival' && <MapPin className="w-3.5 h-3.5 text-blue-400" />}
                  <span>{alert.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.message}</p>
              {!alert.isRead && (
                <div className="mt-2 text-right">
                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className="text-[11px] text-slate-400 hover:text-slate-100 font-medium"
                  >
                    Mark as read
                  </button>
                </div>
              )}
            </div>
          ))}

          {alerts.length === 0 && openAnomalies.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-500/50 mb-2" />
              <p className="text-sm">All clear! No active warnings or fuel anomalies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
