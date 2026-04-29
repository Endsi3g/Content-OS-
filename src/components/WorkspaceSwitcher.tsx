import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaretUpDown, Check, Plus, Code, YoutubeLogo, SuitcaseSimple, Desktop } from '@phosphor-icons/react';
import { useAppStore } from '../store';

const IconMap: Record<string, React.ReactNode> = {
  Code: <Code size={16} />,
  YoutubeLogo: <YoutubeLogo size={16} />,
  SuitcaseSimple: <SuitcaseSimple size={16} />,
  Desktop: <Desktop size={16} />,
};

export function WorkspaceSwitcher() {
  const { workspaces, addWorkspace, activeWorkspaceId, setActiveWorkspaceId } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateWorkspace = async () => {
    try {
      const redirectUri = `${window.location.origin}/api/auth/youtube/callback`;
      const response = await fetch(`/api/auth/youtube/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your YouTube account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        const youTubeWorkspace = {
          id: `ws-yt-${Date.now()}`,
          name: `Olivier Grenon's YouTube Channel`,
          icon: 'YoutubeLogo'
        };
        addWorkspace(youTubeWorkspace);
        setActiveWorkspaceId(youTubeWorkspace.id);
        setIsOpen(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addWorkspace, setActiveWorkspaceId]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-[var(--hover-bg)] px-3 py-1.5 rounded-lg transition-colors border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-main)]">
          {IconMap[currentWorkspace?.icon] || <Code size={16} />}
          {currentWorkspace?.name}
        </div>
        <CaretUpDown size={14} className="text-[var(--text-muted)]" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50 text-left"
          >
            <div className="p-1 px-3 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">
              Switch Workspace
            </div>
            
            <div className="p-1 max-h-60 overflow-y-auto">
              {workspaces.map((ws) => (
                <button 
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspaceId(ws.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--hover-bg)] rounded-md transition-colors text-left"
                >
                  <div className="flex items-center gap-2 text-[var(--text-main)]">
                    {IconMap[ws.icon] || <Code size={16} />}
                    {ws.name}
                  </div>
                  {currentWorkspace?.id === ws.id && (
                    <Check size={16} className="text-blue-500" weight="bold" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="p-1 border-t border-[var(--border)]">
              <button 
                onClick={handleCreateWorkspace}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-main)] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-md transition-colors text-left"
              >
                <YoutubeLogo size={16} />
                Connect YouTube Channel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
