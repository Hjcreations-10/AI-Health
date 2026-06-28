import React from 'react';

export interface MedVisual {
  shape: 'capsule' | 'round' | 'oval' | 'syrup' | 'tablet';
  color: string;
  description: string;
  bgClass: string;
  borderColor: string;
}

export function getMedicineVisual(name: string): MedVisual {
  const norm = name.toLowerCase();
  
  if (norm.includes('metformin')) {
    return {
      shape: 'oval',
      color: '#f8fafc', // Clean white
      description: 'Elongated white tablet with "M500" imprint',
      bgClass: 'bg-slate-50',
      borderColor: 'border-slate-300'
    };
  }
  if (norm.includes('telmisartan')) {
    return {
      shape: 'round',
      color: '#fca5a5', // Soft pink
      description: 'Round pink tablet with split score line',
      bgClass: 'bg-rose-50',
      borderColor: 'border-rose-200'
    };
  }
  if (norm.includes('calcium')) {
    return {
      shape: 'capsule',
      color: '#3b82f6', // Dual blue-white capsule
      description: 'Dual-color Blue & White capsule',
      bgClass: 'bg-blue-50',
      borderColor: 'border-blue-200'
    };
  }
  if (norm.includes('glucosamine')) {
    return {
      shape: 'oval',
      color: '#fef08a', // Pale yellow oval
      description: 'Yellow oval tablet',
      bgClass: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    };
  }
  
  if (norm.includes('syrup') || norm.includes('suspension') || norm.includes('liquid')) {
    return {
      shape: 'syrup',
      color: '#b45309', // Amber syrup
      description: 'Amber liquid bottle',
      bgClass: 'bg-amber-50',
      borderColor: 'border-amber-200'
    };
  }
  
  if (norm.includes('capsule')) {
    return {
      shape: 'capsule',
      color: '#10b981', // Emerald green
      description: 'Emerald green & white capsule',
      bgClass: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    };
  }

  // Generative default based on string hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const shapes: ('round' | 'capsule' | 'oval')[] = ['round', 'capsule', 'oval'];
  const colors = [
    { color: '#f87171', bg: 'bg-red-50', border: 'border-red-200', desc: 'Red tablet' },
    { color: '#60a5fa', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Blue tablet' },
    { color: '#34d399', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'Green tablet' },
    { color: '#fbbf24', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Yellow tablet' },
    { color: '#c084fc', bg: 'bg-purple-50', border: 'border-purple-200', desc: 'Purple tablet' },
  ];
  
  const selectedShape = shapes[Math.abs(hash) % shapes.length];
  const selectedColor = colors[Math.abs(hash) % colors.length];
  
  return {
    shape: selectedShape,
    color: selectedColor.color,
    description: `${selectedColor.desc} (${selectedShape})`,
    bgClass: selectedColor.bg,
    borderColor: selectedColor.border
  };
}

interface MedicineVisualProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function MedicineVisual({ name, size = 'md' }: MedicineVisualProps) {
  const visual = getMedicineVisual(name);
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-2 rounded-2xl border ${visual.bgClass} ${visual.borderColor} shadow-xs transition-transform duration-300 hover:scale-105`}>
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {visual.shape === 'round' && (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Round tablet outer */}
            <circle cx="50" cy="50" r="40" fill={visual.color} stroke="#e2e8f0" strokeWidth="2" />
            <circle cx="50" cy="50" r="39" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
            {/* Split scoring line */}
            <line x1="50" y1="12" x2="50" y2="88" stroke="rgba(0,0,0,0.15)" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="2" fill="rgba(0,0,0,0.1)" />
          </svg>
        )}

        {visual.shape === 'oval' && (
          <svg viewBox="0 0 120 70" className="w-full h-full drop-shadow-md">
            {/* Oval tablet */}
            <rect x="10" y="10" width="100" height="50" rx="25" ry="25" fill={visual.color} stroke="#e2e8f0" strokeWidth="2" />
            <rect x="11" y="11" width="98" height="48" rx="24" ry="24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
            {/* Split score line and pill code imprint */}
            <line x1="60" y1="12" x2="60" y2="58" stroke="rgba(0,0,0,0.1)" strokeWidth="3" strokeLinecap="round" />
            {name.toLowerCase().includes('metformin') && (
              <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold" fontFamily="monospace">M500</text>
            )}
          </svg>
        )}

        {visual.shape === 'capsule' && (
          <svg viewBox="0 0 120 60" className="w-full h-full drop-shadow-md rotate-[30deg]">
            {/* Capsule Background */}
            <g>
              {/* Left half (colored) */}
              <path d="M 40 10 A 20 20 0 0 0 40 50 L 60 50 L 60 10 Z" fill={visual.color} />
              {/* Right half (always white) */}
              <path d="M 60 10 L 80 10 A 20 20 0 0 1 80 50 L 60 50 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              {/* Overall outer capsule stroke */}
              <rect x="20" y="10" width="80" height="40" rx="20" ry="20" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
              {/* Inner highlight sheen */}
              <path d="M 28 20 A 12 12 0 0 1 35 15 L 85 15" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </svg>
        )}

        {visual.shape === 'syrup' && (
          <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-md">
            {/* Syrup bottle top cap */}
            <rect x="32" y="10" width="16" height="12" rx="2" fill="#1e293b" />
            {/* Neck */}
            <rect x="35" y="22" width="10" height="10" fill="#78350f" />
            {/* Bottle shoulder & body */}
            <path d="M 35 32 L 20 45 L 20 85 A 5 5 0 0 0 25 90 L 55 90 A 5 5 0 0 0 60 85 L 60 45 L 45 32 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            {/* Label */}
            <rect x="24" y="52" width="32" height="26" fill="#fef08a" rx="1" />
            <line x1="28" y1="58" x2="52" y2="58" stroke="#1e293b" strokeWidth="2" />
            <line x1="28" y1="64" x2="48" y2="64" stroke="#475569" strokeWidth="1.5" />
            <line x1="28" y1="70" x2="44" y2="70" stroke="#475569" strokeWidth="1.5" />
            {/* Liquid level */}
            <path d="M 20 80 L 20 85 A 5 5 0 0 0 25 90 L 55 90 A 5 5 0 0 0 60 85 L 60 80 Z" fill="#b45309" opacity="0.4" />
          </svg>
        )}
      </div>
      <span className="text-[9px] text-slate-500 font-medium text-center leading-tight mt-1 max-w-[80px] truncate">
        {visual.description}
      </span>
    </div>
  );
}
