import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ArrowLeft,
  RotateCw,
  X,
  Download,
  Play,
  Check,
  Lock,
  Globe,
  Film,
  Music,
  ExternalLink,
  Move,
} from 'lucide-react';
import { MediaFormat, MediaSource, RecentSite } from '../types';
import { extractMediaFromUrl, formatBytes, formatDuration } from '../utils/mediaExtractor';
import { registerShieldInterception } from '../utils/shieldEngine';

interface BrowserViewProps {
  currentUrl: string;
  onNavigateUrl: (url: string) => void;
  recentSites: RecentSite[];
  detectedMedia: MediaSource | null;
  setDetectedMedia: (media: MediaSource | null) => void;
  onOpenFormatPicker: (media: MediaSource) => void;
  onStartOneClickDownload: (media: MediaSource, format: MediaFormat) => void;
  isShieldEnabled: boolean;
  isIncognito: boolean;
  onRecordHistory: (url: string, title: string) => void;
  onScrollDirectionChange?: (isScrollingDown: boolean) => void;
}

export const BrowserView: React.FC<BrowserViewProps> = ({
  currentUrl,
  onNavigateUrl,
  recentSites,
  detectedMedia,
  setDetectedMedia,
  onOpenFormatPicker,
  onStartOneClickDownload,
  isShieldEnabled,
  isIncognito,
  onRecordHistory,
  onScrollDirectionChange,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl || '');
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [activeMedia, setActiveMedia] = useState<MediaSource | null>(detectedMedia);
  const [showOneClickSuccessToast, setShowOneClickSuccessToast] = useState(false);
  const [isMinimizedUrlBar, setIsMinimizedUrlBar] = useState(false);

  // Draggable FAB state
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingFab, setIsDraggingFab] = useState(false);
  const dragDataRef = useRef<{
    startX: number;
    startY: number;
    initialFabX: number;
    initialFabY: number;
    hasMoved: boolean;
  }>({ startX: 0, startY: 0, initialFabX: 0, initialFabY: 0, hasMoved: false });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTopRef = useRef(0);

  // Sync state when currentUrl changes
  useEffect(() => {
    if (currentUrl) {
      setInputUrl(currentUrl);
      simulatePageLoad(currentUrl);
    }
  }, [currentUrl]);

  const simulatePageLoad = (url: string) => {
    setIsLoadingPage(true);
    setTimeout(() => {
      setIsLoadingPage(false);
      const media = extractMediaFromUrl(url);
      setActiveMedia(media);
      setDetectedMedia(media);
      onRecordHistory(url, media.title);

      if (isShieldEnabled) {
        registerShieldInterception(
          Math.floor(Math.random() * 3) + 2,
          Math.floor(Math.random() * 4) + 2
        );
      }
    }, 400);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    let target = inputUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = `https://${target}`;
      } else {
        target = `https://www.youtube.com/results?search_query=${encodeURIComponent(target)}`;
      }
    }
    onNavigateUrl(target);
  };

  // Scroll detection to minimize URL bar and hide title bar when scrolled down
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    if (currentScrollTop > lastScrollTopRef.current + 20 && currentScrollTop > 40) {
      if (!isMinimizedUrlBar) {
        setIsMinimizedUrlBar(true);
        onScrollDirectionChange?.(true);
      }
    } else if (currentScrollTop < lastScrollTopRef.current - 15) {
      if (isMinimizedUrlBar) {
        setIsMinimizedUrlBar(false);
        onScrollDirectionChange?.(false);
      }
    }
    lastScrollTopRef.current = currentScrollTop;
  };

  // Draggable FAB Touch & Mouse Handlers
  const handleFabStart = (clientX: number, clientY: number) => {
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    // Current position
    const currentX = fabPosition ? fabPosition.x : container.width - 76;
    const currentY = fabPosition ? fabPosition.y : container.height - 84;

    dragDataRef.current = {
      startX: clientX,
      startY: clientY,
      initialFabX: currentX,
      initialFabY: currentY,
      hasMoved: false,
    };
    setIsDraggingFab(true);
  };

  const handleFabMove = (clientX: number, clientY: number) => {
    if (!isDraggingFab) return;
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    const dx = clientX - dragDataRef.current.startX;
    const dy = clientY - dragDataRef.current.startY;

    if (Math.hypot(dx, dy) > 5) {
      dragDataRef.current.hasMoved = true;
    }

    const newX = Math.max(10, Math.min(container.width - 64, dragDataRef.current.initialFabX + dx));
    const newY = Math.max(10, Math.min(container.height - 64, dragDataRef.current.initialFabY + dy));

    setFabPosition({ x: newX, y: newY });
  };

  const handleFabEnd = () => {
    if (!dragDataRef.current.hasMoved && activeMedia) {
      // Tap without dragging opens the detected stream formats sheet!
      onOpenFormatPicker(activeMedia);
    }
    setIsDraggingFab(false);
  };

  // Extract domain for display
  let currentDomain = '';
  try {
    currentDomain = new URL(currentUrl.startsWith('http') ? currentUrl : `https://${currentUrl}`).hostname;
  } catch {
    currentDomain = currentUrl;
  }

  const detectedFilesCount = activeMedia?.formats?.length || 0;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-[#141218] overflow-hidden relative select-none"
      onMouseMove={(e) => {
        if (isDraggingFab) handleFabMove(e.clientX, e.clientY);
      }}
      onMouseUp={() => {
        if (isDraggingFab) handleFabEnd();
      }}
      onTouchMove={(e) => {
        if (isDraggingFab && e.touches[0]) {
          handleFabMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={() => {
        if (isDraggingFab) handleFabEnd();
      }}
    >
      {/* Minimized or Full URL Bar */}
      {isMinimizedUrlBar && currentUrl ? (
        /* Minimized Compact URL Pill when scrolled down */
        <div
          onClick={() => {
            setIsMinimizedUrlBar(false);
            onScrollDirectionChange?.(false);
          }}
          className="h-9 px-4 bg-[#1e1a24]/95 border-b border-white/10 shrink-0 flex items-center justify-between gap-2 z-20 cursor-pointer shadow-md backdrop-blur-md animate-in slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center gap-2 truncate">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="font-mono text-xs text-white/90 truncate">{currentDomain}</span>
          </div>
          <span className="text-[10px] text-[#d0bcff] font-semibold shrink-0">Tap to expand</span>
        </div>
      ) : (
        /* Full Omnibox Address Bar */
        <div className="p-2.5 bg-[#1e1a24] border-b border-white/10 shrink-0 flex items-center gap-2 z-20 transition-all duration-200">
          <div className="flex items-center gap-1 text-white/70">
            <button
              onClick={() => onNavigateUrl('')}
              title="Go to Home"
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => simulatePageLoad(inputUrl || currentUrl)}
              title="Refresh Page"
              className={`w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors ${
                isLoadingPage ? 'animate-spin text-[#d0bcff]' : ''
              }`}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
            <div className="absolute left-3 text-white/40 flex items-center gap-1 pointer-events-none">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter any website or video link (every site supported)..."
              className="w-full bg-[#2b2735] text-white text-xs rounded-full pl-8 pr-8 py-2 border border-white/10 focus:outline-none focus:border-[#d0bcff] transition-all"
            />
            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl('')}
                className="absolute right-2.5 w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </form>

          <button
            onClick={handleSearchSubmit}
            className="px-3.5 py-1.5 rounded-full bg-[#d0bcff] text-[#381e72] font-semibold text-xs shrink-0 hover:bg-[#e8def8] transition-colors"
          >
            Go
          </button>
        </div>
      )}

      {/* Progress Bar during page load */}
      {isLoadingPage && (
        <div className="h-0.5 w-full bg-purple-950 overflow-hidden shrink-0 z-20">
          <div className="h-full bg-[#d0bcff] animate-pulse w-3/4 transition-all" />
        </div>
      )}

      {/* Main Viewport Container with scroll listener */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative flex flex-col"
      >
        {!currentUrl ? (
          /* Browser Home Screen with Quick Dials */
          <div className="p-4 space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-[#2b2735] to-[#1e1a24] border border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <Globe className="w-4 h-4 text-[#d0bcff]" />
                <span className="text-xs font-semibold text-[#d0bcff]">Universal Web Sniffer</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Browse any website & download any video
              </h2>
              <p className="text-xs text-white/60 mt-1">
                Supports all websites, direct video streams, HLS playlists (.m3u8), MP4, WebM, and audio files.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  Supported Video Platforms & Sites
                </span>
                <span className="text-[11px] text-[#d0bcff]">Auto-detector ready</span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {recentSites.slice(0, 8).map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      setInputUrl(site.url);
                      onNavigateUrl(site.url);
                    }}
                    className="p-3 rounded-2xl bg-[#1e1a24] border border-white/5 hover:border-white/20 hover:bg-[#2b2735] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-white font-bold text-sm"
                      style={{ backgroundColor: site.color }}
                    >
                      {site.name.charAt(0)}
                    </div>
                    <span className="text-[11px] font-semibold text-white/90 truncate max-w-full group-hover:text-[#d0bcff]">
                      {site.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Whole Web Page View: Shows the entire web page cleanly without stream inspector box */
          <div className="flex-1 flex flex-col relative w-full h-full min-h-0 bg-[#0e0c12]">
            {/* Live Web Page Header Bar */}
            <div className="h-9 px-4 bg-[#18151f] border-b border-white/5 flex items-center justify-between text-xs text-white/70 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <Globe className="w-3.5 h-3.5 text-[#d0bcff]" />
                <span className="font-mono text-white/90 truncate">{currentDomain}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                  {detectedFilesCount} video streams detected
                </span>
              </div>
            </div>

            {/* Whole Web Page Content */}
            <div className="flex-1 p-4 space-y-4">
              {activeMedia && (
                <div className="rounded-2xl overflow-hidden bg-[#1e1a24] border border-white/10 shadow-xl">
                  {/* Embedded Video Player View */}
                  <div className="relative aspect-video bg-black flex items-center justify-center group">
                    <img
                      src={activeMedia.thumbnailUrl}
                      alt={activeMedia.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg group-hover:scale-105 transition-transform">
                        <Play className="w-7 h-7 fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                      {formatDuration(activeMedia.durationSeconds)}
                    </div>
                  </div>

                  {/* Webpage Post Content & Metadata */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#d0bcff]">
                      <span className="font-semibold uppercase tracking-wider">{activeMedia.platform}</span>
                      <span>·</span>
                      <span className="font-mono text-white/60">ID: {activeMedia.videoId}</span>
                    </div>

                    <h1 className="text-base font-bold text-white leading-snug">
                      {activeMedia.title}
                    </h1>

                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>{activeMedia.author}</span>
                      <span>·</span>
                      <span>{activeMedia.views || 'Active Stream'}</span>
                      <span>·</span>
                      <span>{activeMedia.uploadDate || 'Online'}</span>
                    </div>

                    <p className="text-xs text-white/70 pt-1 leading-relaxed border-t border-white/5">
                      Stream source automatically intercepted from {currentDomain}. Tap the floating download icon to inspect and download high-definition video formats (up to 4K 2160p) and MP3 audio.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Movable Floating Action Download Button (FAB) - Can be moved anywhere on page! */}
      {activeMedia && currentUrl && (
        <div
          style={
            fabPosition
              ? { left: `${fabPosition.x}px`, top: `${fabPosition.y}px` }
              : { right: '20px', bottom: '24px' }
          }
          onMouseDown={(e) => {
            e.stopPropagation();
            handleFabStart(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            if (e.touches[0]) handleFabStart(e.touches[0].clientX, e.touches[0].clientY);
          }}
          className={`absolute z-40 touch-none select-none cursor-grab active:cursor-grabbing transition-shadow ${
            isDraggingFab ? 'scale-110 shadow-2xl shadow-purple-900/90' : 'hover:scale-105 active:scale-95'
          }`}
          title="Drag to reposition · Tap to view detected video files & download"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#6750a4] to-[#d0bcff] text-[#381e72] flex items-center justify-center shadow-2xl shadow-purple-950/90 border-2 border-white/30 relative">
            <Download className="w-6 h-6 stroke-[2.5] text-[#1e0a3c]" />

            {/* Move indicator dots */}
            <div className="absolute bottom-1 w-2.5 h-1 flex justify-between">
              <span className="w-0.5 h-0.5 bg-[#1e0a3c] rounded-full opacity-60" />
              <span className="w-0.5 h-0.5 bg-[#1e0a3c] rounded-full opacity-60" />
              <span className="w-0.5 h-0.5 bg-[#1e0a3c] rounded-full opacity-60" />
            </div>

            {/* Detected count badge */}
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#fe5f55] text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-[#141218] animate-bounce">
              {detectedFilesCount}
            </span>
          </div>
        </div>
      )}

      {/* Instant Download Success Toast */}
      {showOneClickSuccessToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#d0bcff] text-[#381e72] px-4 py-2 rounded-full font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in zoom-in duration-150">
          <Check className="w-4 h-4" />
          <span>Download started! Added to Downloads manager.</span>
        </div>
      )}
    </div>
  );
};
