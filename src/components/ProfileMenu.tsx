import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Gear, SignOut, Users } from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { language, setCurrentView } = useAppStore();
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--hover-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-purple-500 shrink-0 border border-[var(--border)] shadow-sm flex items-center justify-center text-white font-bold text-sm">
          {user?.displayName ? user.displayName.charAt(0) : user?.email?.charAt(0) || 'U'}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="p-3 border-b border-[var(--border)]">
              <p className="text-sm font-medium text-[var(--text-main)]">{user?.displayName || 'User'}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
            </div>
            
            <div className="p-1">
              <button 
                onClick={() => {
                  setCurrentView('team');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--hover-bg)] rounded-md transition-colors text-left"
              >
                <Users size={16} className="text-[var(--text-muted)]" />
                Team Workspace
              </button>
              <button 
                onClick={() => {
                  setCurrentView('settings');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--hover-bg)] rounded-md transition-colors text-left"
              >
                <Gear size={16} className="text-[var(--text-muted)]" />
                {t('nav.settings', language)}
              </button>
            </div>
            
            <div className="p-1 border-t border-[var(--border)]">
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors text-left"
              >
                <SignOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
