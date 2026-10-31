import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  KeyRound, 
  X, 
  UserCheck, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Database 
} from 'lucide-react';

export default function LoginInfoModal({ isOpen, onClose }) {
  const { user, quickSwitch } = useAuth();

  if (isOpen === false) return null;

  const accounts = [
    {
      username: 'receptionist1',
      fullName: 'Ali Khan',
      role: 'RECEPTIONIST',
      department: 'Front Desk / Emergency Triage',
      dashboards: 'OPD Registration, Emergency Bypass, 80mm Token Slips',
      color: 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300'
    },
    {
      username: 'dr_surgeon',
      fullName: 'Dr. Tariq Shah',
      role: 'DOCTOR',
      department: 'Clinical OPD & Surgery',
      dashboards: 'CPOE Consultation, 1-Click Kits (Appendectomy/Resus), e-Prescribing',
      color: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
    },
    {
      username: 'pharm_pos',
      fullName: 'Zubair Ahmed',
      role: 'PHARMACIST',
      department: 'Central Pharmacy',
      dashboards: 'FEFO Batch Selection, LASA Drug Safety Banners, Crash Cart Seals',
      color: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
    },
    {
      username: 'lab_tech',
      fullName: 'Hamza Noor',
      role: 'LAB_TECH',
      department: 'Diagnostic Pathology (LIMS)',
      dashboards: 'Swelab Alfa 16-param CBC Analyzer, ASTM Serial Bridge, QR Seals',
      color: 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300'
    },
    {
      username: 'ward_nurse',
      fullName: 'Sobia Bibi',
      role: 'NURSE',
      department: 'Inpatient Wards & ER',
      dashboards: 'Color Bed Matrix, 250x30mm Wristbands, Bedside 5-Rights e-MAR',
      color: 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
    },
    {
      username: 'ot_lead',
      fullName: 'Dr. Bilal Akhtar',
      role: 'SURGEON',
      department: 'Operating Theatre (OT)',
      dashboards: 'WHO Surgical Checklist, Sponge/Instrument Reconciliation, Operative Notes',
      color: 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300'
    },
    {
      username: 'cashier1',
      fullName: 'Usman Qazi',
      role: 'BILLING_CASHIER',
      department: 'Central Cash Office',
      dashboards: 'Unified Cross-Department Invoices, Shift Drawer Cash Balancing',
      color: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
    },
    {
      username: 'admin_dir',
      fullName: 'Medical Director',
      role: 'COMPLIANCE_ADMIN',
      department: 'Executive Governance & QA',
      dashboards: 'KP-HCC Category 2-B 122 Indicators, Biomedical Asset Calibration',
      color: 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300'
    }
  ];

  const handleSwitch = (username) => {
    quickSwitch(username);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-teal-600 to-cyan-600 rounded-xl text-white shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Hospital Staff Directory & Login Access Hub
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All 8 seeded RBAC roles with default credentials for Al Noor Specialist Hospital (KP-HCC MSDS 2-B)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Password Banner */}
        <div className="px-6 py-3 bg-teal-50 dark:bg-teal-950/40 border-b border-teal-200 dark:border-teal-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
            <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Master Test Password for all accounts:</span>
            <code className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg font-mono font-bold text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
              Admin@123
            </code>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Verified in local MySQL database (`users` table)</span>
          </div>
        </div>

        {/* Staff Role Grid */}
        <div className="p-6 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {accounts.map((acc) => {
              const isActive = user?.username === acc.username;
              return (
                <div
                  key={acc.username}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-teal-50/50 dark:bg-slate-900 border-teal-500 dark:border-teal-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          {acc.fullName}
                          {isActive && (
                            <span className="px-2 py-0.2 bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40 rounded-full text-[10px] font-bold">
                              Current Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{acc.department}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${acc.color}`}>
                        {acc.role}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/80 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Dashboards: </span>
                      {acc.dashboards}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>Username: <strong className="text-slate-800 dark:text-slate-200">{acc.username}</strong></span>
                      <span>Password: <strong className="text-slate-800 dark:text-slate-200">Admin@123</strong></span>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => handleSwitch(acc.username)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        isActive
                          ? 'bg-teal-600 text-white cursor-default'
                          : 'bg-slate-100 hover:bg-teal-600 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-white border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Currently Signed In
                        </>
                      ) : (
                        <>
                          <span>1-Click Login As This Role</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Clicking "1-Click Login" generates a fresh JWT and persistent session in MySQL `user_sessions`.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold text-xs transition"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
}
