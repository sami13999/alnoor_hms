import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Ticket, 
  Stethoscope, 
  Pill, 
  FlaskConical, 
  Bed, 
  ShieldCheck, 
  Scissors, 
  Receipt, 
  Award,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, isCollapsed, onToggleCollapse, onOpenLoginModal }) {
  const { user, role, logout } = useAuth();

  const navigationGroups = [
    {
      group: 'FRONT OFFICE',
      items: [
        { id: 'opd', label: 'OPD & Fast-Track', icon: Ticket, badge: 'Rapid' },
        { id: 'billing', label: 'Billing & Cashier', icon: Receipt, badge: 'Drawer' },
      ]
    },
    {
      group: 'CLINICAL CARE',
      items: [
        { id: 'doctor', label: 'Doctor CPOE', icon: Stethoscope, badge: 'Order Sets' },
        { id: 'ipd', label: 'IPD Bed Matrix', icon: Bed, badge: 'Admit/WB' },
        { id: 'emar', label: 'Bedside e-MAR', icon: ShieldCheck, badge: '5-Rights' },
        { id: 'ot', label: 'OT Surgery Suite', icon: Scissors, badge: 'WHO Safety' },
      ]
    },
    {
      group: 'PHARMACY & LAB',
      items: [
        { id: 'pharmacy', label: 'Pharmacy POS', icon: Pill, badge: 'FEFO/LASA' },
        { id: 'lims', label: 'LIMS Diagnostic', icon: FlaskConical, badge: 'Swelab 16' },
      ]
    },
    {
      group: 'REGULATORY',
      items: [
        { id: 'audit', label: 'KP-HCC Category 2-B', icon: Award, badge: 'MSDS' },
      ]
    }
  ];

  const roleColors = {
    RECEPTIONIST: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
    DOCTOR: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    PHARMACIST: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    LAB_TECH: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    NURSE: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    SURGEON: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    BILLING_CASHIER: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    COMPLIANCE_ADMIN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
  };

  return (
    <aside
      className={`relative z-30 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none shadow-sm ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2.5 bg-gradient-to-tr from-teal-600 to-teal-500 rounded-xl shadow-md text-white shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                Al Noor Specialist
              </h1>
              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold tracking-wider uppercase mt-0.5">
                Battagram • MSDS 2-B
              </div>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1">
                {group.group}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={isCollapsed ? `${item.label} (${item.badge})` : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 dark:shadow-teal-950/50'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />

                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                      <span className="truncate">{item.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          isActive
                            ? 'bg-teal-700/80 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Profile & Staff Access Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/60 dark:bg-slate-900/60">
        <button
          onClick={onOpenLoginModal}
          title="Staff Login Credentials Hub"
          className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-teal-700 dark:text-teal-300 transition shadow-sm ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
            {!isCollapsed && <span>Staff Logins Hub</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-300 dark:border-amber-700">
              8 Roles
            </span>
          )}
        </button>

        {/* Current User Card */}
        <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm ${
          isCollapsed ? 'justify-center' : ''
        }`}>
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs shrink-0 uppercase">
            {user?.username?.slice(0, 2) || 'AN'}
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                {user?.full_name || 'Hospital Staff'}
              </div>
              <span className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded border mt-0.5 uppercase ${
                roleColors[role] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {role}
              </span>
            </div>
          )}

          <button
            onClick={logout}
            title="Sign out session"
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
