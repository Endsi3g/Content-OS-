import { motion } from 'motion/react';
import { 
  Scissors, 
  CheckCircle, 
  Clock, 
  WarningCircle,
  VideoCamera,
  Kanban,
  Coffee
} from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { Badge } from '../components/Badge';
import { t } from '../i18n';
import { ScrollReveal } from '../components/ScrollReveal';

export function EditorDashboard() {
  const { assets, clips, tasks, language, setCurrentView } = useAppStore();

  // Metrics for editor
  const readyToClip = assets.filter(a => a.status === 'ready_clipping');
  // For tasks, we don't have assignee login matching mock exactly, but we can just show 'todo' and 'in-progress'
  const myTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in-progress');
  const rejectedClips = clips.filter(c => c.status === 'rejected');
  const pendingClips = clips.filter(c => c.status === 'pending');

  const statCards = [
    {
      title: 'Ready for Clipping',
      value: readyToClip.length,
      icon: <VideoCamera size={24} weight="duotone" className="text-blue-500" />,
      color: 'bg-blue-50 text-blue-600',
      description: 'Raw assets waiting for you',
      action: () => setCurrentView('database')
    },
    {
      title: 'Active Tasks',
      value: myTasks.length,
      icon: <Kanban size={24} weight="duotone" className="text-purple-500" />,
      color: 'bg-purple-50 text-purple-600',
      description: 'Tasks in your queue',
      action: () => setCurrentView('team')
    },
    {
      title: 'Pending Review',
      value: pendingClips.length,
      icon: <Clock size={24} weight="duotone" className="text-orange-500" />,
      color: 'bg-orange-50 text-orange-600',
      description: 'Awaiting admin approval',
      action: () => setCurrentView('review')
    },
    {
      title: 'Needs Revision',
      value: rejectedClips.length,
      icon: <WarningCircle size={24} weight="duotone" className="text-red-500" />,
      color: 'bg-red-50 text-red-600',
      description: 'Clips that need fixes',
      action: () => setCurrentView('review')
    }
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-12">
      <ScrollReveal delay={0}>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] mb-1">Editor Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Your creative workspace. Here's what needs your attention today.</p>
        </div>
      </ScrollReveal>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <ScrollReveal key={stat.title} delay={index * 0.1}>
            <div 
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-full cursor-pointer hover:border-blue-300 transition-colors"
              onClick={stat.action}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-3xl font-semibold text-[var(--text-main)] mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-[var(--text-main)]">{stat.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{stat.description}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Needs Revision / Feedback */}
        <ScrollReveal delay={0.4}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2">
                <WarningCircle className="text-red-500" size={20} weight="duotone" />
                Needs Revision
              </h2>
            </div>
            
            <div className="space-y-4">
              {rejectedClips.length > 0 ? (
                rejectedClips.map(clip => (
                  <div key={clip.id} className="flex flex-col gap-2 p-4 rounded-lg bg-[var(--hover-bg)] border border-[var(--border)]">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-[var(--text-main)]">{clip.title}</p>
                      <Badge status={clip.status} />
                    </div>
                    {clip.comments && (
                      <p className="text-sm text-[var(--text-muted)] bg-red-500/10 p-2 rounded text-red-600 border border-red-500/20">
                        {clip.comments}
                      </p>
                    )}
                    <button 
                      onClick={() => setCurrentView('review')}
                      className="mt-2 self-start text-xs font-semibold px-3 py-1.5 bg-[var(--text-main)] text-[var(--bg)] rounded-md hover:opacity-90 transition-opacity"
                    >
                      Update Clip
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[var(--text-muted)] flex flex-col items-center">
                  <CheckCircle size={32} weight="duotone" className="text-green-500 mb-2" />
                  <p className="text-sm font-medium">All clear!</p>
                  <p className="text-xs">No clips currently need your revision.</p>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Ready for Clipping */}
        <ScrollReveal delay={0.5}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2">
                <Scissors className="text-blue-500" size={20} weight="duotone" />
                Ready to Edit
              </h2>
            </div>
            
            <div className="space-y-4">
              {readyToClip.length > 0 ? (
                readyToClip.map(asset => (
                  <div key={asset.id} className="flex items-start gap-4 p-4 border border-[var(--border)] rounded-lg hover:border-blue-300 transition-colors">
                    <div className="w-16 h-16 rounded bg-gray-100 flex-shrink-0 overflow-hidden relative group">
                      <img src={asset.thumbnailUrl || `https://picsum.photos/seed/${asset.id}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <VideoCamera className="text-white" size={20} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-main)] truncate">{asset.title}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate my-1">
                        <span className="font-medium mr-2">{asset.campaign}</span> • {asset.client}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                        {asset.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[var(--text-muted)] flex flex-col items-center">
                  <Coffee size={32} weight="duotone" className="mb-2 text-[var(--text-muted)]" />
                  <p className="text-sm font-medium">Looking good</p>
                  <p className="text-xs">No raw footage waiting to be clipped right now.</p>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

      </div>
    </div>
  );
}
