import { api, ApiOptions } from './client';
import { getBaseUrl, getToken } from '../config';
import type {
  Job,
  QueueStatus,
  Replacement,
  ReplacementDetail,
  Stats,
  Worker,
  WorkerPairingCode,
} from './types';

// ---- Queue / Status
export const queueStatus = () => api<QueueStatus>('/api/queue/status');
export const queuePause = () => api<QueueStatus>('/api/queue/pause', { method: 'POST' });
export const queueResume = () => api<QueueStatus>('/api/queue/resume', { method: 'POST' });

// ---- Stats
export const stats = () => api<Stats>('/api/stats');

// ---- Jobs
export const liveJobs = () => api<Job[]>('/api/jobs?live=true');
export const job = (id: number) => api<Job>(`/api/jobs/${id}`);
export const jobLog = (id: number) => api<string>(`/api/jobs/${id}/log`);
export const cancelJob = (id: number) => api<{ id: number; status: string }>(`/api/jobs/${id}/cancel`, { method: 'POST' });
export const approveSizePreflight = (id: number) =>
  api<{ id: number; status: string }>(`/api/jobs/${id}/approve-size-preflight`, { method: 'POST' });
export const retryJob = (id: number, higherQuality = false) =>
  api<{ id: number; status: string }>(`/api/jobs/${id}/retry?higherQuality=${higherQuality}`, { method: 'POST' });
export const replaceJob = (id: number) => api<Replacement>(`/api/jobs/${id}/replace`, { method: 'POST' });
export const acceptBelowTarget = (id: number, executionAttempt: number) =>
  api<Replacement>(`/api/jobs/${id}/accept-below-target`, { method: 'POST', body: { executionAttempt } });

// ---- Replacements (things awaiting your approve / rollback)
export const replacements = () => api<Replacement[]>('/api/replacements');
export const replacement = (id: number) => api<ReplacementDetail>(`/api/replacements/${id}`);
export const approveReplacement = (id: number) =>
  api<Replacement>(`/api/replacements/${id}/approve`, { method: 'POST' });
export const rollbackReplacement = (id: number) =>
  api<Replacement>(`/api/replacements/${id}/rollback`, { method: 'POST' });

// ---- Raw streaming for the A/B comparison players ---------------------------------------------
// The video player cannot go through the fetch-based `api` client; it needs a URL plus headers, so
// these hand it an expo-video source directly. Range-enabled on the server, seekable on the device.
export interface StreamSource {
  uri: string;
  headers?: Record<string, string>;
}

const trimSlash = (s: string) => s.replace(/\/+$/, '');

export const replacementStreamSource = async (
  id: number,
  which: 'original' | 'replacement',
): Promise<StreamSource> => {
  const [base, token] = await Promise.all([getBaseUrl(), getToken()]);
  return {
    uri: `${trimSlash(base)}/api/replacements/${id}/${which}/content`,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };
};

// ---- Workers / pairing
export const workers = () => api<Worker[]>('/api/workers');
export const drainWorker = (id: number) => api<Worker>(`/api/workers/${id}/drain`, { method: 'POST' });
export const resumeWorker = (id: number) => api<Worker>(`/api/workers/${id}/drain`, { method: 'DELETE' });
export const revokeWorker = (id: number) => api<void>(`/api/workers/${id}`, { method: 'DELETE' });
export const forgetWorker = (id: number) => api<void>(`/api/workers/${id}/forget`, { method: 'POST' });
export const issuePairingCode = () => api<WorkerPairingCode>('/api/workers/pairing-code', { method: 'POST' });
export const activePairingCode = () => api<WorkerPairingCode | null>('/api/workers/pairing-code');
export const cancelPairingCode = () => api<void>('/api/workers/pairing-code', { method: 'DELETE' });
