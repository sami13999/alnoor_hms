import React from 'react';
import { Printer, X, ShieldAlert } from 'lucide-react';

export default function WristbandModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Patient Thermal Wristband Generator (250 x 30 mm)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wristband Preview Area */}
        <div className="p-8 overflow-x-auto flex justify-center bg-slate-100 dark:bg-slate-950">
          <div
            id="wristband-area"
            className="printable-area bg-white text-black font-mono border-2 border-slate-300 rounded-xl shadow-lg flex items-center px-4 py-2"
            style={{ width: '250mm', height: '30mm', color: '#000' }}
          >
            {/* Left hospital logo/watermark */}
            <div className="border-r border-gray-400 pr-3 mr-3 text-center flex flex-col justify-center min-w-[70px]">
              <div className="font-bold text-[11px] uppercase tracking-wider text-teal-800 leading-tight">
                AL NOOR
              </div>
              <div className="text-[7px] text-gray-600">SPECIALIST</div>
              <div className="text-[6px] text-gray-500">BATTAGRAM</div>
            </div>

            {/* Patient Clinical Identifiers */}
            <div className="flex-1 text-[11px] leading-tight space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-sm uppercase">{data.patient_name || data.fullName}</span>
                <span className="text-[10px] text-gray-700 font-semibold">({data.gender || 'OTHER'}, {data.age_years || data.ageYears || '-'}Y)</span>
              </div>
              <div className="flex gap-4 text-[10px]">
                <span><strong className="text-gray-800">MRN:</strong> {data.mrn}</span>
                <span><strong className="text-gray-800">WARD:</strong> {data.ward_name || 'ER'}</span>
                <span><strong className="text-gray-800">BED:</strong> {data.bed_number}</span>
              </div>
              <div className="text-[9px] text-gray-600">
                <span><strong>Admitted:</strong> {new Date(data.admitted_at || Date.now()).toLocaleString('en-PK')}</span>
                <span className="ml-2"><strong>Doctor:</strong> {data.doctor_name || 'ER Specialist'}</span>
              </div>
            </div>

            {/* Right Barcode Canvas for Bedside 5-Rights scanner */}
            <div className="border-l border-gray-400 pl-4 text-center flex flex-col items-center justify-center min-w-[150px]">
              <div className="font-mono text-[9px] font-bold text-gray-900 tracking-wider">
                ||| | |||| | ||||| || ||| || |||
              </div>
              <div className="text-xs font-black tracking-widest bg-gray-100 px-2 py-0.5 rounded border border-gray-300 mt-1">
                {data.wristband_barcode}
              </div>
              <div className="text-[7px] text-gray-500 mt-0.5">SCAN FOR BEDSIDE e-MAR</div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            KP-HCC MSDS Standard 4.1 Positive Patient Identification
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              Print Wristband
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
