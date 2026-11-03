export type PlatformType = 
  | 'youtube' 
  | 'tiktok' 
  | 'instagram' 
  | 'twitter' 
  | 'reddit' 
  | 'vimeo' 
  | 'facebook' 
  | 'dailymotion' 
  | 'soundcloud' 
  | 'web';

export type VideoResolution = 
  | '4K 2160p' 
  | '2K 1440p' 
  | '1080p FHD' 
  | '720p HD' 
  | '480p SD' 
  | '360p';

export type AudioBitrate = 
  | '320 kbps' 
  | '256 kbps' 
  | '128 kbps';

export interface MediaFormat {
  id: string;
  type: 'video' | 'audio';
  resolution?: VideoResolution;
  audioBitrate?: AudioBitrate;
  format: 'mp4' | 'webm' | 'mp3' | 'm4a' | 'm3u8' | 'mkv' | 'mov' | 'ts';
  fileSizeBytes: number;
  fps?: number;
  codec: string;
  qualityLabel: string;
  isPopular?: boolean;
  directUrl?: string;
}

export interface MediaSource {
  id: string;
  videoId: string;
  url: string;
  title: string;
  author: string;
  platform: PlatformType;
  thumbnailUrl: string;
  durationSeconds: number;
  views?: string;
  uploadDate?: string;
  videoSrc?: string;
  formats: MediaFormat[];
  detectedFilesCount?: number;
}

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'error';

export interface DownloadTask {
  id: string;
  media: MediaSource;
  format: MediaFormat;
  progressPercent: number;
  bytesDownloaded: number;
  totalBytes: number;
  speedBytesPerSec: number;
  status: DownloadStatus;
  createdAt: number;
  completedAt?: number;
  blobUrl?: string;
  error?: string;
}

export interface BrowsingHistoryItem {
  id: string;
  url: string;
  title: string;
  domain: string;
  visitedAt: number;
  visitCount: number;
  favicon?: string;
}

export interface RecentSite {
  id: string;
  name: string;
  domain: string;
  url: string;
  iconName: string;
  color: string;
  category: string;
  visitCount: number;
  lastVisited: number;
}

export interface ShieldStats {
  adsBlocked: number;
  trackersBlocked: number;
  dataSavedBytes: number;
  timeSavedSeconds: number;
}

export interface TrackingTelemetryEvent {
  id: string;
  timestamp: number;
  eventType: 'url_visited' | 'media_sniffed' | 'download_started' | 'download_completed' | 'format_selected' | 'batch_download_started';
  details: string;
  metadata?: Record<string, any>;
}

export interface PrivacySettings {
  incognitoMode: boolean;
  shieldEnabled: boolean;
  blockTrackers: boolean;
  httpsOnly: boolean;
  clearHistoryOnExit: boolean;
  clearCacheOnExit: boolean;
  doNotTrack: boolean;
  allowDataTracking: boolean; // User-toggled tracking capability
}

export type AppTab = 'browser' | 'direct' | 'downloads' | 'settings';
