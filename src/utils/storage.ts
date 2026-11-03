import { BrowsingHistoryItem, PrivacySettings, RecentSite, TrackingTelemetryEvent } from '../types';
import { POPULAR_SITES } from '../data/mockSites';

const STORAGE_KEY_HISTORY = 'grabu_browsing_history_v1';
const STORAGE_KEY_RECENTS = 'grabu_recent_sites_v1';
const STORAGE_KEY_PRIVACY = 'grabu_privacy_settings_v1';
const STORAGE_KEY_CACHE_USAGE = 'grabu_cache_usage_bytes_v1';
const STORAGE_KEY_TRACKING_LOGS = 'grabu_tracking_telemetry_v1';

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  incognitoMode: false,
  shieldEnabled: true,
  blockTrackers: true,
  httpsOnly: true,
  clearHistoryOnExit: false,
  clearCacheOnExit: false,
  doNotTrack: true,
  allowDataTracking: false, // User-controllable data tracking toggle
};

// --- PRIVACY SETTINGS ---
export function getPrivacySettings(): PrivacySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRIVACY);
    if (raw) return { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_PRIVACY_SETTINGS;
}

export function savePrivacySettings(settings: PrivacySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_PRIVACY, JSON.stringify(settings));
  } catch {
    // fallback
  }
}

// --- DATA TRACKING TELEMETRY (TOGGLEABLE) ---
export function getTrackingTelemetry(): TrackingTelemetryEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRACKING_LOGS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export function saveTrackingTelemetry(events: TrackingTelemetryEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TRACKING_LOGS, JSON.stringify(events));
  } catch {
    // fallback
  }
}

export function logTrackingEvent(
  eventType: TrackingTelemetryEvent['eventType'],
  details: string,
  metadata?: Record<string, any>
): void {
  const settings = getPrivacySettings();
  if (!settings.allowDataTracking) {
    // Tracking is disabled - do not collect anything
    return;
  }

  const newEvent: TrackingTelemetryEvent = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
    eventType,
    details,
    metadata,
  };

  const logs = getTrackingTelemetry();
  const updated = [newEvent, ...logs].slice(0, 100); // retain last 100 entries
  saveTrackingTelemetry(updated);
}

export function clearTrackingTelemetry(): void {
  saveTrackingTelemetry([]);
}

// --- BROWSING HISTORY ---
export function getBrowsingHistory(): BrowsingHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  
  const initial: BrowsingHistoryItem[] = [
    {
      id: 'hist-1',
      url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      title: 'Luis Fonsi — Despacito ft. Daddy Yankee',
      domain: 'youtube.com',
      visitedAt: Date.now() - 1000 * 60 * 12,
      visitCount: 3,
    },
    {
      id: 'hist-2',
      url: 'https://vimeo.com/91823746',
      title: 'The Solitary Artisan — Vanguard Cinema',
      domain: 'vimeo.com',
      visitedAt: Date.now() - 1000 * 60 * 45,
      visitCount: 1,
    },
    {
      id: 'hist-3',
      url: 'https://www.tiktok.com/@creativehacks/video/7394821948',
      title: 'Top 5 Minimalist Tech Gadgets',
      domain: 'tiktok.com',
      visitedAt: Date.now() - 1000 * 60 * 120,
      visitCount: 2,
    },
  ];
  saveBrowsingHistory(initial);
  return initial;
}

export function saveBrowsingHistory(history: BrowsingHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  } catch {
    // fallback
  }
}

export function recordHistoryVisit(url: string, title: string): BrowsingHistoryItem[] {
  const settings = getPrivacySettings();
  if (settings.incognitoMode) {
    return getBrowsingHistory();
  }

  let domain = 'web-source';
  try {
    domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
  } catch {
    domain = url.split('/')[0];
  }

  const current = getBrowsingHistory();
  const existingIndex = current.findIndex((item) => item.url.toLowerCase() === url.toLowerCase());

  let updated: BrowsingHistoryItem[];
  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    updated = [
      {
        ...existing,
        title: title || existing.title,
        visitedAt: Date.now(),
        visitCount: existing.visitCount + 1,
      },
      ...current.filter((_, idx) => idx !== existingIndex),
    ];
  } else {
    const newItem: BrowsingHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url,
      title: title || domain,
      domain,
      visitedAt: Date.now(),
      visitCount: 1,
    };
    updated = [newItem, ...current];
  }

  if (updated.length > 200) {
    updated = updated.slice(0, 200);
  }

  saveBrowsingHistory(updated);
  updateRecentSiteVisit(domain, url);
  incrementSimulatedCache(180 * 1024);

  // If tracking is enabled by user, log it
  logTrackingEvent('url_visited', `Visited ${domain}`, { url, title });

  return updated;
}

export function deleteHistoryItem(id: string): BrowsingHistoryItem[] {
  const current = getBrowsingHistory();
  const updated = current.filter((item) => item.id !== id);
  saveBrowsingHistory(updated);
  return updated;
}

export function clearAllBrowsingHistory(): void {
  saveBrowsingHistory([]);
}

// --- RECENT SITES ---
export function getRecentSites(): RecentSite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENTS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  saveRecentSites(POPULAR_SITES);
  return POPULAR_SITES;
}

export function saveRecentSites(sites: RecentSite[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(sites));
  } catch {
    // fallback
  }
}

export function updateRecentSiteVisit(domain: string, url: string): void {
  const sites = getRecentSites();
  const index = sites.findIndex((s) => s.domain.toLowerCase() === domain.toLowerCase());
  if (index >= 0) {
    sites[index].visitCount += 1;
    sites[index].lastVisited = Date.now();
  } else {
    sites.push({
      id: `recent-${Date.now()}`,
      name: domain.split('.')[0].toUpperCase(),
      domain,
      url,
      iconName: 'globe',
      color: '#8b5cf6',
      category: 'Web',
      visitCount: 1,
      lastVisited: Date.now(),
    });
  }
  sites.sort((a, b) => b.lastVisited - a.lastVisited);
  saveRecentSites(sites.slice(0, 12));
}

export function clearRecentSites(): void {
  saveRecentSites([]);
}

// --- CACHE & DATA CLEANUP ---
export function getCacheUsageBytes(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CACHE_USAGE);
    if (raw) return parseInt(raw, 10);
  } catch {
    // fallback
  }
  return 46.8 * 1024 * 1024;
}

export function incrementSimulatedCache(bytes: number): void {
  const current = getCacheUsageBytes();
  try {
    localStorage.setItem(STORAGE_KEY_CACHE_USAGE, (current + bytes).toString());
  } catch {
    // fallback
  }
}

export function clearBrowserCache(): void {
  try {
    localStorage.setItem(STORAGE_KEY_CACHE_USAGE, '0');
  } catch {
    // fallback
  }
}

export function clearAllBrowsingData(): {
  historyCleared: boolean;
  cacheCleared: boolean;
  recentsCleared: boolean;
  cookiesCleared: boolean;
} {
  clearAllBrowsingHistory();
  clearBrowserCache();
  clearRecentSites();
  clearTrackingTelemetry();
  return {
    historyCleared: true,
    cacheCleared: true,
    recentsCleared: true,
    cookiesCleared: true,
  };
}
