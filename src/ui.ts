import type { JobStatus, ReplacementStatus, WorkerStatus } from './api/types';

export function bytes(n?: number | null): string {
  if (n === null || n === undefined) return '—';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = -1;
  do {
    v /= 1024;
    i += 1;
  } while (v >= 1024 && i < units.length - 1);
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[i]}`;
}

export function jobTone(status: JobStatus): string {
  switch (status) {
    case 'Failed':
      return 'error';
    case 'Completed':
      return 'success';
    default:
      return 'active';
  }
}

export function replTone(status: ReplacementStatus): string {
  return status === 'Approved' ? 'success' : status === 'RolledBack' ? 'muted' : 'accent';
}

export function workerTone(online: boolean, revoked: boolean): string {
  if (revoked) return 'muted';
  return online ? 'success' : 'muted';
}

export function fmtWorkerStatus(online: boolean, drainRequestedAt: string | null | undefined, revokedAt: string | null | undefined): string {
  if (revokedAt) return 'revoked';
  if (drainRequestedAt) return 'draining';
  return online ? 'online' : 'offline';
}

export type { JobStatus, ReplacementStatus, WorkerStatus };
