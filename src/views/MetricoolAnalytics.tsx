import { useEffect, useState } from 'react';
import { fetchMetricoolAnalytics } from '../services/metricoolService';
import { ChartLineUp, CircleNotch as Spinner, Users, TrendUp, CursorClick, ArrowUpRight, Sparkle } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  x: '#000000',
  linkedin: '#0A66C2',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] p-3 shadow-md rounded-md">
        <p className="font-semibold text-sm text-[var(--text-main)] mb-2 capitalize">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-xs mb-1">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[var(--text-muted)]">{entry.name}:</span>
            <span className="font-medium text-[var(--text-main)]">
              {entry.name === 'Engagement' ? `${entry.value}%` : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const MetricoolAnalytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetricoolAnalytics().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const chartData = Object.entries(data)
    .filter(([platform, metrics]: [string, any]) => platform !== 'website' && metrics.followers !== undefined)
    .map(([platform, metrics]: [string, any]) => ({
      name: platform,
      followers: metrics.followers || 0,
      engagement: metrics.engagement || 0,
    }));

  const totalFollowers = chartData.reduce((acc, curr) => acc + curr.followers, 0);
  const avgEngagement = (chartData.reduce((acc, curr) => acc + curr.engagement, 0) / chartData.length).toFixed(1);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto w-full pb-12"
    >
      <div className="mb-8 border-b border-[var(--border)] pb-6">
        <h1 className="text-3xl font-bold text-[var(--text-main)] flex items-center gap-3 tracking-tight">
          <ChartLineUp size={28} className="text-[var(--text-main)]" />
          Analytics
        </h1>
        <p className="text-[var(--text-muted)] mt-2">Track your audience growth and engagement across connected platforms.</p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 border-b border-[var(--border)] pb-8">
        {[
          { label: 'Total Followers', value: totalFollowers.toLocaleString() },
          { label: 'Avg Engagement', value: `${avgEngagement}%` }
        ].map((kpi, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-[var(--text-muted)] text-sm mb-1">{kpi.label}</span>
            <span className="text-4xl font-semibold text-[var(--text-main)] tracking-tight">{kpi.value}</span>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-[var(--text-main)] mb-6 tracking-tight">Followers vs Engagement</h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                   <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#c4b5fd" stopOpacity={0.1}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border)' }} 
                  tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  dy={10}
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}%`}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover-bg)' }} />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} iconType="circle" />
                <Bar yAxisId="left" dataKey="followers" name="Followers" fill="#555" radius={[2, 2, 0, 0]} maxBarSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={'#d1d5db'} />
                  ))}
                </Bar>
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="engagement" 
                  name="Engagement" 
                  stroke="#111" 
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 1, fill: 'var(--bg)' }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#111' }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown List */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-main)] mb-6 tracking-tight">Platform Breakdown</h3>
          <div className="space-y-6">
            {Object.entries(data)
              .filter(([platform]) => platform !== 'website')
              .map(([platform, metrics]: [string, any]) => {
              return (
                <div key={platform} className="border-b border-[var(--border)] pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm capitalize text-[var(--text-main)]">{platform}</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(metrics).map(([key, value]: [string, any]) => (
                      <div key={key} className="min-w-[45%]">
                        <p className="text-xs text-[var(--text-muted)] mb-1 capitalize leading-none">{key === 'bounceRate' ? 'Bounce' : key}</p>
                        <p className="text-sm font-medium text-[var(--text-main)] leading-none">
                          {key === 'engagement' || key === 'bounceRate' ? `${value}%` : value.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* AI Coach Review Section */}
      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[var(--hover-bg)] rounded-md border border-[var(--border)] text-[var(--text-main)]">
            <Sparkle size={20} weight="fill" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">AI Coach Review</h3>
        </div>
        
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
          <div className="space-y-4">
            <p className="text-[var(--text-main)]">
              Based on the Metricool data, here is my analysis of your recent performance:
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="mt-1 min-w-3 max-w-3 min-h-3 max-h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                <p className="text-sm text-[var(--text-muted)]">
                  <strong className="text-[var(--text-main)] font-semibold">Instagram is thriving.</strong> Your engagement rate is exceptional. Double down on Reels utilizing the hooks from your top performing scripts.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 min-w-3 max-w-3 min-h-3 max-h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <p className="text-sm text-[var(--text-muted)]">
                  <strong className="text-[var(--text-main)] font-semibold">Untapped potential on YouTube.</strong> While followers are lower, your watch time indicates high intent. Start repurposing successful short-form content into longer deep-dives.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 min-w-3 max-w-3 min-h-3 max-h-3 rounded-full bg-blue-500/20 border border-blue-500/50" />
                <p className="text-sm text-[var(--text-muted)]">
                  <strong className="text-[var(--text-main)] font-semibold">LinkedIn consistency check.</strong> You've had great spikes, but frequency is inconsistent. Let's build a workflow to cross-post key insights from your videos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
