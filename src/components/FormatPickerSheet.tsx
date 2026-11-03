import React, { useState } from 'react';
import {
  X,
  Film,
  Music,
  Download,
  Check,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import { MediaFormat, MediaSource } from '../types';
import { formatBytes, formatDuration } from '../utils/mediaExtractor';

interface FormatPickerSheetProps {
  media: MediaSource | null;
  isOpen: boolean;
  onClose: () => void;
  onStartDownload: (media: MediaSource, format: MediaFormat) => void;
  onStartBatchDownload?: (media: MediaSource, formats: MediaFormat[]) => void;
}

export const FormatPickerSheet: React.FC<FormatPickerSheetProps> = ({
  media,
  isOpen,
  onClose,
  onStartDownload,
  onStartBatchDownload,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'all'>('all');
  const [selectedFormatIds, setSelectedFormatIds] = useState<string[]>([]);

  if (!isOpen || !media) return null;

  const videoFormats = media.formats.filter((f) => f.type === 'video');
  const audioFormats = media.formats.filter((f) => f.type === 'audio');

  const displayedFormats =
    activeTab === 'video'
      ? videoFormats
      : activeTab === 'audio'
      ? audioFormats
      : media.formats;

  const toggleSelectFormat = (id: string) => {
    setSelectedFormatIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentTabIds = displayedFormats.map((f) => f.id);
    const allSelected = currentTabIds.every((id) => selectedFormatIds.includes(id));

    if (allSelected) {
      // Deselect all in current tab
      setSelectedFormatIds((prev) => prev.filter((id) => !currentTabIds.includes(id)));
    } else {
      // Add all from current tab
      const combined = Array.from(new Set([...selectedFormatIds, ...currentTabIds]));
      setSelectedFormatIds(combined);
    }
  };

  const handleQueueBatch = () => {
    const selectedFormats = media.formats.filter((f) => selectedFormatIds.includes(f.id));
    if (selectedFormats.length === 0) return;

    if (onStartBatchDownload) {
      onStartBatchDownload(media, selectedFormats);
    } else {
      selectedFormats.forEach((fmt) => onStartDownload(media, fmt));
    }
    onClose();
  };

  // Compute total selected size
  const totalSelectedBytes = media.formats
    .filter((f) => selectedFormatIds.includes(f.id))
    .reduce((sum, f) => sum + f.fileSizeBytes, 0);

  const isAllCurrentSelected =
    displayedFormats.length > 0 &&
    displayedFormats.every((f) => selectedFormatIds.includes(f.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Modal Container */}
      <div className="relative w-full max-w-xl bg-[#1e1a24] border-t border-white/10 rounded-t-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-250">
        {/* Grab Handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-3 shrink-0" />

        {/* Header Bar */}
        <div className="px-5 pb-3 shrink-0 flex items-start justify-between gap-3 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={media.thumbnailUrl}
              alt={media.title}
              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10 shadow"
            />
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{media.title}</h3>
              <div className="flex items-center gap-2 text-xs text-white/60 mt-0.5">
                <span>{media.author}</span>
                <span>·</span>
                <span>ID: {media.videoId}</span>
                <span>·</span>
                <span>{formatDuration(media.durationSeconds)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab & Batch Actions Bar */}
        <div className="px-5 pt-3 pb-2 shrink-0 space-y-2.5">
          {/* Segmented Control */}
          <div className="grid grid-cols-3 p-1 bg-black/40 rounded-xl border border-white/5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#d0bcff] text-[#381e72] shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All ({media.formats.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'video'
                  ? 'bg-[#d0bcff] text-[#381e72] shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video ({videoFormats.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'audio'
                  ? 'bg-[#d0bcff] text-[#381e72] shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Audio ({audioFormats.length})</span>
            </button>
          </div>

          {/* Batch Selector Bar */}
          <div className="flex items-center justify-between text-xs px-1">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-white/80 hover:text-white font-medium"
            >
              {isAllCurrentSelected ? (
                <CheckSquare className="w-4 h-4 text-[#d0bcff]" />
              ) : (
                <Square className="w-4 h-4 text-white/40" />
              )}
              <span>{isAllCurrentSelected ? 'Deselect All' : 'Select All in View'}</span>
            </button>

            <span className="text-[11px] text-white/50">
              {selectedFormatIds.length > 0
                ? `${selectedFormatIds.length} selected (${formatBytes(totalSelectedBytes)})`
                : 'Select multiple items for batch download'}
            </span>
          </div>
        </div>

        {/* Formats Scroll List with Batch Checkboxes */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2.5">
          {displayedFormats.map((fmt) => {
            const isSelected = selectedFormatIds.includes(fmt.id);

            return (
              <div
                key={fmt.id}
                onClick={() => toggleSelectFormat(fmt.id)}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/40 border-[#d0bcff] shadow-md'
                    : fmt.isPopular
                    ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/50'
                    : 'bg-white/5 border-white/5 hover:border-white/15'
                }`}
              >
                {/* Checkbox & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 text-[#d0bcff]">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 fill-[#381e72]" />
                    ) : (
                      <Square className="w-5 h-5 text-white/30" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {fmt.type === 'video' ? fmt.resolution : `MP3 ${fmt.audioBitrate}`}
                      </span>
                      {fmt.isPopular && (
                        <span className="text-[10px] font-semibold text-[#d0bcff] bg-purple-900/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Recommended
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                      <span>{fmt.codec}</span>
                      <span>·</span>
                      <span>{fmt.fps ? `${fmt.fps} FPS` : 'Stereo Audio'}</span>
                      <span>·</span>
                      <span className="font-mono text-white/80 tabular-nums">
                        {formatBytes(fmt.fileSizeBytes)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instant Single Download Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartDownload(media, fmt);
                    onClose();
                  }}
                  title="Download this single stream immediately"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-transform active:scale-95 shrink-0 ${
                    isSelected
                      ? 'bg-[#d0bcff] text-[#381e72]'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Sticky Bottom Batch Download Action Bar */}
        {selectedFormatIds.length > 0 ? (
          <div className="p-4 bg-[#18151f] border-t border-white/10 shrink-0 animate-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={handleQueueBatch}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6750a4] to-[#d0bcff] text-[#381e72] font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-purple-950/60 active:scale-98 transition-transform"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>
                Queue Batch Download ({selectedFormatIds.length} items · {formatBytes(totalSelectedBytes)})
              </span>
            </button>
          </div>
        ) : (
          <div className="px-5 py-3 border-t border-white/5 bg-black/30 flex items-center justify-center gap-1.5 text-[11px] text-white/50 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select items for batch downloading or tap Download on any format</span>
          </div>
        )}
      </div>
    </div>
  );
};
