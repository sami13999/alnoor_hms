import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  Receipt, 
  CreditCard, 
  Wallet, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Plus, 
  DollarSign, 
  FileText,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import ThermalSlipModal from '../../../components/ThermalSlipModal';

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [recentDrawers, setRecentDrawers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'drawer'
  const [statusFilter, setStatusFilter] = useState('');

  // Consolidation Modal State
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [consForm, setConsForm] = useState({
    patientId: '',
    admissionId: '',
    discountAmount: 0
  });

  // Drawer Balancing Modal State
  const [showCloseDrawerModal, setShowCloseDrawerModal] = useState(false);
  const [physicalCash, setPhysicalCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [openDrawerBalance, setOpenDrawerBalance] = useState('5000');

  // Print slip state
  const [slipData, setSlipData] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchCurrentDrawer();
    fetchRecentDrawers();
    fetchPatientsAndAdmissions();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get(`/billing/invoices?status=${statusFilter}`);
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCurrentDrawer = async () => {
    try {
      const res = await api.get('/billing/shift-drawers/current');
      if (res.data.success) {
        setCurrentDrawer(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentDrawers = async () => {
    try {
      const res = await api.get('/billing/shift-drawers/recent');
      if (res.data.success) {
        setRecentDrawers(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPatientsAndAdmissions = async () => {
    try {
      const [patRes, admRes] = await Promise.all([
        api.get('/opd/patients'),
        api.get('/ipd/admissions/active')
      ]);
      if (patRes.data.success) setPatients(patRes.data.data);
      if (admRes.data.success) setAdmissions(admRes.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectInvoice = async (id) => {
    try {
      const res = await api.get(`/billing/invoices/${id}`);
      if (res.data.success) {
        setSelectedInvoice(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConsolidate = async (e) => {
    e.preventDefault();
    if (!consForm.patientId) {
      alert('Please select a patient');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/billing/invoices/consolidate', {
        patientId: consForm.patientId,
        admissionId: consForm.admissionId || null,
        discountAmount: parseFloat(consForm.discountAmount) || 0
      });

      if (res.data.success) {
        setShowConsolidateModal(false);
        fetchInvoices();
        handleSelectInvoice(res.data.data.invoice_id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Invoice consolidation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSettlePayment = async (invoiceId, amount) => {
    try {
      setLoading(true);
      const res = await api.post(`/billing/invoices/${invoiceId}/payments`, {
        amount: parseFloat(amount),
        paymentMethod: 'CASH'
      });
      if (res.data.success) {
        alert('Payment settled and recorded into shift cash drawer!');
        handleSelectInvoice(invoiceId);
        fetchInvoices();
        fetchCurrentDrawer();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment settlement failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = async () => {
    try {
      setLoading(true);
      const res = await api.post('/billing/shift-drawers/open', {
        openingBalance: parseFloat(openDrawerBalance) || 5000,
        department: 'CENTRAL_CASH'
      });
      if (res.data.success) {
        alert('Shift Cash Drawer opened successfully!');
        fetchCurrentDrawer();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to open drawer');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDrawer = async (e) => {
    e.preventDefault();
    if (!currentDrawer) return;
    try {
      setLoading(true);
      const res = await api.post(`/billing/shift-drawers/${currentDrawer.shift_id}/close`, {
        physicalCountedCash: parseFloat(physicalCash),
        notes: closeNotes
      });
      if (res.data.success) {
        alert(`Shift Closed & Locked! Discrepancy computed: Rs. ${res.data.data.discrepancy_amount || 0}`);
        setShowCloseDrawerModal(false);
        fetchCurrentDrawer();
        fetchRecentDrawers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close drawer');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSlip = (inv) => {
    setSlipData({
      invoice_number: inv.invoice_number,
      patient_name: inv.patient_name,
      mrn: inv.mrn,
      net_amount: inv.net_amount,
      paid_amount: inv.paid_amount,
      items: inv.items,
      created_at: inv.created_at
    });
    setShowSlipModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Receipt className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Unified Central Billing & Cash Drawer Balancing
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-department consolidated patient invoices (OPD + Pharmacy + Lab + Bed Stay + OT) and cashier shift drawer balancing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'invoices' 
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Consolidated Invoicing
            </button>
            <button
              onClick={() => setActiveTab('drawer')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'drawer' 
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-amber-500" />
              <span>Shift Cash Balancing</span>
            </button>
          </div>
          {activeTab === 'invoices' && (
            <button
              onClick={() => setShowConsolidateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Consolidate Bill
            </button>
          )}
        </div>
      </div>

      {activeTab === 'invoices' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Invoices List (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col max-h-[850px] transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Hospital Invoices ({invoices.length})
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {invoices.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-10 text-center">No invoices found.</p>
              ) : (
                invoices.map((inv) => {
                  const isSelected = selectedInvoice?.invoice_id === inv.invoice_id;
                  return (
                    <div
                      key={inv.invoice_id}
                      onClick={() => handleSelectInvoice(inv.invoice_id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="font-mono text-emerald-700 dark:text-emerald-400">{inv.invoice_number}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border ${
                          inv.payment_status === 'PAID'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : inv.payment_status === 'PARTIAL'
                            ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        }`}>
                          {inv.payment_status}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">{inv.patient_name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex justify-between">
                        <span>MRN: {inv.mrn}</span>
                        <span className="font-bold text-slate-900 dark:text-white">Rs. {Number(inv.net_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Invoice Itemized Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {selectedInvoice ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 transition-colors">
                {/* Header */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Consolidated Patient Invoice
                    </span>
                    <h3 className="text-xl font-black font-mono text-slate-900 dark:text-white">{selectedInvoice.invoice_number}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      Patient: <strong className="text-slate-900 dark:text-white">{selectedInvoice.patient_name}</strong> • MRN: {selectedInvoice.mrn}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePrintSlip(selectedInvoice)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 shadow-xs transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    80mm Receipt
                  </button>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Category</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Amount (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedInvoice.items?.map((it) => (
                        <tr key={it.invoice_item_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700">
                              {it.service_type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-200">{it.description}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            Rs. {Number(it.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Calculation */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Gross Total:</span>
                    <span className="font-mono">Rs. {Number(selectedInvoice.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Discount:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">- Rs. {Number(selectedInvoice.discount_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-1.5">
                    <span>Net Payable:</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">Rs. {Number(selectedInvoice.net_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Paid to Date:</span>
                    <span className="font-mono text-teal-700 dark:text-teal-300">Rs. {Number(selectedInvoice.paid_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Action if not fully paid */}
                {selectedInvoice.payment_status !== 'PAID' && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">Settle Balance Cash Payment</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Remaining balance: Rs. {(selectedInvoice.net_amount - selectedInvoice.paid_amount).toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSettlePayment(selectedInvoice.invoice_id, selectedInvoice.net_amount - selectedInvoice.paid_amount)}
                      disabled={loading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      Receive Full Cash & Settle
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center text-slate-400 dark:text-slate-500 text-xs">
                Select an invoice from the left to view itemized breakdown and record settlements.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Shift Cash Drawer Balancing */
        <div className="space-y-6">
          {/* Active Drawer Status Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors">
            {currentDrawer ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Active Shift Drawer
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Drawer #{currentDrawer.shift_id} ({currentDrawer.department})</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Opened at: {new Date(currentDrawer.opening_time).toLocaleString('en-PK')}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPhysicalCash(String(currentDrawer.expected_cash_in_drawer));
                      setShowCloseDrawerModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <Lock className="w-4 h-4" />
                    Close Shift & Balance Cash Drawer
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Opening Float Cash</span>
                    <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                      Rs. {Number(currentDrawer.opening_balance).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">System Billed Collections</span>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      Rs. {Number(currentDrawer.live_billed_cash || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Expected Cash in Drawer</span>
                    <div className="text-xl font-bold font-mono text-teal-700 dark:text-teal-300 mt-1">
                      Rs. {Number(currentDrawer.expected_cash_in_drawer || currentDrawer.opening_balance).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No Active Shift Drawer Open for this Cashier</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Open a new shift cash drawer before collecting hospital payments.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={openDrawerBalance}
                    onChange={(e) => setOpenDrawerBalance(e.target.value)}
                    placeholder="Opening Float"
                    className="w-32 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleOpenDrawer}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    Open Shift Drawer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Past Shift Drawers Reconciliation History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase">Reconciled Cash Drawers History</h3>
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Shift ID</th>
                    <th className="p-3">Cashier</th>
                    <th className="p-3">Opening</th>
                    <th className="p-3">Billed Cash</th>
                    <th className="p-3">Physical Counted</th>
                    <th className="p-3">Discrepancy</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Closed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentDrawers.map((dr) => (
                    <tr key={dr.shift_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-400">#{dr.shift_id}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-200">{dr.cashier_name}</td>
                      <td className="p-3 font-mono">Rs. {Number(dr.opening_balance).toFixed(2)}</td>
                      <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">Rs. {Number(dr.system_billed_cash).toFixed(2)}</td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">Rs. {Number(dr.physical_counted_cash).toFixed(2)}</td>
                      <td className="p-3 font-mono">
                        <span className={`font-bold ${
                          dr.discrepancy_amount === 0 || dr.discrepancy_amount === null
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400 font-black'
                        }`}>
                          Rs. {Number(dr.discrepancy_amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          dr.shift_status === 'CLOSED' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {dr.shift_status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">
                        {dr.closing_time ? new Date(dr.closing_time).toLocaleString('en-PK') : 'Live Shift'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Consolidate Bill Modal */}
      {showConsolidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Consolidate All Department Bills
            </h3>
            <form onSubmit={handleConsolidate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Patient</label>
                <select
                  required
                  value={consForm.patientId}
                  onChange={(e) => setConsForm({ ...consForm, patientId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.full_name} (MRN: {p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Link Inpatient Admission (Optional for bed stay & OT charges)
                </label>
                <select
                  value={consForm.admissionId}
                  onChange={(e) => setConsForm({ ...consForm, admissionId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">-- None (OPD Only) --</option>
                  {admissions.map((a) => (
                    <option key={a.admission_id} value={a.admission_id}>
                      {a.patient_name} - Bed {a.bed_number} ({a.ward_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Amount (PKR)
                </label>
                <input
                  type="number"
                  value={consForm.discountAmount}
                  onChange={(e) => setConsForm({ ...consForm, discountAmount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConsolidateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Consolidate & Generate Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Drawer Modal */}
      {showCloseDrawerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Close Shift Cash Drawer Balancing
            </h3>
            <form onSubmit={handleCloseDrawer} className="space-y-3.5">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div><strong>Opening Cash:</strong> Rs. {Number(currentDrawer.opening_balance).toFixed(2)}</div>
                <div><strong>System Billed Cash:</strong> Rs. {Number(currentDrawer.live_billed_cash).toFixed(2)}</div>
                <div className="text-teal-700 dark:text-teal-300 font-bold">
                  <strong>Expected Drawer Total:</strong> Rs. {Number(currentDrawer.expected_cash_in_drawer).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1">
                  Physical Cash Counted in Drawer (PKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={physicalCash}
                  onChange={(e) => setPhysicalCash(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reconciliation Notes</label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Note any currency denomination notes or discrepancy justification..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseDrawerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Lock Drawer & Reconcile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 80mm Printable Thermal Receipt */}
      <ThermalSlipModal
        isOpen={showSlipModal}
        onClose={() => setShowSlipModal(false)}
        data={slipData}
        title="80mm Consolidated Hospital Bill"
      />
    </div>
  );
}
