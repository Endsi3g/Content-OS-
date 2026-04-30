/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ReactNode, useEffect, useRef } from 'react';
import { Database, Tray, Kanban, CheckSquareOffset, BookOpen, Gear, SquaresFour, Fire, CaretLeft, CaretRight, List as ListIcon, X, MagnifyingGlass, Moon, Sun, Users, ChartLineUp } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { AppProvider, useAppStore } from './store';
import { Overview } from './views/Overview';
import { ContentDatabase } from './views/ContentDatabase';
import { VideoInbox } from './views/VideoInbox';
import { Workflow } from './views/Workflow';
import { ClipReview } from './views/ClipReview';
import { EditorWorkspace } from './views/EditorWorkspace';
import { CameraToCloud } from './views/CameraToCloud';
import { PresentationGallery } from './views/PresentationGallery';
import { Knowledge } from './views/Knowledge';
import { Settings } from './views/Settings';
import { AICoach } from './views/AICoach';
import { TeamView } from './views/TeamView';
import { MetricoolAnalytics } from './views/MetricoolAnalytics';
import { Scripts } from './views/Scripts';
import { Changelog } from './views/Changelog';
import { BoardControl } from './views/BoardControl';
import { LandingPage } from './views/LandingPage';
import { Profile as ProfileView } from './views/Profile';
import { Onboarding } from './components/Onboarding';
import { ProfileMenu } from './components/ProfileMenu';
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { ActionSearchBar } from './components/ui/action-search-bar';
import { WorkspacePresence, OnlineAvatars } from './components/WorkspacePresence';
import { NotificationBell } from './components/NotificationBell';
import { useAuth } from './contexts/AuthContext';
import { t } from './i18n';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import { Toaster } from 'sonner';

function AuthenticatedApp() {
  const { theme, hasCompletedOnboarding, currentView, setIsAddModalOpen, setCurrentView } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'bw');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'bw') {
      document.documentElement.classList.add('bw');
    }
  }, [theme]);

  useKeyboardShortcuts(setCurrentView, () => setIsAddModalOpen(true));

  if (currentView === 'landing') {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LandingPage />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text-main)] overflow-hidden font-sans">
      <Toaster position="top-right" richColors />
      {!hasCompletedOnboarding && <Onboarding />}
      
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between px-6 shrink-0 z-50">
          <div className="flex-1 flex items-center">
            <WorkspaceSwitcher />
          </div>
          <div className="flex-1 flex justify-center min-w-[300px]">
             <ActionSearchBar />
          </div>
          <div className="flex-1 flex justify-end items-center gap-1">
            <OnlineAvatars />
            <NotificationBell />
            <ProfileMenu />
          </div>
        </header>

        <main 
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col"
        >
          <div className="max-w-7xl mx-auto p-4 md:p-8 w-full flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col"
            >
              {currentView === 'overview' && <Overview />}
              {currentView === 'database' && <ContentDatabase />}
              {currentView === 'inbox' && <VideoInbox />}
              {currentView === 'workflow' && <Workflow />}
              {currentView === 'review' && <ClipReview />}
              {currentView === 'editor' && <EditorWorkspace />}
              {currentView === 'c2c' && <CameraToCloud />}
              {currentView === 'presentation' && <PresentationGallery />}
              {currentView === 'knowledge' && <Knowledge />}
              {currentView === 'settings' && <Settings />}
              {currentView === 'aiCoach' && <AICoach />}
              {currentView === 'team' && <TeamView />}
              {currentView === 'analytics' && <MetricoolAnalytics />}
              {currentView === 'scripts' && <Scripts />}
              {currentView === 'changelog' && <Changelog />}
              {currentView === 'boardControl' && <BoardControl />}
              {currentView === 'profile' && <ProfileView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      </div>
    </div>
  );
}

import { InviteFlow } from './views/InviteFlow';

function AppContent() {
  const { user, loading } = useAuth();
  const state = useAppStore();
  const [showLogin, setShowLogin] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const isElectron = window.navigator.userAgent.includes('Electron');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      setInviteToken(token);
    }
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text-muted)]">Loading...</div>;

  if (!user) {
    if (showLogin || inviteToken || isElectron) {
      return (
        <div className="relative min-h-[100dvh]">
          {!isElectron && (
            <button 
              onClick={() => {
                setShowLogin(false);
              }}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-full shadow-md hover:bg-white/20 transition-colors text-sm font-medium backdrop-blur-md"
            >
              <CaretLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <Login onBack={(section) => {
             if (isElectron) return;
             if (section) state.setActiveLandingSection(section);
             setShowLogin(false);
          }} />
        </div>
      );
    }
    return <LandingPage isPublic={true} onLoginClick={() => setShowLogin(true)} />;
  }

  if (inviteToken) {
    return <InviteFlow token={inviteToken} onComplete={() => setInviteToken(null)} />;
  }

  return (
    <WorkspacePresence>
      <AuthenticatedApp />
    </WorkspacePresence>
  );
}


export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

function NavItem({ icon, label, isActive, onClick, collapsed }: { icon: ReactNode; label: string; isActive: boolean; onClick: () => void; collapsed?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive 
          ? 'bg-gray-100 text-[var(--text-main)]' 
          : 'text-[var(--text-muted)] hover:bg-gray-50 hover:text-[var(--text-main)]'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <div className="shrink-0">{icon}</div>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
