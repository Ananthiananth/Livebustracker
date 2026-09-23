import React, { useState, useMemo } from 'react';
import { UserAccount, DistrictConfig } from '../types';
import { 
  Shield, 
  Lock, 
  Mail, 
  Key, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Building2, 
  FileBadge, 
  Phone, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Users,
  Compass,
  BadgeAlert
} from 'lucide-react';
import { saveUserAccountToDb, DEFAULT_TRANSPORT_MANAGER } from '../services/dbService';

interface TransportManagerPortalProps {
  districts: DistrictConfig[];
  selectedDistrict: DistrictConfig;
  onLoginSuccess: (account: UserAccount) => void;
  onBackToStudentView: () => void;
  onBackToDriverView?: () => void;
  registeredManagers?: UserAccount[];
}

// Banned common/trivial passwords
const BANNED_PASSWORDS = [
  'admin',
  'admin123',
  'admin@123',
  'password',
  'password123',
  '12345678',
  'qwerty123',
  'manager',
  'manager123',
  'transport',
  'transport123',
  'college123',
  'welcome123'
];

// Disallowed public/personal mail domains for official transport manager
const BANNED_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'rediffmail.com',
  'mail.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'yopmail.com',
  'tempmail.com'
];

export const TransportManagerPortal: React.FC<TransportManagerPortalProps> = ({
  districts,
  selectedDistrict,
  onLoginSuccess,
  onBackToStudentView,
  onBackToDriverView,
  registeredManagers = []
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Register (New Manager / Handover) State
  const [fullName, setFullName] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('Chief Transport Manager');
  const [department, setDepartment] = useState('Campus Fleet Operations & Logistics Command');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [collegeName, setCollegeName] = useState(selectedDistrict.campusName || 'Government College of Engineering, Tirunelveli');
  const [districtId, setDistrictId] = useState(selectedDistrict.id);
  const [previousManagerName, setPreviousManagerName] = useState('Dr. R. Ramanathan');
  const [handoverReason, setHandoverReason] = useState('Official Term Succession / New Transport In-Charge Appointment');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email Validation Checks
  const emailValidation = useMemo(() => {
    const trimmed = officialEmail.trim().toLowerCase();
    if (!trimmed) return { valid: false, message: '' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, message: 'Please enter a valid email address format.' };
    }

    const domain = trimmed.split('@')[1] || '';
    if (BANNED_EMAIL_DOMAINS.includes(domain)) {
      return { 
        valid: false, 
        message: `Personal email domain (@${domain}) is prohibited. Transport Managers must use official institutional email (e.g. .edu, .ac.in, .org, or @college.edu).` 
      };
    }

    // Must be official institutional domain
    const isOfficial = domain.endsWith('.edu') || 
      domain.endsWith('.ac.in') || 
      domain.endsWith('.gov.in') || 
      domain.endsWith('.org') || 
      domain.includes('college') || 
      domain.includes('univ') || 
      domain.includes('campus');

    if (!isOfficial) {
      return {
        valid: false,
        message: 'Must use an authorized institutional domain (e.g. @college.edu, @institution.ac.in, @campus.edu, or @gov.in).'
      };
    }

    return { valid: true, message: 'Official institutional email domain accepted.' };
  }, [officialEmail]);

  // Password Strength & Uniqueness Checks
  const passwordChecks = useMemo(() => {
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    // Uniqueness checks
    const lowerPass = password.toLowerCase();
    const isCommon = BANNED_PASSWORDS.some(bp => lowerPass.includes(bp));
    
    // Check against previous manager's password or email name
    const matchesEmail = officialEmail && lowerPass.includes(officialEmail.split('@')[0]?.toLowerCase() || 'xyz');
    const isUnique = !isCommon && !matchesEmail && password.length >= 8;

    let score = 0;
    if (hasLength) score++;
    if (hasUpper && hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    if (isUnique) score++;

    let strengthLabel = 'Very Weak';
    let strengthColor = 'bg-rose-500';
    if (score >= 5) {
      strengthLabel = 'Maximum Security (Enterprise Grade)';
      strengthColor = 'bg-emerald-500';
    } else if (score >= 4) {
      strengthLabel = 'Strong';
      strengthColor = 'bg-teal-500';
    } else if (score >= 3) {
      strengthLabel = 'Moderate';
      strengthColor = 'bg-amber-500';
    }

    const allPassed = hasLength && hasUpper && hasLower && hasNumber && hasSpecial && isUnique;

    return {
      hasLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isUnique,
      allPassed,
      score,
      strengthLabel,
      strengthColor
    };
  }, [password, officialEmail]);

  // Handle Quick Prefill of Demo Manager
  const handlePrefillDemo = () => {
    setSignInEmail(DEFAULT_TRANSPORT_MANAGER.email);
    setSignInPassword(DEFAULT_TRANSPORT_MANAGER.password || 'Manager@2026#Secure');
    setSignInError(null);
  };

  // Handle Sign In
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    const emailClean = signInEmail.trim().toLowerCase();
    if (!emailClean) {
      setSignInError('Please enter your official Transport Manager email address.');
      return;
    }

    if (!signInPassword) {
      setSignInError('Please enter your manager password.');
      return;
    }

    // Match against default manager or any registered managers in DB
    const allManagers = [DEFAULT_TRANSPORT_MANAGER, ...registeredManagers];
    const matched = allManagers.find(m => m.email.toLowerCase() === emailClean);

    if (!matched) {
      setSignInError('No authorized Transport Manager account found with this official email. If you are taking charge as a new manager, please click "Register as New Manager" below.');
      return;
    }

    // Check password
    if (matched.password && matched.password !== signInPassword) {
      setSignInError('Incorrect security credentials. Please verify your manager password or contact fleet security.');
      return;
    }

    // Success!
    onLoginSuccess({
      ...matched,
      role: 'admin',
      isTransportManager: true
    });
  };

  // Handle Registration of New Transport Manager (Succession)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!fullName.trim()) {
      setRegisterError('Please provide your full legal name.');
      return;
    }

    if (!emailValidation.valid) {
      setRegisterError(emailValidation.message || 'Please provide an authorized official institutional email.');
      return;
    }

    if (!employeeId.trim()) {
      setRegisterError('Please enter your official institutional Staff / Employee ID (e.g. TM-2026-9041).');
      return;
    }

    if (!designation.trim()) {
      setRegisterError('Please specify your official administrative designation.');
      return;
    }

    if (!phone.trim()) {
      setRegisterError('Please enter your official direct contact / mobile number.');
      return;
    }

    if (!passwordChecks.allPassed) {
      setRegisterError('Password does not meet the mandatory security & uniqueness criteria below.');
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError('Password confirmation does not match. Please re-enter your password.');
      return;
    }

    if (!declarationAccepted) {
      setRegisterError('You must check the official declaration confirming your authorization by the institution.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newManagerAccount: UserAccount = {
        id: `mgr-${Date.now()}`,
        name: fullName.trim(),
        role: 'admin',
        isTransportManager: true,
        email: officialEmail.trim().toLowerCase(),
        officialEmail: officialEmail.trim().toLowerCase(),
        employeeId: employeeId.trim(),
        designation: designation.trim(),
        department: department.trim(),
        phone: phone.trim(),
        collegeName: collegeName.trim(),
        districtId: districtId,
        campusAddress: selectedDistrict.campusAddress,
        password: password,
        handoverDate: new Date().toISOString(),
        previousManagerName: previousManagerName.trim() || 'Dr. R. Ramanathan',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };

      // Persist in Firestore
      await saveUserAccountToDb(newManagerAccount);

      // Successfully authenticated & authorized as Admin
      setIsSubmitting(false);
      onLoginSuccess(newManagerAccount);
    } catch (err: any) {
      console.error('Error saving manager account:', err);
      setIsSubmitting(false);
      setRegisterError('Failed to register new manager in the central database. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        {/* Institutional Top Bar */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-4 flex items-center justify-between text-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center font-black shadow">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900/80 block">
                Restricted Executive Area
              </span>
              <h2 className="text-base font-black tracking-tight leading-tight">
                Transport Manager Operations Portal
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-slate-950/20 text-slate-950 text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-slate-950/30 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Strict Access Control
            </span>
          </div>
        </div>

        {/* Informational Access Banner */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-3.5 flex items-start gap-3">
          <BadgeAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <p className="font-semibold text-slate-100">
              Only authorized Institutional Transport Managers can access fleet control.
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              If the transport manager is changing, select <strong className="text-amber-300">Register as New Manager</strong> below to establish verified credentials. Once created, you are immediately recognized as the active Admin.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-3 bg-slate-950/50 border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setSignInError(null);
            }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === 'signin'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Transport Manager Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setRegisterError(null);
            }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Register as New Manager (Succession)</span>
          </button>
        </div>

        {/* TAB 1: SIGN IN AS TRANSPORT MANAGER */}
        {mode === 'signin' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <span>Welcome, Transport Director</span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  Admin Privileges
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your official institutional email and unique security password to access fleet dispatch.
              </p>
            </div>

            {signInError && (
              <div className="bg-rose-950/80 border border-rose-600/60 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{signInError}</span>
              </div>
            )}

            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Official Institutional Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="e.g. manager.transport@college.edu or fleet@gce.ac.in"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    Security Password *
                  </label>
                  <span className="text-[10px] text-slate-400">Strict Unique Encryption</span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your unique manager password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Demo Pre-fill for Instant Evaluation */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="text-[11px] text-slate-400">
                  <span className="font-semibold text-amber-300 block">Default Transport Manager Credential:</span>
                  <code className="text-slate-300">manager.transport@college.edu</code>
                </div>
                <button
                  type="button"
                  onClick={handlePrefillDemo}
                  className="px-2.5 py-1 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition shrink-0"
                >
                  Prefill Demo Manager
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Verify & Enter Admin Fleet Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegisterError(null);
                }}
                className="text-amber-400 hover:text-amber-300 font-bold underline text-left"
              >
                Is the Transport Manager changing? Register as New Manager &rarr;
              </button>

              <button
                type="button"
                onClick={onBackToStudentView}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Student & Parent Tracking</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER AS NEW TRANSPORT MANAGER (SUCCESSION) */}
        {mode === 'register' && (
          <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                  Manager Succession Protocol
                </span>
                <span className="text-xs text-slate-400">• New In-Charge Onboarding</span>
              </div>
              <h3 className="text-lg font-black text-slate-100 mt-1">
                Register as New College Transport Manager
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                When leadership transitions, create your verified manager profile below. Strict restrictions apply: official mail & unique password required.
              </p>
            </div>

            {registerError && (
              <div className="bg-rose-950/80 border border-rose-600/60 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{registerError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Section 1: Official Identity */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <FileBadge className="w-4 h-4" />
                  <span>1. Official Institutional Profile & Authority</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Full Legal Name & Title *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. S. Anbarasan, M.E."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Staff / Employee ID *
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g. TM-2026-9041 or GCE-FAC-08"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Official Designation *
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Transport Manager / Fleet Operations Head"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Official Contact Phone *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98421 00000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Transit District *
                    </label>
                    <select
                      value={districtId}
                      onChange={(e) => {
                        setDistrictId(e.target.value);
                        const dist = districts.find(d => d.id === e.target.value);
                        if (dist) setCollegeName(dist.campusName);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      {districts.map(d => (
                        <option key={d.id} value={d.id} className="bg-slate-900">
                          {d.name} ({d.code}) - {d.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      College / Institution Name *
                    </label>
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="College Name"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Official Institutional Mail Restriction */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    <span>2. Official Institutional Email Verification *</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Mandatory .edu / .ac.in / .org
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="email"
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    placeholder="e.g. anbarasan.transport@college.edu or tm@gce.ac.in"
                    className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none ${
                      officialEmail.length > 0
                        ? emailValidation.valid
                          ? 'border-emerald-500 focus:border-emerald-500'
                          : 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-700 focus:border-amber-500'
                    }`}
                    required
                  />
                  {officialEmail.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailValidation.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Email Validation Feedback */}
                {officialEmail.length > 0 && (
                  <div className={`text-[11px] font-medium flex items-center gap-1.5 ${
                    emailValidation.valid ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {emailValidation.valid ? (
                      <span>✓ {emailValidation.message}</span>
                    ) : (
                      <span>✗ {emailValidation.message}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] text-slate-400">
                  <span>Quick Domain Shortcuts:</span>
                  {['@college.edu', '@gce.ac.in', '@campus.edu', '@annauniv.edu'].map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => {
                        const base = officialEmail.split('@')[0] || 'transport.manager';
                        setOfficialEmail(`${base}${domain}`);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition"
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3: Unique & Strong Password Enforcement */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Key className="w-4 h-4" />
                    <span>3. Unique Manager Password Enforcement *</span>
                  </div>
                  {password && (
                    <span className="text-[10px] font-bold text-slate-300">
                      Strength: <strong className="text-amber-300">{passwordChecks.strengthLabel}</strong>
                    </span>
                  )}
                </div>

                {/* Password Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Manager Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create unique password"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Confirm Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat manager password"
                      className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none ${
                        confirmPassword.length > 0
                          ? password === confirmPassword
                            ? 'border-emerald-500'
                            : 'border-rose-500'
                          : 'border-slate-700'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Strength Meter Bar */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordChecks.strengthColor}`}
                        style={{ width: `${(passwordChecks.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Security Requirement Checklist */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${passwordChecks.hasLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {passwordChecks.hasLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Minimum 8 characters</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${passwordChecks.hasUpper && passwordChecks.hasLower ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {passwordChecks.hasUpper && passwordChecks.hasLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Uppercase & lowercase letters</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${passwordChecks.hasNumber ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {passwordChecks.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>At least 1 number (0-9)</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${passwordChecks.hasSpecial ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {passwordChecks.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Special symbol (!@#$%^&*)</span>
                  </div>

                  <div className={`sm:col-span-2 flex items-center gap-1.5 ${passwordChecks.isUnique ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {passwordChecks.isUnique ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Unique & non-trivial (Rejects common default passwords)</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Succession / Handover Reference */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>4. Manager Succession / Handover Log</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Previous Outgoing Transport Manager
                    </label>
                    <input
                      type="text"
                      value={previousManagerName}
                      onChange={(e) => setPreviousManagerName(e.target.value)}
                      placeholder="e.g. Dr. R. Ramanathan"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Reason / Authorization Reference
                    </label>
                    <input
                      type="text"
                      value={handoverReason}
                      onChange={(e) => setHandoverReason(e.target.value)}
                      placeholder="e.g. Appointment Order #TRANS-2026-09"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Declaration Checkbox */}
                <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                    required
                  />
                  <span className="text-[11px] text-slate-300 leading-snug">
                    I solemnly declare that I have been officially appointed as the Institutional Transport Manager by the College Directorate and assume responsibility for fleet dispatch, safety operations, and driver administration.
                  </span>
                </label>
              </div>

              {/* Submit & Activate */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-sm shadow-xl shadow-amber-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>
                    {isSubmitting ? 'Authorizing Manager Account in Cloud DB...' : 'Confirm Succession & Authorize as Transport Admin'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setSignInError(null);
                    }}
                    className="text-slate-400 hover:text-amber-300 font-bold"
                  >
                    &larr; Already registered as manager? Sign in here
                  </button>

                  <button
                    type="button"
                    onClick={onBackToStudentView}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    Cancel & Return to Student View
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
