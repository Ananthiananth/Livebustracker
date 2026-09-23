import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole, StudentPassenger, Bus, Route, DistrictConfig, CollegeInfo } from '../types';
import { INITIAL_STUDENTS, INITIAL_BUSES, DISTRICTS_CONFIG, COLLEGES_BY_DISTRICT } from '../data/mockData';
import { saveUserAccountToDb } from '../services/dbService';
import { 
  ShieldCheck, 
  UserCheck, 
  Navigation, 
  ArrowRight, 
  Lock, 
  Mail, 
  Bus as BusIcon, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  KeyRound, 
  Eye, 
  EyeOff, 
  X, 
  Building2, 
  GraduationCap, 
  Phone, 
  UserPlus, 
  Compass, 
  ChevronRight,
  Route as RouteIcon,
  BadgeCheck,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThemeToggle } from './ThemeToggle';

interface LoginPageProps {
  onLogin?: (user: UserAccount) => void;
  onLoginSuccess?: (user: UserAccount) => void;
  onClose?: () => void;
  students?: StudentPassenger[];
  buses?: Bus[];
  routes?: Route[];
  districts?: DistrictConfig[];
  selectedDistrictId?: string;
  onAddStudent?: (studentData: Partial<StudentPassenger>) => Promise<void>;
  onSelectDistrict?: (districtId: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLogin, 
  onLoginSuccess,
  onClose, 
  students = INITIAL_STUDENTS, 
  buses = INITIAL_BUSES,
  routes = [],
  districts = DISTRICTS_CONFIG,
  selectedDistrictId = 'tirunelveli',
  onAddStudent,
  onSelectDistrict
}) => {
  const safeStudents = Array.isArray(students) && students.length > 0 ? students : INITIAL_STUDENTS;
  const safeBuses = Array.isArray(buses) && buses.length > 0 ? buses : INITIAL_BUSES;
  const safeDistricts = Array.isArray(districts) && districts.length > 0 ? districts : DISTRICTS_CONFIG;

  const triggerLogin = (user: UserAccount) => {
    // Persist account session in Firestore database
    saveUserAccountToDb(user).catch(err => console.warn('User account save notice:', err));

    if (user.districtId && onSelectDistrict) {
      onSelectDistrict(user.districtId);
    }
    if (onLogin) onLogin(user);
    if (onLoginSuccess) onLoginSuccess(user);
    if (onClose) onClose();
  };

  // Main Mode: 'signin' vs 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [signInRole, setSignInRole] = useState<UserRole>('student');
  const [signInEmail, setSignInEmail] = useState<string>('parent.sneha@gmail.com');
  const [signInPassword, setSignInPassword] = useState<string>('parent2026');
  const [showSignInPassword, setShowSignInPassword] = useState<boolean>(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(safeStudents[0]?.id || 'stu-01');
  const [selectedBusId, setSelectedBusId] = useState<string>(safeBuses[0]?.id || 'bus-04');
  const [signInDistrictId, setSignInDistrictId] = useState<string>(selectedDistrictId);

  // Sign Up (Create Account) State
  const [signUpRole, setSignUpRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState<string>('');
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [showSignUpPassword, setShowSignUpPassword] = useState<boolean>(false);

  // District & College inclusion
  const [selectedDistrict, setSelectedDistrict] = useState<string>(selectedDistrictId);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('gce-nellai');
  const [isCustomCollege, setIsCustomCollege] = useState<boolean>(false);
  const [customCollegeName, setCustomCollegeName] = useState<string>('');
  const [customCampusAddress, setCustomCampusAddress] = useState<string>('');

  // Student specific sign up fields
  const [rollNumber, setRollNumber] = useState<string>('');
  const [department, setDepartment] = useState<string>('Computer Science & Engineering (CSE)');
  const [yearOfStudy, setYearOfStudy] = useState<string>('1st Year B.E.');
  const [stopName, setStopName] = useState<string>('Vannarpettai Chellapandian Roundana');
  const [parentName, setParentName] = useState<string>('');
  const [assignedBusId, setAssignedBusId] = useState<string>(safeBuses[0]?.id || 'bus-04');

  // Admin specific sign up fields
  const [designation, setDesignation] = useState<string>('Chief Transport Director');
  const [adminDept, setAdminDept] = useState<string>('Campus Fleet Management & Student Transit');

  // Driver specific sign up fields
  const [licenseNumber, setLicenseNumber] = useState<string>('TN72-2022-0045812');
  const [experienceYears, setExperienceYears] = useState<number>(8);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Get available colleges for current chosen district
  const availableColleges = COLLEGES_BY_DISTRICT[selectedDistrict] || COLLEGES_BY_DISTRICT['tirunelveli'] || [];

  // Update default college when district changes in Sign Up
  useEffect(() => {
    const collegesForDistrict = COLLEGES_BY_DISTRICT[selectedDistrict] || [];
    if (collegesForDistrict.length > 0 && !isCustomCollege) {
      setSelectedCollegeId(collegesForDistrict[0].id);
    }
  }, [selectedDistrict, isCustomCollege]);

  // Switch role defaults for Sign In
  const handleSignInRoleChange = (role: UserRole) => {
    setSignInRole(role);
    setError(null);
    if (role === 'admin') {
      setSignInEmail('admin.transport@college.edu');
      setSignInPassword('admin2026');
    } else if (role === 'driver') {
      setSignInEmail('driver.murugan@college.edu');
      setSignInPassword('driver2026');
    } else {
      setSignInEmail('parent.sneha@gmail.com');
      setSignInPassword('parent2026');
    }
  };

  // Sign In Handler
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim()) {
      setError('Please enter your email or username');
      return;
    }

    const currentDistrictObj = safeDistricts.find(d => d.id === signInDistrictId) || safeDistricts[0];
    const defaultCollegeName = availableColleges[0]?.name || currentDistrictObj?.campusName || "Government College of Engineering, Tirunelveli";

    if (signInRole === 'admin') {
      const emailLower = signInEmail.toLowerCase().trim();
      const isOfficial = emailLower.includes('.edu') || 
                         emailLower.includes('.ac.in') || 
                         emailLower.includes('.gov.in') || 
                         emailLower.includes('@college.') ||
                         emailLower.endsWith('.org');
      const isPublicProvider = emailLower.endsWith('@gmail.com') || 
                               emailLower.endsWith('@yahoo.com') || 
                               emailLower.endsWith('@outlook.com') || 
                               emailLower.endsWith('@hotmail.com');

      if (!isOfficial || isPublicProvider) {
        setError('Transport Manager portal requires an authorized official institutional email (.edu / .ac.in / @college.edu). Public domains like @gmail.com are not permitted.');
        return;
      }

      if (!signInPassword || signInPassword.length < 6) {
        setError('Please enter your secure Transport Manager password (minimum 6 characters).');
        return;
      }

      triggerLogin({
        id: 'usr-admin-01',
        name: 'Dr. R. Ramanathan',
        role: 'admin',
        isTransportManager: true,
        email: signInEmail,
        officialEmail: signInEmail,
        districtId: signInDistrictId,
        collegeName: defaultCollegeName,
        campusAddress: currentDistrictObj?.campusAddress,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        department: 'Fleet & Transit Operations Command',
        designation: 'Chief Transport Director & Admin'
      });
    } else if (signInRole === 'driver') {
      const bus = safeBuses.find(b => b.id === selectedBusId) || safeBuses[0];
      triggerLogin({
        id: bus?.driverId || 'drv-04',
        name: bus?.driverName || 'M. Murugan (Senior Driver)',
        role: 'driver',
        email: signInEmail,
        districtId: signInDistrictId,
        collegeName: defaultCollegeName,
        phone: bus?.driverPhone || '+91 98421 78901',
        busId: bus?.id || 'bus-04',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      });
    } else {
      const student = safeStudents.find(s => s.id === selectedStudentId) || safeStudents[0];
      triggerLogin({
        id: `usr-parent-${student?.id || '01'}`,
        name: `${student?.parentName || 'Sundaram K'} (Parent of ${student?.name || 'Sneha'})`,
        role: 'student',
        email: signInEmail,
        districtId: signInDistrictId,
        collegeName: defaultCollegeName,
        studentId: student?.id,
        busId: student?.busId,
        rollNumber: student?.rollNumber,
        phone: student?.parentPhone,
        department: student?.department,
        avatar: student?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
      });
    }
  };

  // Quick Demo Login
  const handleQuickDemoLogin = (role: UserRole) => {
    const currentDistrictObj = safeDistricts.find(d => d.id === signInDistrictId) || safeDistricts[0];
    const defaultCollegeName = availableColleges[0]?.name || currentDistrictObj?.campusName || "Government College of Engineering, Tirunelveli";

    if (role === 'admin') {
      triggerLogin({
        id: 'usr-admin-01',
        name: 'Dr. R. Ramanathan (Transport Director)',
        role: 'admin',
        email: 'admin.transport@college.edu',
        districtId: signInDistrictId,
        collegeName: defaultCollegeName,
        campusAddress: currentDistrictObj?.campusAddress,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        department: 'Fleet & Transit Operations Command',
        designation: 'Institutional Fleet Director'
      });
    } else if (role === 'driver') {
      const targetBus = safeBuses.find(b => b.id === selectedBusId) || safeBuses[0];
      triggerLogin({
        id: targetBus?.driverId || 'drv-04',
        name: targetBus?.driverName || 'M. Murugan (Senior Driver)',
        role: 'driver',
        email: 'driver.murugan@college.edu',
        districtId: signInDistrictId,
        collegeName: defaultCollegeName,
        phone: targetBus?.driverPhone || '+91 98421 78901',
        busId: targetBus?.id || 'bus-04',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      });
    } else {
      const targetStudent = safeStudents.find(s => s.id === selectedStudentId) || safeStudents[0];
      triggerLogin({
        id: `usr-parent-${targetStudent?.id || '01'}`,
        name: `${targetStudent?.parentName || 'Sundaram K'} (Parent of ${targetStudent?.name || 'Sneha'})`,
        role: 'student',
        email: targetStudent?.parentEmail || 'parent.sneha@gmail.com',
        districtId: signInDistrictId,
        collegeName: defaultCollegeName,
        studentId: targetStudent?.id,
        busId: targetStudent?.busId,
        rollNumber: targetStudent?.rollNumber,
        phone: targetStudent?.parentPhone,
        department: targetStudent?.department,
        avatar: targetStudent?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
      });
    }
  };

  // Create Account (Sign Up) Handler
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please provide your full name');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    // Determine final college name
    let finalCollegeName = '';
    let finalCampusAddress = '';

    if (isCustomCollege) {
      if (!customCollegeName.trim()) {
        setError('Please enter your custom College / Institution Name');
        return;
      }
      finalCollegeName = customCollegeName.trim();
      finalCampusAddress = customCampusAddress.trim() || `${selectedDistrict.toUpperCase()} Transit Zone`;
    } else {
      const collegeObj = availableColleges.find(c => c.id === selectedCollegeId) || availableColleges[0];
      finalCollegeName = collegeObj?.name || 'Government College of Engineering (GCE), Tirunelveli';
      finalCampusAddress = collegeObj?.address || '';
    }

    setIsSubmitting(true);

    try {
      const chosenBus = safeBuses.find(b => b.id === assignedBusId) || safeBuses[0];
      const newUserId = `usr-${signUpRole}-${Date.now().toString().slice(-4)}`;

      // If registering as student/parent, also automatically register student into fleet
      if (signUpRole === 'student') {
        const studentPayload: Partial<StudentPassenger> = {
          id: `stu-${Date.now().toString().slice(-4)}`,
          name: fullName,
          rollNumber: rollNumber.trim() || `24${department.slice(0, 2).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
          department: department,
          year: yearOfStudy,
          busId: chosenBus?.id || 'bus-04',
          busNumber: chosenBus?.busNumber || 'Bus #04',
          routeId: chosenBus?.assignedRouteId || 'route-01',
          stopId: `stop-${Date.now()}`,
          stopName: stopName || 'Campus Main Terminal',
          parentName: parentName || `${fullName}'s Guardian`,
          parentPhone: phone || '+91 98400 12345',
          parentEmail: signUpEmail,
          districtId: selectedDistrict,
          status: 'waiting-at-stop',
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
        };

        if (onAddStudent) {
          await onAddStudent(studentPayload);
        }

        const newUserAccount: UserAccount = {
          id: newUserId,
          name: fullName,
          role: 'student',
          email: signUpEmail,
          phone: phone,
          rollNumber: studentPayload.rollNumber,
          department: department,
          year: yearOfStudy,
          studentId: studentPayload.id,
          busId: chosenBus?.id,
          collegeName: finalCollegeName,
          districtId: selectedDistrict,
          campusAddress: finalCampusAddress,
          parentName: parentName || 'Guardian',
          parentPhone: phone,
          avatar: studentPayload.avatar
        };

        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        triggerLogin(newUserAccount);
      } else if (signUpRole === 'admin') {
        const emailLower = signUpEmail.toLowerCase().trim();
        const isOfficial = emailLower.includes('.edu') || 
                           emailLower.includes('.ac.in') || 
                           emailLower.includes('.gov.in') || 
                           emailLower.includes('@college.') ||
                           emailLower.endsWith('.org');
        const isPublicProvider = emailLower.endsWith('@gmail.com') || 
                                 emailLower.endsWith('@yahoo.com') || 
                                 emailLower.endsWith('@outlook.com') || 
                                 emailLower.endsWith('@hotmail.com');

        if (!isOfficial || isPublicProvider) {
          setError('Transport Manager accounts require an official institutional email address (e.g. manager.transport@college.edu). Public domains like @gmail.com are not permitted.');
          setIsSubmitting(false);
          return;
        }

        if (signUpPassword.length < 8) {
          setError('Transport Manager password must be at least 8 characters long.');
          setIsSubmitting(false);
          return;
        }

        const hasUpper = /[A-Z]/.test(signUpPassword);
        const hasLower = /[a-z]/.test(signUpPassword);
        const hasDigit = /[0-9]/.test(signUpPassword);
        const hasSpecial = /[^A-Za-z0-9]/.test(signUpPassword);

        if (!(hasUpper && hasLower && hasDigit && hasSpecial)) {
          setError('Transport Manager password must be unique and strong (include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol).');
          setIsSubmitting(false);
          return;
        }

        const newUserAccount: UserAccount = {
          id: newUserId,
          name: fullName,
          role: 'admin',
          isTransportManager: true,
          email: signUpEmail,
          officialEmail: signUpEmail,
          employeeId: `TM-${Date.now().toString().slice(-4)}`,
          phone: phone,
          department: adminDept || 'Fleet Operations & Transit',
          designation: designation || 'Transport Manager & Fleet Director',
          collegeName: finalCollegeName,
          districtId: selectedDistrict,
          campusAddress: finalCampusAddress,
          handoverDate: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
        };

        saveUserAccountToDb(newUserAccount).catch(err => {
          console.warn("Could not persist manager to DB:", err);
        });

        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        triggerLogin(newUserAccount);
      } else {
        // Driver
        const newUserAccount: UserAccount = {
          id: newUserId,
          name: fullName,
          role: 'driver',
          email: signUpEmail,
          phone: phone,
          busId: chosenBus?.id,
          collegeName: finalCollegeName,
          districtId: selectedDistrict,
          campusAddress: finalCampusAddress,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        };

        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        triggerLogin(newUserAccount);
      }
    } catch (err: any) {
      console.error("Error creating account:", err);
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1500] bg-slate-950/85 backdrop-blur-md overflow-y-auto text-slate-100 flex flex-col justify-start sm:justify-center items-center p-3 sm:p-6 lg:p-8 animate-fadeIn">
      {/* Background glow accents */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/5 blur-[160px] pointer-events-none" />

      {/* Main Dialog Container */}
      <div className="w-full max-w-4xl z-10 space-y-5 sm:space-y-6 my-auto relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2.5 rounded-full border border-slate-700 shadow-xl transition z-20"
            title="Close Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Banner */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-300 font-mono">
              College Smart Fleet & GPS Transit
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black">
              <BusIcon className="w-6 h-6 fill-current" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
              {authMode === 'signin' ? 'College Transit Sign In' : 'Create College Transit Account'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            {authMode === 'signin' 
              ? 'Access institutional Admin controls, Parent live bus tracking, or the Driver telemetry console.'
              : 'Register your college, configure district transit routes, and enable live bus tracking.'
            }
          </p>
        </div>

        {/* Mode Switcher Tabs: Sign In vs Create Account & Dark Mode in Circled Area */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                authMode === 'signin'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Sign In to Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setError(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                authMode === 'signup'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Account</span>
              <span className="text-[10px] bg-slate-950/70 text-cyan-300 px-1.5 py-0.5 rounded-full font-mono">
                Register
              </span>
            </button>
          </div>

          {/* Theme / Dark Mode Toggle in the circled area */}
          <div className="flex items-center">
            <ThemeToggle 
              variant="pill" 
              className="h-[46px] px-4 rounded-2xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800 shadow-xl hover:border-amber-400/80 transition-all text-xs sm:text-sm font-bold"
            />
          </div>
        </div>

        {/* -------------------- VIEW 1: SIGN IN MODE -------------------- */}
        {authMode === 'signin' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Multi-Role Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Admin Card */}
              <div 
                onClick={() => handleSignInRoleChange('admin')}
                className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  signInRole === 'admin'
                    ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      signInRole === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'
                    }`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    {signInRole === 'admin' && (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                        Active Selection
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
                        Restricted Access
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-100 font-display">
                      Transport Manager & Admin
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Portion opened exclusively by the verified <strong>Transport Manager</strong>. Successors must register with official mail & unique password.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickDemoLogin('admin');
                  }}
                  className="mt-3.5 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black py-2.5 rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <span>Authorize Transport Manager</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Student & Parent Card */}
              <div 
                onClick={() => handleSignInRoleChange('student')}
                className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  signInRole === 'student'
                    ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      signInRole === 'student' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    {signInRole === 'student' && (
                      <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                        Active Selection
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-100 font-display">
                      Student / Parent Sign In
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Track assigned college bus live GPS, view arrival ETA at stop, and boarding notifications.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickDemoLogin('student');
                  }}
                  className="mt-3.5 w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black py-2.5 rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <span>Track as Student/Parent</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Driver Card */}
              <div 
                onClick={() => handleSignInRoleChange('driver')}
                className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  signInRole === 'driver'
                    ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      signInRole === 'driver' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-emerald-400'
                    }`}>
                      <Navigation className="w-5 h-5" />
                    </div>
                    {signInRole === 'driver' && (
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                        Active Selection
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-100 font-display">
                      Driver Sign In
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Broadcast real-time vehicle GPS telemetry, update student boarding & seats, report delays.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickDemoLogin('driver');
                  }}
                  className="mt-3.5 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2.5 rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <span>Launch Driver Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Custom Sign In Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-100 font-display flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-amber-400" />
                    <span>
                      {signInRole === 'admin' && 'Admin Credential Authentication'}
                      {signInRole === 'student' && 'Student & Parent Identification'}
                      {signInRole === 'driver' && 'Bus Captain Sign In'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select your transit district and sign in to access your designated portal
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <select
                      value={signInDistrictId}
                      onChange={(e) => setSignInDistrictId(e.target.value)}
                      className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
                    >
                      {safeDistricts.map(d => (
                        <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-200 text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignInSubmit} className="space-y-4">
                {/* If Parent/Student, show quick enrolled child selector */}
                {signInRole === 'student' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Select Enrolled Student / Child
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => {
                        setSelectedStudentId(e.target.value);
                        const stu = safeStudents.find(s => s.id === e.target.value);
                        if (stu) {
                          setSignInEmail(stu.parentEmail || `${stu.name.toLowerCase().replace(/\s+/g, '.')}@college.edu`);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      {safeStudents.map(stu => (
                        <option key={stu.id} value={stu.id} className="bg-slate-900">
                          {stu.name} ({stu.rollNumber}) • {stu.busNumber} • Stop: {stu.stopName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* If Driver, show quick bus selector */}
                {signInRole === 'driver' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Select Assigned Fleet Bus
                    </label>
                    <select
                      value={selectedBusId}
                      onChange={(e) => {
                        setSelectedBusId(e.target.value);
                        const b = safeBuses.find(x => x.id === e.target.value);
                        if (b) {
                          setSignInEmail(`driver.${b.driverName.split(' ')[0].toLowerCase()}@college.edu`);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {safeBuses.map(b => (
                        <option key={b.id} value={b.id} className="bg-slate-900">
                          {b.busNumber} ({b.plateNumber}) — Driver: {b.driverName} ({b.capacity} Seats)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      {signInRole === 'admin' ? 'Institutional Email / Admin ID' : signInRole === 'driver' ? 'Driver Email / Employee ID' : 'Parent / Student Email'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="e.g. name@college.edu"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showSignInPassword ? 'text' : 'password'}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm px-6 py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <span>Sign In to {signInRole === 'admin' ? 'Admin Fleet' : signInRole === 'driver' ? 'Driver Console' : 'Student Tracker'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setError(null);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold text-center sm:text-right underline underline-offset-4"
                  >
                    Don't have an account? Enable Create Account →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* -------------------- VIEW 2: CREATE ACCOUNT (SIGN UP) MODE -------------------- */}
        {authMode === 'signup' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 animate-fadeIn">
            {/* Step 1: Select Role to Register */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Select Role to Create Account For
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSignUpRole('student')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                    signUpRole === 'student'
                      ? 'bg-cyan-950/50 border-cyan-500 ring-2 ring-cyan-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${signUpRole === 'student' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'}`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">Student / Parent</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Track bus live GPS & get stop alerts</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSignUpRole('admin')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                    signUpRole === 'admin'
                      ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${signUpRole === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">College / Admin</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Only Admin can Add Bus, Route & Students</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSignUpRole('driver')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                    signUpRole === 'driver'
                      ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${signUpRole === 'driver' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-emerald-400'}`}>
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">Bus Driver</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Broadcast GPS & passenger boarding</p>
                  </div>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-200 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSignUpSubmit} className="space-y-5">
              {/* Step 2: College & District Inclusion */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>2. College Institution & District Setup</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* District Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Transit District / Region *
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {safeDistricts.map(d => (
                        <option key={d.id} value={d.id} className="bg-slate-900">
                          {d.name} ({d.code}) — {d.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* College Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      College / University Institution *
                    </label>
                    <select
                      value={isCustomCollege ? 'custom' : selectedCollegeId}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomCollege(true);
                        } else {
                          setIsCustomCollege(false);
                          setSelectedCollegeId(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      {availableColleges.map(c => (
                        <option key={c.id} value={c.id} className="bg-slate-900">
                          {c.name} ({c.category})
                        </option>
                      ))}
                      <option value="custom" className="bg-slate-900 text-amber-400 font-bold">
                        ➕ Other / Enter Custom College Name...
                      </option>
                    </select>
                  </div>
                </div>

                {/* If Custom College is chosen, show input fields */}
                {isCustomCollege && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-amber-300">
                        Custom College Name *
                      </label>
                      <input
                        type="text"
                        value={customCollegeName}
                        onChange={(e) => setCustomCollegeName(e.target.value)}
                        placeholder="e.g. Government College of Technology / Engineering"
                        className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-amber-300">
                        Campus Main Terminal Address
                      </label>
                      <input
                        type="text"
                        value={customCampusAddress}
                        onChange={(e) => setCustomCampusAddress(e.target.value)}
                        placeholder="e.g. Highway Campus, Palayamkottai, Tirunelveli"
                        className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Bus Allocation based on district */}
                {(signUpRole === 'student' || signUpRole === 'driver') && (
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Select College Bus for your Route *
                    </label>
                    <select
                      value={assignedBusId}
                      onChange={(e) => setAssignedBusId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      {safeBuses.map(b => (
                        <option key={b.id} value={b.id} className="bg-slate-900">
                          {b.busNumber} ({b.plateNumber}) • Driver: {b.driverName} • {b.capacity} Seats ({b.fuelType})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Step 3: Account Personal Details */}
              <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <UserCheck className="w-4 h-4" />
                  <span>3. Personal & Security Credentials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={signUpRole === 'admin' ? 'Dr. S. Sundaram' : signUpRole === 'driver' ? 'M. Murugan' : 'Kavitha Sundaram'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="e.g. user@college.edu or gmail.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Mobile / WhatsApp Phone *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98421 00000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Account Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role Specific Additional Fields */}
                {signUpRole === 'student' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Student Roll Number *
                      </label>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder="e.g. 24CS108 or 23ME045"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Department
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                      >
                        <option>Computer Science & Engineering (CSE)</option>
                        <option>Artificial Intelligence & Data Science (AI&DS)</option>
                        <option>Electronics & Communication (ECE)</option>
                        <option>Electrical & Electronics (EEE)</option>
                        <option>Mechanical Engineering</option>
                        <option>Civil Engineering</option>
                        <option>Information Technology (IT)</option>
                        <option>Arts & Science / MBA</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Pickup / Boarding Stop *
                      </label>
                      <input
                        type="text"
                        value={stopName}
                        onChange={(e) => setStopName(e.target.value)}
                        placeholder="e.g. Vannarpettai Roundana"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {signUpRole === 'admin' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-amber-300">
                        Institutional Designation *
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Chief Transport Officer / Fleet Manager"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-amber-300">
                        Department / Cell
                      </label>
                      <input
                        type="text"
                        value={adminDept}
                        onChange={(e) => setAdminDept(e.target.value)}
                        placeholder="e.g. Campus Transport & Logistics"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {signUpRole === 'driver' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-emerald-300">
                        Heavy Driving License Number *
                      </label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. TN72-2022-0045812"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-emerald-300">
                        Driving Experience (Years)
                      </label>
                      <input
                        type="number"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm px-7 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <BadgeCheck className="w-5 h-5" />
                  <span>
                    {isSubmitting ? 'Activating Account...' : `Create & Activate ${signUpRole === 'admin' ? 'Admin' : signUpRole === 'driver' ? 'Driver' : 'Student'} Account`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 font-bold"
                >
                  Already have an account? <span className="text-amber-400 underline">Sign in instead</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
