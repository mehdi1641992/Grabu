import React from 'react';
import { Shield, CheckCircle, Zap, HardDrive, Clock, X, Lock } from 'lucide-react';
import { ShieldStats } from '../types';
import { formatBytes } from '../utils/mediaExtractor';

interface ShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ShieldStats;
  isShieldEnabled: boolean;
  onToggleShield: () => void;
}

export const ShieldModal: React.FC<ShieldModalProps> = ({
  isOpen,
  onClose,
  stats,
  isShieldEnabled,
  onToggleShield,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-[#1e1a24] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-gradient-to-br from-[#fe5f55]/20 to-transparent border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#fe5f55] text-white flex items-center justify-center shadow-lg shadow-[#fe5f55]/30">
              <Shield className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Grabu Privacy Shield</h3>
              <span className="text-[10px] text-emerald-400 font-medium">Brave-Grade Protection</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Protection Toggle */}
        <div className="p-4 bg-black/20 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">Shield Status:</span>
            <span
              className={`text-xs font-bold ${
                isShieldEnabled ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isShieldEnabled ? 'UP & PROTECTING' : 'DOWN (PAUSED)'}
            </span>
          </div>

          <button
            onClick={onToggleShield}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              isShieldEnabled ? 'bg-[#fe5f55]' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                isShieldEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#2b2735] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-[#fe5f55] text-xs">
                <Shield className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">Ads Blocked</span>
              </div>
              <span className="text-xl font-bold text-white font-mono tabular-nums block">
                {stats.adsBlocked}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#2b2735] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">Trackers Stopped</span>
              </div>
              <span className="text-xl font-bold text-white font-mono tabular-nums block">
                {stats.trackersBlocked}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#2b2735] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <HardDrive className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">Bandwidth Saved</span>
              </div>
              <span className="text-base font-bold text-white font-mono tabular-nums block">
                {formatBytes(stats.dataSavedBytes)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#2b2735] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">Time Saved</span>
              </div>
              <span className="text-base font-bold text-white font-mono tabular-nums block">
                {stats.timeSavedSeconds}s
              </span>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-2.5 text-[11px] text-white/60">
            <Lock className="w-3.5 h-3.5 text-[#d0bcff] shrink-0 mt-0.5" />
            <span>
              Grabu filters network requests on-device before scripts execute. No surveillance data ever leaves your device.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
