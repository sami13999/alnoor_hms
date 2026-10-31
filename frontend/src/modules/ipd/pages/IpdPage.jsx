import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  Bed, 
  User, 
  Printer, 
  LogOut, 
  Plus, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Building,
  CheckCircle2,
  Trash2,
  QrCode
} from 'lucide-react';
import WristbandModal from '../../../components/WristbandModal';

export default function IpdPage() {
  const [wards, setWards] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWristband, setSelectedWristband] = useState(null);
  const [showWristbandModal, setShowWristbandModal] = useState(false);

  // New Admission Modal state
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  useEffect(() => {
    fetchWardsAndBeds();
    fetchActiveAdmissions();
    fetchPatients();
  }, []);

  const fetchWardsAndBeds = async () => {
    try {
      const res = await api.get('/ipd/wards-beds');
      if (res.data.success) {
        setWards(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActiveAdmissions = async () => {
    try {
      const res = await api.get('/ipd/admissions/active');
      if (res.data.success) {
        setAdmissions(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/opd/patients');
      if (res.data.success) {
        setPatients(res.data.data);
        if (res.data.data.length > 0) setSelectedPatientId(res.data.data[0].patient_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBedClick = (bed) => {
    if (bed.status === 'VACANT') {
      setSelectedBed(bed);
      setShowAdmitModal(true);
    } else if (bed.status === 'OCCUPIED' && bed.admission_id) {
      handlePrintWristband(bed.admission_id);
    } else if (bed.status === 'DIRTY') {
      if (window.confirm(`Mark bed ${bed.bed_number} as clean and ready for admission?`)) {
        handleCleanBed(bed.bed_id);
      }
    }
  };

  const handleCleanBed = async (bedId) => {
    try {
      const res = await api.put(`/ipd/beds/${bedId}/status`, { status: 'VACANT' });
      if (res.data.success) {
        fetchWardsAndBeds();
      }
    } catch (e) {
      alert('Failed to update bed status');
    }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedBed) return;
    try {
      setLoading(true);
      const res = await api.post('/ipd/admissions', {
        patientId: selectedPatientId,
        bedId: selectedBed.bed_id,
        attendingDoctorId: 2 // Dr. Tariq Shah
      });

      if (res.data.success) {
        setShowAdmitModal(false);
        fetchWardsAndBeds();
        fetchActiveAdmissions();
        setSelectedWristband(res.data.data);
        setShowWristbandModal(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Admission failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintWristband = async (admissionId) => {
    try {
      const res = await api.get(`/ipd/wristband/${admissionId}`);
      if (res.data.success) {
        setSelectedWristband(res.data.data);
        setShowWristbandModal(true);
      }
    } catch (e) {
      alert('Failed to fetch wristband data');
    }
  };

  const handleDischarge = async (admissionId) => {
    if (!window.confirm('Discharge patient and mark bed for terminal cleaning?')) return;
    try {
      const res = await api.put(`/ipd/admissions/${admissionId}/discharge`);
      if (res.data.success) {
        alert('Patient discharged. Bed marked DIRTY for housekeeping cleaning.');
        fetchWardsAndBeds();
        fetchActiveAdmissions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Discharge failed');
    }
  };

  const totalBeds = wards.reduce((acc, w) => acc + w.beds.length, 0);
  const occupiedBeds = wards.reduce((acc, w) => acc + w.beds.filter(b => b.status === 'OCCUPIED').length, 0);
  const vacantBeds = wards.reduce((acc, w) => acc + w.beds.filter(b => b.status === 'VACANT').length, 0);
  const dirtyBeds = wards.reduce((acc, w) => acc + w.beds.filter(b => b.status === 'DIRTY').length, 0);

  return (
    <div className="space-y-6">
      {/* Top Clinical Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Inpatient Beds
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalBeds} Beds</div>
          <span className="text-xs text-slate-400">Across 5 Hospital Wards</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Vacant & Ready
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{vacantBeds} Beds</div>
          <span className="text-xs text-slate-400">Available for Intake</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              Occupied Inpatients
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
          </div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">{occupiedBeds} Beds</div>
          <span className="text-xs text-slate-400">Active Patient Care</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Terminal Cleaning
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{dirtyBeds} Beds</div>
          <span className="text-xs text-slate-400">Housekeeping Protocol</span>
        </div>
      </div>

      {/* Ward-by-Ward Telemetry Bed Cards */}
      <div className="space-y-6">
        {wards.map((ward) => {
          const wardVacant = ward.beds.filter(b => b.status === 'VACANT').length;
          const occupancyRate = ward.beds.length > 0 ? Math.round(((ward.beds.length - wardVacant) / ward.beds.length) * 100) : 0;

          return (
            <div
              key={ward.ward_id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Ward Header */}
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-xl">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                      {ward.ward_name}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Department: {ward.ward_type} Ward
                    </span>
                  </div>
                </div>

                {/* Occupancy Indicator */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {ward.beds.length - wardVacant} of {ward.beds.length} Beds Occupied
                    </span>
                    <div className="w-32 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-teal-500 h-full rounded-full transition-all"
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
                    {occupancyRate}%
                  </span>
                </div>
              </div>

              {/* Beds Grid */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ward.beds.map((bed) => {
                  const isOccupied = bed.status === 'OCCUPIED';
                  const isVacant = bed.status === 'VACANT';
                  const isDirty = bed.status === 'DIRTY';

                  return (
                    <div
                      key={bed.bed_id}
                      className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                        isOccupied
                          ? 'bg-blue-50/40 dark:bg-slate-800/60 border-blue-200 dark:border-blue-800/80 shadow-xs'
                          : isVacant
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400 hover:shadow-md'
                          : isDirty
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80'
                          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80'
                      }`}
                    >
                      {/* Bed Card Header */}
                      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bed className={`w-4 h-4 ${isOccupied ? 'text-blue-600 dark:text-cyan-400' : isVacant ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`} />
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                            {bed.bed_number}
                          </span>
                        </div>

                        {/* Status Chip */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                            isOccupied
                              ? 'bg-blue-100 text-blue-800 dark:bg-cyan-950 dark:text-cyan-300 border-blue-200 dark:border-cyan-700'
                              : isVacant
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                              : isDirty
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isOccupied ? 'bg-blue-600 dark:bg-cyan-500' : isVacant ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                          }`} />
                          {bed.status}
                        </span>
                      </div>

                      {/* Bed Card Body */}
                      <div className="p-4 flex-1">
                        {isOccupied ? (
                          <div className="space-y-3">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-cyan-950 text-blue-800 dark:text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-300 dark:border-cyan-700">
                                {bed.patient_name?.charAt(0) || 'P'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                  {bed.patient_name}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                  MRN: <strong className="text-slate-700 dark:text-slate-300">{bed.mrn}</strong> ({bed.gender}, {bed.age_years}Y)
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1 pt-1.5 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800">
                              <div className="flex justify-between font-mono">
                                <span>Wristband:</span>
                                <span className="font-bold text-blue-700 dark:text-cyan-400">{bed.wristband_barcode}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Attending:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{bed.doctor_name || 'Dr. Tariq Shah'}</span>
                              </div>
                            </div>
                          </div>
                        ) : isDirty ? (
                          <div className="py-4 text-center space-y-2">
                            <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                            <div className="text-xs font-bold text-amber-800 dark:text-amber-400">
                              Patient Discharged • Dirty Bed
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Terminal decontamination required before next admission.
                            </p>
                          </div>
                        ) : (
                          <div className="py-5 text-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
                              <Plus className="w-5 h-5" />
                            </div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Bed Clean & Ready
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Click to admit a registered patient.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Bed Card Actions Footer */}
                      <div className="p-3 bg-white/80 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
                        {isOccupied ? (
                          <>
                            <button
                              onClick={() => handlePrintWristband(bed.admission_id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition shadow-xs"
                            >
                              <Printer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              Wristband
                            </button>
                            <button
                              onClick={() => handleDischarge(bed.admission_id)}
                              className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition"
                            >
                              Discharge
                            </button>
                          </>
                        ) : isDirty ? (
                          <button
                            onClick={() => handleCleanBed(bed.bed_id)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Clean & Vacant
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBedClick(bed)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            <Plus className="w-4 h-4" />
                            Admit Patient
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admitted Inpatients Reference Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
              Currently Admitted Inpatients ({admissions.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Positive patient identification (KP-HCC MSDS 4.1 compliant wristband barcodes)
            </p>
          </div>
          <button onClick={fetchActiveAdmissions} className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline">
            Refresh List
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Patient / MRN</th>
                <th className="p-3">Ward & Bed</th>
                <th className="p-3">Thermal Wristband Barcode</th>
                <th className="p-3">Admitted Date</th>
                <th className="p-3">Attending Physician</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {admissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No active admissions in inpatient wards.
                  </td>
                </tr>
              ) : (
                admissions.map((ad) => (
                  <tr key={ad.admission_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{ad.patient_name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {ad.mrn} ({ad.gender}, {ad.age_years}Y)
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{ad.ward_name}</div>
                      <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold">{ad.bed_number}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {ad.wristband_barcode}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {new Date(ad.admitted_at).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{ad.doctor_name}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handlePrintWristband(ad.admission_id)}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs shadow-sm transition"
                      >
                        Print Wristband
                      </button>
                      <button
                        onClick={() => handleDischarge(ad.admission_id)}
                        className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg font-bold text-xs transition"
                      >
                        Discharge
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bed Admission Modal */}
      {showAdmitModal && selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bed className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Admit Patient to Bed {selectedBed.bed_number}
            </h3>
            <form onSubmit={handleAdmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Patient Record
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.full_name} (MRN: {p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div><strong>Ward Location:</strong> {wards.find(w => w.ward_id === selectedBed.ward_id)?.ward_name}</div>
                <div><strong>Bed Code:</strong> {selectedBed.bed_number}</div>
                <div><strong>Inpatient Bed Rate:</strong> Rs. 1,500 / day</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Confirm Admission & Print Wristband
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 250x30mm Wristband Modal */}
      <WristbandModal
        isOpen={showWristbandModal}
        onClose={() => setShowWristbandModal(false)}
        data={selectedWristband}
      />
    </div>
  );
}
