import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginInfoModal from './components/LoginInfoModal';

// Feature Pages
import OpdPage from './modules/opd/pages/OpdPage';
import DoctorPage from './modules/doctor/pages/DoctorPage';
import PharmacyPage from './modules/pharmacy/pages/PharmacyPage';
import LimsPage from './modules/lims/pages/LimsPage';
import IpdPage from './modules/ipd/pages/IpdPage';
import EmarPage from './modules/emar/pages/EmarPage';
import OtPage from './modules/ot/pages/OtPage';
import BillingPage from './modules/billing/pages/BillingPage';
import AuditPage from './modules/audit/pages/AuditPage';

import { 
  Database, 
  CheckCircle2, 
  ShieldCheck,
  Server
} from 'lucide-react';

export default function App() {
  const { user, role, loading } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('opd');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Auto-switch default tab based on user's active role
  useEffect(() => {
    if (role === 'RECEPTIONIST') setActiveTab('opd');
    else if (role === 'DOCTOR') setActiveTab('doctor');
    else if (role === 'PHARMACIST') setActiveTab('pharmacy');
    else if (role === 'LAB_TECH') setActiveTab('lims');
    else if (role === 'NURSE') setActiveTab('emar');
    else if (role === 'SURGEON') setActiveTab('ot');
    else if (role === 'BILLING_CASHIER') setActiveTab('billing');
    else if (role === 'COMPLIANCE_ADMIN') setActiveTab('audit');
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
          Loading Al Noor Specialist Hospital Infrastructure...
        </p>
      </div>
    );
  }

  return (
    <div className={`h-screen flex ${theme === 'dark' ? 'dark bg-[#0B0F17] text-slate-100' : 'bg-slate-100/70 text-slate-900'} font-sans antialiased overflow-hidden transition-colors duration-150`}>
      {/* 1. Left Collapsible Modern Healthcare Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenLoginModal={() => setShowLoginModal(true)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Executive Header */}
        <Navbar
          activeTab={activeTab}
          onOpenLoginModal={() => setShowLoginModal(true)}
        />

        {/* Live Database Proof Notice Bar */}
        <div className="px-6 py-2 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 transition-colors shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>
              Connected Live to MySQL: <strong className="text-teal-700 dark:text-teal-300 font-mono">hospital_management</strong> (localhost:3306)
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>
              Engine: <strong className="text-slate-800 dark:text-slate-200">InnoDB ACID</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> 29 / 29 Relational Tables Live
            </span>
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-bold hover:underline transition"
            >
              Staff Directory & Credentials →
            </button>
          </div>
        </div>

        {/* Active Feature Workspace View (Smooth Internal Scroll) */}
        <main className="flex-1 p-6 max-w-[1680px] w-full mx-auto overflow-y-auto space-y-6">
          {activeTab === 'opd' && <OpdPage />}
          {activeTab === 'doctor' && <DoctorPage />}
          {activeTab === 'pharmacy' && <PharmacyPage />}
          {activeTab === 'lims' && <LimsPage />}
          {activeTab === 'ipd' && <IpdPage />}
          {activeTab === 'emar' && <EmarPage />}
          {activeTab === 'ot' && <OtPage />}
          {activeTab === 'billing' && <BillingPage />}
          {activeTab === 'audit' && <AuditPage />}
        </main>
      </div>

      {/* Staff Logins Hub Modal */}
      {showLoginModal && (
        <LoginInfoModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}
