# Grabu — Ad-Free Material You Video Downloader & Privacy In-App Browser

Grabu is a minimalist, privacy-first Android-style media downloader and in-app browser inspired by VidMate and Brave Browser. Built with modern Material Design 3 (Material You) principles, it pairs a full-featured in-app web browser with automatic real-time media sniffing, one-click high-definition downloads (up to 4K & MP3), a zero-data-collection privacy architecture, and robust browser history, cache, and cookie cleanup controls.

## User Review & Critical Decisions

> [!IMPORTANT]
> The app is officially named **Grabu** and incorporates the confirmed specifications:

- **Brand Name**: **Grabu** — punchy, memorable, and utilitarian.
- **Enhanced In-App Browser & Real-Time Media Sniffer**:
  - Full address bar navigation with auto-complete, back/forward/refresh, bookmark quick-dials, and direct URL entry.
  - Automatic stream detection engine: whenever a page loads or plays media, Grabu instantly extracts the video title, video ID, thumbnail, resolution list (4K, 1080p, 720p), and file sizes.
- **One-Click In-Browser Download Bar**:
  - A contextual floating overlay appears immediately on the browsing screen showing detected media info (Title, ID, Resolution, Size) with an instant "One-Click Download" button for the best quality, alongside a format expander for audio (MP3) or alternate resolutions.
- **Zero Data Collection & Absolute Privacy Guarantee**:
  - The app operates 100% locally. Zero telemetry, zero analytics, and zero external tracking.
  - Even if the user logs into services (such as Google or social platforms), credentials and browsing cookies remain sandboxed strictly on the device with zero outbound telemetry.
- **Comprehensive History, Cache & Data Cleanup**:
  - Dedicated History & Cache Manager inside Settings: view recent site visits, search browsing history, and perform one-tap or granular cleanup (Clear History, Clear Web Cache, Clear Stored Cookies/Sessions, Clear Download Temp Files).
  - Incognito / Private Browsing mode toggle that prevents history and search queries from being recorded at all.

---

## 1. Overview & Core Concept

### What It Does
Grabu functions as a dual-engine media hub: a shielded, ad-free mobile browser with built-in stream analysis, and a high-speed download manager. When navigating supported platforms (YouTube, TikTok, Instagram, Twitter/X, Reddit, Vimeo, Facebook, Dailymotion, or general web pages), the app automatically detects video/audio tags and streaming manifests, displaying a prominent one-click download bar with exact resolution, size, and title.

### Target Audience & Persona
Users who want a fast, ad-free Android browsing and media download experience with strict privacy protections, effortless cache/history management, and instant downloads without leaving the web page.

### Key Value
- **Zero Data Collection**: No remote analytics, no tracking pixels, no user profiling.
- **Instant Media Sniffing**: Automatically identifies media title, ID, resolutions, and byte sizes directly from the active webpage.
- **One-Click Downloads**: Download the highest-quality stream with a single tap from the bottom of the browsing interface.
- **Clean Privacy Controls**: Clear history, recent site visits, and cache with one touch from Settings.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **In-App Browsing & Automatic Media Sniffing**:
   - User launches Grabu and sees the browser home screen featuring quick-dial tiles for popular video platforms and a Material 3 omnibox search/address bar.
   - User navigates to any site or searches for video content.
   - While browsing, the Brave-style shield suppresses intrusive popups, banners, and video prerolls.
   - As video/audio plays or loads, the bottom media detection pill slides up with a tactile spring animation, displaying:
     - Video thumbnail and title
     - Video ID (e.g., `dQw4w9WgXcQ` or platform post ID)
     - Optimal resolution (e.g., `1080p FHD · 84 MB` or `4K UHD · 240 MB`)
     - Glowing "One-Click Download" button.

2. **One-Click Download vs. Format Drawer**:
   - Tapping "One-Click Download" immediately starts downloading the optimal format and displays a subtle toast confirming background queuing.
   - Tapping the "Formats" expander opens the Material Design 3 Bottom Sheet, allowing selection among 4K, 1440p, 1080p, 720p, 480p MP4 or 320kbps/128kbps MP3 audio extractions.

3. **History & Cache Cleanup in Settings**:
   - User taps the "Settings / Shield" tab.
   - Top section displays "Recent Site Visits" horizontal carousel for rapid re-navigation.
   - Privacy Cleanup section shows live storage consumption (Browsing History entries, Browser Cache in MB, Stored Cookies/Sessions).
   - "Clear All Browsing Data" button with confirmation sheet, plus individual one-tap trash actions for:
     - Clear Browsing History
     - Clear Browser Cache & Blobs
     - Clear Saved Site Sessions
     - "Incognito Mode" toggle (session history is discarded immediately on tab close).

4. **Download Manager & Media Vault**:
   - Active downloads show live multi-segment progress, download speed (MB/s), and pause/resume buttons.
   - Completed files appear in the Library with in-app playback and "Save to Android Storage" export.

### Visual Identity & Theme

- **Design Philosophy**: Android Material Design 3 (Material You) with dynamic color tokens, smooth fluid transitions via Motion, and ergonomic 48px touch targets.
- **Color System**:
  - *Light Mode*: Dynamic Material You tonal lavender/violet (`#6750a4`), warm neutral container surfaces (`#f7f2fa`, `#ece6f0`), dark charcoal text (`#1d1b20`), Brave Shield coral accent (`#fe5f55`).
  - *Dark Mode*: Deep pitch AMOLED background (`#141218`), surface containers (`#211f26`, `#2b2930`), pastel purple active elements (`#d0bcff`), Brave flame shield (`#ff8577`).
- **Typography**:
  - Plus Jakarta Sans for crisp headers, titles, and body prose.
  - Space Mono with `tabular-nums` for download speed meters, bitrates, and file size counters.

---

## 3. Key Product Decisions & Trade-Offs

- **Client-Side Isolated Browser & Stream Interceptor**:
  - *Chosen Approach*: Real-time stream detection engine with sandboxed iframe preview, synthetic media stream sniffer, and instant metadata analyzer.
  - *Why*: Allows true one-click media detection across all major video platforms without breaking CORS or requiring invasive server-side user surveillance.
- **Zero-Telemetry Local Storage Architecture**:
  - *Chosen Approach*: All history, cookies, cached thumbnails, and preferences reside solely in client-side IndexedDB and localStorage.
  - *Why*: Guarantees that neither Google accounts nor browsing activity can be logged or exfiltrated, meeting the user's strict zero-data collection requirement.
- **Granular Privacy Cleanup System**:
  - *Chosen Approach*: Multi-tier cleanup allowing selective or total purging of history, cache blobs, recent site visit shortcuts, and session cookies.
  - *Why*: Matches modern mobile browser privacy suites (Brave, Firefox Focus) with transparency and peace of mind.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────┐
│                       Grabu App                        │
│     (Android Shell Frame / Standalone PWA Container)   │
├────────────────────────────────────────────────────────┤
│ Top App Bar: Address/Search Bar · Shield · Incognito   │
├────────────────────────────────────────────────────────┤
│                   Active Viewport View                 │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │             In-App Browser Engine                │  │
│  │ • Omnibox navigation & bookmarks                 │  │
│  │ • Ad & tracker suppression filter                │  │
│  │ • Real-time video/audio stream sniffer           │  │
│  │                                                  │  │
│  │ ┌──────────────────────────────────────────────┐ │  │
│  │ │ Floating Media Sniffer Bar                   │ │  │
│  │ │ [Thumb] "Video Title" (ID: #10842) · 1080p   │ │  │
│  │ │ [One-Click Download]  [All Formats ▼]        │ │  │
│  │ └──────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────────────────────┐   ┌─────────────────────────┐  │
│  │  Fast URL Paste    │   │  Download Manager       │  │
│  │  Direct link paste │   │  Active / Completed     │  │
│  └────────────────────┘   └─────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │             Settings & Privacy Center            │  │
│  │ • Recent Site Visits                             │  │
│  │ • History Viewer & Search                        │  │
│  │ • One-Tap Clear Cache, History, Cookies          │  │
│  │ • Zero-Telemetry Privacy Shield Status           │  │
│  └──────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────┤
│ Material 3 Bottom Sheet (Format & Resolution Picker)   │
│ • 4K (2160p), 1440p, 1080p, 720p, 480p, MP3 Audio      │
├────────────────────────────────────────────────────────┤
│ Fixed Material You Bottom Navigation Bar               │
│ [Browser]      [Fast Paste]      [Downloads] [Settings]│
└────────────────────────────────────────────────────────┘
```

### Data Entities & State Model

```typescript
interface BrowsingHistoryItem {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  visitedAt: number;
  visitCount: number;
}

interface DetectedMedia {
  id: string;
  videoId: string;
  url: string;
  title: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'reddit' | 'vimeo' | 'facebook' | 'web';
  thumbnailUrl: string;
  durationSeconds: number;
  bestResolution: '4K 2160p' | 'Full HD 1080p' | 'HD 720p';
  bestSizeBytes: number;
  formats: MediaFormat[];
}

interface PrivacySettings {
  incognitoMode: boolean;
  blockAds: boolean;
  blockTrackers: boolean;
  clearHistoryOnExit: boolean;
  clearCacheOnExit: boolean;
}
```

### Interactive State Transitions

1. **Browser Navigation**: Entering a URL or tapping a preset platform navigates the in-app browser; if not in Incognito Mode, records a visit to local history and increments recent site counts.
2. **Media Sniffing**: The stream sniffer analyzes current web media, extracting title, video ID, resolutions, and sizes, immediately sliding up the one-click download bar.
3. **One-Click Download**: Single tap initiates background download of best format, notifying user with a progress toast.
4. **History & Cache Purge**: User triggers one-tap or granular cleanup in Settings, which wipes history, purges cached blobs, and resets site session storage instantly.
