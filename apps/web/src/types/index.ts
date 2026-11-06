export interface User {
  id: string;
  email: string;
  timezone: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  targetFrequency: number;
  dailyTargetMinutes: number;
  isActive: boolean;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: 'TODO' | 'DONE';
  doneAt: string | null;
  loggedMinutes: number;
}

export interface SessionRow {
  id: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  habitId: string;
  habitName: string;
  habitColor: string;
  taskTitle: string | null;
}

export interface DayTrack {
  date: string;
  totalMinutes: number;
  habits: { id: string; name: string; color: string; dailyTargetMinutes: number; minutes: number; met: boolean }[];
  tasks: Task[];
  sessions: SessionRow[];
}

export interface Overview {
  period: 'week' | 'month';
  from: string;
  to: string;
  today: string;
  totalMinutes: number;
  studyHours: number;
  activeDays: number;
  tasks: { total: number; done: number };
  habitCompletion: number;
  streak: { current: number; longest: number };
  daily: { date: string; minutes: number; sessions: number; tasksDone: number }[];
  habits: { habitId: string; name: string; color: string; minutes: number; daysMet: number; targetDays: number; completion: number }[];
}

export interface Heatmap {
  from: string;
  to: string;
  days: { date: string; minutes: number; level: 0 | 1 | 2 | 3 | 4 }[];
  streak: { current: number; longest: number };
}
