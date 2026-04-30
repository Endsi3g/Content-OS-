/**
 * useElectron.ts
 * 
 * A React hook that provides safe, typed access to Electron native APIs.
 * Returns null for all APIs when running in the browser (non-Electron context).
 * 
 * Usage:
 *   const { openFolder, sendNotification, setAutoLaunch } = useElectron();
 *   if (openFolder) {
 *     const path = await openFolder();
 *   }
 */

const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
const api = isElectron ? (window as any).electronAPI : null;

export function useElectron() {
  return {
    isElectron,

    /** Open a native folder picker dialog. Returns selected path or null. */
    openFolder: api
      ? (): Promise<string | null> => api.openFolder()
      : null,

    /** Open a native file picker for video files. Returns array of paths. */
    openVideoFiles: api
      ? (filters?: { name: string; extensions: string[] }[]): Promise<string[]> =>
          api.openVideoFiles(filters)
      : null,

    /** Send a native Windows toast notification. */
    sendNotification: api
      ? (title: string, body: string): Promise<void> =>
          api.sendNotification(title, body)
      : null,

    /** Check if the app starts with Windows. */
    getAutoLaunch: api
      ? (): Promise<boolean> => api.getAutoLaunch()
      : null,

    /** Enable or disable auto-start with Windows. */
    setAutoLaunch: api
      ? (enabled: boolean): Promise<boolean> => api.setAutoLaunch(enabled)
      : null,

    /** Open a URL in the default system browser. */
    openExternal: api
      ? (url: string): void => api.openExternal(url)
      : null,

    /** Get app version from package.json. */
    getVersion: api
      ? (): Promise<string> => api.getVersion()
      : null,

    /**
     * Subscribe to deep-link navigation events (tray menu / global shortcuts).
     * Callback receives a route string like '/scripts?action=new'.
     */
    onNavigate: api
      ? (callback: (route: string) => void): void =>
          api.onNavigate(callback)
      : null,
  };
}
