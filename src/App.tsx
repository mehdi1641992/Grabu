import React, { useState, useEffect } from 'react';
import {
  AppTab,
  BrowsingHistoryItem,
  DownloadTask,
  MediaFormat,
  MediaSource,
  PrivacySettings,
  RecentSite,
  ShieldStats,
} from './types';
import { AndroidFrame } from './components/AndroidFrame';
import { TopAppBar } from './components/TopAppBar';
import { BottomNav } from './components/BottomNav';
import { BrowserView } from './components/BrowserView';
import { DirectDownloaderView } from './components/DirectDownloaderView';
import { DownloadsView } from './components/DownloadsView';
import { SettingsPrivacyView } from './components/SettingsPrivacyView';
import { FormatPickerSheet } from './components/FormatPickerSheet';
import { ShieldModal } from './components/ShieldModal';
import { MediaPlayerModal } from './components/MediaPlayerModal';
import {
  clearAllBrowsingData,
  clearAllBrowsingHistory,
  clearBrowserCache,
  clearRecentSites,
  deleteHistoryItem,
  getBrowsingHistory,
  getCacheUsageBytes,
  getPrivacySettings,
  getRecentSites,
  recordHistoryVisit,
  savePrivacySettings,
  logTrackingEvent,
} from './utils/storage';
import {
  getStoredShieldStats,
  saveShieldStats,
  registerShieldInterception,
} from './utils/shieldEngine';
import {
  createRealMediaBlob,
  getStoredCompletedDownloads,
  saveCompletedDownloads,
} from './utils/downloadEngine';
import { SAMPLE_MEDIA_CATALOG } from './data/mockSites';

export default function App() {
  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<AppTab>('browser');
  const [currentBrowserUrl, setCurrentBrowserUrl] = useState<string>(
    'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
  );
  const [isFrameEnabled, setIsFrameEnabled] = useState<boolean>(true);
  const [isTitleBarHidden, setIsTitleBarHidden] = useState<boolean>(false);

  // Media & Sniffer State
  const [detectedMedia, setDetectedMedia] = useState<MediaSource | null>(
    SAMPLE_MEDIA_CATALOG[0]
  );
  const [formatPickerMedia, setFormatPickerMedia] = useState<MediaSource | null>(null);
  const [isFormatPickerOpen, setIsFormatPickerOpen] = useState(false);

  // MX Player State
  const [activePlayerTask, setActivePlayerTask] = useState<DownloadTask | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Shield Modal State
  const [isShieldModalOpen, setIsShieldModalOpen] = useState(false);
  const [shieldStats, setShieldStats] = useState<ShieldStats>(getStoredShieldStats);

  // Storage & Privacy States
  const [history, setHistory] = useState<BrowsingHistoryItem[]>(getBrowsingHistory);
  const [recentSites, setRecentSites] = useState<RecentSite[]>(getRecentSites);
  const [cacheUsageBytes, setCacheUsageBytes] = useState<number>(getCacheUsageBytes);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(getPrivacySettings);

  // Downloads State
  const [activeTasks, setActiveTasks] = useState<DownloadTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<DownloadTask[]>(() => {
    const stored = getStoredCompletedDownloads();
    if (stored.length > 0) return stored;
    // Seed initial completed task so Library has a ready-to-play item in MX Player
    const initialTask: DownloadTask = {
      id: 'task-initial-sample',
      media: SAMPLE_MEDIA_CATALOG[0],
      format: SAMPLE_MEDIA_CATALOG[0].formats[2], // 1080p FHD
      progressPercent: 100,
      bytesDownloaded: SAMPLE_MEDIA_CATALOG[0].formats[2].fileSizeBytes,
      totalBytes: SAMPLE_MEDIA_CATALOG[0].formats[2].fileSizeBytes,
      speedBytesPerSec: 0,
      status: 'completed',
      createdAt: Date.now() - 1000 * 60 * 30,
      completedAt: Date.now() - 1000 * 60 * 29,
    };
    saveCompletedDownloads([initialTask]);
    return [initialTask];
  });

  // Permanently enforce dark mode on root document
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Multi-threaded Download Engine Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTasks((prevTasks) => {
        if (prevTasks.length === 0) return prevTasks;

        const updated: DownloadTask[] = [];
        const finished: DownloadTask[] = [];

        prevTasks.forEach((task) => {
          if (task.status !== 'downloading') {
            updated.push(task);
            return;
          }

          // Random speed variance around 14-24 MB/s
          const baseSpeed = 18 * 1024 * 1024;
          const currentSpeed = Math.round(baseSpeed * (0.8 + Math.random() * 0.4));
          const chunk = currentSpeed * 0.5;
          const newBytes = Math.min(task.totalBytes, task.bytesDownloaded + chunk);
          const newProgress = (newBytes / task.totalBytes) * 100;

          if (newProgress >= 100) {
            const completedTask: DownloadTask = {
              ...task,
              bytesDownloaded: task.totalBytes,
              progressPercent: 100,
              speedBytesPerSec: 0,
              status: 'completed',
              completedAt: Date.now(),
            };
            finished.push(completedTask);
            logTrackingEvent('download_completed', `Completed ${task.media.title}`, {
              format: task.format.resolution || task.format.audioBitrate,
              sizeBytes: task.totalBytes,
            });
          } else {
            updated.push({
              ...task,
              bytesDownloaded: newBytes,
              progressPercent: newProgress,
              speedBytesPerSec: currentSpeed,
            });
          }
        });

        if (finished.length > 0) {
          setCompletedTasks((prevCompleted) => {
            const nextCompleted = [...finished, ...prevCompleted];
            saveCompletedDownloads(nextCompleted);
            return nextCompleted;
          });
          finished.forEach((ft) => {
            createRealMediaBlob(ft.format, ft.media);
          });
        }

        return updated;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---
  const handleStartDownload = (media: MediaSource, format: MediaFormat) => {
    const newTask: DownloadTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      media,
      format,
      progressPercent: 0,
      bytesDownloaded: 0,
      totalBytes: format.fileSizeBytes,
      speedBytesPerSec: 16 * 1024 * 1024,
      status: 'downloading',
      createdAt: Date.now(),
    };

    setActiveTasks((prev) => [newTask, ...prev]);

    logTrackingEvent('download_started', `Started download for ${media.title}`, {
      resolution: format.resolution || format.audioBitrate,
      format: format.format,
    });
  };

  const handleBatchDownload = (media: MediaSource, formats: MediaFormat[]) => {
    const now = Date.now();
    const newTasks: DownloadTask[] = formats.map((fmt, idx) => ({
      id: `task-batch-${now}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      media,
      format: fmt,
      progressPercent: 0,
      bytesDownloaded: 0,
      totalBytes: fmt.fileSizeBytes,
      speedBytesPerSec: Math.round((14 + Math.random() * 6) * 1024 * 1024),
      status: 'downloading',
      createdAt: now + idx,
    }));

    setActiveTasks((prev) => [...newTasks, ...prev]);

    logTrackingEvent('batch_download_started', `Queued batch download of ${formats.length} streams for ${media.title}`, {
      count: formats.length,
      totalBytes: formats.reduce((acc, f) => acc + f.fileSizeBytes, 0),
    });
  };

  const handlePauseTask = (id: string) => {
    setActiveTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'paused', speedBytesPerSec: 0 } : t))
    );
  };

  const handleResumeTask = (id: string) => {
    setActiveTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'downloading' } : t))
    );
  };

  const handleCancelTask = (id: string) => {
    setActiveTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handlePauseAllTasks = () => {
    setActiveTasks((prev) =>
      prev.map((t) => ({ ...t, status: 'paused', speedBytesPerSec: 0 }))
    );
  };

  const handleResumeAllTasks = () => {
    setActiveTasks((prev) =>
      prev.map((t) => ({ ...t, status: 'downloading' }))
    );
  };

  const handleCancelAllTasks = () => {
    setActiveTasks([]);
  };

  const handleDeleteCompletedTask = (id: string) => {
    setCompletedTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveCompletedDownloads(updated);
      return updated;
    });
  };

  const handlePlayMedia = (task: DownloadTask) => {
    setActivePlayerTask(task);
    setIsPlayerOpen(true);
  };

  const handleNavigateUrl = (url: string) => {
    setCurrentBrowserUrl(url);
    setCurrentTab('browser');
  };

  const handleRecordHistory = (url: string, title: string) => {
    if (!privacySettings.incognitoMode) {
      const updated = recordHistoryVisit(url, title);
      setHistory(updated);
      setRecentSites(getRecentSites());
      setCacheUsageBytes(getCacheUsageBytes());
    }
  };

  // Privacy & Tracking Handlers
  const handleUpdatePrivacySettings = (settings: PrivacySettings) => {
    setPrivacySettings(settings);
    savePrivacySettings(settings);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    clearAllBrowsingHistory();
    setHistory([]);
  };

  const handleClearCache = () => {
    clearBrowserCache();
    setCacheUsageBytes(0);
  };

  const handleClearRecentSites = () => {
    clearRecentSites();
    setRecentSites([]);
  };

  const handleClearAllBrowsingData = () => {
    clearAllBrowsingData();
    setHistory([]);
    setCacheUsageBytes(0);
    setRecentSites([]);
  };

  const handleToggleShield = () => {
    const updated = {
      ...privacySettings,
      shieldEnabled: !privacySettings.shieldEnabled,
    };
    handleUpdatePrivacySettings(updated);
  };

  return (
    <AndroidFrame
      isFrameEnabled={isFrameEnabled}
      onToggleFrame={() => setIsFrameEnabled(!isFrameEnabled)}
    >
      {/* Top App Bar (Collapses smoothly when scrolled down in browser) */}
      <div
        className={`transition-all duration-300 overflow-hidden shrink-0 ${
          isTitleBarHidden && currentTab === 'browser'
            ? 'max-h-0 opacity-0 -translate-y-full pointer-events-none'
            : 'max-h-14 opacity-100 translate-y-0'
        }`}
      >
        <TopAppBar
          shieldStats={shieldStats}
          isShieldActive={privacySettings.shieldEnabled}
          isIncognito={privacySettings.incognitoMode}
          isTrackingEnabled={privacySettings.allowDataTracking}
          onOpenShieldModal={() => setIsShieldModalOpen(true)}
        />
      </div>

      {/* Main Tab Views */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {currentTab === 'browser' && (
          <BrowserView
            currentUrl={currentBrowserUrl}
            onNavigateUrl={handleNavigateUrl}
            recentSites={recentSites}
            detectedMedia={detectedMedia}
            setDetectedMedia={setDetectedMedia}
            onOpenFormatPicker={(media) => {
              setFormatPickerMedia(media);
              setIsFormatPickerOpen(true);
            }}
            onStartOneClickDownload={handleStartDownload}
            isShieldEnabled={privacySettings.shieldEnabled}
            isIncognito={privacySettings.incognitoMode}
            onRecordHistory={handleRecordHistory}
            onScrollDirectionChange={(isDown) => setIsTitleBarHidden(isDown)}
          />
        )}

        {currentTab === 'direct' && (
          <DirectDownloaderView
            onOpenFormatPicker={(media) => {
              setFormatPickerMedia(media);
              setIsFormatPickerOpen(true);
            }}
            onStartDownload={handleStartDownload}
          />
        )}

        {currentTab === 'downloads' && (
          <DownloadsView
            activeTasks={activeTasks}
            completedTasks={completedTasks}
            onPauseTask={handlePauseTask}
            onResumeTask={handleResumeTask}
            onCancelTask={handleCancelTask}
            onDeleteCompletedTask={handleDeleteCompletedTask}
            onPlayMedia={handlePlayMedia}
            onPauseAllTasks={handlePauseAllTasks}
            onResumeAllTasks={handleResumeAllTasks}
            onCancelAllTasks={handleCancelAllTasks}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsPrivacyView
            history={history}
            recentSites={recentSites}
            cacheUsageBytes={cacheUsageBytes}
            privacySettings={privacySettings}
            onUpdatePrivacySettings={handleUpdatePrivacySettings}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            onClearCache={handleClearCache}
            onClearRecentSites={handleClearRecentSites}
            onClearAllBrowsingData={handleClearAllBrowsingData}
            onNavigateToUrl={handleNavigateUrl}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsTitleBarHidden(false);
        }}
        activeDownloadsCount={activeTasks.length}
        hasDetectedMedia={Boolean(detectedMedia)}
      />

      {/* Format Picker Bottom Sheet (Supports Batch Downloading) */}
      <FormatPickerSheet
        media={formatPickerMedia}
        isOpen={isFormatPickerOpen}
        onClose={() => setIsFormatPickerOpen(false)}
        onStartDownload={handleStartDownload}
        onStartBatchDownload={handleBatchDownload}
      />

      {/* Brave Shield Stats Modal */}
      <ShieldModal
        isOpen={isShieldModalOpen}
        onClose={() => setIsShieldModalOpen(false)}
        stats={shieldStats}
        isShieldEnabled={privacySettings.shieldEnabled}
        onToggleShield={handleToggleShield}
      />

      {/* Full-featured MX Player Video Modal */}
      <MediaPlayerModal
        task={activePlayerTask}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
    </AndroidFrame>
  );
}
