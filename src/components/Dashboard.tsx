import React, { useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Flame,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  format, 
  startOfDay, 
  subDays, 
  eachDayOfInterval, 
  isSameDay, 
  startOfWeek, 
  startOfMonth,
  endOfDay
} from 'date-fns';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { PomodoroSession } from '../types';

interface DashboardProps {
  sessions: PomodoroSession[];
  loading: boolean;
  targetSessions: number;
  setTargetSessions: (val: number) => void;
}

import { ProTips } from './ProTips';

export function Dashboard({ sessions, loading, targetSessions, setTargetSessions }: DashboardProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const sessionsToday = sessions.filter(s => {
      const d = new Date(s.completed_at || new Date());
      return d >= today && s.session_type === 'work';
    });

    const targetProgress = Math.min(1, sessionsToday.length / targetSessions);

    const sessionsThisWeek = sessions.filter(s => {
      const d = new Date(s.completed_at || new Date());
      return d >= weekStart && s.session_type === 'work';
    });

    const sessionsThisMonth = sessions.filter(s => {
      const d = new Date(s.completed_at || new Date());
      return d >= monthStart && s.session_type === 'work';
    });

    const totalMinutes = sessions
      .filter(s => s.session_type === 'work')
      .reduce((acc, s) => acc + s.duration_minutes, 0);

    const weekMinutes = sessionsThisWeek.reduce((acc, s) => acc + s.duration_minutes, 0);
    const monthMinutes = sessionsThisMonth.reduce((acc, s) => acc + s.duration_minutes, 0);

    // Calculate streak
    let streak = 0;
    const sessionDates = new Set(sessions.map(s => format(new Date(s.completed_at || new Date()), 'yyyy-MM-dd')));
    let checkDate = startOfDay(new Date());
    
    while (sessionDates.has(format(checkDate, 'yyyy-MM-dd'))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }

    // Chart Data (last 7 days)
    const chartData = eachDayOfInterval({
      start: subDays(now, 6),
      end: now
    }).map(date => {
      const daySessions = sessions.filter(s => isSameDay(new Date(s.completed_at || new Date()), date) && s.session_type === 'work');
      return {
        name: format(date, 'MMM dd'),
        count: daySessions.length,
        hours: Number((daySessions.reduce((acc, s) => acc + s.duration_minutes, 0) / 60).toFixed(1))
      };
    });

    return {
      sessionsToday: sessionsToday.length,
      todayMinutes: sessionsToday.reduce((acc, s) => acc + s.duration_minutes, 0),
      weekMinutes,
      monthMinutes,
      totalMinutes,
      streak,
      chartData,
      targetSessions,
      targetProgress
    };
  }, [sessions, targetSessions]);

  const calendarDays = useMemo(() => eachDayOfInterval({
    start: subDays(new Date(), 20),
    end: new Date(),
  }), []);

  const getIntensity = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const count = sessions.filter(s => {
      const d = new Date(s.completed_at || new Date());
      return d >= dayStart && d <= dayEnd && s.session_type === 'work';
    }).length;

    if (count === 0) return 'bg-surface';
    if (count <= 2) return 'bg-brand/20';
    if (count <= 4) return 'bg-brand/50';
    return 'bg-brand';
  };

  if (loading) return <div className="flex justify-center p-12 text-ink/20 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Loading focus data...</div>;

  return (
    <div className="space-y-12 w-full max-w-7xl mx-auto pb-20">
      {/* Quick Tips */}
      <ProTips />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-12 lg:col-span-6 liquid-glass p-10 flex flex-col justify-between group rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="ambient-glow w-64 h-64 bg-brand/5 -top-32 -left-32 animate-pulse-slow" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-brand" size={18} />
              <h3 className="text-ink/30 font-black uppercase tracking-[0.3em] text-[10px]">Daily Goal Progress</h3>
            </div>
            <span className="text-brand font-black font-mono text-xs">{stats.sessionsToday} / {stats.targetSessions} Sessions</span>
          </div>

          <div className="space-y-8 relative z-10">
            <div className="text-7xl font-black text-ink tracking-tighter uppercase font-display text-glow">
              {Math.round(stats.targetProgress * 100)}%
            </div>
            
            <div className="w-full h-1 bg-surface rounded-full relative overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.targetProgress * 100}%` }}
                className="absolute inset-y-0 left-0 bg-brand shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <span className="text-ink/10 text-[9px] font-bold uppercase tracking-[0.2em] font-mono">Status: In Progress</span>
              <button 
                onClick={() => {
                  const newTarget = prompt('Set Daily Goal (Sessions):', targetSessions.toString());
                  if (newTarget && !isNaN(parseInt(newTarget))) {
                    setTargetSessions(parseInt(newTarget));
                    localStorage.setItem('target_sessions', newTarget);
                  }
                }}
                className="text-[10px] font-bold text-brand hover:text-white transition-colors uppercase tracking-widest"
              >
                [Edit Goal]
              </button>
            </div>
          </div>
        </div>

        {[
          { label: 'Weekly Focus', value: `${Math.round(stats.weekMinutes / 60)}h`, icon: BarChart2 },
          { label: 'Monthly Focus', value: `${Math.round(stats.monthMinutes / 60)}h`, icon: Clock },
          { label: 'Current Streak', value: `${stats.streak} Days`, icon: Flame },
          { label: "Today's Time", value: `${Math.floor(stats.todayMinutes / 60)}h ${stats.todayMinutes % 60}m`, icon: Clock },
        ].map((stat, i) => (
          <div
            key={stat.label}
             className="md:col-span-4 lg:col-span-3 glass-card p-8 flex flex-col justify-between hover:bg-white/5 group border border-white/5 rounded-3xl"
          >
            <div className="flex items-start justify-between">
              <stat.icon className="text-ink/10 group-hover:text-brand transition-colors" size={20} />
              <span className="text-ink/20 text-[8px] font-bold uppercase tracking-[0.3em] text-right leading-relaxed">{stat.label}</span>
            </div>
            <div className="text-3xl font-black text-ink tracking-tighter mt-10 font-display">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-card p-10 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-12">
             <div>
                <h4 className="text-sm font-black text-ink uppercase tracking-[0.2em] font-display">Daily Activity</h4>
                <p className="text-[9px] text-ink/20 font-bold uppercase tracking-widest mt-1">Sessions completed over time</p>
              </div>
            <BarChart2 size={18} className="text-brand opacity-20" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border-subtle)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false} 
                  tick={{ fill: 'var(--color-ink)', opacity: 0.2, fontSize: 9, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderRadius: '12px', border: '1px solid var(--color-border-subtle)', fontSize: '10px', color: 'var(--tooltip-text)' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area 
                  type="stepAfter" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={0.1} 
                  fill="#3b82f6" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-10 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-12">
             <div>
                <h4 className="text-sm font-black text-ink uppercase tracking-[0.2em] font-display">Focus Time</h4>
                <p className="text-[9px] text-ink/20 font-bold uppercase tracking-widest mt-1">Hours studied daily</p>
              </div>
            <Clock size={18} className="text-brand opacity-20" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border-subtle)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false} 
                  tick={{ fill: 'var(--color-ink)', opacity: 0.2, fontSize: 9, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderRadius: '12px', border: '1px solid var(--color-border-subtle)', fontSize: '10px', color: 'var(--tooltip-text)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-bg-deep)', stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Activity Heatmap */}
        <div className="lg:col-span-7 glass-card p-10 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-ink/20 font-bold uppercase tracking-[0.4em] text-[8px]">Study History</h3>
            <div className="flex items-center gap-1.5">
              {[0.1, 0.3, 0.6, 1].map((op) => (
                <div key={op} className="w-2 h-2 bg-brand rounded-sm" style={{ opacity: op }} />
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-7 sm:grid-cols-10 lg:grid-cols-20 gap-2 border border-border-subtle bg-surface p-4 rounded-2xl">
            {calendarDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "aspect-square rounded-[2px] transition-all hover:scale-125 hover:z-10 cursor-crosshair",
                  getIntensity(day).replace('bg-white/5', 'bg-white/10')
                )}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-between text-[8px] font-bold text-ink/10 uppercase tracking-widest font-mono">
            <span>Minimum Focus</span>
            <span>Maximum Focus</span>
          </div>
        </div>

        {/* Recent Sessions List */}
        <div className="lg:col-span-5 glass-card p-10 flex flex-col rounded-3xl border border-white/5">
          <h3 className="text-ink/20 font-bold uppercase tracking-[0.4em] text-[8px] mb-10">Recent Sessions</h3>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-surface border border-border-subtle rounded-2xl hover:bg-brand/5 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-1 h-1 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]",
                    session.session_type === 'work' ? 'bg-brand' : 'bg-ink/10'
                  )} />
                  <div>
                    <div className="text-ink font-bold text-[10px] uppercase tracking-widest">{session.session_type.replace('_', ' ')}</div>
                    <div className="text-ink/20 text-[9px] mt-1 font-mono uppercase tracking-widest">
                      {format(new Date(session.completed_at || new Date()), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="text-brand font-black font-mono text-[10px]">{session.duration_minutes}m</div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="py-16 text-center text-ink/10 font-mono text-[10px] uppercase tracking-[0.5em]">
                No sessions recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

