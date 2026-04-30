import { useEffect, useState, useRef, createContext, useContext } from 'react';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { useAppStore } from '../store';
import { useAuth } from '../contexts/AuthContext';

export interface AwarenessUser {
  uid: string;
  name: string;
  avatar: string;
  currentView: string;
  color: string;
}

interface WorkspacePresenceContextType {
  onlineUsers: AwarenessUser[];
  provider: HocuspocusProvider | null;
}

const PresenceContext = createContext<WorkspacePresenceContextType>({
  onlineUsers: [],
  provider: null,
});

function generateUserColor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
}

function getPersistentColor(uid: string): string {
  const key = `user-color-${uid}`;
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const color = generateUserColor(uid);
  localStorage.setItem(key, color);
  return color;
}

export function WorkspacePresence({ children }: { children: React.ReactNode }) {
  const { activeWorkspaceId, currentView } = useAppStore();
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<AwarenessUser[]>([]);
  const providerRef = useRef<HocuspocusProvider | null>(null);

  useEffect(() => {
    if (!activeWorkspaceId || !user) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/collaboration`;

    const doc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: `workspace:${activeWorkspaceId}`,
      document: doc,
    });

    providerRef.current = provider;

    // Set our awareness info
    provider.setAwarenessField('user', {
      uid: user.uid,
      name: user.displayName || user.email || 'Anonymous',
      avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
      currentView,
      color: getPersistentColor(user.uid),
    } as AwarenessUser);

    // Listen for awareness changes
    const updateUsers = () => {
      const states = provider.awareness?.getStates();
      if (!states) return;
      const users: AwarenessUser[] = [];
      states.forEach((state: any) => {
        if (state.user && state.user.uid !== user.uid) {
          users.push(state.user);
        }
      });
      setOnlineUsers(users);
    };

    provider.on('awarenessUpdate', updateUsers);
    // Also sync on connect
    provider.on('connect', updateUsers);

    return () => {
      provider.destroy();
      providerRef.current = null;
    };
  }, [activeWorkspaceId, user?.uid]);

  // Update currentView in awareness when it changes
  useEffect(() => {
    if (providerRef.current && user) {
      providerRef.current.setAwarenessField('user', {
        uid: user.uid,
        name: user.displayName || user.email || 'Anonymous',
        avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
        currentView,
        color: getPersistentColor(user.uid),
      } as AwarenessUser);
    }
  }, [currentView]);

  return (
    <PresenceContext.Provider value={{ onlineUsers, provider: providerRef.current }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function useWorkspacePresence() {
  return useContext(PresenceContext);
}

/** Renders online user avatars for the header */
export function OnlineAvatars() {
  const { onlineUsers } = useWorkspacePresence();
  if (onlineUsers.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2 mr-3">
      {onlineUsers.slice(0, 5).map(u => (
        <div
          key={u.uid}
          title={`${u.name} — ${u.currentView}`}
          className="w-7 h-7 rounded-full border-2 border-[var(--surface)] overflow-hidden cursor-default hover:z-10 hover:scale-110 transition-transform"
          style={{ borderColor: u.color }}
        >
          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      ))}
      {onlineUsers.length > 5 && (
        <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-[var(--surface)] flex items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">
          +{onlineUsers.length - 5}
        </div>
      )}
    </div>
  );
}
