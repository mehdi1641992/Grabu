import React, { useState } from 'react';
import { Clipboard, Download, ArrowRight, Sparkles, Check, Film, Music, Shield } from 'lucide-react';
import { MediaFormat, MediaSource } from '../types';
import { extractMediaFromUrl, formatBytes, formatDuration } from '../utils/mediaExtractor';

interface DirectDownloaderViewProps {
  onOpenFormatPicker: (media: MediaSource) => void;
  onStartDownload: (media: MediaSource, format: MediaFormat) => void;
}

export const DirectDownloaderView: React.FC<DirectDownloaderViewProps> = ({
  onOpenFormatPicker,
  onStartDownload,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [analyzedMedia, setAnalyzedMedia] = useState<MediaSource | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        analyzeUrl(text);
      }
    } catch {
      // Fallback if clipboard permission is denied
    }
  };

  const analyzeUrl = (url: string) => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const media = extractMediaFromUrl(url);
      setAnalyzedMedia(media);
      setIsAnalyzing(false);
    }, 350);
  };

  const handleQuickDownload = () => {
    if (!analyzedMedia) return;
    const bestFmt =
      analyzedMedia.formats.find((f) => f.resolution === '1080p FHD') ||
      analyzedMedia.formats.find((f) => f.type === 'video') ||
      analyzedMedia.formats[0];

    onStartDownload(analyzedMedia, bestFmt);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const sampleLinks = [
    {
      label: 'YouTube 4K Music Video',
      url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    },
    {
      label: 'TikTok Viral Short (1080p)',
      url: 'https://www.tiktok.com/@creativehacks/video/7394821948',
    },
    {
      label: 'Instagram Drone 4K Reel',
      url: 'https://www.instagram.com/reel/C8xP0q9kL2/',
    },
    {
      label: 'Vimeo Cinema Masterpiece',
      url: 'https://vimeo.com/91823746',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#141218]">
      {/* Title & Instructions */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Direct Link Downloader</h2>
        <p className="text-xs text-white/60 mt-0.5">
          Paste any link from any website to extract all HD streams and audio tracks instantly.
        </p>
      </div>

      {/* Input Box Card */}
      <div className="p-3.5 bg-[#1e1a24] rounded-3xl border border-white/10 shadow-lg space-y-3">
        <div className="relative">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              if (e.target.value.length > 10) analyzeUrl(e.target.value);
            }}
            placeholder="Paste video link here..."
            className="w-full bg-[#2b2735] text-white text-xs rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-[#d0bcff] transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePaste}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Clipboard className="w-3.5 h-3.5 text-[#d0bcff]" />
            <span>Paste from Clipboard</span>
          </button>

          <button
            onClick={() => analyzeUrl(inputUrl)}
            disabled={!inputUrl || isAnalyzing}
            className="flex-1 py-2.5 rounded-xl bg-[#d0bcff] hover:bg-[#e8def8] text-[#381e72] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span>Analyzing...</span>
            ) : (
              <>
                <span>Extract Streams</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instant Sample Presets */}
      <div>
        <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider px-1">
          Try with Sample Links
        </span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {sampleLinks.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputUrl(item.url);
                analyzeUrl(item.url);
              }}
              className="p-2.5 rounded-2xl bg-[#1e1a24] border border-white/5 hover:border-white/20 text-left transition-all active:scale-95 flex flex-col justify-between"
            >
              <span className="text-xs font-semibold text-white/90 truncate">{item.label}</span>
              <span className="text-[10px] text-[#d0bcff] font-mono truncate mt-1">Tap to test</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analyzed Media Card Result */}
      {analyzedMedia && (
        <div className="p-4 rounded-3xl bg-[#1e1a24] border border-purple-500/30 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <img
              src={analyzedMedia.thumbnailUrl}
              alt={analyzedMedia.title}
              className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-white/10"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-[#d0bcff]">
                <span className="font-semibold uppercase">{analyzedMedia.platform}</span>
                <span>·</span>
                <span className="font-mono text-white/60">ID: {analyzedMedia.videoId}</span>
              </div>
              <h3 className="text-sm font-bold text-white leading-tight mt-1 line-clamp-2">
                {analyzedMedia.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                <span>{analyzedMedia.author}</span>
                <span>·</span>
                <span>{formatDuration(analyzedMedia.durationSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            <button
              onClick={handleQuickDownload}
              className="flex-1 py-3 rounded-2xl bg-[#d0bcff] hover:bg-[#e8def8] text-[#381e72] font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 transition-transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>One-Click HD (1080p)</span>
            </button>

            <button
              onClick={() => onOpenFormatPicker(analyzedMedia)}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>All Formats ({analyzedMedia.formats.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#d0bcff] text-[#381e72] px-4 py-2 rounded-full font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in zoom-in duration-150">
          <Check className="w-4 h-4" />
          <span>Queued in Downloads Manager!</span>
        </div>
      )}
    </div>
  );
};
