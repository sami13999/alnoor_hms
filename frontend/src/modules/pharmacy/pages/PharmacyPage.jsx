import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ShieldAlert, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Printer, 
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import ThermalSlipModal from '../../../components/ThermalSlipModal';

export default function PharmacyPage() {
  const [inventory, setInventory] = useState([]);
  const [pendingRx, setPendingRx] = useState([]);
  const [crashCartLogs, setCrashCartLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [lasaOnly, setLasaOnly] = useState(false);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dispense'); // 'dispense' | 'crashcart'

  // Crash Cart Modal state
  const [showCrashModal, setShowCrashModal] = useState(false);
  const [crashForm, setCrashForm] = useState({
    wardName: 'Emergency Room (ER)',
    sealNumber: 'SEAL-2026-ER99',
    adrenalineQty: 10,
    atropineQty: 10,
    notes: 'Daily morning shift seal verification. All ampoules intact.'
  });

  // Slip modal state
  const [receiptData, setReceiptData] = useState(null);
  const [showSlip, setShowSlip] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchPendingPrescriptions();
    fetchCrashCartLogs();
  }, [lasaOnly]);

  const fetchInventory = async () => {
    try {
      const res = await api.get(`/pharmacy/inventory?search=${encodeURIComponent(search)}&lasaOnly=${lasaOnly}`);
      if (res.data.success) {
        setInventory(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPendingPrescriptions = async () => {
    try {
      const res = await api.get('/pharmacy/prescriptions/pending');
      if (res.data.success) {
        setPendingRx(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCrashCartLogs = async () => {
    try {
      const res = await api.get('/pharmacy/crash-cart/logs');
      if (res.data.success) {
        setCrashCartLogs(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddToCart = (item) => {
    const existing = cart.find(c => c.batchId === item.batch_id);
    if (existing) {
      if (existing.quantity + 1 > item.stock_quantity) {
        alert('Cannot add more than available stock quantity');
        return;
      }
      setCart(cart.map(c => c.batchId === item.batch_id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([
        ...cart,
        {
          batchId: item.batch_id,
          brandName: item.brand_name,
          genericName: item.generic_name,
          batchNumber: item.batch_number,
          unitPrice: parseFloat(item.selling_price),
          quantity: 1,
          isLasa: item.is_lasa
        }
      ]);
    }
  };

  const handleRemoveFromCart = (batchId) => {
    setCart(cart.filter(c => c.batchId !== batchId));
  };

  const totalCart = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleCheckout = async (prescriptionId = null, patientId = null) => {
    if (cart.length === 0) return;
    try {
      setLoading(true);
      const res = await api.post('/pharmacy/checkout', {
        patientId: patientId || 1, // Default walk-in / OPD
        prescriptionId,
        items: cart.map(c => ({
          batchId: c.batchId,
          quantity: c.quantity,
          unitPrice: c.unitPrice
        }))
      });

      if (res.data.success) {
        setReceiptData({
          saleId: res.data.data.sale_id,
          totalAmount: res.data.data.total_amount,
          items: cart,
          date: new Date().toISOString()
        });
        setShowSlip(true);
        setCart([]);
        fetchInventory();
        fetchPendingPrescriptions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCrashCart = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/pharmacy/crash-cart/verify', crashForm);
      if (res.data.success) {
        alert('Daily Crash Cart seal & medication tally successfully recorded!');
        setShowCrashModal(false);
        fetchCrashCartLogs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record crash cart log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* High-Contrast LASA Drug Alert Banner */}
      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100 flex items-start justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-800 dark:text-rose-200">
              MANDATORY LASA SAFETY ALERT (LOOK-ALIKE / SOUND-ALIKE MEDICATIONS)
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
              Verify generic formulations before dispensing: <strong>Toradol (Ketorolac)</strong> vs <strong>Tramal (Tramadol)</strong>, and <strong>Adrenaline (Epinephrine)</strong> vs <strong>Atropine Sulfate</strong>. Barcode confirmation required.
            </p>
          </div>
        </div>
        <button
          onClick={() => setLasaOnly(!lasaOnly)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
            lasaOnly 
              ? 'bg-rose-600 text-white' 
              : 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {lasaOnly ? 'Showing LASA Drugs Only' : 'Filter LASA Drugs'}
        </button>
      </div>

      {/* Top Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
            <Pill className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Pharmacy POS & Safe Dispensing Terminal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              FEFO automated batch inventory deduction, look-alike/sound-alike safety screening, and daily resuscitation crash cart seal tally.
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('dispense')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'dispense' 
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            FEFO POS Dispensing
          </button>
          <button
            onClick={() => setActiveTab('crashcart')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'crashcart' 
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Crash Cart Daily Inspection
          </button>
        </div>
      </div>

      {activeTab === 'dispense' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: FEFO Drug Catalog (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search & Filter Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex gap-3 shadow-sm transition-colors">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Scan barcode or type medicine brand / generic name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
              <button
                onClick={fetchInventory}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition"
              >
                Search
              </button>
            </div>

            {/* FEFO Batches Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <span>Formulary Inventory (FEFO Auto-Sorting)</span>
                <span className="text-teal-700 dark:text-teal-400 font-mono">{inventory.length} Batches Active</span>
              </div>

              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 dark:bg-slate-850 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Drug / Generic</th>
                      <th className="p-3">Batch & Expiry</th>
                      <th className="p-3">Barcode</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Price</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inventory.map((item) => (
                      <tr key={item.batch_id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${item.is_lasa ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {item.brand_name}
                            {item.is_lasa === 1 && (
                              <span className="px-2 py-0.2 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[9px] font-black rounded-full border border-rose-300 dark:border-rose-800">
                                LASA
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.generic_name}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-slate-700 dark:text-slate-300">{item.batch_number}</div>
                          <div className={`text-[10px] font-semibold ${
                            item.days_until_expiry < 90 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            Exp: {new Date(item.expiry_date).toLocaleDateString('en-PK')} ({item.days_until_expiry}d)
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {item.barcode || 'N/A'}
                        </td>
                        <td className="p-3">
                          <span className={`font-bold font-mono ${
                            item.stock_quantity <= item.reorder_level ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {item.stock_quantity} {item.unit_type}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-200">
                          Rs. {Number(item.selling_price).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={item.stock_quantity <= 0 || item.is_locked_fefo}
                            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition"
                          >
                            + Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Cart & Pending Doctor Prescriptions (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* POS Checkout Cart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <ShoppingCart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                  Dispense Cart ({cart.length})
                </h3>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
                  Cart is empty. Select batches from the left.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.batchId} className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex-1 truncate mr-2">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{item.brandName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Batch: {item.batchNumber}</div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-teal-700 dark:text-teal-300 font-semibold">
                          {item.quantity} x {item.unitPrice}
                        </span>
                        <button
                          onClick={() => handleRemoveFromCart(item.batchId)}
                          className="text-slate-400 hover:text-rose-500 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white mb-3">
                  <span>Total Payable:</span>
                  <span className="text-teal-700 dark:text-teal-400 font-mono text-base font-black">Rs. {totalCart.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => handleCheckout()}
                  disabled={cart.length === 0 || loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition cursor-pointer"
                >
                  Atomic Checkout & Print Receipt
                </button>
              </div>
            </div>

            {/* Pending Prescriptions Queue */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                Doctor Prescriptions Awaiting Dispense ({pendingRx.length})
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {pendingRx.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No pending prescriptions.</p>
                ) : (
                  pendingRx.map((rx) => (
                    <div key={rx.prescription_id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                        <span>{rx.patient_name}</span>
                        <span className="text-teal-700 dark:text-teal-400 font-mono">RX #{rx.prescription_id}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">MRN: {rx.mrn} • Attending: {rx.doctor_name}</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">{rx.pending_items} pending item(s) to dispense</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Crash Cart Daily Verification Section */
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase">Emergency Crash Cart Inspection & Seal Logs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">MSDS KP-HCC Standard 3.2: Daily verification of emergency resuscitation medicines (Adrenaline & Atropine tally).</p>
            </div>
            <button
              onClick={() => setShowCrashModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              + Log Daily Seal Verification
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Ward</th>
                  <th className="p-3.5">Seal Number</th>
                  <th className="p-3.5">Adrenaline Qty</th>
                  <th className="p-3.5">Atropine Qty</th>
                  <th className="p-3.5">Verified By</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {crashCartLogs.map((log) => (
                  <tr key={log.cart_log_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-white">{log.ward_name}</td>
                    <td className="p-3.5 font-mono font-bold text-teal-700 dark:text-teal-400">{log.seal_number}</td>
                    <td className="p-3.5 font-mono">{log.adrenaline_qty} Amps</td>
                    <td className="p-3.5 font-mono">{log.atropine_qty} Amps</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">{log.verified_by_nurse_name}</td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400">{new Date(log.verification_date).toLocaleDateString('en-PK')}</td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400 italic text-[11px]">{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Crash Cart Modal */}
      {showCrashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Emergency Crash Cart Inspection & Seal
            </h3>
            <form onSubmit={handleVerifyCrashCart} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ward Location</label>
                <select
                  value={crashForm.wardName}
                  onChange={(e) => setCrashForm({ ...crashForm, wardName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Emergency Room (ER)">Emergency Room (ER)</option>
                  <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                  <option value="Male Surgical Ward">Male Surgical Ward</option>
                  <option value="Female Surgical Ward">Female Surgical Ward</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Numbered Tamper-Evident Seal #</label>
                <input
                  type="text"
                  required
                  value={crashForm.sealNumber}
                  onChange={(e) => setCrashForm({ ...crashForm, sealNumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Adrenaline 1mg Qty</label>
                  <input
                    type="number"
                    required
                    value={crashForm.adrenalineQty}
                    onChange={(e) => setCrashForm({ ...crashForm, adrenalineQty: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Atropine 1mg Qty</label>
                  <input
                    type="number"
                    required
                    value={crashForm.atropineQty}
                    onChange={(e) => setCrashForm({ ...crashForm, atropineQty: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Verification Remarks</label>
                <textarea
                  rows={2}
                  value={crashForm.notes}
                  onChange={(e) => setCrashForm({ ...crashForm, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCrashModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Confirm & Seal Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 80mm Printable Receipt */}
      <ThermalSlipModal
        isOpen={showSlip}
        onClose={() => setShowSlip(false)}
        data={receiptData}
        title="80mm Pharmacy Dispense Slip"
      />
    </div>
  );
}
