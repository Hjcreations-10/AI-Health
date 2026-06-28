/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Patient, Prescription, Medicine } from '../types';
import { 
  Building2, 
  Search, 
  QrCode, 
  FileText, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Sparkles,
  ClipboardList,
  ChevronRight,
  ShieldAlert,
  Camera,
  Upload,
  Fingerprint,
  Mic
} from 'lucide-react';

interface HospitalPortalProps {
  patient: Patient;
  prescriptions: Prescription[];
  onAddPrescription: (prescriptionData: {
    doctorName: string;
    specialty: string;
    hospitalName: string;
    diagnosis: string;
    medicines: Partial<Medicine>[];
  }) => Promise<{ warnings?: string; prescription: Prescription }>;
  onRefreshAll: () => void;
  autoScanOnLoad?: boolean;
  onResetAutoScan?: () => void;
}

export default function HospitalPortal({
  patient,
  prescriptions,
  onAddPrescription,
  onRefreshAll,
  autoScanOnLoad,
  onResetAutoScan,
}: HospitalPortalProps) {
  const [patientIdSearch, setPatientIdSearch] = useState('AIH-882-901-IN');
  const [isPatientLoaded, setIsPatientLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Form States for Prescribing
  const [doctorName, setDoctorName] = useState('Dr. S. K. Nair');
  const [specialty, setSpecialty] = useState('Geriatric Generalist');
  const [hospitalName, setHospitalName] = useState('Narayana Health, Bangalore');
  const [diagnosis, setDiagnosis] = useState('Osteoarthritic knee pain flare up');
  
  // List of medicines to add in current prescription
  const [currentMeds, setCurrentMeds] = useState<Partial<Medicine>[]>([
    {
      name: 'Aceclofenac (100mg)',
      dosage: '1 Tablet',
      frequency: '1-0-1',
      instructions: 'After Food',
      duration: '7 Days',
      purpose: 'Reduces severe knee pain and inflammation'
    }
  ]);

  // Form input for the drug being configured
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1 Tablet');
  const [newMedFrequency, setNewMedFrequency] = useState('1-0-1');
  const [newMedInstructions, setNewMedInstructions] = useState('After Food');
  const [newMedDuration, setNewMedDuration] = useState('15 Days');
  const [newMedPurpose, setNewMedPurpose] = useState('');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [addedPrescriptionId, setAddedPrescriptionId] = useState<string | null>(null);

  // Advanced Visual Card Scanner States
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScanCard = () => {
    setIsScanning(true);
    setAiReport(null);
    setAddedPrescriptionId(null);
    
    // Beautiful text to speech confirmation
    import('../utils/speech').then(({ speakText }) => {
      speakText("Initiating Health Card scanning process. Calibrating holographic matrix...", "English");
    });

    setTimeout(() => {
      setIsScanning(false);
      setIsPatientLoaded(true);
      import('../utils/speech').then(({ speakText }) => {
        speakText("Patient Health Card decrypted successfully. Access granted. Records loaded.", "English");
      });
    }, 2000);
  };

  React.useEffect(() => {
    if (autoScanOnLoad) {
      handleScanCard();
      if (onResetAutoScan) {
        onResetAutoScan();
      }
    }
  }, [autoScanOnLoad]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      handleScanCard();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      handleScanCard();
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAddMedToDraft = () => {
    if (!newMedName.trim() || !newMedPurpose.trim()) return;
    setCurrentMeds([
      ...currentMeds,
      {
        name: newMedName,
        dosage: newMedDosage,
        frequency: newMedFrequency,
        instructions: newMedInstructions,
        duration: newMedDuration,
        purpose: newMedPurpose
      }
    ]);
    // Reset individual medic inputs
    setNewMedName('');
    setNewMedPurpose('');
  };

  const handleRemoveMedDraft = (index: number) => {
    setCurrentMeds(currentMeds.filter((_, i) => i !== index));
  };

  const handleCreatePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMeds.length === 0) return;

    setFormSubmitting(true);
    setAiReport(null);
    setAddedPrescriptionId(null);

    try {
      const result = await onAddPrescription({
        doctorName,
        specialty,
        hospitalName,
        diagnosis,
        medicines: currentMeds,
      });

      if (result.warnings) {
        setAiReport(result.warnings);
      }
      if (result.prescription) {
        setAddedPrescriptionId(result.prescription.id);
        // Clear med inputs & draft list
        setCurrentMeds([]);
        setDiagnosis('');
      }
    } catch (err) {
      console.error('Error submitting prescription:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Popular geriatric medicines autocomplete templates
  const PRESET_MEDICINES = [
    { name: 'Metformin XR (500mg)', purpose: 'Controls high blood sugar' },
    { name: 'Telmisartan (40mg)', purpose: 'Lowers blood pressure' },
    { name: 'Atorvastatin (10mg)', purpose: 'Lowers cholesterol' },
    { name: 'Calcium + Vitamin D3', purpose: 'Strengthens bone density' },
    { name: 'Pantoprazole (40mg)', purpose: 'Prevents acid reflux' },
    { name: 'Aspirin (75mg)', purpose: 'Blood thinner to prevent cardiac events' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8" id="hospital-portal">
      
      {/* LEFT PANEL: Patient Look-up & Scanners */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* PHYSICAL / DIGITAL HOLOGRAPHIC AI HEALTH CARD */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[32px] border border-slate-800 shadow-2xl p-6 text-white space-y-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-900/15" id="holographic-health-card">
          {/* Glassmorphism reflections */}
          <div className="absolute -right-16 -top-16 h-36 w-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 h-36 w-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase font-mono text-slate-300">
                AI Health Card
              </span>
            </div>
            <span className="text-[9px] font-bold font-mono bg-blue-600/30 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              NFC Secured
            </span>
          </div>

          {/* Golden Chip & Contactless logo */}
          <div className="flex justify-between items-center">
            {/* Golden Chip */}
            <div className="h-8 w-11 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 rounded-md border border-amber-600 shadow-sm relative overflow-hidden">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[0.5px] bg-amber-800/30" />
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[0.5px] bg-amber-800/30" />
              <div className="absolute inset-1.5 border border-amber-800/20 rounded-xs" />
            </div>

            {/* Wireless symbol */}
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400/80" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 8a8.5 8.5 0 0 1 14 0" />
              <path d="M8 11a4.5 4.5 0 0 1 8 0" />
              <path d="M11 14a1 1 0 0 1 2 0" />
            </svg>
          </div>

          {/* Patient Details on the card */}
          <div className="space-y-3">
            <div>
              <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">Holder</p>
              <h4 className="font-display font-bold text-sm tracking-wide text-white">{patient?.name || 'Jyothsna Singuluri'}</h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">Health ID</p>
                <p className="font-mono font-bold text-slate-200 text-[11px]">{patientIdSearch}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">Vitals Node</p>
                <div className="font-mono text-[10px] text-slate-300 space-y-0.5">
                  <p className="font-bold text-emerald-400 text-[11px] flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1 inline-block" />
                    <span>BLE Active</span>
                  </p>
                  <p className="text-[9px] text-slate-300">
                    BP: <span className="text-white font-bold">120/80</span> | Sugar: <span className="text-white font-bold">104</span>
                  </p>
                  <p className="text-[9px] text-slate-300">
                    Session HR: <span className="text-rose-400 font-bold animate-pulse">{patient?.vitals.heartRate || 72} bpm</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scanning Overlay Viewport built directly into the card mock */}
          <div className="border-t border-white/10 pt-4 flex justify-between items-center gap-3">
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
              <Fingerprint className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
              <span>Bio-Link Active</span>
            </div>
            
            {/* Direct click scan option */}
            <button
              onClick={handleScanCard}
              disabled={isScanning}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-blue-600/30"
              id="direct-card-scan-click"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Scan Directly</span>
            </button>
          </div>
        </div>

        {/* CLINICAL ACCESS SCANNER VIEWPORT TERMINAL */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4" id="hospital-look-up">
          <div className="flex items-center justify-between pb-1 border-b border-slate-50">
            <div className="flex items-center space-x-2 text-blue-600">
              <Camera className="h-5 w-5 animate-pulse" />
              <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wider font-mono">
                Decryption Viewfinder
              </h3>
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              CAMERA SIMULATOR
            </span>
          </div>

          {/* Interactive Scanning Viewport (Visual camera feed with green sweeps) */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`h-40 rounded-2xl border-2 border-dashed relative overflow-hidden transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' 
                : isScanning 
                ? 'border-emerald-500 bg-slate-950' 
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
            }`}
            onClick={triggerFileSelect}
          >
            {isScanning ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-slate-950">
                {/* Laser scan line sweep */}
                <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-lg shadow-emerald-400/80 animate-[scan_2s_infinite_linear] top-0" />
                
                <QrCode className="h-10 w-10 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-widest animate-pulse">
                  DECRYPTING SECURE CHIP...
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  Decrypting BLE protocol payloads
                </span>
              </div>
            ) : uploadedFileName ? (
              <div className="space-y-1 animate-fadeIn">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">File Received Successfully</p>
                <p className="text-[10px] text-slate-500 font-mono">{uploadedFileName}</p>
                <p className="text-[10px] text-blue-500 font-bold underline cursor-pointer mt-1">Scan another card</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-slate-400 mx-auto animate-bounce" />
                <div>
                  <p className="text-xs font-bold text-slate-700">Drag &amp; Drop Patient Card Photo</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Or click to select a file from computer</p>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md text-[9px] font-mono font-bold mx-auto">
                  <Mic className="h-3 w-3 animate-pulse" />
                  <span>VOICE ACTIVATED: Say "Scan Card"</span>
                </div>
              </div>
            )}

            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileSelect}
              className="hidden" 
            />
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={patientIdSearch}
                onChange={(e) => setPatientIdSearch(e.target.value)}
                placeholder="Enter Patient Health ID..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-4 pr-10 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleScanCard}
                disabled={isScanning}
                className={`py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center space-x-1.5 cursor-pointer ${
                  isScanning ? 'animate-pulse opacity-80' : ''
                }`}
                id="terminal-scan-card-btn"
              >
                <QrCode className="h-4 w-4" />
                <span>Simulate QR Scan</span>
              </button>
              
              <button
                onClick={() => {
                  setUploadedFileName(null);
                  setIsPatientLoaded(false);
                }}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Reset Terminal</span>
              </button>
            </div>
          </div>
        </div>

        {/* If Patient Loaded, show basic overview in hospital panel */}
        {isPatientLoaded && (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-5 animate-fade-in" id="hospital-patient-preview">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{patient.name}</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">UID: {patient.id}</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md">
                Verified Records
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Physiology:</span>
                <span className="font-bold text-slate-700">{patient.gender}, {patient.age} Yrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Active Diagnoses:</span>
                <div className="flex flex-col text-right items-end gap-1 font-semibold text-slate-700">
                  {patient.chronicDiseases.map((d, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Allergies:</span>
                <div className="flex flex-col text-right items-end gap-1 font-semibold text-rose-600">
                  {patient.allergies.map((a, i) => (
                    <span key={i} className="text-[10px] bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide font-mono">Past Consultations</h5>
              <div className="space-y-2">
                {prescriptions.map((pr) => (
                  <div key={pr.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
                      <span>{pr.id}</span>
                      <span>{pr.date}</span>
                    </div>
                    <strong className="text-slate-700 block text-[11px]">{pr.hospitalName}</strong>
                    <div className="text-[11px] text-slate-500">
                      Doctor: <span className="font-semibold">{pr.doctorName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Clinical Prescription Composer */}
      <div className="lg:col-span-8 space-y-6">
        {!isPatientLoaded ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[32px] h-[450px] flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
            <ClipboardList className="h-12 w-12 text-slate-400 animate-pulse" />
            <h3 className="font-display font-bold text-slate-800 text-sm">Waiting for Health Card Scan</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Before prescribing or checking active medication histories, scan the patient's card on the left panel.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-6 animate-fade-in" id="prescription-composer">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-800">Prescription Creator &amp; Advisor</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compose clinical prescriptions. AI will automatically evaluate drug-drug conflicts.
                </p>
              </div>
              <span className="p-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl">
                <Activity className="h-5 w-5" />
              </span>
            </div>

            {/* AI Warning Report display */}
            {aiReport && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 font-bold text-xs text-amber-700 uppercase tracking-wider font-mono">
                  <AlertTriangle className="h-4.5 w-4.5 animate-bounce" />
                  <span>AI Drug-Drug Interaction Advisory Report</span>
                </div>
                <p className="text-xs leading-relaxed font-semibold">{aiReport}</p>
                <div className="text-[10px] text-amber-600 flex items-center space-x-1.5 font-mono pt-1">
                  <Sparkles className="h-3 w-3 text-blue-500" />
                  <span>Evaluated against 5 active medications in cloud patient timeline.</span>
                </div>
              </div>
            )}

            {/* Success notification */}
            {addedPrescriptionId && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <strong className="text-xs font-bold block">Prescription {addedPrescriptionId} Uploaded successfully</strong>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Records synchronized. The patient can now purchase these medications at any partner pharmacy.
                  </p>
                </div>
              </div>
            )}

            {/* Configuration Form */}
            <form onSubmit={handleCreatePrescriptionSubmit} className="space-y-6 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Prescribing Physician</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Specialty</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Hospital / Clinic Node</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Principal Diagnosis</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="E.g., Chronic Knee Osteoarthritis pain..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700 focus:outline-none"
                  required
                />
              </div>

              {/* Medicines Grid draft list */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide font-display flex items-center space-x-1">
                  <span>Prescribed Medications Draft List</span>
                  <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-600">
                    {currentMeds.length} medicines
                  </span>
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {currentMeds.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 font-medium">
                      No medications added to this prescription yet. Add below.
                    </div>
                  ) : (
                    currentMeds.map((med, index) => (
                      <div key={index} className="p-3.5 bg-slate-50/50 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-800 text-xs">{med.name}</strong>{' '}
                          <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600">{med.frequency}</span>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Dosage: <span className="font-semibold text-slate-700">{med.dosage}</span> • Instructions:{' '}
                            <span className="font-semibold text-slate-700">{med.instructions}</span> • Duration:{' '}
                            <span className="font-semibold text-slate-700">{med.duration}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 italic">"{med.purpose}"</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMedDraft(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add New Medicine to Draft Subform */}
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                  <h5 className="font-bold text-slate-700 flex items-center space-x-1">
                    <Plus className="h-4 w-4 text-blue-500" />
                    <span>Add Medicine Specification</span>
                  </h5>

                  {/* Preset autocomplete pills */}
                  <div className="flex flex-wrap gap-1 pb-1">
                    {PRESET_MEDICINES.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewMedName(p.name);
                          setNewMedPurpose(p.purpose);
                        }}
                        className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded text-[10px] font-semibold text-slate-600 hover:text-blue-600 transition-all cursor-pointer"
                      >
                        + {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase font-mono">Medicine Name</label>
                      <input
                        type="text"
                        value={newMedName}
                        onChange={(e) => setNewMedName(e.target.value)}
                        placeholder="E.g., Atorvastatin (10mg)"
                        className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase font-mono">Dosage Quantity</label>
                      <input
                        type="text"
                        value={newMedDosage}
                        onChange={(e) => setNewMedDosage(e.target.value)}
                        placeholder="E.g., 1 Tablet, 5ml"
                        className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase font-mono">Frequency</label>
                      <select
                        value={newMedFrequency}
                        onChange={(e) => setNewMedFrequency(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none text-xs"
                      >
                        <option value="1-0-1">1-0-1 (Morning + Night)</option>
                        <option value="1-0-0">1-0-0 (Morning only)</option>
                        <option value="0-1-0">0-1-0 (Afternoon only)</option>
                        <option value="0-0-1">0-0-1 (Night only)</option>
                        <option value="1-1-1">1-1-1 (Three times)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase font-mono">Instructions</label>
                      <select
                        value={newMedInstructions}
                        onChange={(e) => setNewMedInstructions(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none text-xs"
                      >
                        <option value="After Food">After Food</option>
                        <option value="Before Food">Before Food</option>
                        <option value="Empty Stomach">Empty Stomach</option>
                        <option value="At Bedtime">At Bedtime</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase font-mono">Duration</label>
                      <input
                        type="text"
                        value={newMedDuration}
                        onChange={(e) => setNewMedDuration(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase font-mono">Intended Purpose</label>
                    <input
                      type="text"
                      value={newMedPurpose}
                      onChange={(e) => setNewMedPurpose(e.target.value)}
                      placeholder="E.g., Lowers cholesterol and cardioprotects"
                      className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMedToDraft}
                    className="py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-all w-full cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Draft List</span>
                  </button>
                </div>
              </div>

              {/* Submit whole prescription */}
              <button
                type="submit"
                disabled={formSubmitting || currentMeds.length === 0}
                className={`w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-all tracking-wider shadow-sm flex items-center justify-center space-x-2 cursor-pointer uppercase ${
                  formSubmitting || currentMeds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                id="hospital-submit-prescription-btn"
              >
                <Plus className="h-4 w-4" />
                <span>{formSubmitting ? 'Evaluating Interactions via Gemini AI...' : 'Approve & Upload Digital Prescription'}</span>
              </button>

            </form>
          </div>
        )}
      </div>

    </div>
  );
}
