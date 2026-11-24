import { useCallback, useEffect, useState } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { getBaseUrl, getToken } from '../config';
import { liveJobs } from '../api/endpoints';
import type { Job } from '../api/types';

export type ConnMode = 'signalr' | 'poll' | 'off';

export function useJobsConnection(pollMs = 5000) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [mode, setMode] = useState<ConnMode>('off');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setJobs(await liveJobs());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải danh sách job');
    }
  }, []);

  useEffect(() => {
    let hub: ReturnType<typeof HubConnectionBuilder.prototype.build> | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let active = true;

    (async () => {
      // Try SignalR first (live pushes); fall back to polling if it cannot connect.
      try {
        const base = await getBaseUrl();
        const token = await getToken();
        hub = new HubConnectionBuilder()
          .withUrl(`${base}/hubs/jobs`, { accessTokenFactory: () => token })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Error)
          .build();
        hub.on('jobsChanged', () => {
          void refresh();
        });
        await hub.start();
        if (!active) return;
        setMode('signalr');
        void refresh();
      } catch {
        if (!active) return;
        setMode('poll');
        void refresh();
        timer = setInterval(() => void refresh(), pollMs);
      }
    })();

    return () => {
      active = false;
      if (hub) void hub.stop();
      if (timer) clearInterval(timer);
    };
  }, [pollMs, refresh]);

  return { jobs, refresh, mode, error };
}
