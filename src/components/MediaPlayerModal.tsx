import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  X,
  Music,
  Film,
  Download,
  Lock,
  Unlock,
  Sun,
  Settings2,
  Ratio,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DownloadTask } from '../types';
import { formatDuration } from '../utils/mediaExtractor';
import { triggerBrowserFileSave } from '../utils/downloadEngine';

interface MediaPlayerModalProps {
  task: DownloadTask | null;
  isOpen: boolean;
  onClose: () => void;
}

type AspectRatioMode = 'fit' | 'stretch' | 'crop' | 'original';
type DecoderMode = 'HW' | 'HW+' | 'SW';

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({ task, isOpen, onClose }) => {
  // Playback states
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1); // 0 to 2 (up to 200% volume boost)
  const [brightness, setBrightness] = useState(100); // 10% to 100%
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('fit');
  const [decoder, setDecoder] = useState<DecoderMode>('HW+');
  const [isLocked, setIsLocked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Gesture feedback indicators
  const [gestureFeedback, setGestureFeedback] = useState<{
    type: 'volume' | 'brightness' | 'seek';
    value: string;
    percent?: number;
  } | null>(null);

  // Double-tap ripple indicator
  const [doubleTapRipple, setDoubleTapRipple] = useState<'left' | 'right' | null>(null);

  // Clock for MX Player HUD
  const [hudTime, setHudTime] = useState('12:00');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number; volume: number; brightness: number } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  useEffect(() => {
    if (task) {
      setDuration(task.media.durationSeconds || 180);
      setCurrentTime(0);
      setIsPlaying(true);
      setIsLocked(false);
      setShowControls(true);
      resetControlsTimer();
    }
  }, [task]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setHudTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const resetControlsTimer = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!isLocked) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  };

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;

    // Check for double click / tap
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isRightHalf = clickX > rect.width / 2;

    if (now - lastTapRef.current.time < 300) {
      // Double tap detected!
      if (isRightHalf) {
        skipTime(10);
        setDoubleTapRipple('right');
      } else {
        skipTime(-10);
        setDoubleTapRipple('left');
      }
      setTimeout(() => setDoubleTapRipple(null), 600);
      lastTapRef.current = { time: 0, x: 0 };
      return;
    }

    lastTapRef.current = { time: now, x: clickX };

    // Single tap toggles controls
    setShowControls((prev) => !prev);
    resetControlsTimer();
  };

  // --- Touch Gestures (MX Player Signature swipe controls) ---
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked || e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      volume,
      brightness,
    };
    resetControlsTimer();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked || !touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const rect = playerContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Vertical swipe
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 15) {
      const isRightSide = touchStartRef.current.x > rect.left + rect.width / 2;
      const deltaPercent = -(dy / rect.height);

      if (isRightSide) {
        // MX Player Volume Control (supports boost up to 200%)
        const newVol = Math.max(0, Math.min(2.0, touchStartRef.current.volume + deltaPercent * 2));
        setVolume(newVol);
        if (videoRef.current) videoRef.current.volume = Math.min(1.0, newVol);
        setGestureFeedback({
          type: 'volume',
          value: `${Math.round(newVol * 100)}%`,
          percent: Math.min(100, Math.round((newVol / 2) * 100)),
        });
      } else {
        // MX Player Brightness Control (10% to 100%)
        const newBright = Math.max(15, Math.min(100, Math.round(touchStartRef.current.brightness + deltaPercent * 100)));
        setBrightness(newBright);
        setGestureFeedback({
          type: 'brightness',
          value: `${newBright}%`,
          percent: newBright,
        });
      }
    } else if (Math.abs(dx) > 20) {
      // Horizontal swipe: Scrub / Seek
      const seekOffset = Math.round((dx / rect.width) * 60); // +/- 60 seconds
      setGestureFeedback({
        type: 'seek',
        value: `${seekOffset >= 0 ? '+' : ''}${seekOffset}s`,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gestureFeedback?.type === 'seek' && touchStartRef.current) {
      const rect = playerContainerRef.current?.getBoundingClientRect();
      if (rect) {
        const dx = (e.changedTouches[0]?.clientX || 0) - touchStartRef.current.x;
        const seekOffset = Math.round((dx / rect.width) * 60);
        skipTime(seekOffset);
      }
    }
    touchStartRef.current = null;
    setTimeout(() => setGestureFeedback(null), 500);
  };

  if (!isOpen || !task) return null;

  const isAudio = task.format.type === 'audio';
  const videoSourceUrl =
    task.blobUrl ||
    task.media.videoSrc ||
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      resetControlsTimer();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
    resetControlsTimer();
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(duration, videoRef.current.currentTime + seconds)
      );
    }
    resetControlsTimer();
  };

  const cycleAspectRatio = () => {
    const modes: AspectRatioMode[] = ['fit', 'stretch', 'crop', 'original'];
    const nextIdx = (modes.indexOf(aspectRatio) + 1) % modes.length;
    setAspectRatio(modes[nextIdx]);
    resetControlsTimer();
  };

  const cycleDecoder = () => {
    const decoders: DecoderMode[] = ['HW', 'HW+', 'SW'];
    const nextIdx = (decoders.indexOf(decoder) + 1) % decoders.length;
    setDecoder(decoders[nextIdx]);
    resetControlsTimer();
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.5, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const next = speeds[nextIdx];
    setPlaybackSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
    resetControlsTimer();
  };

  // Video object styling based on aspect ratio
  const getVideoStyle = () => {
    switch (aspectRatio) {
      case 'stretch':
        return 'w-full h-full object-fill';
      case 'crop':
        return 'w-full h-full object-cover';
      case 'original':
        return 'max-w-none w-auto h-auto object-none';
      case 'fit':
      default:
        return 'w-full h-full object-contain';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none">
      <div
        ref={playerContainerRef}
        className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-black"
        style={{ filter: `brightness(${brightness}%)` }}
        onClick={handleScreenClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Media Canvas */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isAudio ? (
            <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center z-0">
              <div className="w-28 h-28 rounded-full bg-purple-950/50 border border-purple-500/30 flex items-center justify-center shadow-2xl animate-pulse">
                <Music className="w-14 h-14 text-[#d0bcff]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white max-w-sm truncate">{task.media.title}</h3>
                <span className="text-xs text-[#d0bcff] font-mono mt-1 block">
                  MP3 Hi-Fi Audio · {task.format.audioBitrate || '320 kbps'}
                </span>
              </div>
              <audio
                ref={videoRef as any}
                src={videoSourceUrl}
                autoPlay
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration || 180);
                }}
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={videoSourceUrl}
              autoPlay
              playsInline
              className={getVideoStyle()}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) setDuration(videoRef.current.duration || 180);
              }}
            />
          )}
        </div>

        {/* MX Player Double Tap Skip Ripples */}
        {doubleTapRipple === 'left' && (
          <div className="absolute left-10 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center pointer-events-none animate-in zoom-in-50 duration-200">
            <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center text-white backdrop-blur-sm">
              <RotateCcw className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold text-white mt-1.5 font-mono">-10s</span>
          </div>
        )}
        {doubleTapRipple === 'right' && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center pointer-events-none animate-in zoom-in-50 duration-200">
            <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center text-white backdrop-blur-sm">
              <RotateCw className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold text-white mt-1.5 font-mono">+10s</span>
          </div>
        )}

        {/* Gesture On-Screen Feedback Pill (Volume / Brightness / Seek) */}
        {gestureFeedback && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black/80 border border-white/20 rounded-2xl px-6 py-4 flex flex-col items-center gap-2 pointer-events-none shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-100">
            {gestureFeedback.type === 'volume' && (
              <>
                <Volume2 className="w-8 h-8 text-[#d0bcff]" />
                <span className="text-sm font-bold text-white font-mono">{gestureFeedback.value}</span>
                <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-[#d0bcff]" style={{ width: `${gestureFeedback.percent}%` }} />
                </div>
              </>
            )}
            {gestureFeedback.type === 'brightness' && (
              <>
                <Sun className="w-8 h-8 text-amber-300" />
                <span className="text-sm font-bold text-white font-mono">{gestureFeedback.value}</span>
                <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-amber-400" style={{ width: `${gestureFeedback.percent}%` }} />
                </div>
              </>
            )}
            {gestureFeedback.type === 'seek' && (
              <>
                <RotateCw className="w-8 h-8 text-emerald-400" />
                <span className="text-lg font-bold text-white font-mono">{gestureFeedback.value}</span>
              </>
            )}
          </div>
        )}

        {/* Touch Lock Indicator (Floats when locked) */}
        {isLocked && (
          <div className="absolute top-6 left-6 z-40">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLocked(false);
                setShowControls(true);
                resetControlsTimer();
              }}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl transition-transform active:scale-90"
            >
              <Unlock className="w-5 h-5 text-amber-300" />
            </button>
          </div>
        )}

        {/* --- MX Player Overlay HUD (Top & Bottom) --- */}
        {!isLocked && showControls && (
          <>
            {/* Top HUD */}
            <div
              className="p-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between z-30 transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Title & Status */}
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                    {task.media.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-white/60">
                    <span className="font-mono text-[#d0bcff]">{task.format.resolution || task.format.audioBitrate}</span>
                    <span>·</span>
                    <span>{hudTime}</span>
                  </div>
                </div>
              </div>

              {/* Right MX Controls */}
              <div className="flex items-center gap-2">
                {/* Decoder Switcher (HW / HW+ / SW) */}
                <button
                  onClick={cycleDecoder}
                  title="Decoder mode: Hardware vs Software"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#d0bcff] text-xs font-mono font-bold border border-white/10"
                >
                  {decoder}
                </button>

                {/* Aspect Ratio Switcher */}
                <button
                  onClick={cycleAspectRatio}
                  title={`Aspect Ratio: ${aspectRatio.toUpperCase()}`}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1"
                >
                  <Ratio className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-mono hidden sm:inline">{aspectRatio}</span>
                </button>

                {/* Export / Save to Device */}
                <button
                  onClick={() => triggerBrowserFileSave(task)}
                  title="Save file to Android device storage"
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                </button>

                {/* Screen Lock Button */}
                <button
                  onClick={() => {
                    setIsLocked(true);
                    setShowControls(false);
                  }}
                  title="Lock controls"
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  <Lock className="w-4 h-4 text-amber-300" />
                </button>
              </div>
            </div>

            {/* Bottom MX Player Controls */}
            <div
              className="p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-30 space-y-3 transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Scrub Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-white/80 tabular-nums">
                  <span>{formatDuration(Math.round(currentTime))}</span>
                  <span>{formatDuration(Math.round(duration))}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 180}
                  step="0.5"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d0bcff]"
                />
              </div>

              {/* Bottom Buttons Bar */}
              <div className="flex items-center justify-between">
                {/* Left Options */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={cycleSpeed}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold"
                  >
                    {playbackSpeed}x
                  </button>

                  <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-xl text-xs text-white/90">
                    <Volume2 className="w-3.5 h-3.5 text-[#d0bcff]" />
                    <span className="font-mono text-[11px]">{Math.round(volume * 100)}%</span>
                  </div>
                </div>

                {/* Center Playback Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => skipTime(-10)}
                    title="Rewind 10s"
                    className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-[#d0bcff] text-[#381e72] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => skipTime(10)}
                    title="Forward 10s"
                    className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                </div>

                {/* Right Options */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (videoRef.current?.requestFullscreen) {
                        videoRef.current.requestFullscreen();
                      }
                    }}
                    className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
