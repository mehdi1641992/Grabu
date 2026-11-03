import React from 'react';
import { Shield, ShieldAlert, EyeOff, Radio } from 'lucide-react';
import { ShieldStats } from '../types';

interface TopAppBarProps {
  shieldStats: ShieldStats;
  isShieldActive: boolean;
  isIncognito: boolean;
  isTrackingEnabled: boolean;
  onOpenShieldModal: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  shieldStats,
  isShieldActive,
  isIncognito,
  isTrackingEnabled,
  onOpenShieldModal,
}) => {
  const totalBlocked = shieldStats.adsBlocked + shieldStats.trackersBlocked;

  return (
    <header className="h-14 px-4 shrink-0 flex items-center justify-between gap-3 border-b border-white/10 bg-[#1e1a24] backdrop-blur-md z-40 select-none">
      {/* Brand Zone */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6750a4] to-[#d0bcff] flex items-center justify-center shadow-md shadow-purple-900/30">
          <span className="text-white font-extrabold text-base tracking-tighter">G</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            Grabu
            <span className="text-[10px] font-semibold text-[#d0bcff] bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-500/30">
              HD
            </span>
          </span>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="flex items-center gap-2">
        {isIncognito && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
            <EyeOff className="w-3 h-3" />
            <span>Incognito</span>
          </div>
        )}

        {isTrackingEnabled && (
          <div className="flex items-center gap-1 text-[10px] font-medium text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Telemetry On</span>
          </div>
        )}
      </div>

      {/* Action Zone */}
      <div className="flex items-center gap-2">
        {/* Brave-style Shield Protection Button */}
        <button
          onClick={onOpenShieldModal}
          title="Brave Shield Ad & Tracker Protection"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            isShieldActive
              ? 'bg-[#fe5f55]/15 text-[#fe5f55] border border-[#fe5f55]/40 hover:bg-[#fe5f55]/25'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
          }`}
        >
          {isShieldActive ? (
            <Shield className="w-3.5 h-3.5 fill-[#fe5f55]/20" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5" />
          )}
          <span className="tabular-nums font-mono">{totalBlocked}</span>
        </button>
      </div>
    </header>
  );
};
