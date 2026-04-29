import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { Asset, Clip, AssetStatus, ClipStatus, KnowledgeDoc, Task, TeamMember, Role, ChatSession, ChatMessage, Script, ChangelogEntry, CustomRole, Workspace } from './types';
import { mockAssets, mockClips, mockDocs, mockTeamMembers } from './data';
import { Language } from './i18n';
import { api } from './lib/api';

export type AppView = 'overview' | 'landing' | 'inbox' | 'database' | 'workflow' | 'review' | 'editor' | 'c2c' | 'presentation' | 'knowledge' | 'settings' | 'aiCoach' | 'team' | 'analytics' | 'scripts' | 'changelog' | 'boardControl' | 'profile';
export type Theme = 'light' | 'dark' | 'bw';

interface AppContextType {
  workspaces: Workspace[];
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  assets: Asset[];
  clips: Clip[];
  docs: KnowledgeDoc[];
  tasks: Task[];
  teamMembers: TeamMember[];
  setTeamMembers: (members: TeamMember[]) => void;
  customRoles: CustomRole[];
  addCustomRole: (role: Omit<CustomRole, 'id'>) => void;
  updateCustomRole: (id: string, updates: Partial<CustomRole>) => void;
  removeCustomRole: (id: string) => void;
  chatSessions: ChatSession[];
  scripts: Script[];
  changelogEntries: ChangelogEntry[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  addChatSession: (session: ChatSession) => void;
  updateChatSession: (id: string, updates: Partial<ChatSession>) => void;
  removeChatSession: (id: string) => void;
  addChatMessage: (sessionId: string, message: ChatMessage) => void;
  addScript: (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateScript: (id: string, updates: Partial<Script>) => void;
  removeScript: (id: string) => void;
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  removeTeamMember: (id: string) => void;
  updateTeamMemberRole: (id: string, role: Role) => void;
  addDoc: (doc: Omit<KnowledgeDoc, 'id' | 'lastUpdated'>) => void;
  updateDoc: (id: string, updates: Partial<KnowledgeDoc>) => void;
  removeDoc: (id: string) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  language: Language;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  activeLandingSection: string;
  setActiveLandingSection: (section: string) => void;
  isAddModalOpen: boolean;
  isMetricoolConnected: boolean;
  setIsMetricoolConnected: (isConnected: boolean) => void;
  setIsAddModalOpen: (isOpen: boolean) => void;
  setLanguage: (lang: Language) => void;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => void;
  removeAsset: (id: string) => void;
  updateAssetStatus: (id: string, status: AssetStatus) => void;
  updateAsset: (id: string, data: Partial<Asset>) => void;
  updateAssetOrder: (assetIds: string[]) => void;
  updateAssetsStatus: (ids: string[], status: AssetStatus) => void;
  updateAssets: (ids: string[], data: Partial<Asset>) => void;
  removeAssets: (ids: string[]) => void;
  updateClipStatus: (id: string, status: ClipStatus) => void;
  updateClip: (id: string, data: Partial<Clip>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  dismissedTooltips: string[];
  dismissTooltip: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: 'ws1', name: 'Personal Project', icon: 'Code' },
    { id: 'ws2', name: 'YouTube Channel', icon: 'YoutubeLogo' },
    { id: 'ws3', name: 'Agency Videos', icon: 'SuitcaseSimple' },
    { id: 'ws4', name: 'App Development', icon: 'Desktop' },
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>('ws1');
  const [assetsState, setAssetsState] = useState({
    past: [] as Asset[][],
    present: mockAssets,
    future: [] as Asset[][]
  });
  
  const assets = assetsState.present;

  const setAssets = (updater: (prev: Asset[]) => Asset[]) => {
    setAssetsState(state => {
      const newPresent = updater(state.present);
      if (newPresent === state.present) return state;
      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: []
      };
    });
  };

  const undo = () => {
    setAssetsState(state => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      
      // We can't easily use the language state here without moving it up, 
      // but we can just use a simple icon or english text for the toast.
      toast.success('Action undone', { duration: 2000 });
      
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future]
      };
    });
  };

  const redo = () => {
    setAssetsState(state => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      
      toast.success('Action redone', { duration: 2000 });
      
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture
      };
    });
  };

  const canUndo = assetsState.past.length > 0;
  const canRedo = assetsState.future.length > 0;

  const [clips, setClips] = useState<Clip[]>(mockClips);
  const [docs, setDocs] = useState<KnowledgeDoc[]>(mockDocs);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Edit Podcast Episode 42', assignee: 'tm-002', status: 'in-progress', dueDate: '2026-04-05' },
    { id: '2', title: 'Create 3 Shorts from Webinar', assignee: 'tm-003', status: 'todo', dueDate: '2026-04-03' },
    { id: '3', title: 'Review final cut for YouTube', assignee: 'tm-001', status: 'review' },
  ]);

  const [scripts, setScripts] = useState<Script[]>([
    {
      id: 'sc-1',
      title: 'YouTube Hook for App Launch',
      content: 'Here are 3 hooks for the new launch:\n\n1. Do you know why 90% of apps fail? It is not what you think.\n2. I spent 3 weeks building this feature. Look at the result.\n3. The one tool you need for 2026.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([
    {
      id: 'cl-7',
      title: 'v1.7.0 - Viewer Workspace & UI Revamp',
      description: 'Introduced the Viewer workspace (Overview, Review, Presentations, Knowledge, Changelog). Revamped Camera to Cloud and Editor Workspace UI. Added desktop app download links to the footer.',
      category: 'feature',
      date: new Date().toISOString(),
    },
    {
      id: 'cl-6',
      title: 'v1.6.0 - Auth Sync & App Navigation Overhaul',
      description: 'Prepared backend authentication sync to assign users to workspaces upon login. Redesigned the landing page navigation bar to match UI requirements perfectly.',
      category: 'feature',
      date: new Date().toISOString(),
    },
    {
      id: 'cl-0',
      title: 'v1.5.0 - Prisma Backend Integration & Cinematic Landing Page',
      description: 'Fully integrated a Hono-powered backend with Prisma & PostgreSQL persistence for scripts, timelines, notes, and AI interactions. Overhauled the public Landing Page to be fully cinematic fullscreen without borders featuring an animated WordsPullUp Hero section.',
      category: 'feature',
      date: '2026-04-27T16:20:00Z',
      author: 'Admin'
    },
    {
      id: 'cl-1',
      title: 'v1.4.0 - Video Preview, E2E Board Control & Enhanced AI Coach',
      description: 'Major infrastructure update. Improved the global UX, added video preview capabilities via a native VideoPlayer component, and significantly upgraded the UI layout to be more responsive on Content Database. Also introduced a secure Board Control interface for remote Playwright execution, and added a visual reflection system to AI chats.',
      category: 'feature',
      date: '2026-04-27T14:00:00Z',
      author: 'System'
    },
    {
      id: 'cl-2',
      title: 'v1.3.1 - Bug fixes & Clip Review Overhaul',
      description: 'Resolved the state desynchronization bug in the Clip Review tab which prevented "Save Comments" from persisting correctly. Also migrated modals to use scoped absolute positioning so they no longer bleed over the application sidebar Navigation layout.',
      category: 'bugfix',
      date: '2026-04-26T16:45:00Z',
      author: 'Admin'
    },
    {
      id: 'cl-3',
      title: 'v1.3.0 - AI Coach Prompts & Scripting Modules',
      description: 'Integrated robust advanced text editing features via TipTap. Enhanced the knowledge base capabilities and enabled interactive scripting. Upgraded the underlying LLM system context to include metrics context dynamically, allowing the AI Coach to read the actual engagement rates and provide actionable feedback.',
      category: 'feature',
      date: '2026-04-26T10:00:00Z',
      author: 'AI Agent'
    },
    {
      id: 'cl-4',
      title: 'v1.2.0 - Metricool Analytics Integration',
      description: 'Added Metricool mock APIs to retrieve audience demographics, views, retention curve drops, and conversion events. The dashboard now shows real trends.',
      category: 'feature',
      date: '2026-04-25T10:00:00Z',
      author: 'Admin'
    }
  ]);

  const [customRoles, setCustomRoles] = useState<CustomRole[]>([
    { id: 'admin', name: 'admin', allowedViews: ['overview', 'landing', 'inbox', 'database', 'workflow', 'review', 'editor', 'c2c', 'presentation', 'aiCoach', 'knowledge', 'scripts', 'team', 'analytics', 'changelog', 'settings', 'boardControl', 'profile'] },
    { id: 'editor', name: 'editor', allowedViews: ['overview', 'inbox', 'database', 'workflow', 'review', 'editor', 'c2c', 'presentation', 'aiCoach', 'knowledge', 'scripts', 'team', 'analytics', 'changelog', 'settings', 'profile'] },
    { id: 'viewer', name: 'viewer', allowedViews: ['overview', 'review', 'presentation', 'knowledge', 'changelog', 'settings', 'profile'] }
  ]);

  const addCustomRole = (role: Omit<CustomRole, 'id'>) => {
    setCustomRoles(prev => [...prev, { ...role, id: role.name.toLowerCase().replace(/\s+/g, '-') }]);
  };

  const updateCustomRole = (id: string, updates: Partial<CustomRole>) => {
    setCustomRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeCustomRole = (id: string) => {
    setCustomRoles(prev => prev.filter(r => r.id !== id));
  };

  const addScript = (scriptData: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newScript: Script = {
      ...scriptData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setScripts(prev => [newScript, ...prev]);
  };

  const updateScript = (id: string, updates: Partial<Script>) => {
    setScripts(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s));
  };

  const removeScript = (id: string) => {
    setScripts(prev => prev.filter(s => s.id !== id));
  };

  const updateTeamMemberRole = async (id: string, role: string) => {
    try {
      await api.patch(`/api/users/${id}/role`, { role });
      setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, role: role as any } : m));
      toast.success('Role updated successfully');
    } catch (e) {
      console.error("Failed to update role:", e);
    }
  };

  const addTeamMember = (member: Omit<TeamMember, 'id'>) => {
    setTeamMembers(prev => [...prev, { ...member, id: crypto.randomUUID() }]);
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const addTask = (task: Omit<Task, 'id'>) => setTasks(prev => [...prev, { ...task, id: Math.random().toString(36).substr(2, 9) }]);
  const updateTask = (id: string, updates: Partial<Task>) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const removeTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'bw';
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('onboardingCompleted') === 'true';
  });

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSetHasCompletedOnboarding = (completed: boolean) => {
    setHasCompletedOnboarding(completed);
    localStorage.setItem('onboardingCompleted', String(completed));
  };
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeLandingSection, setActiveLandingSection] = useState<string>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMetricoolConnected, setIsMetricoolConnected] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('chatSessions');
    return saved ? JSON.parse(saved) : [{ id: '1', title: 'New Chat', messages: [], updatedAt: new Date().toISOString() }];
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(chatSessions[0]?.id || null);

  const addChatSession = (session: ChatSession) => {
    setChatSessions(prev => {
      const next = [session, ...prev];
      localStorage.setItem('chatSessions', JSON.stringify(next));
      return next;
    });
  };

  const updateChatSession = (id: string, updates: Partial<ChatSession>) => {
    setChatSessions(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      localStorage.setItem('chatSessions', JSON.stringify(next));
      return next;
    });
  };

  const removeChatSession = (id: string) => {
    setChatSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      localStorage.setItem('chatSessions', JSON.stringify(next));
      // If the currently active chat is removed, switch to the first available or clear it
      if (activeChatId === id) {
        setActiveChatId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  const addChatMessage = (sessionId: string, message: ChatMessage) => {
    setChatSessions(prev => {
      const next = prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, message], updatedAt: new Date().toISOString() } : s);
      localStorage.setItem('chatSessions', JSON.stringify(next));
      return next;
    });
  };

  const addAsset = (assetData: Omit<Asset, 'id' | 'createdAt'>) => {
    const newAsset: Asset = {
      ...assetData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      order: 0,
    };
    setAssets(prev => [newAsset, ...prev]);
  };

  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setClips(prev => prev.filter(c => c.assetId !== id));
  };

  const removeAssets = (ids: string[]) => {
    setAssets(prev => prev.filter(a => !ids.includes(a.id)));
    setClips(prev => prev.filter(c => !ids.includes(c.assetId)));
  };

  const updateAssetStatus = (id: string, status: AssetStatus) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const updateAssetsStatus = (ids: string[], status: AssetStatus) => {
    setAssets(prev => prev.map(a => ids.includes(a.id) ? { ...a, status } : a));
  };

  const updateAssets = (ids: string[], data: Partial<Asset>) => {
    setAssets(prev => prev.map(a => ids.includes(a.id) ? { ...a, ...data } : a));
  };

  const updateAsset = (id: string, data: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const updateAssetOrder = (assetIds: string[]) => {
    setAssets(prev => {
      const newAssets = [...prev];
      assetIds.forEach((id, index) => {
        const assetIndex = newAssets.findIndex(a => a.id === id);
        if (assetIndex !== -1) {
          newAssets[assetIndex] = { ...newAssets[assetIndex], order: index };
        }
      });
      return newAssets;
    });
  };

  const [dismissedTooltips, setDismissedTooltips] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissedTooltips');
    return saved ? JSON.parse(saved) : [];
  });

  const dismissTooltip = (id: string) => {
    setDismissedTooltips(prev => {
      const next = [...prev, id];
      localStorage.setItem('dismissedTooltips', JSON.stringify(next));
      return next;
    });
  };

  const updateClipStatus = (id: string, status: ClipStatus) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const updateClip = (id: string, data: Partial<Clip>) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const addWorkspace = (workspace: Workspace) => {
    setWorkspaces(prev => [...prev, workspace]);
  };

  const addDoc = (doc: Omit<KnowledgeDoc, 'id' | 'lastUpdated'>) => {
    const newDoc: KnowledgeDoc = {
      ...doc,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString(),
    };
    setDocs(prev => [newDoc, ...prev]);
  };

  const updateDoc = (id: string, updates: Partial<KnowledgeDoc>) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ...updates, lastUpdated: new Date().toISOString() } : d));
  };

  const removeDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <AppContext.Provider value={{ 
      workspaces,
      setWorkspaces,
      addWorkspace,
      activeWorkspaceId,
      setActiveWorkspaceId,
      assets, 
      clips, 
      docs, 
      tasks,
      teamMembers,
      setTeamMembers,
      customRoles,
      addCustomRole,
      updateCustomRole,
      removeCustomRole,
      chatSessions,
      scripts,
      changelogEntries,
      activeChatId,
      setActiveChatId,
      addChatSession,
      updateChatSession,
      removeChatSession,
      addChatMessage,
      addScript,
      updateScript,
      removeScript,
      addTeamMember,
      removeTeamMember,
      updateTeamMemberRole,
      addDoc,
      updateDoc,
      removeDoc,
      addTask,
      updateTask,
      removeTask,
      language,
      theme,
      setTheme: handleSetTheme,
      hasCompletedOnboarding,
      setHasCompletedOnboarding: handleSetHasCompletedOnboarding,
      currentView,
      setCurrentView,
      activeLandingSection,
      setActiveLandingSection,
      isMetricoolConnected,
      setIsMetricoolConnected,
      isAddModalOpen,
      setIsAddModalOpen,
      setLanguage,
      addAsset, 
      removeAsset,
      removeAssets,
      updateAssetStatus, 
      updateAssetsStatus,
      updateAsset, 
      updateAssets,
      updateAssetOrder,
      updateClipStatus,
      updateClip,
      undo,
      redo,
      canUndo,
      canRedo,
      dismissedTooltips,
      dismissTooltip
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
}
