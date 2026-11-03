import React from 'react';
import { Compass, Link2, Download, Settings, Sparkles } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  activeDownloadsCount: number;
  hasDetectedMedia: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  activeDownloadsCount,
  hasDetectedMedia,
}) => {
  const tabs = [
    {
      id: 'browser' as AppTab,
      label: 'Browser',
      icon: Compass,
      hasDot: hasDetectedMedia,
    },
    {
      id: 'direct' as AppTab,
      label: 'Fast Paste',
      icon: Link2,
      hasDot: false,
    },
    {
      id: 'downloads' as AppTab,
      label: 'Downloads',
      icon: Download,
      badge: activeDownloadsCount > 0 ? activeDownloadsCount : undefined,
    },
    {
      id: 'settings' as AppTab,
      label: 'Settings',
      icon: Settings,
      hasDot: false,
    },
  ];

  return (
    <nav className="h-16 shrink-0 border-t border-white/10 bg-[#1e1a24]/95 dark:bg-[#1e1a24]/95 backdrop-blur-lg flex items-center justify-around px-2 z-40 select-none">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] relative transition-transform active:scale-95"
          >
            {/* Active Pill Container */}
            <div
              className={`px-4 py-1 rounded-full flex items-center justify-center transition-all duration-200 relative ${
                isActive
                  ? 'bg-[#d0bcff] text-[#381e72] shadow-sm shadow-purple-900/30'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />

              {/* Active Downloads Count Badge */}
              {tab.badge !== undefined && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#fe5f55] text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-bounce">
                  {tab.badge}
                </span>
              )}

              {/* Stream Sniffer Alert Badge on Browser icon */}
              {tab.hasDot && !isActive && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
            </div>

            {/* Caption */}
            <span
              className={`text-[11px] font-medium tracking-tight mt-1 transition-colors ${
                isActive ? 'text-[#d0bcff] font-semibold' : 'text-white/60'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
