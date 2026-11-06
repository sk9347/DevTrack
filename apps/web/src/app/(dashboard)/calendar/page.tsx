'use client';

import { useState } from 'react';
import { Heatmap } from '@/components/charts/heatmap';
import { ErrorText, Skeleton } from '@/components/ui/controls';
import { DayDetail } from '@/features/calendar/day-detail';
import { useFetch } from '@/lib/use-fetch';
import type { DayTrack, Heatmap as HeatmapData } from '@/types';

export default function CalendarPage() {
  const heatmap = useFetch<HeatmapData>('/analytics/heatmap?weeks=53');
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked ?? heatmap.data?.to ?? null;
  const track = useFetch<DayTrack>(selected ? `/analytics/day?date=${selected}` : null);

  return (
    <>
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <p className="mt-1 text-sm text-muted">
        Every cell is a day. Select one to see what you studied. {heatmap.data && <span className="tabular-nums">Longest streak: {heatmap.data.streak.longest} days.</span>}
      </p>
      <ErrorText>{heatmap.error}</ErrorText>

      <div className="mt-6">
        {heatmap.data ? <Heatmap fit days={heatmap.data.days} selected={selected ?? undefined} onSelect={setPicked} /> : <Skeleton className="h-32" />}
      </div>

      <div className="mt-10">{track.data ? <DayDetail track={track.data} /> : <Skeleton className="h-40" />}</div>
    </>
  );
}
