/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  User, 
  Watch, 
  Building2, 
  ShoppingBag, 
  ShieldAlert, 
  Users,
  Wifi,
  Bell
} from 'lucide-react';

interface HeaderProps {
  currentRole: string;
  onChangeRole: (role: string) => void;
  systemAlert: boolean;
  onTriggerAlertReset: () => void;
}

export default function Header({ currentRole, onChangeRole, systemAlert, onTriggerAlertReset }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const roles = [
    { id: 'patient', name: 'Patient App', icon: User, gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/30' },
    { id: 'watch', name: 'Smartwatch', icon: Watch, gradient: 'from-rose-500 to-pink-600', glow: 'shadow-rose-500/30' },
    { id: 'hospital', name: 'Hospital Portal', icon: Building2, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30' },
    { id: 'pharmacy', name: 'Pharmacy', icon: ShoppingBag, gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/30' },
    { id: 'caregiver', name: 'Caregiver', icon: Users, gradient: 'from-sky-500 to-cyan-600', glow: 'shadow-sky-500/30' },
  ];

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <header className="sticky top-0 z-50" id="app-header">
      {/* Emergency Alert Banner */}
      {systemAlert && (
        <button
          onClick={onTriggerAlertReset}
          className="w-full bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-bold py-2.5 flex items-center justify-center space-x-3 animate-pulse cursor-pointer"
          id="emergency-banner"
        >
          <ShieldAlert className="h-4 w-4 animate-bounce" />
          <span className="tracking-widest uppercase">⚠ EMERGENCY ALARM ACTIVE — TAP TO DISMISS ⚠</span>
          <ShieldAlert className="h-4 w-4 animate-bounce" />
        </button>
      )}

      {/* Main Brand Bar */}
      <div className="glass-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-blue-500 to-rose-500 rounded-xl text-white shadow-lg animate-glow-pulse flex items-center justify-center">
                <Activity className="h-5 w-5 animate-heartbeat" />
              </div>
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
            </div>
            <div>
              <h1 className="text-base font-display font-bold tracking-tight text-white">
                AI Health <span className="text-gradient-health">Companion</span>
              </h1>
              <p className="text-[9px] font-mono text-slate-400 tracking-[0.15em] uppercase">
                Universal Elderly Healthcare Ecosystem
              </p>
            </div>
          </div>

          {/* Right Status Bar */}
          <div className="flex items-center space-x-4">
            {/* Live clock */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-mono font-bold text-white tabular-nums">{timeStr}</span>
              <span className="text-[9px] font-mono text-slate-400">{dateStr}</span>
            </div>

            {/* Cloud sync status */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400 hidden sm:block">Live Sync</span>
            </div>

            {/* Notification bell */}
            <div className="relative p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
              <Bell className="h-4 w-4 text-slate-300" />
              {systemAlert && (
                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-rose-500 border border-slate-900"></span>
              )}
            </div>

            {/* Patient ID badge */}
            <div className="hidden lg:block text-[10px] font-mono px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-slate-500">UID: </span>
              <span className="text-indigo-400 font-bold">AIH-882-901-IN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Navigation Bar */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] font-mono whitespace-nowrap pr-2 select-none hidden md:block">
              Ecosystem Node:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = currentRole === role.id;
                return (
                  <button
                    key={role.id}
                    id={`role-tab-${role.id}`}
                    onClick={() => onChangeRole(role.id)}
                    className={`relative flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? `bg-gradient-to-r ${role.gradient} text-white shadow-lg ${role.glow} shadow-md`
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-transparent hover:border-white/10'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{role.name}</span>
                    {role.id === 'watch' && systemAlert && (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping flex-shrink-0" />
                    )}
                    {isActive && (
                      <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
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
