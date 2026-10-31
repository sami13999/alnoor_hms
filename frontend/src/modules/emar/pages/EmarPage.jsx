import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  ShieldCheck, 
  QrCode, 
  Thermometer, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  User, 
  Pill,
  Sparkles
} from 'lucide-react';

export default function EmarPage() {
  const [scheduled, setScheduled] = useState([]);
  const [recentAdmins, setRecentAdmins] = useState([]);
  const [tempLogs, setTempLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'fridge'
  const [loading, setLoading] = useState(false);
  const [wards, setWards] = useState([]);

  // 5-Rights Scanner inputs
  const [selectedItem, setSelectedItem] = useState(null);
  const [wristbandCode, setWristbandCode] = useState('');
  const [drugBarcode, setDrugBarcode] = useState('');
  const [dosageGiven, setDosageGiven] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  // Fridge Temperature form
  const [fridgeForm, setFridgeForm] = useState({
    wardId: 1,
    fridgeId: 'FRIDGE-ER-01',
    tempCelsius: '4.5'
  });

  useEffect(() => {
    fetchScheduled();
    fetchRecentAdmins();
    fetchTempLogs();
    fetchWards();
  }, []);

  const fetchScheduled = async () => {
    try {
      const res = await api.get('/emar/scheduled');
      if (res.data.success) {
        setScheduled(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentAdmins = async () => {
    try {
      const res = await api.get('/emar/recent');
      if (res.data.success) {
        setRecentAdmins(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTempLogs = async () => {
    try {
      const res = await api.get('/emar/temperatures');
      if (res.data.success) {
        setTempLogs(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWards = async () => {
    try {
      const res = await api.get('/ipd/wards-beds');
      if (res.data.success) {
        setWards(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSchedule = (item) => {
    setSelectedItem(item);
    setScanResult(null);
    setScanError(null);
    setDosageGiven(item.dosage);
    setWristbandCode(item.wristband_barcode);
    setDrugBarcode(item.expected_drug_barcode || '896400010011');
  };

  const handleBedsideValidate = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setScanError(null);
    setScanResult(null);

    try {
      setLoading(true);
      const res = await api.post('/emar/administer', {
        admissionId: selectedItem.admission_id,
        prescriptionItemId: selectedItem.prescription_item_id,
        scannedWristbandCode: wristbandCode.trim(),
        scannedDrugBarcode: drugBarcode.trim(),
        dosageGiven: dosageGiven.trim() || selectedItem.dosage
      });

      if (res.data.success) {
        setScanResult(res.data);
        fetchScheduled();
        fetchRecentAdmins();
      }
    } catch (err) {
      setScanError(err.response?.data?.message || 'Bedside 5-Rights validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogTemperature = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/emar/temperatures', fridgeForm);
      if (res.data.success) {
        alert('Ward Cold-Chain Temperature successfully logged to database!');
        fetchTempLogs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record temperature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Workstation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Bedside e-MAR (5-Rights Barcode Verification) & Cold Chain
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dual-barcode verification (Patient Wristband + Medication Unit Barcode) ensuring the Right Patient, Drug, Dose, Route, and Time.
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'scanner' 
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Bedside 5-Rights Barcode Scanner
          </button>
          <button
            onClick={() => setActiveTab('fridge')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'fridge' 
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ward Cold-Chain Fridge Log
          </button>
        </div>
      </div>

      {activeTab === 'scanner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scheduled Meds Worklist (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col max-h-[850px] transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Prescribed Inpatient Meds Due ({scheduled.length})
              </span>
              <button onClick={fetchScheduled} className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline">
                Refresh
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {scheduled.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-10 text-center">
                  No active inpatient prescriptions due for administration.
                </p>
              ) : (
                scheduled.map((item, idx) => {
                  const isSelected = selectedItem?.prescription_item_id === item.prescription_item_id && selectedItem?.admission_id === item.admission_id;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectSchedule(item)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{item.patient_name}</span>
                        <span className="font-mono text-[10px] text-teal-700 dark:text-teal-300 font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800">
                          Bed: {item.bed_number}
                        </span>
                      </div>

                      <div className="font-bold text-rose-700 dark:text-rose-400 text-xs mt-1">
                        {item.drug_name} — {item.dosage} ({item.frequency})
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 flex justify-between">
                        <span>WB: {item.wristband_barcode}</span>
                        <span>{item.ward_name}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 5-Rights Bedside Verification Terminal (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 transition-colors">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase">
                    Bedside 5-Rights Cross-Check Protocol
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Scan patient wristband barcode and medicine barcode at bedside before drug release.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {['Right Patient', 'Right Drug', 'Right Dose', 'Right Route', 'Right Time'].map((r) => (
                    <span key={r} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 text-[9px] font-bold rounded-md border border-slate-200 dark:border-slate-700">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {selectedItem ? (
                <form onSubmit={handleBedsideValidate} className="space-y-4">
                  {/* Selected Prescription Details */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      Prescribed Clinical Order
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedItem.drug_name} ({selectedItem.dosage}) — {selectedItem.frequency}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 font-mono">
                      Target Patient: <strong className="text-slate-900 dark:text-white">{selectedItem.patient_name}</strong> (MRN: {selectedItem.mrn}) • Bed: {selectedItem.bed_number}
                    </div>
                    {selectedItem.instructions && (
                      <div className="text-teal-700 dark:text-teal-400 italic">Instructions: {selectedItem.instructions}</div>
                    )}
                  </div>

                  {/* Barcode Scanner Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        1. Scanned Wristband Barcode
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Scan or enter wristband code"
                        value={wristbandCode}
                        onChange={(e) => setWristbandCode(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        2. Scanned Drug Unit Barcode
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Scan or enter drug barcode"
                        value={drugBarcode}
                        onChange={(e) => setDrugBarcode(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      3. Actual Dosage Administered
                    </label>
                    <input
                      type="text"
                      required
                      value={dosageGiven}
                      onChange={(e) => setDosageGiven(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                    />
                  </div>

                  {/* Alerts / Error feedback */}
                  {scanError && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-800 dark:text-rose-200 text-xs font-bold">
                      <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>{scanError}</span>
                    </div>
                  )}

                  {scanResult && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div>{scanResult.message}</div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                          Administered by: {scanResult.administration?.nurse_name} at {new Date(scanResult.administration?.administered_at).toLocaleTimeString('en-PK')}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-teal-600 hover:from-rose-700 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm transition cursor-pointer"
                  >
                    Verify 5-Rights & Confirm Administration
                  </button>
                </form>
              ) : (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Select a scheduled medication from the left queue to begin bedside 5-rights verification.
                </div>
              )}
            </div>

            {/* Recent Administrations Log */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                Recent 5-Rights Bedside Administration Audit Log ({recentAdmins.length})
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {recentAdmins.map((adm) => (
                  <div key={adm.emar_id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{adm.patient_name} (Bed {adm.bed_number})</div>
                      <div className="text-[10px] text-teal-700 dark:text-teal-400 font-mono">
                        {adm.drug_name} — {adm.dosage_given}
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold block">5-Rights Verified</span>
                      <span>Nurse: {adm.nurse_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Cold-Chain Fridge Logs */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Log Medication Fridge Temp
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                KP-HCC Category 2-B standard: Cold-chain refrigerators storing vaccines and insulin must maintain 2.0°C to 8.0°C.
              </p>

              <form onSubmit={handleLogTemperature} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ward</label>
                  <select
                    value={fridgeForm.wardId}
                    onChange={(e) => setFridgeForm({ ...fridgeForm, wardId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    {wards.map((w) => (
                      <option key={w.ward_id} value={w.ward_id}>{w.ward_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fridge Device ID</label>
                  <input
                    type="text"
                    required
                    value={fridgeForm.fridgeId}
                    onChange={(e) => setFridgeForm({ ...fridgeForm, fridgeId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={fridgeForm.tempCelsius}
                    onChange={(e) => setFridgeForm({ ...fridgeForm, tempCelsius: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition"
                >
                  Record Temperature & Verify Cold Chain
                </button>
              </form>
            </div>

            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase">Twice-Daily Temperature Logs</h3>
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Ward</th>
                      <th className="p-3">Fridge ID</th>
                      <th className="p-3">Temp (°C)</th>
                      <th className="p-3">Cold Chain Status</th>
                      <th className="p-3">Recorded By</th>
                      <th className="p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tempLogs.map((log) => (
                      <tr key={log.temp_log_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{log.ward_name}</td>
                        <td className="p-3 font-mono text-cyan-700 dark:text-cyan-400">{log.fridge_id}</td>
                        <td className="p-3 font-mono font-bold text-sm text-slate-900 dark:text-white">{log.temp_celsius}°C</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            log.is_cold_chain_breach
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {log.is_cold_chain_breach ? 'BREACH ALERT (<2°C or >8°C)' : 'Compliant (2-8°C)'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{log.nurse_name}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">{new Date(log.logged_at).toLocaleString('en-PK')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
