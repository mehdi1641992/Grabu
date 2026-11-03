import { MediaFormat, MediaSource, PlatformType } from '../types';
import { SAMPLE_MEDIA_CATALOG } from '../data/mockSites';

export function detectPlatform(url: string): PlatformType {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('reddit.com')) return 'reddit';
  if (lower.includes('vimeo.com')) return 'vimeo';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
  if (lower.includes('dailymotion.com')) return 'dailymotion';
  if (lower.includes('soundcloud.com')) return 'soundcloud';
  return 'web';
}

export function extractVideoId(url: string, platform: PlatformType): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    if (platform === 'youtube') {
      if (urlObj.searchParams.has('v')) return urlObj.searchParams.get('v') || 'yt-video';
      const parts = urlObj.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || 'yt-video';
    }
    
    if (platform === 'tiktok') {
      const match = url.match(/\/video\/(\d+)/);
      if (match) return match[1];
    }

    if (platform === 'instagram') {
      const match = url.match(/\/(reel|p)\/([^/?#]+)/);
      if (match) return match[2];
    }

    if (platform === 'vimeo') {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || 'vimeo-media';
    }

    if (platform === 'twitter') {
      const match = url.match(/\/status\/(\d+)/);
      if (match) return match[1];
    }

    // Direct file link detection (e.g. video.mp4, clip.m3u8)
    const pathname = urlObj.pathname;
    const filenameMatch = pathname.match(/\/([^/?#]+\.(mp4|m3u8|webm|mkv|mov|ts|avi|flv|mp3|m4a|aac))$/i);
    if (filenameMatch) {
      return filenameMatch[1];
    }
  } catch {
    // Fallback
  }

  // Generic fallback ID based on hash
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return `vid-${Math.abs(hash).toString(36)}`;
}

export function generateUniversalFormats(
  durationSeconds: number = 210,
  directExtension?: string,
  directUrl?: string
): MediaFormat[] {
  // Approximate bitrates (bytes per second)
  const bitrates = {
    '4k': (28 * 1024 * 1024) / 8,      // 28 Mbps
    '2k': (14 * 1024 * 1024) / 8,      // 14 Mbps
    '1080p': (8 * 1024 * 1024) / 8,    // 8 Mbps
    '720p': (4 * 1024 * 1024) / 8,     // 4 Mbps
    '480p': (1.8 * 1024 * 1024) / 8,   // 1.8 Mbps
    'mp3-320': (320 * 1024) / 8,       // 320 kbps
    'mp3-128': (128 * 1024) / 8,       // 128 kbps
  };

  const formats: MediaFormat[] = [
    {
      id: `fmt-${Date.now()}-4k`,
      type: 'video',
      resolution: '4K 2160p',
      format: (directExtension as any) || 'mp4',
      fileSizeBytes: Math.round(durationSeconds * bitrates['4k']),
      fps: 60,
      codec: 'AV1 / AAC',
      qualityLabel: '4K Ultra HD · 60fps',
      isPopular: false,
      directUrl,
    },
    {
      id: `fmt-${Date.now()}-2k`,
      type: 'video',
      resolution: '2K 1440p',
      format: (directExtension as any) || 'mp4',
      fileSizeBytes: Math.round(durationSeconds * bitrates['2k']),
      fps: 60,
      codec: 'VP9 / AAC',
      qualityLabel: '2K Quad HD',
      directUrl,
    },
    {
      id: `fmt-${Date.now()}-1080`,
      type: 'video',
      resolution: '1080p FHD',
      format: (directExtension as any) || 'mp4',
      fileSizeBytes: Math.round(durationSeconds * bitrates['1080p']),
      fps: 60,
      codec: 'H.264 / AAC',
      qualityLabel: '1080p Full HD (Recommended)',
      isPopular: true,
      directUrl,
    },
    {
      id: `fmt-${Date.now()}-720`,
      type: 'video',
      resolution: '720p HD',
      format: (directExtension as any) || 'mp4',
      fileSizeBytes: Math.round(durationSeconds * bitrates['720p']),
      fps: 30,
      codec: 'H.264 / AAC',
      qualityLabel: '720p Standard HD',
      directUrl,
    },
    {
      id: `fmt-${Date.now()}-480`,
      type: 'video',
      resolution: '480p SD',
      format: (directExtension as any) || 'mp4',
      fileSizeBytes: Math.round(durationSeconds * bitrates['480p']),
      fps: 30,
      codec: 'H.264 / AAC',
      qualityLabel: '480p SD Mobile Saver',
      directUrl,
    },
    {
      id: `fmt-${Date.now()}-mp3-320`,
      type: 'audio',
      audioBitrate: '320 kbps',
      format: 'mp3',
      fileSizeBytes: Math.round(durationSeconds * bitrates['mp3-320']),
      codec: 'MP3 Master Audio',
      qualityLabel: 'MP3 High Quality · 320 kbps',
      isPopular: true,
      directUrl,
    },
    {
      id: `fmt-${Date.now()}-mp3-128`,
      type: 'audio',
      audioBitrate: '128 kbps',
      format: 'mp3',
      fileSizeBytes: Math.round(durationSeconds * bitrates['mp3-128']),
      codec: 'MP3 Standard',
      qualityLabel: 'MP3 Standard · 128 kbps',
      directUrl,
    },
  ];

  return formats;
}

export function extractMediaFromUrl(rawUrl: string): MediaSource {
  const cleanUrl = rawUrl.trim();
  const platform = detectPlatform(cleanUrl);
  const videoId = extractVideoId(cleanUrl, platform);

  // Check if it's a direct video or audio link
  const isDirectVideoFile = /\.(mp4|m3u8|webm|mkv|mov|ts|avi|flv)$/i.test(cleanUrl);
  const isDirectAudioFile = /\.(mp3|m4a|aac|wav|ogg)$/i.test(cleanUrl);

  // Check if we have an explicit sample catalog match
  const sampleMatch = SAMPLE_MEDIA_CATALOG.find(
    (item) => item.platform === platform || item.url.toLowerCase() === cleanUrl.toLowerCase()
  );

  if (sampleMatch) {
    return {
      ...sampleMatch,
      url: cleanUrl,
      videoId,
      detectedFilesCount: sampleMatch.formats.length,
    };
  }

  // Parse domain and page name for ANY website on the internet
  let domain = 'web-source';
  let pageName = 'Embedded Stream';
  let detectedExtension: string | undefined = undefined;

  try {
    const u = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    domain = u.hostname.replace('www.', '');
    const pathParts = u.pathname.split('/').filter(Boolean);
    const lastPart = pathParts.pop();
    if (lastPart) {
      const extMatch = lastPart.match(/\.([a-z0-9]+)$/i);
      if (extMatch) {
        detectedExtension = extMatch[1].toLowerCase();
      }
      pageName = decodeURIComponent(lastPart.replace(/[-_.]/g, ' '));
      pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    } else {
      pageName = domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  } catch {
    pageName = 'Web Video Stream';
  }

  const durationSeconds = isDirectVideoFile ? 140 : 210;
  const formats = generateUniversalFormats(durationSeconds, detectedExtension, cleanUrl);

  // Sample royalty-free fallback video streams for instant playback
  const sampleStreams = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  ];
  const streamIdx = Math.abs(videoId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % sampleStreams.length;

  return {
    id: `media-${Date.now()}-${videoId}`,
    videoId,
    url: cleanUrl,
    title: `${pageName} — ${isDirectVideoFile ? 'Direct Media Stream' : 'Detected Stream'}`,
    author: `${domain} video source`,
    platform,
    thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=640&q=80',
    durationSeconds,
    views: 'Live Stream Detected',
    uploadDate: 'Just now',
    videoSrc: isDirectVideoFile ? cleanUrl : sampleStreams[streamIdx],
    formats,
    detectedFilesCount: formats.length,
  };
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
