import React, { useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Flame,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { motion } from 'motion/react';
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

    if (count === 0) return 'bg-white/5';
    if (count <= 2) return 'bg-white/20';
    if (count <= 4) return 'bg-white/40';
    return 'bg-brand';
  };

  if (loading) return <div className="flex justify-center p-12 text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Node Data...</div>;

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto p-4">
      {/* AI Insights */}
      <ProTips />

      {/* Target Progress & Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-[32px] md:col-span-2 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 size={120} />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold uppercase tracking-widest text-[10px] opacity-40">Daily Objective</h3>
            <span className="text-white/30 text-[10px] font-mono">{stats.sessionsToday} / {stats.targetSessions} SESSIONS</span>
          </div>

          <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-4">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.targetProgress * 100}%` }}
              className="absolute inset-y-0 left-0 bg-brand shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            />
          </div>

          <div className="flex justify-between items-end">
            <div className="text-3xl font-black text-white tracking-tighter italic">
              {Math.round(stats.targetProgress * 100)}% <span className="text-sm opacity-20 not-italic uppercase font-bold tracking-widest ml-2">Synchronized</span>
            </div>
            <button 
              onClick={() => {
                const newTarget = prompt('Set Daily Session Target:', targetSessions.toString());
                if (newTarget && !isNaN(parseInt(newTarget))) {
                  localStorage.setItem('target_sessions', newTarget);
                  setTargetSessions(parseInt(newTarget));
                }
              }}
              className="text-[9px] font-black italic text-brand hover:text-white transition-colors uppercase tracking-widest"
            >
              Adjust Objective
            </button>
          </div>
        </motion.div>

        {[
          { label: 'Weekly', value: `${Math.round(stats.weekMinutes / 60)}h`, icon: BarChart2, color: 'text-white/40' },
          { label: 'Streak', value: `${stats.streak} Days`, icon: Flame, color: 'text-orange-500' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 2) * 0.1 }}
            key={stat.label}
            className="glass-card p-6 rounded-[32px]"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={stat.color} size={18} />
              <span className="text-white/30 text-[9px] font-bold uppercase tracking-[0.2em]">{stat.label}</span>
            </div>
            <div className="text-2xl font-black text-white tracking-tighter italic">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Today Total', value: `${Math.floor(stats.todayMinutes / 60)}h ${stats.todayMinutes % 60}m`, icon: Clock, color: 'text-brand' },
          { label: 'Monthly Focus', value: `${Math.round(stats.monthMinutes / 60)}h`, icon: TrendingUp, color: 'text-white/40' },
          { label: 'All-Time', value: `${Math.round(stats.totalMinutes / 60)}h`, icon: BarChart2, color: 'text-white/40' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 4) * 0.1 }}
            key={stat.label}
            className="glass-card p-6 rounded-[32px]"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={stat.color} size={18} />
              <span className="text-white/30 text-[9px] font-bold uppercase tracking-[0.2em]">{stat.label}</span>
            </div>
            <div className="text-xl font-black text-white tracking-tighter italic">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Volume Chart (Sessions) */}
        <div className="glass-card p-8 rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white font-bold uppercase tracking-widest text-[10px] opacity-40">Focus Volume (Sessions)</h3>
            <CheckCircle2 size={16} className="text-brand opacity-50" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff20', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(5, 5, 5, 0.8)', borderRadius: '12px', border: '1px solid #ffffff10', fontSize: '10px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Focus Hours Chart */}
        <div className="glass-card p-8 rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white font-bold uppercase tracking-widest text-[10px] opacity-40">Depth Analysis (Hours)</h3>
            <Clock size={16} className="text-white/20" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff20', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(5, 5, 5, 0.8)', borderRadius: '12px', border: '1px solid #ffffff10', fontSize: '10px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="hours" 
                  stroke="#ffffff" 
                  strokeWidth={2}
                  dot={{ fill: '#ffffff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Matrix */}
        <div className="glass-card p-8 rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white font-bold uppercase tracking-widest text-[10px] opacity-40">Activity Matrix</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-[2px] bg-white/5" />
              <div className="w-2 h-2 rounded-[2px] bg-white/20" />
              <div className="w-2 h-2 rounded-[2px] bg-white/40" />
              <div className="w-2 h-2 rounded-[2px] bg-brand" />
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1.5 h-36 content-start">
            {calendarDays.map((day) => (
              <div key={day.toISOString()} className="group relative">
                <div
                  className={`w-full aspect-square rounded-[2px] transition-all ${getIntensity(day)} hover:ring-1 hover:ring-white/40 cursor-default shadow-sm`}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-[8px] text-white/20 flex justify-between uppercase font-bold tracking-[0.2em]">
            <span>Low Output</span>
            <span>Peak Flow</span>
          </div>
        </div>

        {/* Recent Session Log */}
        <div className="glass-card p-8 rounded-[32px] flex flex-col">
          <h3 className="text-white font-bold uppercase tracking-widest text-[10px] opacity-40 mb-6">Execution Log</h3>
          <div className="space-y-4 flex-1">
            {sessions.slice(0, 4).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                <div className="flex items-center gap-4">
                  <div className={`w-1 h-8 rounded-full ${session.session_type === 'work' ? 'bg-brand shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-white/10'}`} />
                  <div>
                    <div className="text-white font-black text-xs uppercase tracking-tighter italic">{session.session_type.replace('_', ' ')}</div>
                    <div className="text-white/20 text-[9px] font-mono mt-0.5">{format(new Date(session.completed_at || new Date()), 'MMM dd, HH:mm')}</div>
                  </div>
                </div>
                <div className="text-white font-black italic tracking-tighter text-sm">{session.duration_minutes}m</div>
              </div>
            ))}
            {sessions.length === 0 && <div className="text-center text-white/20 py-12 font-mono text-[10px] uppercase tracking-[0.3em]">No telemetry detected.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

