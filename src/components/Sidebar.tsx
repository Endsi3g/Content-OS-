import { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuPage, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuPageTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel } from './ui/material-ui-dropdown-menu';
import { SquaresFour, Browser, Tray, Database, Kanban, CheckSquareOffset, ChartLineUp, Fire, BookOpen, Gear, Moon, Sun, CaretLeft, CaretRight, Users, FileText, ClockCounterClockwise, TerminalWindow, User, CircleHalfTilt, FilmStrip, CloudArrowUp, MonitorPlay } from '@phosphor-icons/react';
import { t } from '../i18n';
import { OnboardingTooltip } from './OnboardingTooltip';
import { Onboarding } from './Onboarding';
import { useRole } from '../hooks/useRole';
import { Role } from '../types';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentView, setCurrentView, theme, setTheme, language, customRoles, hasCompletedOnboarding } = useAppStore();
  const rawRole = useRole();
  const currentRole = customRoles.find(r => r.id === rawRole) || customRoles.find(r => r.id === 'viewer');

  const navGroups = [
    {
      label: null,
      items: [
        { id: 'overview', icon: <SquaresFour size={18} />, label: t('nav.overview', language) },
        { id: 'inbox', icon: <Tray size={18} />, label: t('nav.inbox', language) },
      ]
    },
    {
      label: 'Content',
      items: [
        { id: 'c2c', icon: <CloudArrowUp size={18} />, label: 'Camera to Cloud' },
        { id: 'database', icon: <Database size={18} />, label: t('nav.database', language) },
        { id: 'workflow', icon: <Kanban size={18} />, label: t('nav.workflow', language) },
        { id: 'review', icon: <CheckSquareOffset size={18} />, label: t('nav.review', language) },
        { id: 'editor', icon: <FilmStrip size={18} />, label: 'Editor' },
        { id: 'presentation', icon: <MonitorPlay size={18} />, label: 'Presentations' },
        { id: 'scripts', icon: <FileText size={18} />, label: 'Scripts' },
      ]
    },
    {
      label: 'Tools',
      items: [
        { id: 'analytics', icon: <ChartLineUp size={18} />, label: 'Analytics' },
        { id: 'aiCoach', icon: <Fire size={18} />, label: t('nav.aiCoach', language) },
        { id: 'knowledge', icon: <BookOpen size={18} />, label: t('nav.knowledge', language) },
      ]
    },
    {
      label: 'System',
      items: [
        { id: 'team', icon: <Users size={18} />, label: 'Team' },
        { id: 'boardControl', icon: <TerminalWindow size={18} />, label: 'Board Control' },
      ]
    }
  ];

  return (
    <motion.aside
      className="h-screen bg-[var(--surface)] flex shrink-0 relative border-r border-[var(--border)] z-[200]"
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-5 -right-3.5 z-[210] p-1 flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm transition-transform hover:scale-110"
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        {isCollapsed ? <CaretRight size={14} weight="bold" /> : <CaretLeft size={14} weight="bold" />}
      </button>

      <div className="flex flex-col w-full h-full overflow-hidden">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center sm:justify-start px-4 shrink-0 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--text-main)] rounded flex items-center justify-center shrink-0">
              <span className="text-[var(--bg)] font-bold font-serif">C</span>
            </div>
            {!isCollapsed && <span className="font-serif font-medium text-lg tracking-tight text-[var(--text-main)] whitespace-nowrap">Content OS</span>}
          </div>
        </div>
        {/* Onboarding — inside sidebar */}
        {!hasCompletedOnboarding && !isCollapsed && <Onboarding />}

        {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-5">
        {navGroups.map((group, groupIdx) => {
          const visibleItems = currentRole ? group.items.filter(item => currentRole.allowedViews.includes(item.id)) : group.items;
          if (visibleItems.length === 0) return null;
          
          return (
            <div key={groupIdx} className="flex flex-col gap-1">
              {!isCollapsed && group.label && (
                <div className="px-3 mb-1 text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                  {group.label}
                </div>
              )}
              {visibleItems.map(item => {
                const button = (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as any)}
                    className={`w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${
                      currentView === item.id
                        ? 'bg-[var(--hover-bg)] text-[var(--text-main)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)]'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="shrink-0">{item.icon}</div>
                    {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </button>
                );

                const roleTooltips: Record<string, Record<string, any>> = {
                  admin: {
                    overview: { id: 'nav-overview-admin', title: 'Admin Overview', content: 'Monitor all projects, team KPIs, and overall health.', delay: 500 },
                    team: { id: 'nav-team-admin', title: 'Team Management', content: 'Manage users, assign custom roles, and configure access.', delay: 1500 },
                    c2c: { id: 'nav-c2c-admin', title: 'Camera to Cloud', content: 'Link your cinema cameras directly to Content OS for live proxy uploads.', delay: 2500 },
                    workflow: { id: 'nav-workflow-admin', title: 'Master Workflow', content: 'Move assets through the pipeline and ensure fast delivery.', delay: 3500 }
                  },
                  editor: {
                    inbox: { id: 'nav-inbox-editor', title: 'Video Inbox', content: 'Upload your raw footage or C2C proxies here, then assign campaigns.', delay: 500 },
                    editor: { id: 'nav-editor-editor', title: 'Editor Workspace', content: 'Frame-accurate review and collaboration directly on the timeline.', delay: 1500 },
                    scripts: { id: 'nav-scripts-editor', title: 'Live Scripts', content: 'Write and edit scripts collaboratively in real-time with the team.', delay: 2500 },
                    presentation: { id: 'nav-pres-editor', title: 'Presentation Gallery', content: 'Share beautiful galleries of approved deliverables with clients.', delay: 3500 },
                  },
                  viewer: {
                    overview: { id: 'nav-overview-viewer', title: 'Welcome to Content OS!', content: 'Check the overall status of your campaigns here.', delay: 500 },
                    review: { id: 'nav-review-viewer', title: 'Clip Review', content: 'Watch and approve/reject clips generated for you.', delay: 1500 },
                    presentation: { id: 'nav-pres-viewer', title: 'Final Deliverables', content: 'Download your finalized assets from beautiful galleries.', delay: 2500 },
                    knowledge: { id: 'nav-know-viewer', title: 'Onboarding & knowledge', content: 'Start by reading the Onboarding Guide to learn everything.', delay: 3500 },
                  }
                };

                const tooltipConfig = roleTooltips[rawRole]?.[item.id];

                if (tooltipConfig && !isCollapsed) {
                  return (
                    <OnboardingTooltip
                      key={item.id}
                      id={tooltipConfig.id}
                      title={tooltipConfig.title}
                      content={tooltipConfig.content}
                      position="right"
                      delay={tooltipConfig.delay}
                    >
                      {button}
                    </OnboardingTooltip>
                  );
                }

                return button;
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[var(--border)] flex flex-col gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)]`}>
            <div className="shrink-0"><User size={18} /></div>
            {!isCollapsed && <span className="whitespace-nowrap flex-1 text-left">Account</span>}
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="min-w-[16rem] w-auto mb-2" side="right" align="end">
            <DropdownMenuPage id="main">
               <DropdownMenuLabel>Account</DropdownMenuLabel>
               
               <DropdownMenuItem onClick={() => setCurrentView('profile')}>
                 <User size={16} className="text-muted-foreground mr-2" />
                 <span>My Profile</span>
               </DropdownMenuItem>
               
               <DropdownMenuPageTrigger targetId="theme">
                 {theme === 'light' ? <Sun size={16} className="text-muted-foreground mr-2" /> : (theme === 'dark' ? <Moon size={16} className="text-muted-foreground mr-2" /> : <CircleHalfTilt size={16} className="text-muted-foreground mr-2" />)}
                 <span>Theme Preferences</span>
               </DropdownMenuPageTrigger>
               
               <DropdownMenuSeparator />
               
               <DropdownMenuItem onClick={() => setCurrentView('landing')}>
                 <Browser size={16} className="text-muted-foreground mr-2" />
                 <span>Landing Page</span>
               </DropdownMenuItem>

               <DropdownMenuItem onClick={() => setCurrentView('changelog')}>
                 <ClockCounterClockwise size={16} className="text-muted-foreground mr-2" />
                 <span>Changelog</span>
               </DropdownMenuItem>
               
            </DropdownMenuPage>
            
            <DropdownMenuPage id="theme">
               <DropdownMenuLabel>Theme Mode</DropdownMenuLabel>
               <DropdownMenuRadioGroup value={theme} onValueChange={(val) => setTheme(val as any)}>
                  <DropdownMenuRadioItem value="light">
                    <Sun size={16} className="text-muted-foreground mr-2" /> Light Mode
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <Moon size={16} className="text-muted-foreground mr-2" /> Dark Mode
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="bw">
                    <CircleHalfTilt size={16} className="text-muted-foreground mr-2" /> Minimal B&W
                  </DropdownMenuRadioItem>
               </DropdownMenuRadioGroup>
            </DropdownMenuPage>
          </DropdownMenuContent>
        </DropdownMenu>

        <button 
          onClick={() => window.open('https://github.com/Endsi3g/Content-OS-/releases/latest', '_blank')}
          className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)]`}
          title={isCollapsed ? 'Download Desktop' : undefined}
        >
          <div className="shrink-0"><MonitorPlay size={18} /></div>
          {!isCollapsed && <span className="whitespace-nowrap text-blue-400">Download Desktop</span>}
        </button>

        <button 
          onClick={() => setCurrentView('settings')}
          className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${
            currentView === 'settings'
              ? 'bg-[var(--hover-bg)] text-[var(--text-main)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)]'
          }`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <div className="shrink-0"><Gear size={18} /></div>
          {!isCollapsed && <span className="whitespace-nowrap">Settings</span>}
        </button>
      </div>
      </div>
    </motion.aside>
  );
}
