import { motion } from 'motion/react';
import { 
  ChartBar, 
  VideoCamera, 
  Scissors, 
  CheckCircle, 
  Clock, 
  WarningCircle,
  TrendUp,
  CaretRight
} from '@phosphor-icons/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../store';
import { Badge } from '../components/Badge';
import { t } from '../i18n';
import { ScrollReveal } from '../components/ScrollReveal';
import { OnboardingTooltip } from '../components/OnboardingTooltip';
import { EditorDashboard } from './EditorDashboard';
import { useRole } from '../hooks/useRole';

export function Overview() {
  const { assets, clips, language, setCurrentView } = useAppStore();
  const role = useRole();

  if (role === 'editor') {
    return <EditorDashboard />;
  }

  // Calculate metrics
  const totalAssets = assets.length;
  const inboxAssets = assets.filter(a => a.status === 'inbox').length;
  const processingAssets = assets.filter(a => a.status === 'processing').length;
  const reviewAssets = assets.filter(a => a.status === 'review').length;
  
  const totalClips = clips.length;
  const pendingClips = clips.filter(c => c.status === 'pending').length;
  const approvedClips = clips.filter(c => c.status === 'approved').length;

  const recentAssets = [...assets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  const statCards = [
    {
      title: t('overview.totalAssets', language),
      value: totalAssets,
      icon: <VideoCamera size={24} weight="duotone" className="text-blue-500" />,
      trend: '+12% this week',
      trendUp: true
    },
    {
      title: t('overview.pendingClips', language),
      value: pendingClips,
      icon: <Scissors size={24} weight="duotone" className="text-orange-500" />,
      trend: t('overview.needsReview', language),
      trendUp: false
    },
    {
      title: t('overview.inProcessing', language),
      value: processingAssets,
      icon: <Clock size={24} weight="duotone" className="text-purple-500" />,
      trend: t('overview.aiWorking', language),
      trendUp: true
    },
    {
      title: t('overview.approvedClips', language),
      value: approvedClips,
      icon: <CheckCircle size={24} weight="duotone" className="text-green-500" />,
      trend: '+24% this month',
      trendUp: true
    }
  ];

  const mockChartData = [
    { name: 'Mon', views: 4000, clips: 24 },
    { name: 'Tue', views: 3000, clips: 13 },
    { name: 'Wed', views: 2000, clips: 38 },
    { name: 'Thu', views: 2780, clips: 39 },
    { name: 'Fri', views: 1890, clips: 48 },
    { name: 'Sat', views: 2390, clips: 38 },
    { name: 'Sun', views: 3490, clips: 43 },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-12">
      <ScrollReveal delay={0}>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] mb-1">{t('overview.title', language)}</h1>
          <p className="text-sm text-[var(--text-muted)]">{t('overview.description', language)}</p>
        </div>
      </ScrollReveal>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <ScrollReveal key={stat.title} delay={index * 0.1}>
            {index === 0 ? (
              <OnboardingTooltip
                id="overview-kpi"
                title="Your Dashboard Metrics"
                content="These cards give you a quick summary of your content pipeline, including pending reviews and total assets."
                position="bottom"
                delay={1500}
              >
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-full w-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      {stat.icon}
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-green-600' : 'text-orange-600'}`}>
                      {stat.trendUp ? <TrendUp size={14} /> : <WarningCircle size={14} />}
                      {stat.trend}
                    </span>
                  </div>
                  <h3 className="text-3xl font-semibold text-[var(--text-main)] mb-1">{stat.value}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{stat.title}</p>
                </div>
              </OnboardingTooltip>
            ) : (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {stat.icon}
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-green-600' : 'text-orange-600'}`}>
                    {stat.trendUp ? <TrendUp size={14} /> : <WarningCircle size={14} />}
                    {stat.trend}
                  </span>
                </div>
                <h3 className="text-3xl font-semibold text-[var(--text-main)] mb-1">{stat.value}</h3>
                <p className="text-sm text-[var(--text-muted)]">{stat.title}</p>
              </div>
            )}
          </ScrollReveal>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pipeline Status / Performance Chart */}
        <ScrollReveal delay={0.4} className="lg:col-span-2">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-full min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Performance Overview</h2>
              <button 
                onClick={() => setCurrentView('database')}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                {t('overview.viewDatabase', language)}
              </button>
            </div>
            
            <div className="flex-1 w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={mockChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClips" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#8C877D" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8C877D" fontSize={12} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D8" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
                  />
                  <Area type="monotone" dataKey="views" stroke="#8884d8" fillOpacity={1} fill="url(#colorViews)" />
                  <Area type="monotone" dataKey="clips" stroke="#82ca9d" fillOpacity={1} fill="url(#colorClips)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>

        {/* Recent Activity */}
        <ScrollReveal delay={0.5}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-main)]">{t('overview.recentAssets', language)}</h2>
            </div>
            
            <div className="space-y-4">
              {recentAssets.map(asset => (
                <div key={asset.id} className="flex items-start gap-3 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                    <img src={asset.thumbnailUrl || `https://picsum.photos/seed/${asset.id}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-main)] truncate">{asset.title}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{asset.client}</p>
                  </div>
                  <div>
                    <Badge status={asset.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
