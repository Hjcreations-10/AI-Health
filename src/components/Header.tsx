/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Activity, 
  Heart, 
  Layers, 
  User, 
  Watch, 
  Building2, 
  ShoppingBag, 
  ShieldAlert, 
  Users 
} from 'lucide-react';

interface HeaderProps {
  currentRole: string;
  onChangeRole: (role: string) => void;
  systemAlert: boolean;
  onTriggerAlertReset: () => void;
}

export default function Header({ currentRole, onChangeRole, systemAlert, onTriggerAlertReset }: HeaderProps) {
  const roles = [
    { id: 'patient', name: 'Patient Mobile App', icon: User, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'watch', name: 'Smartwatch Companion', icon: Watch, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'hospital', name: 'Hospital Portal', icon: Building2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'pharmacy', name: 'Pharmacy Portal', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'caregiver', name: 'Caregiver Dashboard', icon: Users, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/85 shadow-premium" id="app-header">
      {/* Upper Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-rose-500 rounded-xl text-white shadow-premium flex items-center justify-center animate-heartbeat">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-display font-black tracking-tight text-gradient-primary">
              AI Health Companion
            </h1>
            <p className="text-[10px] font-mono text-slate-500 tracking-wider">
              UNIVERSAL HEALTHCARE ECOSYSTEM FOR ELDERLY CARE
            </p>
          </div>
        </div>
 
        {/* Global Realtime State & Notification Hub */}
        <div className="flex items-center space-x-4">
          {systemAlert ? (
            <button
              onClick={onTriggerAlertReset}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-full text-xs font-semibold animate-pulse-ring transition-all shadow-md glow-red"
              id="emergency-clear-btn"
            >
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span className="font-bold">EMERGENCY ACTIVE - TAP TO DISMISS</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-xs text-emerald-700 font-semibold shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-Time Cloud Sync</span>
            </div>
          )}
 
          <div className="text-xs text-slate-400 font-mono hidden md:block">
            UID: <span className="text-blue-600 font-bold">AIH-882-901-IN</span>
          </div>
        </div>
      </div>
 
      {/* Role Switcher Toolbar */}
      <div className="bg-slate-50/60 border-t border-slate-200/80 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none font-mono py-1.5 mr-2">
              Select Ecosystem Node:
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = currentRole === role.id;
                return (
                  <button
                    key={role.id}
                    id={`role-tab-${role.id}`}
                    onClick={() => onChangeRole(role.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all border cursor-pointer hover-lift ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white shadow-md glow-blue'
                        : 'bg-white/80 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{role.name}</span>
                    {role.id === 'watch' && systemAlert && (
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
