import React, { useState } from 'react';
import {
  Download,
  Play,
  Pause,
  X,
  CheckCircle2,
  Share2,
  HardDrive,
  Trash2,
  Film,
  Music,
  Save,
  Layers,
  RotateCw,
  Zap,
} from 'lucide-react';
import { DownloadTask } from '../types';
import { formatBytes } from '../utils/mediaExtractor';
import { triggerBrowserFileSave } from '../utils/downloadEngine';

interface DownloadsViewProps {
  activeTasks: DownloadTask[];
  completedTasks: DownloadTask[];
  onPauseTask: (id: string) => void;
  onResumeTask: (id: string) => void;
  onCancelTask: (id: string) => void;
  onDeleteCompletedTask: (id: string) => void;
  onPlayMedia: (task: DownloadTask) => void;
  onPauseAllTasks?: () => void;
  onResumeAllTasks?: () => void;
  onCancelAllTasks?: () => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  activeTasks,
  completedTasks,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onDeleteCompletedTask,
  onPlayMedia,
  onPauseAllTasks,
  onResumeAllTasks,
  onCancelAllTasks,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>(
    activeTasks.length > 0 ? 'active' : 'completed'
  );

  // Compute aggregate metrics
  const totalActiveSpeed = activeTasks
    .filter((t) => t.status === 'downloading')
    .reduce((sum, t) => sum + t.speedBytesPerSec, 0);

  const areAllPaused = activeTasks.length > 0 && activeTasks.every((t) => t.status === 'paused');

  const handleSaveAllToDevice = () => {
    completedTasks.forEach((task, index) => {
      setTimeout(() => {
        triggerBrowserFileSave(task);
      }, index * 300);
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#141218]">
      {/* Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-[#1e1a24] rounded-2xl border border-white/5">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'active'
              ? 'bg-[#d0bcff] text-[#381e72] shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <span>Downloading</span>
          {activeTasks.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#381e72] text-[#d0bcff] text-[10px] font-bold flex items-center justify-center">
              {activeTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'completed'
              ? 'bg-[#d0bcff] text-[#381e72] shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <span>Library</span>
          <span className="text-[10px] opacity-75">({completedTasks.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'active' ? (
        activeTasks.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/30">
              <Download className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-white/80">No active downloads</p>
            <p className="text-xs text-white/50 max-w-xs mx-auto">
              Select multiple video streams on any website to batch download simultaneously.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Batch Controls Header for Active Downloads */}
            <div className="p-3 bg-[#1e1a24] rounded-2xl border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">
                    Batch Queue: {activeTasks.length} items
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Total speed: {(totalActiveSpeed / (1024 * 1024)).toFixed(1)} MB/s
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {areAllPaused ? (
                  <button
                    onClick={onResumeAllTasks}
                    className="px-2.5 py-1 rounded-lg bg-[#d0bcff] text-[#381e72] text-xs font-bold flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Resume All</span>
                  </button>
                ) : (
                  <button
                    onClick={onPauseAllTasks}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1"
                  >
                    <Pause className="w-3 h-3" />
                    <span>Pause All</span>
                  </button>
                )}

                <button
                  onClick={onCancelAllTasks}
                  className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold"
                >
                  Cancel All
                </button>
              </div>
            </div>

            {/* Active Task Cards */}
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 bg-[#1e1a24] rounded-2xl border border-white/10 shadow-md space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={task.media.thumbnailUrl}
                    alt={task.media.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{task.media.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#d0bcff] mt-0.5">
                      <span>{task.format.resolution || task.format.audioBitrate}</span>
                      <span>·</span>
                      <span className="uppercase">{task.format.format}</span>
                    </div>
                    {/* Status & Speed */}
                    <div className="flex items-center justify-between text-[11px] text-white/60 mt-1 font-mono tabular-nums">
                      <span>
                        {formatBytes(task.bytesDownloaded)} / {formatBytes(task.totalBytes)}
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        {task.status === 'paused'
                          ? 'Paused'
                          : `${(task.speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#6750a4] to-[#d0bcff] transition-all duration-200 rounded-full"
                    style={{ width: `${Math.min(100, task.progressPercent)}%` }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-white/80 font-mono">
                    {Math.round(task.progressPercent)}%
                  </span>
                  <div className="flex items-center gap-2">
                    {task.status === 'paused' ? (
                      <button
                        onClick={() => onResumeTask(task.id)}
                        className="px-3 py-1 rounded-lg bg-[#d0bcff] text-[#381e72] font-semibold text-xs flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Resume</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onPauseTask(task.id)}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1"
                      >
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </button>
                    )}
                    <button
                      onClick={() => onCancelTask(task.id)}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : completedTasks.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/30">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-white/80">No downloaded files yet</p>
          <p className="text-xs text-white/50 max-w-xs mx-auto">
            Downloaded videos and converted MP3s will appear here for instant offline playback.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Batch Actions Header for Library */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
              {completedTasks.length} Downloaded Files
            </span>

            <button
              onClick={handleSaveAllToDevice}
              className="px-3 py-1.5 rounded-xl bg-[#d0bcff]/20 text-[#d0bcff] hover:bg-[#d0bcff]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Batch Save All to Device</span>
            </button>
          </div>

          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="p-3.5 bg-[#1e1a24] rounded-2xl border border-white/10 shadow-md space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <img
                    src={task.media.thumbnailUrl}
                    alt={task.media.title}
                    className="w-16 h-16 rounded-xl object-cover border border-white/10"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl">
                    <button
                      onClick={() => onPlayMedia(task)}
                      className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:scale-105 transition-transform"
                    >
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                    {task.media.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#d0bcff] mt-1 font-mono">
                    <span className="font-semibold">{task.format.resolution || task.format.audioBitrate}</span>
                    <span>·</span>
                    <span className="text-white/60">{formatBytes(task.totalBytes)}</span>
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    Completed · Ready for offline playback in MX Player
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPlayMedia(task)}
                    className="px-3 py-1.5 rounded-xl bg-[#d0bcff] text-[#381e72] font-semibold text-xs flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play in MX</span>
                  </button>

                  <button
                    onClick={() => triggerBrowserFileSave(task)}
                    title="Export / Save to Device Storage"
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save to Device</span>
                  </button>
                </div>

                <button
                  onClick={() => onDeleteCompletedTask(task.id)}
                  title="Delete from Library"
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
