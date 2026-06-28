/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Prescription } from '../types';
import { 
  ShoppingBag, 
  Search, 
  QrCode, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  User, 
  Sparkles,
  ClipboardCheck,
  RefreshCw
} from 'lucide-react';

interface PharmacyPortalProps {
  prescriptions: Prescription[];
  onFulfillPrescription: (prescriptionId: string) => Promise<void>;
  onRefreshAll: () => void;
}

export default function PharmacyPortal({
  prescriptions,
  onFulfillPrescription,
  onRefreshAll,
}: PharmacyPortalProps) {
  const [prescriptionIdSearch, setPrescriptionIdSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [selectedPrId, setSelectedPrId] = useState<string | null>(null);
  const [fulfillmentSuccess, setFulfillmentSuccess] = useState(false);

  const pendingPrescriptions = prescriptions.filter(p => !p.isFulfilled);
  const completedPrescriptions = prescriptions.filter(p => p.isFulfilled);

  const handleScanPrescription = () => {
    setScanning(true);
    setFulfillmentSuccess(false);
    
    setTimeout(() => {
      setScanning(false);
      // Auto-select the first pending prescription if available, or just toggle
      if (pendingPrescriptions.length > 0) {
        setSelectedPrId(pendingPrescriptions[0].id);
      } else if (prescriptions.length > 0) {
        setSelectedPrId(prescriptions[0].id);
      }
    }, 1200);
  };

  const handleFulfillSubmit = async (pId: string) => {
    try {
      await onFulfillPrescription(pId);
      setFulfillmentSuccess(true);
      setSelectedPrId(null);
      // Clear success notification after 5s
      setTimeout(() => setFulfillmentSuccess(false), 5000);
    } catch (err) {
      console.error('Fulfillment error:', err);
    }
  };

  const activePrescription = prescriptions.find(p => p.id === selectedPrId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8" id="pharmacy-portal">
      
      {/* LEFT PANEL: Scan & Select Prescription */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Search Bar */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4" id="pharmacy-search">
          <div className="flex items-center space-x-2 text-blue-600">
            <ShoppingBag className="h-5 w-5" />
            <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wider font-mono">
              Partner Pharmacy Terminal
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter a prescription ID or scan the prescription's secure QR code to dispense medicines immediately.
          </p>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={prescriptionIdSearch}
                onChange={(e) => setPrescriptionIdSearch(e.target.value)}
                placeholder="Search Prescription ID..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>

            <button
              onClick={handleScanPrescription}
              disabled={scanning}
              className={`w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 cursor-pointer ${
                scanning ? 'animate-pulse opacity-80' : ''
              }`}
              id="pharmacy-scan-prescription-btn"
            >
              <QrCode className="h-4.5 w-4.5" />
              <span>{scanning ? 'Decoding Secure QR Code...' : 'Scan Prescription QR'}</span>
            </button>
          </div>
        </div>

        {/* Pending / Unfulfilled list */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4">
          <h4 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wider font-mono">
            Unfulfilled Queue ({pendingPrescriptions.length})
          </h4>

          <div className="space-y-3">
            {pendingPrescriptions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-xl">
                No pending prescriptions to dispense.
              </div>
            ) : (
              pendingPrescriptions.map((p) => (
                <div
                  key={p.id}
                  id={`pharmacy-queue-item-${p.id}`}
                  onClick={() => setSelectedPrId(p.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedPrId === p.id
                      ? 'bg-blue-50 border-blue-300 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                  }`}
                >
                  <div className="space-y-1 text-xs">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/50 px-1.5 py-0.5 rounded">
                      {p.id}
                    </span>
                    <strong className="text-slate-800 block mt-1">{p.hospitalName}</strong>
                    <span className="text-[10px] text-slate-500 block">Date: {p.date} • Dr. {p.doctorName}</span>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed list */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4">
          <h4 className="font-display font-bold text-slate-400 text-sm uppercase tracking-wider font-mono">
            Fulfilled History ({completedPrescriptions.length})
          </h4>

          <div className="space-y-2.5 max-h-48 overflow-y-auto">
            {completedPrescriptions.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex justify-between items-center opacity-85">
                <div>
                  <span className="font-mono text-slate-500 font-bold">{p.id}</span>
                  <strong className="text-slate-700 block text-[11px] mt-0.5">{p.hospitalName}</strong>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <span>Fulfilled</span>
                  <span className="block font-mono font-semibold">{p.fulfillmentDate || p.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: Medicine Dispatch Console */}
      <div className="lg:col-span-7 space-y-6">
        
        {fulfillmentSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3">
            <CheckCircle2 className="h-5.5 w-5.5 text-emerald-600" />
            <div>
              <strong className="text-xs font-bold block">Prescription Fulfilled Successfully</strong>
              <p className="text-[11px] mt-0.5 text-emerald-700">
                Pills and instructions have been dispensed. Adherence trackers and medicine timelines on the Patient's mobile device and Smartwatch have been updated in real-time.
              </p>
            </div>
          </div>
        )}

        {!activePrescription ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[32px] h-[400px] flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
            <ClipboardCheck className="h-12 w-12 text-slate-400 animate-pulse" />
            <h3 className="font-display font-bold text-slate-800 text-sm">Select Prescription to Dispense</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Scan a prescription QR or select an item from the pending queue to configure dosage schedules and dispense medicines.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-6 animate-fade-in" id="pharmacy-dispatch">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md">
                  {activePrescription.id}
                </span>
                <h3 className="font-display font-bold text-lg text-slate-800 mt-2">Dispense Clinical Order</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm dosage quantities, durations, and instructions to push to client timelines.
                </p>
              </div>

              <div className="text-right text-xs text-slate-400 font-mono">
                <span>Date: {activePrescription.date}</span>
                <span className="block font-semibold text-slate-700">{activePrescription.doctorName}</span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Source Clinic</span>
                <strong className="text-slate-800">{activePrescription.hospitalName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Diagnosis Profile</span>
                <span className="text-slate-700 font-semibold">{activePrescription.diagnosis}</span>
              </div>
            </div>

            {/* Fulfill Item Checklist */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide font-mono">
                Prescribed Drug Packing List
              </h4>

              <div className="space-y-3 text-xs">
                {activePrescription.medicines.map((med) => (
                  <div key={med.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <strong className="text-slate-800">{med.name}</strong>
                        <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono font-bold">
                          {med.frequency}
                        </span>
                      </div>
                      <div className="text-slate-500 leading-relaxed text-[11px]">
                        Dosage: <strong className="text-slate-700">{med.dosage}</strong> • Instruction:{' '}
                        <strong className="text-slate-700">{med.instructions}</strong> • Duration:{' '}
                        <strong className="text-slate-700">{med.duration}</strong>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">"Intended for: {med.purpose}"</p>
                    </div>

                    <div className="flex items-center space-x-1.5 self-end md:self-center">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded">Pending Dispensation</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm & Dispense button */}
            <button
              onClick={() => handleFulfillSubmit(activePrescription.id)}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm tracking-wider uppercase flex items-center justify-center space-x-2 cursor-pointer"
              id="pharmacy-fulfill-submit-btn"
            >
              <ClipboardCheck className="h-4.5 w-4.5" />
              <span>Confirm packing &amp; Dispense Medications</span>
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

// Simple Helper Component
function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
