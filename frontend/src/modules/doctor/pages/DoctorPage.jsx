import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  Stethoscope, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Trash2, 
  FlaskConical, 
  Sparkles,
  Lock,
  User,
  ShieldCheck
} from 'lucide-react';

export default function DoctorPage() {
  const [queue, setQueue] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [orderSets, setOrderSets] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [verbalOrders, setVerbalOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('cpoe'); // 'cpoe' | 'verbal'

  // Prescription Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedKit, setSelectedKit] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState([
    { drugName: '', dosage: '', frequency: 'TDS (Three Times Daily)', durationDays: 5, instructions: 'After meals' }
  ]);
  const [selectedLabTestIds, setSelectedLabTestIds] = useState([]);

  // Verbal Order Form State
  const [verbalForm, setVerbalForm] = useState({
    patientId: '',
    orderDetails: '',
    receivedByNurseId: 5 // Default Sobia Bibi
  });

  useEffect(() => {
    fetchQueue();
    fetchOrderSets();
    fetchLabTests();
    fetchVerbalOrders();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/doctor/queue?all=true');
      if (res.data.success) {
        setQueue(res.data.data);
        if (!selectedAppt && res.data.data.length > 0) {
          setSelectedAppt(res.data.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrderSets = async () => {
    try {
      const res = await api.get('/doctor/order-sets');
      if (res.data.success) setOrderSets(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLabTests = async () => {
    try {
      const res = await api.get('/lims/tests');
      if (res.data.success) setLabTests(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVerbalOrders = async () => {
    try {
      const res = await api.get('/doctor/verbal-orders');
      if (res.data.success) setVerbalOrders(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyOrderSet = (kitCode) => {
    setSelectedKit(kitCode);
    if (kitCode === 'APPENDECTOMY_KIT') {
      setDiagnosis('Acute Appendicitis - Surgical Emergency Prophylaxis');
      setPrescriptionItems([
        { drugName: 'Rocephin 1g Inj', dosage: '1g IV', frequency: 'BD (Twice Daily)', durationDays: 3, instructions: 'Pre-op Antibiotic Prophylaxis' },
        { drugName: 'Toradol 30mg Inj', dosage: '30mg IV', frequency: 'PRN (As Needed)', durationDays: 2, instructions: 'Pain management' },
        { drugName: 'Normal Saline 1000ml', dosage: '1000ml IV', frequency: 'Stat', durationDays: 1, instructions: 'IV Hydration' }
      ]);
      const cbcTest = labTests.find(t => t.test_code === 'CBC_SWELAB');
      if (cbcTest && !selectedLabTestIds.includes(cbcTest.test_id)) {
        setSelectedLabTestIds(prev => [...prev, cbcTest.test_id]);
      }
    } else if (kitCode === 'ER_RESUS_KIT') {
      setDiagnosis('Hypovolemic Shock / Acute Resuscitation Protocol');
      setPrescriptionItems([
        { drugName: 'Ringers Lactate 1000ml', dosage: '1000ml IV', frequency: 'Stat', durationDays: 1, instructions: 'Rapid Infusion' },
        { drugName: 'Adrenaline 1mg Inj', dosage: '1mg IV', frequency: 'Stat', durationDays: 1, instructions: 'Crash Cart Protocol' }
      ]);
    } else if (kitCode === 'NORMAL_DELIVERY_KIT') {
      setDiagnosis('Normal Spontaneous Vaginal Delivery (NSVD)');
      setPrescriptionItems([
        { drugName: 'Syntocinon (Oxytocin) 10 IU', dosage: '10 IU IM', frequency: 'Stat', durationDays: 1, instructions: 'Post-delivery uterine contraction' },
        { drugName: 'Augmentin 625mg', dosage: '1 Tab Oral', frequency: 'BD (Twice Daily)', durationDays: 5, instructions: 'Post-natal antibiotic coverage' }
      ]);
    }
  };

  const handleAddItem = () => {
    setPrescriptionItems(prev => [
      ...prev,
      { drugName: '', dosage: '', frequency: 'TDS (Three Times Daily)', durationDays: 5, instructions: 'After meals' }
    ]);
  };

  const handleRemoveItem = (idx) => {
    setPrescriptionItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    setPrescriptionItems(prev => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  const handleToggleLabTest = (testId) => {
    setSelectedLabTestIds(prev => 
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    if (!diagnosis) {
      alert('Please enter a clinical diagnosis');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/doctor/prescriptions', {
        appointmentId: selectedAppt.appointment_id,
        patientId: selectedAppt.patient_id,
        diagnosis,
        items: prescriptionItems.filter(i => i.drugName.trim() !== ''),
        labTestIds: selectedLabTestIds
      });

      if (res.data.success) {
        alert('CPOE e-Prescription & Diagnostic Lab Orders successfully locked and saved to MySQL!');
        setDiagnosis('');
        setSelectedKit('');
        setPrescriptionItems([{ drugName: '', dosage: '', frequency: 'TDS (Three Times Daily)', durationDays: 5, instructions: 'After meals' }]);
        setSelectedLabTestIds([]);
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleSignVerbalOrder = async (orderId) => {
    try {
      const res = await api.put(`/doctor/verbal-orders/${orderId}/sign`);
      if (res.data.success) {
        alert('Verbal order successfully counter-signed and locked within 24hr protocol.');
        fetchVerbalOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to sign verbal order');
    }
  };

  const handleLogVerbalOrder = async (e) => {
    e.preventDefault();
    if (!verbalForm.patientId || !verbalForm.orderDetails) {
      alert('Patient and Order details are required.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/doctor/verbal-orders', {
        patientId: verbalForm.patientId,
        orderedByDoctorId: 2, // Dr. Tariq Shah
        receivedByNurseId: verbalForm.receivedByNurseId,
        orderDetails: verbalForm.orderDetails
      });
      if (res.data.success) {
        alert('Verbal emergency order logged. 24-Hour Counter-Signature Clock started!');
        setVerbalForm({ patientId: '', orderDetails: '', receivedByNurseId: 5 });
        fetchVerbalOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log verbal order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Workstation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              <Stethoscope className="w-5 h-5" />
            </span>
            <span>Doctor Consultation & CPOE Workstation</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Clinical Order Sets (1-Click Kits), Structured e-Prescribing with FEFO suggestions, and 24-hr Verbal Order counter-signing.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('cpoe')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'cpoe' 
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Live CPOE & E-Prescribing
          </button>
          <button
            onClick={() => setActiveTab('verbal')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'verbal' 
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Verbal Order Log (24h Lock)</span>
            {verbalOrders.filter(v => !v.is_signed_within_24hr).length > 0 && (
              <span className="ml-1 bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {verbalOrders.filter(v => !v.is_signed_within_24hr).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'cpoe' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Waiting Queue (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col max-h-[850px] transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Live Patient Queue ({queue.length})
              </span>
              <button onClick={fetchQueue} className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline">
                Refresh
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {queue.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 dark:text-slate-500">
                  No patients waiting in queue.
                </div>
              ) : (
                queue.map((appt) => {
                  const isSelected = selectedAppt?.appointment_id === appt.appointment_id;
                  return (
                    <div
                      key={appt.appointment_id}
                      onClick={() => setSelectedAppt(appt)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 dark:border-teal-600 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-teal-700 dark:text-teal-400 text-sm">
                          {appt.token_number}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          appt.queue_status === 'COMPLETED' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}>
                          {appt.queue_status}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">{appt.patient_name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        MRN: {appt.mrn} • {appt.gender}, {appt.age_years}Y
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: CPOE Consultation & E-Prescription (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {selectedAppt ? (
              <form onSubmit={handleSubmitPrescription} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 transition-colors">
                {/* Active Patient Header */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      Active Patient Consultation
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedAppt.patient_name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      MRN: {selectedAppt.mrn} • Token: {selectedAppt.token_number} • Age/Gender: {selectedAppt.gender}, {selectedAppt.age_years} Yrs
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-semibold">
                    In Consultation
                  </span>
                </div>

                {/* 1-Click Clinical Order Sets (Fast Kit Selector) */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      1-Click Clinical Order Sets (Evidence-Based Protocols)
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {orderSets.map((kit) => (
                      <button
                        key={kit.kit_code}
                        type="button"
                        onClick={() => handleApplyOrderSet(kit.kit_code)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedKit === kit.kit_code
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs text-teal-700 dark:text-teal-300">{kit.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{kit.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clinical Diagnosis Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Clinical Diagnosis & Findings <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter clinical assessment or ICD-10 notes..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                {/* Medication Prescriptions Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Prescribed Medications (E-Prescription)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Medication
                    </button>
                  </div>

                  <div className="space-y-2">
                    {prescriptionItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <input
                            type="text"
                            required
                            placeholder="Drug name (e.g. Augmentin 625mg)"
                            value={item.drugName}
                            onChange={(e) => handleItemChange(idx, 'drugName', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Dosage (e.g. 1 tab)"
                            value={item.dosage}
                            onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            value={item.frequency}
                            onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                          >
                            <option value="Stat">Stat (Immediate)</option>
                            <option value="OD (Once Daily)">OD (Once Daily)</option>
                            <option value="BD (Twice Daily)">BD (Twice Daily)</option>
                            <option value="TDS (Three Times Daily)">TDS (Three Times Daily)</option>
                            <option value="PRN (As Needed)">PRN (As Needed)</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Days"
                            value={item.durationDays}
                            onChange={(e) => handleItemChange(idx, 'durationDays', parseInt(e.target.value, 10))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Lab Order Integration */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Direct Diagnostic Lab Orders (Automated Barcoding)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {labTests.map((t) => (
                      <label
                        key={t.test_id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          selectedLabTestIds.includes(t.test_id)
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLabTestIds.includes(t.test_id)}
                          onChange={() => handleToggleLabTest(t.test_id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-0"
                        />
                        <span className="truncate">{t.test_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit CPOE */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    Lock e-Prescription & Dispatch Clinical Orders
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center text-slate-400 dark:text-slate-500">
                Please select a patient from the waiting queue on the left to start consultation.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Verbal Order Log & 24h Counter-Signature Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Log Verbal Emergency Order
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Per KP-HCC MSDS 2-B standard: All emergency verbal drug/procedure orders must be logged and counter-signed by the ordering physician within 24 hours.
            </p>

            <form onSubmit={handleLogVerbalOrder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Admitted Patient / Inpatient
                </label>
                <select
                  required
                  value={verbalForm.patientId}
                  onChange={(e) => setVerbalForm({ ...verbalForm, patientId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                >
                  <option value="">-- Choose Patient --</option>
                  {queue.map((q) => (
                    <option key={q.patient_id} value={q.patient_id}>
                      {q.patient_name} (MRN: {q.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Verbal Order Instructions
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Administer Stat 1g Ceftriaxone IV and 1 Ampoule Tramal for acute trauma pain..."
                  value={verbalForm.orderDetails}
                  onChange={(e) => setVerbalForm({ ...verbalForm, orderDetails: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-xs uppercase tracking-wider text-slate-950 rounded-xl shadow-sm transition cursor-pointer"
              >
                Log Verbal Order & Start 24h Clock
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">
              Active Verbal Orders & Sign-off Status
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {verbalOrders.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center">No verbal orders recorded.</p>
              ) : (
                verbalOrders.map((vo) => (
                  <div
                    key={vo.verbal_order_id}
                    className={`p-4 rounded-xl border ${
                      vo.is_signed_within_24hr
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{vo.patient_name}</div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        vo.is_signed_within_24hr
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300 dark:border-amber-700 animate-pulse'
                      }`}>
                        {vo.is_signed_within_24hr ? 'COUNTER-SIGNED' : `REQUIRES SIGNATURE (${vo.hours_elapsed || 0}h elapsed)`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 my-2 italic">"{vo.order_details}"</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono border-t border-slate-200/80 dark:border-slate-800 pt-2 mt-2">
                      <span>Ordered By: {vo.doctor_name} | Received By: {vo.nurse_name}</span>
                      {!vo.is_signed_within_24hr && (
                        <button
                          onClick={() => handleSignVerbalOrder(vo.verbal_order_id)}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                        >
                          Doctor Sign & Lock
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
