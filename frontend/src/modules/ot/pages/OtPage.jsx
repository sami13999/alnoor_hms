import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  Scissors, 
  CheckSquare, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Save,
  Plus
} from 'lucide-react';

export default function OtPage() {
  const [surgeries, setSurgeries] = useState([]);
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // New count input form
  const [itemType, setItemType] = useState('SPONGE');
  const [initialCount, setInitialCount] = useState(10);
  const [postCount, setPostCount] = useState(10);
  const [countAlert, setCountAlert] = useState(null);

  // Operative notes editor
  const [operativeNotes, setOperativeNotes] = useState('');

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [admissions, setAdmissions] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    admissionId: '',
    procedureName: 'Laparoscopic Appendectomy',
    scheduledStart: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchSurgeries();
    fetchAdmissions();
  }, []);

  const fetchSurgeries = async () => {
    try {
      const res = await api.get('/ot/surgeries');
      if (res.data.success) {
        setSurgeries(res.data.data);
        if (res.data.data.length > 0 && !selectedSurgery) {
          selectSurgery(res.data.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdmissions = async () => {
    try {
      const res = await api.get('/ipd/admissions/active');
      if (res.data.success) {
        setAdmissions(res.data.data);
        if (res.data.data.length > 0) {
          setScheduleForm(prev => ({ ...prev, admissionId: res.data.data[0].admission_id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectSurgery = async (surg) => {
    setSelectedSurgery(surg);
    setOperativeNotes(surg.operative_notes || '');
    setCountAlert(null);
    try {
      const res = await api.get(`/ot/surgeries/${surg.ot_surgery_id}/counts`);
      if (res.data.success) {
        setCounts(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleWho = async (field, currentVal) => {
    if (!selectedSurgery) return;
    const newVal = !currentVal;
    try {
      const res = await api.put(`/ot/surgeries/${selectedSurgery.ot_surgery_id}/who-checklist`, {
        [field]: newVal,
        surgeryStatus: field === 'whoSignoutCompleted' && newVal ? 'COMPLETED' : 'IN_PROGRESS'
      });
      if (res.data.success) {
        const updated = { ...selectedSurgery, [field === 'whoSigninCompleted' ? 'who_signin_completed' : field === 'whoTimeoutCompleted' ? 'who_timeout_completed' : 'who_signout_completed']: newVal ? 1 : 0 };
        setSelectedSurgery(updated);
        fetchSurgeries();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update WHO checklist');
    }
  };

  const handleRecordCount = async (e) => {
    e.preventDefault();
    if (!selectedSurgery) return;
    try {
      setLoading(true);
      const res = await api.post(`/ot/surgeries/${selectedSurgery.ot_surgery_id}/counts`, {
        itemType,
        initialCount: parseInt(initialCount, 10),
        postClosureCount: parseInt(postCount, 10)
      });

      if (res.data.success) {
        setCountAlert({
          isReconciled: res.data.is_reconciled,
          alert: res.data.alert
        });
        selectSurgery(selectedSurgery);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record count');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedSurgery) return;
    try {
      setLoading(true);
      const res = await api.put(`/ot/surgeries/${selectedSurgery.ot_surgery_id}/notes`, {
        operativeNotes
      });
      if (res.data.success) {
        alert('Surgeon operative notes successfully recorded in database!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save operative notes');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSurgery = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/ot/surgeries', scheduleForm);
      if (res.data.success) {
        setShowScheduleModal(false);
        fetchSurgeries();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule surgery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Scissors className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Operating Theatre (OT) & WHO Surgical Safety Suite
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              3-Phase WHO Surgical Safety Checklist (Sign-In, Time-Out, Sign-Out) and Sponge/Instrument reconciliation to prevent retained foreign objects.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Schedule Surgical Case
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Surgical Theatre Schedule (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col max-h-[850px] transition-colors">
          <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
            OT Theatre Schedule ({surgeries.length})
          </div>

          <div className="overflow-y-auto space-y-2 flex-1 pr-1">
            {surgeries.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-10 text-center">No surgical procedures scheduled.</p>
            ) : (
              surgeries.map((s) => {
                const isSelected = selectedSurgery?.ot_surgery_id === s.ot_surgery_id;
                return (
                  <div
                    key={s.ot_surgery_id}
                    onClick={() => selectSurgery(s)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 shadow-xs'
                        : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900 dark:text-white truncate max-w-[170px]">{s.procedure_name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border ${
                        s.surgery_status === 'COMPLETED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : s.surgery_status === 'IN_PROGRESS'
                          ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      }`}>
                        {s.surgery_status}
                      </span>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300 text-xs mt-1">{s.patient_name} (MRN: {s.mrn})</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 flex justify-between">
                      <span>Surgeon: {s.surgeon_name}</span>
                      <span>{new Date(s.scheduled_start).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: WHO Checklist & Instrument Reconciliation Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedSurgery ? (
            <div className="space-y-5">
              {/* Surgical Case Details */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm transition-colors">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    Surgical Case #{selectedSurgery.ot_surgery_id}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedSurgery.procedure_name}</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Patient: <strong className="text-slate-900 dark:text-white">{selectedSurgery.patient_name}</strong> (MRN: {selectedSurgery.mrn}) • Bed: {selectedSurgery.bed_number} ({selectedSurgery.ward_name})
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Lead Surgeon: {selectedSurgery.surgeon_name}</div>
                  <div className="text-slate-500 dark:text-slate-400 font-mono">{new Date(selectedSurgery.scheduled_start).toLocaleString('en-PK')}</div>
                </div>
              </div>

              {/* WHO Surgical Safety Checklist (3 Gateways) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 transition-colors">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    WHO Surgical Safety Checklist (MSDS Requirement 3-Phase Verification)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Phase 1: SIGN-IN */}
                  <div
                    onClick={() => handleToggleWho('whoSigninCompleted', selectedSurgery.who_signin_completed)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      selectedSurgery.who_signin_completed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span>1. SIGN-IN</span>
                      {selectedSurgery.who_signin_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <p className="text-[11px] leading-tight text-slate-600 dark:text-slate-300 mt-1">
                      Before induction of anesthesia: Confirm patient identity, site marking, allergy check.
                    </p>
                  </div>

                  {/* Phase 2: TIME-OUT */}
                  <div
                    onClick={() => handleToggleWho('whoTimeoutCompleted', selectedSurgery.who_timeout_completed)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      selectedSurgery.who_timeout_completed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span>2. TIME-OUT</span>
                      {selectedSurgery.who_timeout_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <p className="text-[11px] leading-tight text-slate-600 dark:text-slate-300 mt-1">
                      Before skin incision: Entire surgical team verbal check (surgeon, anesthetist, scrub nurse).
                    </p>
                  </div>

                  {/* Phase 3: SIGN-OUT */}
                  <div
                    onClick={() => handleToggleWho('whoSignoutCompleted', selectedSurgery.who_signout_completed)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      selectedSurgery.who_signout_completed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span>3. SIGN-OUT</span>
                      {selectedSurgery.who_signout_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <p className="text-[11px] leading-tight text-slate-600 dark:text-slate-300 mt-1">
                      Before patient leaves OT: Instrument & sponge reconciliation, specimen labelling.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sponge & Instrument Count Reconciliation Grid */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                      Sponge, Needle & Instrument Count Reconciliation
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Scrub Nurse Sign-off Protocol
                  </span>
                </div>

                {/* Log Count Form */}
                <form onSubmit={handleRecordCount} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Item Category</label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="SPONGE">Gauze / Lap Sponge</option>
                      <option value="NEEDLE">Surgical Needles</option>
                      <option value="FORCEPS">Artery Forceps</option>
                      <option value="SCALPEL">Scalpel Blades</option>
                      <option value="CLAMPS">Hemostatic Clamps</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Pre-Op Initial Count</label>
                    <input
                      type="number"
                      required
                      value={initialCount}
                      onChange={(e) => setInitialCount(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Post-Closure Count</label>
                    <input
                      type="number"
                      required
                      value={postCount}
                      onChange={(e) => setPostCount(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition"
                    >
                      Verify Count
                    </button>
                  </div>
                </form>

                {/* Reconciliation alert feedback */}
                {countAlert && (
                  <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 ${
                    countAlert.isReconciled
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 animate-pulse'
                  }`}>
                    {countAlert.isReconciled ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />}
                    <span>{countAlert.alert}</span>
                  </div>
                )}

                {/* Counts History Table */}
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Item Type</th>
                        <th className="p-3">Initial Count</th>
                        <th className="p-3">Post-Closure Count</th>
                        <th className="p-3">Reconciliation Status</th>
                        <th className="p-3">Verified By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {counts.map((c) => (
                        <tr key={c.count_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{c.item_type}</td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{c.initial_count}</td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{c.post_closure_count}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              c.is_reconciled
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 font-black animate-pulse'
                            }`}>
                              {c.is_reconciled ? 'RECONCILED (0 MISMATCH)' : 'COUNT MISMATCH! RETAINED BODY ALERT'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{c.verified_by_nurse_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Surgeon Operative Notes Editor */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 transition-colors">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Surgeon Post-Operative Notes
                  </h4>
                  <button
                    onClick={handleSaveNotes}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Operative Notes
                  </button>
                </div>

                <textarea
                  rows={4}
                  placeholder="Document surgical incision, findings, procedure steps, blood loss, and closure details..."
                  value={operativeNotes}
                  onChange={(e) => setOperativeNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center text-slate-400 dark:text-slate-500 text-xs">
              Select a surgical case from the schedule on the left to review the WHO checklist and counts.
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scissors className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Schedule Surgical Procedure
            </h3>
            <form onSubmit={handleScheduleSurgery} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Admitted Inpatient
                </label>
                <select
                  required
                  value={scheduleForm.admissionId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, admissionId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  {admissions.map((a) => (
                    <option key={a.admission_id} value={a.admission_id}>
                      {a.patient_name} (MRN: {a.mrn} - Bed {a.bed_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Procedure Title</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.procedureName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, procedureName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Scheduled Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleForm.scheduledStart}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledStart: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Schedule Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
