'use client';

import { useState, useMemo } from 'react';
import type { Project } from '@/types';

function isBetween(date: Date, start: string | undefined, end: string | undefined): boolean {
  const d = date.getTime();
  if (start && end) return d >= new Date(start).setHours(0, 0, 0, 0) && d <= new Date(end).setHours(23, 59, 59, 999);
  if (start) return d >= new Date(start).setHours(0, 0, 0, 0);
  return false;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarStripProps {
  projects: Project[];
  onSelectDate?: (date: Date | null) => void;
}

export function CalendarStrip({ projects, onSelectDate }: CalendarStripProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      result.push(d);
    }
    return result;
  }, [today]);

  const activeProjects = useMemo(
    () => projects.filter(p => p.phase !== 'delivered'),
    [projects]
  );

  const getJobCount = (date: Date): number => {
    return activeProjects.filter(p =>
      isBetween(date, p.startDate, p.estimatedCompletion)
    ).length;
  };

  const handleSelect = (date: Date) => {
    const isDeselect = selectedDate && sameDay(selectedDate, date);
    const next = isDeselect ? null : date;
    setSelectedDate(next);
    onSelectDate?.(next);
  };

  return (
    <div className="flex items-stretch gap-1.5 overflow-x-auto scrollbar-none">
      {days.map(date => {
        const isToday = sameDay(date, today);
        const isSelected = selectedDate && sameDay(date, selectedDate);
        const jobCount = getJobCount(date);

        return (
          <button
            key={date.toISOString()}
            onClick={() => handleSelect(date)}
            className={`flex-1 min-w-[64px] flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all active:scale-[0.97] ${
              isSelected
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : isToday
                ? 'bg-c-surface border-amber-500/20 text-c-text'
                : 'bg-c-card border-c-border text-c-text-3 active:bg-c-surface'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isSelected ? 'text-amber-400' : isToday ? 'text-amber-400/70' : 'text-c-text-4'
            }`}>
              {DAY_NAMES[date.getDay()]}
            </span>
            <span className={`text-lg font-bold ${
              isSelected ? 'text-amber-400' : isToday ? 'text-c-text' : 'text-c-text-2'
            }`}>
              {date.getDate()}
            </span>
            <div className="flex gap-0.5">
              {jobCount > 0 ? (
                Array.from({ length: Math.min(jobCount, 3) }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-amber-400' : 'bg-amber-500/50'
                  }`} />
                ))
              ) : (
                <div className="w-1.5 h-1.5" /> // spacer to maintain height
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
