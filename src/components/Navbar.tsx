import React, { useState, useRef, useEffect } from 'react';
import { UserRole, FleetAlert, FuelAnomalyAlert, DistrictConfig, UserAccount } from '../types';
import { 
  Bus, 
  Users, 
  Shield, 
  Bell, 
  PhoneCall, 
  Radio, 
  MapPin, 
  ChevronDown, 
  Check, 
  Compass, 
  LogOut, 
  LogIn,
  UserCheck
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onOpenLogin?: () => void;
  alerts?: FleetAlert[];
  anomalies?: FuelAnomalyAlert[];
  unreadAlertsCount?: number;
  activeBusCount?: number;
  districts?: DistrictConfig[];
  selectedDistrict: DistrictConfig;
  onSelectDistrict: (districtId: string) => void;
  onOpenAlerts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  onLogout,
  onOpenLogin,
  alerts = [],
  anomalies = [],
  unreadAlertsCount,
  onOpenAlerts,
  activeBusCount = 0,
  districts = [],
  selectedDistrict,
  onSelectDistrict
}) => {
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeAnomalies = Array.isArray(anomalies) ? anomalies : [];
  const safeDistricts = Array.isArray(districts) ? districts : [];

  const unreadAlertCount = typeof unreadAlertsCount === 'number'
    ? unreadAlertsCount
    : (safeAlerts.filter(a => !a.isRead).length + safeAnomalies.filter(a => a.status === 'open' || !(a as any).resolved).length);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDistrictDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDistricts = safeDistricts.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-[500] shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40 shrink-0">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-slate-100 tracking-tight font-display flex items-center gap-1.5">
                CAMPUS <span className="text-amber-400 font-black">TRANSIT</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 animate-pulse">
                <Radio className="w-3 h-3 text-emerald-400" /> LIVE GPS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden md:block">
              Smart College Transit & Multi-Role Operations
            </p>
          </div>
        </div>

        {/* District Selector & Location Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}
            className="flex items-center gap-2 bg-slate-950 hover:bg-slate-850 text-slate-200 px-3 py-1.5 rounded-xl border border-amber-500/40 hover:border-amber-400 text-xs font-semibold shadow-inner transition group"
            title="Click to select District / City"
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
              <MapPin className="w-3.5 h-3.5" />
            </span>
            <div className="text-left hidden sm:block">
              <span className="text-[9px] block text-slate-400 font-normal leading-tight">District Location</span>
              <span className="font-bold text-amber-300 flex items-center gap-1">
                {selectedDistrict.name}
                <span className="text-[10px] text-slate-400 font-mono">({selectedDistrict.code})</span>
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${districtDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* District Dropdown Menu */}
          {districtDropdownOpen && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Select Transit District</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400/90 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                  {districts.length} Regions
                </span>
              </div>

              {/* Search Bar */}
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Search district (e.g. Tirunelveli)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              {/* Quick Tirunelveli Button if not selected */}
              {selectedDistrict.id !== 'tirunelveli' && (
                <button
                  onClick={() => {
                    onSelectDistrict('tirunelveli');
                    setDistrictDropdownOpen(false);
                  }}
                  className="w-full mb-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/50 rounded-xl p-2 text-left flex items-center justify-between text-xs font-bold text-amber-300 transition"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400 animate-bounce" />
                    <span>Go to Tirunelveli (TN-72)</span>
                  </div>
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-black">DEFAULT</span>
                </button>
              )}

              {/* Districts List */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {filteredDistricts.map((district) => {
                  const isSelected = district.id === selectedDistrict.id;
                  const isTirunelveli = district.id === 'tirunelveli';
                  return (
                    <button
                      key={district.id}
                      onClick={() => {
                        onSelectDistrict(district.id);
                        setDistrictDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-slate-950' : isTirunelveli ? 'bg-amber-400' : 'bg-slate-600'}`} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{district.name}</span>
                            {isTirunelveli && (
                              <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${isSelected ? 'bg-slate-900 text-amber-400' : 'bg-amber-950 text-amber-400 border border-amber-700/60'}`}>
                                Featured
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] block ${isSelected ? 'text-slate-900/80 font-medium' : 'text-slate-500'}`}>
                            {district.state} • {district.tagline}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-slate-900 text-amber-300' : 'bg-slate-950 text-slate-400'}`}>
                          {district.code}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher Tabs */}
        <nav className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => onRoleChange('student')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentRole === 'student'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Student / Parent Access</span>
            <span className="sm:hidden">Student/Parent</span>
          </button>

          <button
            onClick={() => onRoleChange('driver')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentRole === 'driver'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Driver Console</span>
            <span className="sm:hidden">Driver</span>
          </button>

          <button
            onClick={() => onRoleChange('admin')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentRole === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Fleet</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </nav>

        {/* User Account / Login & Alerts */}
        <div className="flex items-center gap-2">
          {currentUser && currentUser.role === 'student' && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-600/60 shadow-sm">
              <UserCheck className="w-3 h-3 text-cyan-400" />
              Student / Parent Access
            </span>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-lg object-cover border border-slate-700"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <span className="text-xs font-bold text-slate-200 block truncate max-w-[120px] leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-bold block leading-tight text-cyan-400">
                  {currentUser.role === 'student' ? 'Student / Parent Access' : currentUser.role}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition ml-1"
                  title="Switch Role / Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            onOpenLogin && (
              <button
                onClick={onOpenLogin}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )
          )}          {/* High-Visibility Theme Toggle: Always visible on all screen sizes */}
          <ThemeToggle variant="segmented" className="hidden md:inline-flex shrink-0" />
          <ThemeToggle variant="pill" className="md:hidden shrink-0" />

          {/* Alerts Bell */}
          <button
            onClick={onOpenAlerts}
            className="relative bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 p-2 rounded-xl border border-slate-700 transition shrink-0"
            title="Fleet Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md animate-bounce">
                {unreadAlertCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
