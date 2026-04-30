import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCircle } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useAppStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspacePresence } from './WorkspacePresence';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  linkView?: string;
  linkId?: string;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { setCurrentView } = useAppStore();
  const { provider } = useWorkspacePresence();
  const ref = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount and when provider pushes updates
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch { /* silent fail */ }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Listen for Hocuspocus awareness-based notification pushes
  useEffect(() => {
    if (!provider) return;
    const handleUpdate = () => {
      // Re-fetch when awareness changes — lightweight check
      fetchNotifications();
    };
    provider.on('awarenessUpdate', handleUpdate);
    return () => { provider.off('awarenessUpdate', handleUpdate); };
  }, [provider]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markRead = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
    } catch { /* silent */ }
  };

  const handleClick = (n: Notification) => {
    if (n.linkView) {
      setCurrentView(n.linkView as any);
    }
    markRead(n.id);
    setOpen(false);
  };

  const unread = notifications.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
        title="Notifications"
      >
        <Bell size={20} weight={unread > 0 ? 'fill' : 'regular'} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50"
          >
            <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  <CheckCircle size={14} /> Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--text-muted)]">
                All caught up! 🎉
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className="w-full text-left p-3 hover:bg-[var(--hover)] transition-colors"
                  >
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{n.body}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
