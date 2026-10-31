import React from 'react';
import { Printer, X } from 'lucide-react';

export default function ThermalSlipModal({ isOpen, onClose, data, title = '80mm Thermal Slip' }) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 80mm Printable Slip Canvas */}
        <div className="p-6 overflow-y-auto flex justify-center bg-slate-100 dark:bg-slate-950">
          <div
            id="thermal-slip-area"
            className="printable-area bg-white text-black font-mono text-xs p-4 rounded-xl shadow-md w-[80mm] min-h-[110mm] border border-slate-300"
            style={{ width: '80mm', color: '#000' }}
          >
            {/* Hospital Header */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400">
              <h2 className="font-bold text-sm tracking-wider uppercase">AL NOOR SPECIALIST HOSPITAL</h2>
              <p className="text-[10px] text-gray-700">District Battagram, Khyber Pakhtunkhwa</p>
              <p className="text-[10px] text-gray-700">KP-HCC MSDS Reg: Category 2-B</p>
              <p className="text-[10px] text-gray-700">Phone: +92-932-410123 / Emergency: 1122</p>
            </div>

            {/* Token / Slip Title */}
            <div className="text-center my-2">
              <span className="inline-block bg-black text-white px-3 py-1 font-bold text-lg rounded">
                {data.token_number || data.invoice_number || 'SLIP'}
              </span>
              <p className="text-[10px] text-gray-600 mt-1">
                {new Date(data.created_at || Date.now()).toLocaleString('en-PK')}
              </p>
            </div>

            {/* Patient Details */}
            <div className="space-y-1 py-2 border-t border-b border-dashed border-gray-400 text-[11px]">
              <div className="flex justify-between">
                <span className="font-semibold">MRN:</span>
                <span>{data.mrn || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Patient:</span>
                <span className="font-bold uppercase">{data.patient_name || data.patientName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Gender / Age:</span>
                <span>{data.gender || 'OTHER'} / {data.age_years || data.ageYears || '-'} Yrs</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Phone:</span>
                <span>{data.phone || 'N/A'}</span>
              </div>
              {data.doctor_name && (
                <div className="flex justify-between">
                  <span className="font-semibold">Doctor:</span>
                  <span>{data.doctor_name}</span>
                </div>
              )}
            </div>

            {/* Items or Billing Lines */}
            {data.items && data.items.length > 0 && (
              <div className="py-2 border-b border-dashed border-gray-400">
                <div className="flex justify-between font-bold border-b border-gray-300 pb-1 mb-1">
                  <span>Item / Drug</span>
                  <span>Amt (Rs.)</span>
                </div>
                {data.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] py-0.5">
                    <span className="truncate max-w-[140px]">{it.brandName || it.description || it.drugName}</span>
                    <span>Rs. {Number(it.subtotal || it.amount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Total / Fee */}
            <div className="pt-2 text-right">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL PAID:</span>
                <span>Rs. {Number(data.net_amount || data.totalAmount || 500).toFixed(2)}</span>
              </div>
              <p className="text-[9px] text-gray-500 mt-0.5 italic">Payment verified & recorded to shift drawer</p>
            </div>

            {/* Thermal Footer Notice */}
            <div className="mt-4 pt-2 border-t border-dashed border-gray-400 text-center text-[9px] text-gray-600">
              <p>Thank you for choosing Al Noor Specialist Hospital.</p>
              <p>Bring this token slip to the consultation counter.</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Standard 80mm POS Thermal Slip</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Slip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
