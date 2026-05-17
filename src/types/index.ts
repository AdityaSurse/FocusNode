export type SessionType = 'work' | 'short_break' | 'long_break';

export interface PomodoroSession {
  id: number;
  user_id: string;
  session_type: SessionType;
  duration_minutes: number;
  completed_at: string;
}

export interface Profile {
  id: string;
  sync_key: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Stats {
  totalMinutes: number;
  sessionsToday: number;
  streak: number;
}
