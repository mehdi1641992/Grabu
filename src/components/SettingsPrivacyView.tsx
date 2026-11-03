import React, { useState } from 'react';
import {
  Shield,
  Trash2,
  HardDrive,
  RotateCcw,
  Check,
  Search,
  Lock,
  EyeOff,
  Flame,
  Globe,
  Radio,
  Activity,
  AlertTriangle,
  ListFilter,
} from 'lucide-react';
import { BrowsingHistoryItem, PrivacySettings, RecentSite, TrackingTelemetryEvent } from '../types';
import { formatBytes } from '../utils/mediaExtractor';
import { getTrackingTelemetry, clearTrackingTelemetry } from '../utils/storage';

interface SettingsPrivacyViewProps {
  history: BrowsingHistoryItem[];
  recentSites: RecentSite[];
  cacheUsageBytes: number;
  privacySettings: PrivacySettings;
  onUpdatePrivacySettings: (settings: PrivacySettings) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  onClearCache: () => void;
  onClearRecentSites: () => void;
  onClearAllBrowsingData: () => void;
  onNavigateToUrl: (url: string) => void;
}

export const SettingsPrivacyView: React.FC<SettingsPrivacyViewProps> = ({
  history,
  recentSites,
  cacheUsageBytes,
  privacySettings,
  onUpdatePrivacySettings,
  onDeleteHistoryItem,
  onClearHistory,
  onClearCache,
  onClearRecentSites,
  onClearAllBrowsingData,
  onNavigateToUrl,
}) => {
  const [historySearch, setHistorySearch] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cleanupToastMessage, setCleanupToastMessage] = useState<string | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<TrackingTelemetryEvent[]>(getTrackingTelemetry);
  const [showLogsViewer, setShowLogsViewer] = useState(false);

  const filteredHistory = history.filter(
    (item) =>
      item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.url.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.domain.toLowerCase().includes(historySearch.toLowerCase())
  );

  const triggerToast = (msg: string) => {
    setCleanupToastMessage(msg);
    setTimeout(() => setCleanupToastMessage(null), 2500);
  };

  const handleClearAll = () => {
    onClearAllBrowsingData();
    setShowConfirmModal(false);
    setTelemetryLogs([]);
    triggerToast('All browsing history, cache, and site cookies purged!');
  };

  const handleToggleDataTracking = () => {
    const nextVal = !privacySettings.allowDataTracking;
    const updated = {
      ...privacySettings,
      allowDataTracking: nextVal,
    };
    onUpdatePrivacySettings(updated);
    triggerToast(nextVal ? 'Data tracking enabled' : 'Data tracking disabled');
  };

  const handleClearTelemetry = () => {
    clearTrackingTelemetry();
    setTelemetryLogs([]);
    triggerToast('Telemetry tracking logs cleared');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#141218]">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Privacy & Data Control</h2>
        <p className="text-xs text-white/60 mt-0.5">
          Control data tracking capability, browser cache, recent visits, and history.
        </p>
      </div>

      {/* User Data Tracking Capability Switcher (Explicitly Requested) */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1e1a24] to-[#25202c] border border-cyan-500/30 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Data Tracking Capability</h3>
              <span
                className={`text-[10px] font-semibold ${
                  privacySettings.allowDataTracking ? 'text-cyan-400' : 'text-white/50'
                }`}
              >
                {privacySettings.allowDataTracking ? 'Tracking Enabled (User Opt-In)' : 'Tracking Disabled (Zero Data Mode)'}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleDataTracking}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              privacySettings.allowDataTracking ? 'bg-cyan-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                privacySettings.allowDataTracking ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="text-xs text-white/70 leading-relaxed">
          {privacySettings.allowDataTracking
            ? 'When enabled, Grabu records your search terms, preferred video formats, and network speed diagnostics. You can inspect or wipe tracked telemetry at any time.'
            : 'When disabled, Grabu operates under strict Zero Data Collection mode. No logs, searches, or accounts are recorded or transmitted.'}
        </p>

        {privacySettings.allowDataTracking && (
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => {
                setTelemetryLogs(getTrackingTelemetry());
                setShowLogsViewer(!showLogsViewer);
              }}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{showLogsViewer ? 'Hide Tracked Logs' : `View Tracked Logs (${telemetryLogs.length})`}</span>
            </button>

            <button
              onClick={handleClearTelemetry}
              className="text-xs text-white/50 hover:text-white"
            >
              Clear Logs
            </button>
          </div>
        )}

        {/* Telemetry Log Viewer */}
        {showLogsViewer && privacySettings.allowDataTracking && (
          <div className="mt-2 p-3 bg-black/40 rounded-2xl border border-white/5 max-h-48 overflow-y-auto space-y-1.5">
            {telemetryLogs.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-2">No tracked events recorded yet</p>
            ) : (
              telemetryLogs.map((log) => (
                <div key={log.id} className="text-[11px] font-mono text-white/70 flex justify-between gap-2 border-b border-white/5 pb-1">
                  <span className="text-cyan-400 font-semibold">{log.eventType}</span>
                  <span className="truncate flex-1 text-white/80">{log.details}</span>
                  <span className="text-white/40">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Storage & Cache Purge Center */}
      <div className="p-4 rounded-3xl bg-[#1e1a24] border border-white/10 shadow-md space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#d0bcff]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Browser Storage & Cache
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-white/90 tabular-nums">
            {formatBytes(cacheUsageBytes)} used
          </span>
        </div>

        {/* Breakdown Metric Tiles */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-2xl bg-[#2b2735] text-center border border-white/5">
            <span className="text-[10px] text-white/50 block">History</span>
            <span className="text-sm font-bold text-white font-mono">{history.length}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#2b2735] text-center border border-white/5">
            <span className="text-[10px] text-white/50 block">Web Cache</span>
            <span className="text-sm font-bold text-white font-mono">{formatBytes(cacheUsageBytes)}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#2b2735] text-center border border-white/5">
            <span className="text-[10px] text-white/50 block">Recent Sites</span>
            <span className="text-sm font-bold text-white font-mono">{recentSites.length}</span>
          </div>
        </div>

        {/* Master Purge Button */}
        <button
          onClick={() => setShowConfirmModal(true)}
          className="w-full py-3 rounded-2xl bg-[#fe5f55]/15 border border-[#fe5f55]/30 hover:bg-[#fe5f55]/25 text-[#fe5f55] font-bold text-xs flex items-center justify-center gap-2 transition-colors active:scale-98"
        >
          <Flame className="w-4 h-4" />
          <span>Clear All Browsing Data & Cache</span>
        </button>

        {/* Granular Cleaning Actions */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
          <button
            onClick={() => {
              onClearHistory();
              triggerToast('Browsing history cleared');
            }}
            className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-semibold transition-colors"
          >
            Clear History
          </button>
          <button
            onClick={() => {
              onClearCache();
              triggerToast('Web cache emptied');
            }}
            className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-semibold transition-colors"
          >
            Clear Cache
          </button>
          <button
            onClick={() => {
              onClearRecentSites();
              triggerToast('Recent sites reset');
            }}
            className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-semibold transition-colors"
          >
            Reset Recents
          </button>
        </div>
      </div>

      {/* Incognito & Shield Toggles */}
      <div className="p-4 rounded-3xl bg-[#1e1a24] border border-white/10 shadow-md space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Browsing Privacy</h3>

        <div className="space-y-3">
          {/* Incognito Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <EyeOff className="w-4 h-4 text-amber-300 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-white block">Incognito Mode</span>
                <span className="text-[11px] text-white/50">Do not save browsing history or cache</span>
              </div>
            </div>
            <button
              onClick={() =>
                onUpdatePrivacySettings({
                  ...privacySettings,
                  incognitoMode: !privacySettings.incognitoMode,
                })
              }
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                privacySettings.incognitoMode ? 'bg-amber-400' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  privacySettings.incognitoMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Brave Ad Shield Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[#fe5f55] mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-white block">Brave Ad & Tracker Shield</span>
                <span className="text-[11px] text-white/50">Block popups, video ads & telemetry</span>
              </div>
            </div>
            <button
              onClick={() =>
                onUpdatePrivacySettings({
                  ...privacySettings,
                  shieldEnabled: !privacySettings.shieldEnabled,
                })
              }
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                privacySettings.shieldEnabled ? 'bg-[#d0bcff]' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  privacySettings.shieldEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Sites Carousel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
            Recent Site Visits
          </span>
          <span className="text-[11px] text-white/50">{recentSites.length} sites</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {recentSites.map((site) => (
            <button
              key={site.id}
              onClick={() => onNavigateToUrl(site.url)}
              className="px-3 py-2 rounded-2xl bg-[#1e1a24] border border-white/5 hover:border-white/20 flex items-center gap-2 shrink-0 transition-transform active:scale-95"
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: site.color }}
              >
                {site.name.charAt(0)}
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-white block leading-tight">{site.name}</span>
                <span className="text-[10px] text-white/40">{site.visitCount} visits</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Browsing History Viewer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
            Browsing History ({history.length})
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-white/40" />
          <input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search past visited links or titles..."
            className="w-full bg-[#1e1a24] text-white text-xs rounded-2xl pl-8 pr-4 py-2.5 border border-white/10 focus:outline-none focus:border-[#d0bcff]"
          />
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/40">
              {historySearch ? 'No matching history records' : 'History is empty'}
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-[#1e1a24] rounded-2xl border border-white/5 hover:border-white/15 flex items-center justify-between gap-3 group transition-colors"
              >
                <div
                  onClick={() => onNavigateToUrl(item.url)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#d0bcff]">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5">
                    <span className="font-mono text-[#d0bcff]">{item.domain}</span>
                    <span>·</span>
                    <span>{new Date(item.visitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteHistoryItem(item.id)}
                  title="Delete from history"
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal for Master Purge */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-[#1e1a24] border border-white/10 p-5 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fe5f55]/20 text-[#fe5f55] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Clear All Browsing Data?</h3>
              <p className="text-xs text-white/60 mt-1">
                This will immediately purge all browsing history, cached video streams, cookies, and recent site visit shortcuts. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 rounded-xl bg-[#fe5f55] text-white text-xs font-bold transition-transform active:scale-95"
              >
                Purge All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {cleanupToastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#d0bcff] text-[#381e72] px-4 py-2 rounded-full font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in zoom-in duration-150">
          <Check className="w-4 h-4" />
          <span>{cleanupToastMessage}</span>
        </div>
      )}
    </div>
  );
};
