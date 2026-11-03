import { ShieldStats } from '../types';

const INITIAL_SHIELD_STATS: ShieldStats = {
  adsBlocked: 142,
  trackersBlocked: 89,
  dataSavedBytes: 38.4 * 1024 * 1024, // 38.4 MB
  timeSavedSeconds: 14.8,
};

const STORAGE_KEY_SHIELD = 'grabu_shield_stats_v1';

export function getStoredShieldStats(): ShieldStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHIELD);
    if (raw) return JSON.parse(raw);
  } catch {
    // Return default
  }
  return INITIAL_SHIELD_STATS;
}

export function saveShieldStats(stats: ShieldStats): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHIELD, JSON.stringify(stats));
  } catch {
    // Ignore storage issues
  }
}

export function registerShieldInterception(adCount: number = 2, trackerCount: number = 3): ShieldStats {
  const current = getStoredShieldStats();
  const addedBytes = (adCount * 280 + trackerCount * 90) * 1024; // Average weight
  const addedTime = (adCount * 0.4 + trackerCount * 0.2);

  const updated: ShieldStats = {
    adsBlocked: current.adsBlocked + adCount,
    trackersBlocked: current.trackersBlocked + trackerCount,
    dataSavedBytes: current.dataSavedBytes + addedBytes,
    timeSavedSeconds: parseFloat((current.timeSavedSeconds + addedTime).toFixed(1)),
  };

  saveShieldStats(updated);
  return updated;
}

export function resetShieldStats(): ShieldStats {
  const reset: ShieldStats = {
    adsBlocked: 0,
    trackersBlocked: 0,
    dataSavedBytes: 0,
    timeSavedSeconds: 0,
  };
  saveShieldStats(reset);
  return reset;
}
