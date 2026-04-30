/**
 * useElectron.ts
 *
 * A React hook that provides safe, typed access to Electron native APIs.
 * Returns null for all APIs when running in the browser (non-Electron context).
 *
 * Usage:
 *   const { openFolder, sendNotification, getCaptureSources } = useElectron();
 *   if (openFolder) {
 *     const path = await openFolder();
 *   }
 */

interface FileInfo {
  path: string;
  name: string;
  ext: string;
  size: number;
  isDirectory: boolean;
}

interface FileBase64 {
  data: string;
  mime: string;
  name: string;
}

interface CaptureSource {
  id: string;
  name: string;
  thumbnail: string; // data URL
}

const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
const api = isElectron ? (window as any).electronAPI : null;

export function useElectron() {
  return {
    isElectron,

    // ─── File System ──────────────────────────────────────────────────────
    /** Open a native folder picker dialog. Returns selected path or null. */
    openFolder: api
      ? (): Promise<string | null> => api.openFolder()
      : null,

    /** Open a native file picker for video files. Returns array of paths. */
    openVideoFiles: api
      ? (filters?: { name: string; extensions: string[] }[]): Promise<string[]> =>
          api.openVideoFiles(filters)
      : null,

    // ─── Notifications ────────────────────────────────────────────────────
    /** Send a native Windows toast notification. */
    sendNotification: api
      ? (title: string, body: string): Promise<void> =>
          api.sendNotification(title, body)
      : null,

    // ─── Auto-Launch ──────────────────────────────────────────────────────
    /** Check if the app starts with Windows. */
    getAutoLaunch: api
      ? (): Promise<boolean> => api.getAutoLaunch()
      : null,

    /** Enable or disable auto-start with Windows. */
    setAutoLaunch: api
      ? (enabled: boolean): Promise<boolean> => api.setAutoLaunch(enabled)
      : null,

    // ─── Shell ────────────────────────────────────────────────────────────
    /** Open a URL in the default system browser. */
    openExternal: api
      ? (url: string): void => api.openExternal(url)
      : null,

    // ─── App Info ─────────────────────────────────────────────────────────
    /** Get app version from package.json. */
    getVersion: api
      ? (): Promise<string> => api.getVersion()
      : null,

    // ─── Navigation ───────────────────────────────────────────────────────
    /**
     * Subscribe to deep-link navigation events (tray menu / global shortcuts / deep links).
     * Callback receives a route string like '/scripts?action=new'.
     */
    onNavigate: api
      ? (callback: (route: string) => void): void =>
          api.onNavigate(callback)
      : null,

    // ─── Phase 2: Drag & Drop ─────────────────────────────────────────────
    /** Get metadata for files dropped from Windows Explorer. */
    getFileInfo: api
      ? (filePaths: string[]): Promise<FileInfo[]> =>
          api.getFileInfo(filePaths)
      : null,

    /** Read a file from disk as base64 (thumbnails, previews). */
    readFileBase64: api
      ? (filePath: string): Promise<FileBase64 | null> =>
          api.readFileBase64(filePath)
      : null,

    // ─── Phase 2: Screen Capture ──────────────────────────────────────────
    /** Get available screen and window capture sources with thumbnails. */
    getCaptureSources: api
      ? (): Promise<CaptureSource[]> => api.getCaptureSources()
      : null,

    // ─── FFmpeg Local Video Editing ───────────────────────────────────────
    ffmpeg: api ? api.ffmpeg : null,

    // ─── Offline Storage & Sync ───────────────────────────────────────────
    offline: api ? api.offline : null,
  };
}
