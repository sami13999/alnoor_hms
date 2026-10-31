import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Calendar, 
  Plus, 
  Search, 
  BarChart3,
  Layers
} from 'lucide-react';

export default function AuditPage() {
  const [evaluations, setEvaluations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [activeTab, setActiveTab] = useState('kphcc'); // 'kphcc' | 'assets'
  const [loading, setLoading] = useState(false);

  // New Audit Form state
  const [passingIndicators, setPassingIndicators] = useState(105);
  const [auditDate, setAuditDate] = useState(new Date().toISOString().slice(0, 10));

  // Asset Modal state
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetForm, setAssetForm] = useState({
    assetCode: 'LAB-EQP-0004',
    assetName: 'Automated Urine Chemistry Analyzer',
    department: 'LAB',
    modelNumber: 'UriScan Pro',
    serialNumber: 'USP-8831',
    lastCalibrationDate: new Date().toISOString().slice(0, 10),
    nextCalibrationDue: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });

  useEffect(() => {
    fetchEvaluations();
    fetchAssets();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const res = await api.get('/audit/kphcc-msds');
      if (res.data.success) {
        setEvaluations(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await api.get('/audit/fixed-assets');
      if (res.data.success) {
        setAssets(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordAudit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/audit/kphcc-msds', {
        auditDate,
        passingIndicators
      });
      if (res.data.success) {
        alert(`KP-HCC Audit Evaluation Recorded! ${res.data.standardBadge}`);
        fetchEvaluations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record audit');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/audit/fixed-assets', assetForm);
      if (res.data.success) {
        setShowAssetModal(false);
        fetchAssets();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const scorePct = parseFloat(((passingIndicators / 122) * 100).toFixed(1));
  const isCompliant = scorePct >= 80.0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Award className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              KP-HCC Category 2-B Governance & Asset Calibration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              122 Minimum Service Delivery Standards (MSDS) indicators monitoring (≥ 80% passing threshold) and biomedical equipment calibration logs.
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('kphcc')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'kphcc' 
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            KP-HCC 122 Indicators
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'assets' 
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Biomedical Assets & Calibration
          </button>
        </div>
      </div>

      {activeTab === 'kphcc' ? (
        <div className="space-y-6">
          {/* Real-time KPI Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-6 shadow-sm transition-colors">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Khyber Pakhtunkhwa Health Care Commission (KP-HCC)
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Category 2-B Hospital Minimum Service Delivery Standards (MSDS)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                Al Noor Specialist Hospital, Battagram is governed under the KP-HCC Act. Category 2-B hospitals must satisfy at least 80% of the 122 clinical, radiological, laboratory, and patient safety indicators.
              </p>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl min-w-[140px]">
                <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{scorePct}%</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">Compliance Score</div>
              </div>

              <div>
                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 shadow-xs ${
                  isCompliant
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-500'
                    : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-500'
                }`}>
                  {isCompliant ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      CATEGORY 2-B COMPLIANT (≥ 80%)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      NON-COMPLIANT (&lt; 80%)
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Calculator Form & History Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Record Hospital Audit Assessment
              </h4>

              <form onSubmit={handleRecordAudit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Audit Date
                  </label>
                  <input
                    type="date"
                    required
                    value={auditDate}
                    onChange={(e) => setAuditDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Passing Indicators:</span>
                    <span className="font-mono text-teal-700 dark:text-teal-400 font-bold">{passingIndicators} / 122</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="122"
                    value={passingIndicators}
                    onChange={(e) => setPassingIndicators(parseInt(e.target.value, 10))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Total Statutory Indicators:</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">122</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Current Passing Count:</span>
                    <span className="font-mono text-teal-700 dark:text-teal-300 font-bold">{passingIndicators}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Score Percentage:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{scorePct}%</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition cursor-pointer"
                >
                  Save Assessment & Seal Evaluation
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                Historical KP-HCC Audit Evaluations ({evaluations.length})
              </h4>

              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Passing / Total</th>
                      <th className="p-3">Score %</th>
                      <th className="p-3">Category 2-B Compliance</th>
                      <th className="p-3">Evaluated At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {evaluations.map((ev) => (
                      <tr key={ev.audit_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{ev.audit_date}</td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{ev.passing_indicators} / {ev.indicator_count}</td>
                        <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-400">{ev.score_percentage}%</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            ev.is_compliant_category_2b
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          }`}>
                            {ev.is_compliant_category_2b ? 'COMPLIANT' : 'NON-COMPLIANT'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {new Date(ev.evaluated_at).toLocaleString('en-PK')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Fixed Assets & Biomedical Calibration Section */
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase">Biomedical Equipment & Fixed Asset Registry</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Asset syntax: <code>[DEPT]-[TYPE]-[SERIAL]</code>. Calibrations monitored for KP-HCC electrical safety & diagnostic precision standards.
              </p>
            </div>
            <button
              onClick={() => setShowAssetModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Register Fixed Asset
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">Asset Code</th>
                    <th className="p-3.5">Asset Title</th>
                    <th className="p-3.5">Dept</th>
                    <th className="p-3.5">Model / Serial #</th>
                    <th className="p-3.5">Last Calibration</th>
                    <th className="p-3.5">Next Due</th>
                    <th className="p-3.5">Calibration Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assets.map((a) => (
                    <tr key={a.asset_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-teal-700 dark:text-teal-400">{a.asset_code}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{a.asset_name}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {a.department}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {a.model_number || '-'} / {a.serial_number || '-'}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono">
                        {a.last_calibration_date ? new Date(a.last_calibration_date).toLocaleDateString('en-PK') : 'Pending'}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {a.next_calibration_due ? new Date(a.next_calibration_due).toLocaleDateString('en-PK') : 'N/A'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          a.calibration_status === 'OVERDUE'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 font-black animate-pulse'
                            : a.calibration_status === 'DUE_SOON'
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200'
                            : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200'
                        }`}>
                          {a.calibration_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Register Fixed Biomedical Asset
            </h3>
            <form onSubmit={handleSaveAsset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Code [DEPT]-[TYPE]-[SERIAL]
                </label>
                <input
                  type="text"
                  required
                  value={assetForm.assetCode}
                  onChange={(e) => setAssetForm({ ...assetForm, assetCode: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  value={assetForm.assetName}
                  onChange={(e) => setAssetForm({ ...assetForm, assetName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={assetForm.department}
                  onChange={(e) => setAssetForm({ ...assetForm, department: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="OPD">OPD</option>
                  <option value="IPD">IPD</option>
                  <option value="LAB">LAB</option>
                  <option value="OT">OT</option>
                  <option value="PHARMACY">PHARMACY</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Model #</label>
                  <input
                    type="text"
                    value={assetForm.modelNumber}
                    onChange={(e) => setAssetForm({ ...assetForm, modelNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Serial #</label>
                  <input
                    type="text"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Calibration</label>
                  <input
                    type="date"
                    value={assetForm.lastCalibrationDate}
                    onChange={(e) => setAssetForm({ ...assetForm, lastCalibrationDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Next Due Date</label>
                  <input
                    type="date"
                    value={assetForm.nextCalibrationDue}
                    onChange={(e) => setAssetForm({ ...assetForm, nextCalibrationDue: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Asset Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
