import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  UserPlus, 
  Ticket, 
  AlertOctagon, 
  Printer, 
  Search, 
  CheckCircle2, 
  User, 
  Phone, 
  CreditCard, 
  Clock, 
  Ambulance, 
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import ThermalSlipModal from '../../../components/ThermalSlipModal';

export default function OpdPage() {
  const [patients, setPatients] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // Rapid Registration Form state
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'MALE',
    ageYears: '',
    cnic: '',
    phone: '',
    emergencyContact: '',
    address: ''
  });

  // Modal print states
  const [slipData, setSlipData] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [emergencyAlertMsg, setEmergencyAlertMsg] = useState(null);

  useEffect(() => {
    fetchRecent();
    fetchDoctors();
  }, []);

  const fetchRecent = async () => {
    try {
      const res = await api.get('/opd/appointments/recent');
      if (res.data.success) {
        setRecentAppointments(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/auth/test-users');
      if (res.data.success) {
        const docList = res.data.data.filter(u => u.role_name === 'DOCTOR' || u.role_name === 'SURGEON');
        setDoctors(docList);
        if (docList.length > 0) setSelectedDoctorId(docList[0].user_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.get(`/opd/patients?q=${encodeURIComponent(searchQuery)}`);
      if (res.data.success) {
        setPatients(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Pakistani CNIC mask: XXXXX-XXXXXXX-X
  const formatCnic = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 13);
    let formatted = cleaned;
    if (cleaned.length > 5 && cleaned.length <= 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.length > 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`;
    }
    return formatted;
  };

  // Pakistani Phone mask: 03XX-XXXXXXX
  const formatPhone = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length > 4) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }
    return cleaned;
  };

  // 5-Second Rapid Registration
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/opd/patients', {
        ...formData,
        ageYears: formData.ageYears ? parseInt(formData.ageYears, 10) : null
      });

      if (res.data.success) {
        setSelectedPatient(res.data.data);
        setFormData({
          fullName: '',
          gender: 'MALE',
          ageYears: '',
          cnic: '',
          phone: '',
          emergencyContact: '',
          address: ''
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Patient registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Issue OPD Specialist Token & Launch 80mm Print
  const handleGenerateToken = async (patientId) => {
    if (!selectedDoctorId) {
      alert('Please select a specialist doctor');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/opd/appointments/token', {
        patientId,
        doctorId: selectedDoctorId
      });

      if (res.data.success) {
        setSlipData(res.data.data);
        setShowSlipModal(true);
        fetchRecent();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Token generation failed');
    } finally {
      setLoading(false);
    }
  };

  // 1-CLICK RED ALERT EMERGENCY ADMISSION
  const handleRedAlertEmergency = async () => {
    if (!window.confirm('TRIGGER RED ALERT EMERGENCY FAST-TRACK ADMISSION?\n\nThis will instantly allocate an emergency crash bed and bypass upfront payment per KP-HCC resuscitation protocol.')) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/opd/emergency-admission', {
        fullName: formData.fullName || 'Emergency Resus Patient',
        gender: formData.gender || 'OTHER',
        ageYears: formData.ageYears ? parseInt(formData.ageYears, 10) : 40,
        phone: formData.phone || '0300-0000000',
        doctorId: selectedDoctorId || 2
      });
      if (res.data.success) {
        setEmergencyAlertMsg(res.data.data);
        fetchRecent();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Emergency fast-track admission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar with 1-Click Red Alert Emergency Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              <Ticket className="w-5 h-5" />
            </span>
            <span>OPD Intake & Emergency Fast-Track</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rapid 5-second patient intake, Pakistani CNIC & phone formatting, 80mm thermal token slips, and 1-click emergency resuscitation bypass.
          </p>
        </div>

        {/* 1-CLICK RED ALERT BUTTON */}
        <button
          onClick={handleRedAlertEmergency}
          disabled={loading}
          className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-rose-600/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Ambulance className="w-4 h-4 animate-bounce" />
          <span>RED ALERT EMERGENCY ADMISSION</span>
        </button>
      </div>

      {/* Emergency Admission Success Banner if triggered */}
      {emergencyAlertMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100 flex items-start justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-800 dark:text-rose-200 uppercase tracking-wide text-xs">
                CRITICAL EMERGENCY FAST-TRACK ALLOCATED!
              </h4>
              <p className="text-sm mt-1">
                Patient: <strong className="font-semibold">{emergencyAlertMsg.full_name}</strong> (MRN: {emergencyAlertMsg.mrn}) • 
                Allocated Bed: <strong className="text-rose-700 dark:text-rose-300">{emergencyAlertMsg.bed_number}</strong> ({emergencyAlertMsg.ward_name})
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 font-mono">
                Wristband Barcode: <span className="bg-rose-200/80 dark:bg-rose-900 px-2 py-0.5 rounded font-bold">{emergencyAlertMsg.wristband_barcode}</span> | Attending: {emergencyAlertMsg.doctor_name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEmergencyAlertMsg(null)}
            className="text-xs bg-rose-200 dark:bg-rose-900/60 hover:bg-rose-300 dark:hover:bg-rose-800 text-rose-800 dark:text-rose-200 px-3 py-1.5 rounded-lg font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Form on left, Patient Lookup & Queue on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 5-Second Rapid Registration (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <UserPlus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">
              Rapid Patient Registration (5s)
            </h3>
          </div>

          <form onSubmit={handleRegisterPatient} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Muhammad Ismail"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Child</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Age (Years)</label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={formData.ageYears}
                  onChange={(e) => setFormData({ ...formData, ageYears: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="03XX-XXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pakistani CNIC</label>
                <input
                  type="text"
                  placeholder="XXXXX-XXXXXXX-X"
                  value={formData.cnic}
                  onChange={(e) => setFormData({ ...formData, cnic: formatCnic(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Address / Tehsil</label>
              <input
                type="text"
                placeholder="e.g. Allai, Battagram"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow-sm transition"
            >
              <UserPlus className="w-4 h-4" />
              Save Patient & Select
            </button>
          </form>

          {/* Quick Doctor Consultation Token Issuer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Issue Specialist OPD Token (Rs. 500)
            </h4>
            
            {selectedPatient ? (
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{selectedPatient.full_name}</div>
                  <div className="text-xs text-teal-700 dark:text-teal-400 font-mono">MRN: {selectedPatient.mrn}</div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold"
                >
                  Change
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Register a patient above or search an existing record from the right panel.
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Consulting Specialist Doctor
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              >
                {doctors.map((d) => (
                  <option key={d.user_id} value={d.user_id}>
                    {d.full_name} ({d.role_name})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => selectedPatient && handleGenerateToken(selectedPatient.patient_id)}
              disabled={!selectedPatient || loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              Generate Token & Print 80mm Slip
            </button>
          </div>
        </div>

        {/* Right Column: Search & Live Token Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Patient Quick Search */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-colors">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search registered patient by MRN, Phone, CNIC or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-semibold rounded-xl text-white transition"
              >
                Search
              </button>
            </form>

            {/* Patient Search Results */}
            {patients.length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                {patients.map((pat) => (
                  <div
                    key={pat.patient_id}
                    onClick={() => setSelectedPatient(pat)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{pat.full_name}</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2">({pat.gender}, {pat.age_years || '-'} Yrs)</span>
                      <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                        MRN: <span className="text-teal-700 dark:text-teal-400 font-semibold">{pat.mrn}</span> | Phone: {pat.phone}
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-600 hover:text-white transition font-semibold text-xs">
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Active Tokens Queue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                  Today's OPD Queue & Tokens ({recentAppointments.length})
                </h3>
              </div>
              <button
                onClick={fetchRecent}
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Token</th>
                    <th className="p-3">Patient / MRN</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">
                        No tokens issued yet today.
                      </td>
                    </tr>
                  ) : (
                    recentAppointments.map((item) => (
                      <tr key={item.appointment_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold font-mono text-teal-700 dark:text-teal-400">
                          {item.token_number}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{item.patient_name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.mrn}</div>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{item.doctor_name}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.queue_status === 'COMPLETED'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : item.queue_status === 'IN_CONSULTATION'
                                ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {item.queue_status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSlipData(item);
                              setShowSlipModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Reprint 80mm Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 80mm Thermal Receipt Slip Modal */}
      <ThermalSlipModal
        isOpen={showSlipModal}
        onClose={() => setShowSlipModal(false)}
        data={slipData}
        title="80mm Thermal OPD Token Slip"
      />
    </div>
  );
}
