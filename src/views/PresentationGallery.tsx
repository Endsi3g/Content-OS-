import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MonitorPlay, LockKey, DownloadSimple, UserCircle, PlayCircle, ShareNetwork, Gear
} from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { ScrollReveal } from '../components/ScrollReveal';

export function PresentationGallery() {
  const { assets } = useAppStore();
  const [isClientView, setIsClientView] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  
  const [presentation, setPresentation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/presentations/default')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.presentation) {
          setPresentation(d.presentation);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const updateSetting = async (field: string, value: boolean) => {
    if (!presentation) return;
    setPresentation({ ...presentation, [field]: value });
    try {
      await fetch(`/api/presentations/${presentation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-[var(--text-main)]">Loading presentation...</div>;
  if (!presentation) return <div className="flex items-center justify-center h-full text-[var(--text-main)]">No presentation data available.</div>;

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg)] text-[var(--text-main)] overflow-y-auto">
      {/* Admin Toggle Banner */}
      {!isClientView && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-800/30 p-2 flex items-center justify-center gap-4 text-sm font-medium relative z-50 shrink-0">
          <span className="text-blue-600 dark:text-blue-400">You are in editor mode.</span>
          <button 
            onClick={() => setIsClientView(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded transition-colors text-white text-xs shadow-sm"
          >
            Preview Client View
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="px-3 py-1 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--hover-bg)] rounded transition-colors text-[var(--text-main)] text-xs flex items-center gap-1 shadow-sm"
            >
              <Gear size={14} /> Presentation Settings
            </button>
            {isSettingsOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--surface)] border border-[var(--border)] p-4 rounded-xl shadow-lg z-50">
                <h4 className="text-sm font-semibold mb-3 border-b border-[var(--border)] pb-2 text-[var(--text-main)]">Settings</h4>
                <div className="space-y-4 text-[var(--text-main)]">
                  <label className="flex items-center justify-between text-xs cursor-pointer">
                    <span>Password Required</span>
                    <input type="checkbox" checked={presentation.passwordEnabled} onChange={e => updateSetting('passwordEnabled', e.target.checked)} className="form-checkbox text-blue-600 rounded bg-[var(--hover-bg)] border-[var(--border)]" />
                  </label>
                  <label className="flex items-center justify-between text-xs cursor-pointer">
                    <span>Allow Downloads</span>
                    <input type="checkbox" checked={presentation.downloadsEnabled} onChange={e => updateSetting('downloadsEnabled', e.target.checked)} className="form-checkbox text-blue-600 rounded bg-[var(--hover-bg)] border-[var(--border)]" />
                  </label>
                  <div>
                    <span className="text-xs font-semibold block mb-1 text-[var(--text-muted)] mt-1">Share Link</span>
                    <div className="flex bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1.5 text-xs shadow-inner">
                      <input type="text" readOnly value={`https://content-os.app/s/${presentation.id.slice(0, 8)}`} className="bg-transparent outline-none flex-1 w-full text-[var(--text-main)]" />
                      <button className="text-blue-600 dark:text-blue-400 font-bold hover:text-blue-500">Copy</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isClientView && (
        <div className="fixed top-4 right-4 z-[110]">
          <button 
            onClick={() => setIsClientView(false)}
            className="px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--hover-bg)] rounded-full transition-colors text-[var(--text-main)] text-xs font-medium shadow-md flex items-center gap-2"
          >
            Exit Client Preview
          </button>
        </div>
      )}

      <ScrollReveal className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 pt-12 md:pt-16">
        {/* Branding & Header */}
        <div className="text-center pb-12 mb-12 border-b border-[var(--border)] border-dashed">
          <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <span className="text-3xl font-bold font-serif text-white">C</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--text-main)]">{presentation.title}</h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            {presentation.description}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-[var(--text-muted)] font-medium">
            {presentation.passwordEnabled && <span className="flex items-center gap-2"><LockKey size={18} weight="duotone" /> Private Link</span>}
            {presentation.downloadsEnabled && <span className="flex items-center gap-2"><DownloadSimple size={18} weight="duotone" /> Downloads Enabled</span>}
            <span className="flex items-center gap-2"><UserCircle size={18} weight="duotone" /> Shared by Content Team</span>
          </div>
        </div>

        {/* Video Grid */}
        <div className="pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {presentation.videos.map((vid: any, idx: number) => (
              <motion.div 
                key={vid.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer flex flex-col"
              >
                <div 
                  className="relative aspect-video rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] isolate cursor-pointer"
                  onClick={() => setActiveVideo(vid.id)}
                >
                  {activeVideo === vid.id ? (
                    <video 
                      src={vid.url || "https://storage.googleapis.com/muxdemofiles/mux.mp4"} 
                      controls 
                      autoPlay 
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <>
                      <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-10">
                        <PlayCircle size={64} className="text-white shadow-2xl drop-shadow-2xl" weight="fill" />
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white rounded text-xs font-mono font-medium backdrop-blur z-20 shadow-sm border border-white/10">
                        {vid.duration}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-start justify-between px-1">
                  <div>
                    <h3 className="font-semibold text-lg text-[var(--text-main)] group-hover:text-blue-600 transition-colors">{vid.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Recently Added</p>
                  </div>
                  {presentation.downloadsEnabled && (
                    <a 
                      href={vid.url || "https://storage.googleapis.com/muxdemofiles/mux.mp4"} 
                      download 
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <DownloadSimple size={20} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
