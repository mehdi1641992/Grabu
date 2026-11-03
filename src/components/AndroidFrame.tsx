import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery, Smartphone, Monitor } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isFrameEnabled: boolean;
  onToggleFrame: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isFrameEnabled,
  onToggleFrame,
}) => {
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0c12] text-[#e6e1e5] flex flex-col items-center justify-start p-0 sm:p-4 md:p-6 transition-colors duration-300">
      {/* Top Floating Viewport Mode Switcher for Desktop / Tablet */}
      <div className="hidden sm:flex items-center gap-2 mb-3 bg-[#1e1a24] border border-white/10 rounded-full px-3 py-1 shadow-lg text-xs">
        <span className="text-white/60">Display Mode:</span>
        <button
          onClick={onToggleFrame}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${
            isFrameEnabled
              ? 'bg-[#d0bcff] text-[#381e72] font-semibold'
              : 'text-white/80 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Android Phone
        </button>
        <button
          onClick={onToggleFrame}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${
            !isFrameEnabled
              ? 'bg-[#d0bcff] text-[#381e72] font-semibold'
              : 'text-white/80 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          Full Responsive
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 ${
          isFrameEnabled
            ? 'max-w-[412px] h-[100dvh] sm:h-[870px] sm:rounded-[44px] sm:border-[8px] sm:border-[#2b2735] sm:shadow-2xl shadow-purple-950/40 relative overflow-hidden flex flex-col bg-[#141218] dark:bg-[#141218]'
            : 'max-w-5xl min-h-[92vh] sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col bg-[#141218] dark:bg-[#141218]'
        }`}
      >
        {/* Android Status Bar (Shown in Frame Mode or Mobile Viewports) */}
        {isFrameEnabled && (
          <div className="h-10 px-6 shrink-0 flex items-center justify-between text-xs font-medium text-white/90 select-none z-50 bg-[#141218] border-b border-white/5">
            <span>{currentTime}</span>
            {/* Front Camera Hole Punch */}
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/20 mx-auto" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-tight text-[#d0bcff]">5G</span>
              <Signal className="w-3.5 h-3.5 text-white/80" />
              <Wifi className="w-3.5 h-3.5 text-white/80" />
              <div className="flex items-center gap-1">
                <span className="text-[11px] tabular-nums">94%</span>
                <Battery className="w-4 h-4 text-white/90" />
              </div>
            </div>
          </div>
        )}

        {/* Child Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">{children}</div>

        {/* Android Gesture Navigation Bar */}
        {isFrameEnabled && (
          <div className="h-4 w-full flex items-center justify-center shrink-0 bg-[#141218] select-none pb-1">
            <div className="w-32 h-1 bg-white/40 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
