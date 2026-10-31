import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldCheck, 
  Clock, 
  Sun, 
  Moon, 
  KeyRound, 
  Sparkles, 
  ChevronRight, 
  Database,
  Menu,
  PanelLeftClose
} from 'lucide-react';

export default function Navbar({ activeTab, onOpenLoginModal, isDrawerOpen, onToggleDrawer }) {
  const { user, role, quickSwitch, testUsers } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tabLabels = {
    opd: 'OPD Intake & Emergency Fast-Track',
    doctor: 'Doctor CPOE & Clinical Consultation',
    pharmacy: 'Pharmacy POS & FEFO Inventory',
    lims: 'Diagnostic Pathology & LIMS Analyzer',
    ipd: 'Inpatient (IPD) Bed Matrix & Wristbands',
    emar: 'Bedside e-MAR (5-Rights Scanner)',
    ot: 'Operating Theatre & WHO Safety',
    billing: 'Unified Invoicing & Cash Drawer',
    audit: 'KP-HCC Category 2-B Governance',
  };

  const handleRoleChange = (e) => {
    if (e.target.value) {
      quickSwitch(e.target.value);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="px-3.5 sm:px-4 lg:px-5 py-2 flex items-center justify-between gap-3 min-w-0">
        
        {/* Left Side: Drawer Toggle Button & Module Title (Clean Truncation, Never Overflows) */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
          {/* Quick Drawer Open/Close Button */}
          <button
            onClick={onToggleDrawer}
            title={isDrawerOpen ? 'Close Navigation Drawer (Esc)' : 'Open Navigation Drawer (All Modules)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 ${
              isDrawerOpen
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                : 'bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-300'
            }`}
          >
            {isDrawerOpen ? (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="hidden sm:inline font-bold">Close</span>
              </>
            ) : (
              <>
                <Menu className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="hidden sm:inline font-bold">Modules</span>
              </>
            )}
          </button>

          {/* Title & Breadcrumb Block with strict truncation */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate leading-none">
              <span className="shrink-0">Al Noor HMS</span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wider text-[10px] shrink-0">
                MSDS 2-B
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5 truncate">
              {tabLabels[activeTab] || 'Clinical Informatics'}
            </h2>
          </div>
        </div>

        {/* Right Side: Responsive Tools (Clock, Day/Night Switcher, Staff Hub, Role Selector) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
          {/* Responsive Live PKT Clock (Date + Time on XL, Time-only on MD, Hidden on Mobile/Narrow) */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs font-mono text-slate-700 dark:text-slate-300 shrink-0">
            <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="hidden xl:inline text-slate-500 dark:text-slate-400">
              {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
            <span className="font-bold text-teal-600 dark:text-teal-400">
              {currentTime.toLocaleTimeString('en-PK')}
            </span>
          </div>

          {/* Segmented Theme Switcher: Day (Light) / Night (Dark) */}
          <div 
            className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg p-0.5 gap-0.5 shadow-xs shrink-0"
            role="group"
            aria-label="Workstation Shift Theme"
          >
            <button
              type="button"
              onClick={() => isDark && toggleTheme()}
              title="Clinical Day Shift (Light Mode)"
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                !isDark 
                  ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Day</span>
            </button>
            <button
              type="button"
              onClick={() => !isDark && toggleTheme()}
              title="Diagnostic Night Shift (Dark Mode)"
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 text-teal-300 shadow-xs border border-teal-500/30' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400 fill-teal-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Night</span>
            </button>
          </div>

          {/* Staff Login Directory Button */}
          <button
            onClick={onOpenLoginModal}
            title="Hospital Staff Credentials & Fast Login Directory"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/80 text-xs font-bold text-teal-700 dark:text-teal-300 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Staff Hub</span>
          </button>

          {/* Role Switcher Pill */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 shadow-xs shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 hidden sm:inline" />
            <select
              value={user?.username || ''}
              onChange={handleRoleChange}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-white focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[155px] truncate"
            >
              {testUsers.map((u) => (
                <option 
                  key={u.user_id} 
                  value={u.username}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {u.role_name} — {u.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>
    </header>
  );
}
