import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  FlaskConical, 
  Activity, 
  CheckCircle2, 
  Printer, 
  QrCode, 
  FileCheck, 
  Play, 
  Clock, 
  AlertCircle,
  Binary,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  ShieldCheck,
  FileSpreadsheet,
  Droplets,
  Layers,
  Sparkles
} from 'lucide-react';

export default function LimsPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRawStream, setShowRawStream] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/lims/orders?status=${filterStatus}`);
      if (res.data.success) {
        setOrders(res.data.data);
        if (res.data.data.length > 0 && !selectedOrder) {
          fetchOrderDetails(res.data.data[0].lab_order_id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      const res = await api.get(`/lims/orders/${id}`);
      if (res.data.success) {
        setSelectedOrder(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateAnalyzer = async (id) => {
    try {
      setLoading(true);
      const res = await api.post(`/lims/orders/${id}/simulate-analyzer`);
      if (res.data.success) {
        setSelectedOrder(res.data.data);
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Analyzer simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOrder = async (id) => {
    try {
      setLoading(true);
      const res = await api.put(`/lims/orders/${id}/verify`);
      if (res.data.success) {
        setSelectedOrder(res.data.data);
        fetchOrders();
        alert('Diagnostic report digitally verified and locked with QR seal!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const cbc = selectedOrder?.cbcResults;

  // Helper to determine normal/low/high flag
  const getFlag = (val, min, max) => {
    if (val === undefined || val === null) return { status: 'NORMAL', label: 'Normal', color: 'emerald' };
    const num = parseFloat(val);
    if (num < min) return { status: 'LOW', label: 'Low', color: 'amber' };
    if (num > max) return { status: 'HIGH', label: 'High', color: 'rose' };
    return { status: 'NORMAL', label: 'Normal', color: 'emerald' };
  };

  const filteredOrders = orders.filter(o => 
    o.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.specimen_barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.mrn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Diagnostic Pathology & LIMS Analyzer
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Swelab Alfa 16-Param
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specimen barcode serialization, automated ASTM/HL7 RS-232 telemetry, and Pathologist verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Orders</option>
            <option value="SAMPLE_COLLECTED">Sample Collected</option>
            <option value="RESULT_READY">Result Ready</option>
            <option value="VERIFIED">Verified</option>
          </select>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold transition"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Specimen Worklist (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col max-h-[820px] transition-colors">
          <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Specimen Worklist ({filteredOrders.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">EDTA Whole Blood</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto space-y-2 flex-1 pt-3 pr-1">
            {filteredOrders.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-12 text-center">No specimen orders found.</p>
            ) : (
              filteredOrders.map((o) => {
                const isSelected = selectedOrder?.lab_order_id === o.lab_order_id;
                return (
                  <div
                    key={o.lab_order_id}
                    onClick={() => fetchOrderDetails(o.lab_order_id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 shadow-xs'
                        : 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-purple-700 dark:text-purple-300 text-[11px]">
                        {o.specimen_barcode}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                          o.order_status === 'VERIFIED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : o.order_status === 'RESULT_READY'
                            ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {o.order_status === 'VERIFIED' ? 'Verified' : o.order_status === 'RESULT_READY' ? 'Result Ready' : 'Collected'}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 dark:text-white text-xs mt-1.5">{o.patient_name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex justify-between">
                      <span>MRN: {o.mrn}</span>
                      <span>CBC (16-Param)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: High-Grade Telemetry Diagnostic Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedOrder ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 transition-colors">
              {/* Specimen Telemetry Header */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                      {selectedOrder.specimen_barcode}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                      EDTA Whole Blood
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Patient: <strong className="text-slate-900 dark:text-white">{selectedOrder.patient_name}</strong> • MRN: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{selectedOrder.mrn}</span> ({selectedOrder.gender}, {selectedOrder.age_years || '-'}Y)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedOrder.order_status === 'SAMPLE_COLLECTED' && (
                    <button
                      onClick={() => handleSimulateAnalyzer(selectedOrder.lab_order_id)}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Simulate Serial Capture (Swelab Alfa)
                    </button>
                  )}

                  {selectedOrder.order_status === 'RESULT_READY' && (
                    <button
                      onClick={() => handleVerifyOrder(selectedOrder.lab_order_id)}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Pathologist Digital Sign-Off
                    </button>
                  )}

                  {selectedOrder.order_status === 'VERIFIED' && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Digitally Verified by Pathologist
                    </span>
                  )}
                </div>
              </div>

              {/* Diagnostic Results Viewport */}
              {cbc ? (
                <div className="space-y-6">
                  {/* Panel 1: Key Primary Telemetry Cards (WBC, RBC, HGB, PLT) */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        Key Hematology Indices
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Acquired: {new Date(cbc.imported_at).toLocaleTimeString('en-PK')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      {/* WBC */}
                      {(() => {
                        const flag = getFlag(cbc.wbc, 4.0, 10.0);
                        return (
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                              <span>WBC</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                flag.status === 'NORMAL' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'
                              }`}>{flag.label}</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                              {cbc.wbc}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Ref: 4.0 - 10.0 x10^9/L
                            </div>
                          </div>
                        );
                      })()}

                      {/* RBC */}
                      {(() => {
                        const flag = getFlag(cbc.rbc, 3.8, 5.8);
                        return (
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                              <span>RBC</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                flag.status === 'NORMAL' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'
                              }`}>{flag.label}</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                              {cbc.rbc}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Ref: 3.8 - 5.8 x10^12/L
                            </div>
                          </div>
                        );
                      })()}

                      {/* Hemoglobin */}
                      {(() => {
                        const flag = getFlag(cbc.hgb, 11.5, 16.5);
                        return (
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                              <span>Hemoglobin</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                flag.status === 'NORMAL' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'
                              }`}>{flag.label}</span>
                            </div>
                            <div className={`text-2xl font-black font-mono tracking-tight ${flag.status !== 'NORMAL' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                              {cbc.hgb}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Ref: 11.5 - 16.5 g/dL
                            </div>
                          </div>
                        );
                      })()}

                      {/* Platelets */}
                      {(() => {
                        const flag = getFlag(cbc.plt, 150, 450);
                        return (
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                              <span>Platelets</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                flag.status === 'NORMAL' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'
                              }`}>{flag.label}</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                              {cbc.plt}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Ref: 150 - 450 x10^9/L
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Panel 2: Clean Two-Column Medical Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left: Red Blood Cell Indices Table */}
                    <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Red Blood Cell Indices & Morphology
                      </h5>
                      <div className="divide-y divide-slate-200/60 dark:divide-slate-800 text-xs">
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Hematocrit (HCT)</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{cbc.hct} %</span>
                          <span className="text-[10px] text-slate-400 font-mono">35.0 - 50.0</span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">MCV (Mean Corpuscular Vol)</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{cbc.mcv} fL</span>
                          <span className="text-[10px] text-slate-400 font-mono">80.0 - 98.0</span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">MCH (Mean Corpuscular Hgb)</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{cbc.mch} pg</span>
                          <span className="text-[10px] text-slate-400 font-mono">27.0 - 32.0</span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">MCHC (Mean Corp Hgb Conc)</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{cbc.mchc} g/dL</span>
                          <span className="text-[10px] text-slate-400 font-mono">32.0 - 36.0</span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">RDW-CV (Red Cell Distribution)</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{cbc.rdw_pct} %</span>
                          <span className="text-[10px] text-slate-400 font-mono">11.5 - 14.5</span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">MPV (Mean Platelet Volume)</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{cbc.mpv} fL</span>
                          <span className="text-[10px] text-slate-400 font-mono">7.0 - 11.0</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: White Blood Cell 3-Part Differential Breakdown */}
                    <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          WBC 3-Part Differential
                        </h5>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">100% Total</span>
                      </div>

                      {/* Visual Stacked Differential Bar */}
                      <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700">
                        <div 
                          style={{ width: `${cbc.gra_pct || 55}%` }} 
                          className="bg-indigo-500 h-full" 
                          title={`Granulocytes: ${cbc.gra_pct}%`} 
                        />
                        <div 
                          style={{ width: `${cbc.lym_pct || 30}%` }} 
                          className="bg-teal-500 h-full" 
                          title={`Lymphocytes: ${cbc.lym_pct}%`} 
                        />
                        <div 
                          style={{ width: `${cbc.mid_pct || 15}%` }} 
                          className="bg-amber-500 h-full" 
                          title={`Mid/Monocytes: ${cbc.mid_pct || 15}%`} 
                        />
                      </div>

                      <div className="space-y-2 pt-1 text-xs">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">Granulocytes (GRA)</span>
                          </div>
                          <div className="font-mono text-slate-900 dark:text-white font-bold">
                            {cbc.gra_pct}% <span className="text-[10px] font-normal text-slate-400">({cbc.gra_num} x10^9/L)</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">Lymphocytes (LYM)</span>
                          </div>
                          <div className="font-mono text-slate-900 dark:text-white font-bold">
                            {cbc.lym_pct}% <span className="text-[10px] font-normal text-slate-400">({cbc.lym_num} x10^9/L)</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">Mid-sized / Monocytes</span>
                          </div>
                          <div className="font-mono text-slate-900 dark:text-white font-bold">
                            {cbc.mid_pct || 12.62}% <span className="text-[10px] font-normal text-slate-400">({cbc.mid_num || 0.8} x10^9/L)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Serial Analyzer RS-232 Stream (No more ugly permanent black box!) */}
                  <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowRawStream(!showRawStream)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2">
                        <Binary className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Serial RS-232 Diagnostic Packet (ASTM 1394 / HL7)</span>
                        <span className="text-[10px] px-2 py-0.2 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded font-mono">
                          Live Stream Capture
                        </span>
                      </div>
                      {showRawStream ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {showRawStream && (
                      <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap border-t border-slate-800 leading-relaxed">
                        {cbc.raw_serial_payload || 'No raw serial ASTM packet stored.'}
                      </div>
                    )}
                  </div>

                  {/* QR Digital Verification Seal */}
                  {selectedOrder.order_status === 'VERIFIED' && (
                    <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-xs">
                          <QrCode className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                            KP-HCC Diagnostic Quality Seal (Category 2-B Verified)
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                            Signed by Pathologist: <strong>{selectedOrder.pathologist_name || 'Dr. Hamza Noor'}</strong> • {new Date(selectedOrder.verified_at).toLocaleString('en-PK')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Lab Report
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Specimen collected. Click <strong>"Simulate Serial Capture (Swelab Alfa)"</strong> above to stream analyzer data.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-20 text-center text-slate-400 dark:text-slate-500 text-xs">
              Select an order from the left worklist to view analyzer parameters and verify reports.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
