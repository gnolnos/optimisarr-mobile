// Subset of Optimisarr's API shapes that the MVP reads/writes.
// Field names mirror the server JSON exactly (see web/src/lib/api.ts).

export type JobStatus =
  | 'Queued'
  | 'Running'
  | 'Leased'
  | 'Encoding'
  | 'Verifying'
  | 'Delivering'
  | 'Failed'
  | 'Completed';

export interface Job {
  id: number;
  status: JobStatus;
  executionAttempt?: number;
  mediaId?: number;
  relativePath?: string;
  title?: string;
  workerName?: string | null;
  videoEncoder?: string | null;
  hardwareDecoder?: string | null;
  stage?: string | null;
  progress?: number | null;
  reason?: string | null;
  outcome?: string | null;
  retryReason?: string | null;
  outputSizeBytes?: number | null;
  sourceSizeBytes?: number | null;
  queuedAt?: string;
  startedAt?: string;
  finishedAt?: string | null;
}

export interface QueueStatus {
  paused?: boolean;
  running?: boolean;
  encoderMode?: string;
  maxConcurrentJobs?: number;
  runningJobs?: number;
  queuedJobs?: number;
  canStart?: boolean;
  blockedReason?: string | null;
}

export interface Stats {
  filesOptimised?: number;
  bytesSaved?: number;
  originalBytes?: number;
  optimisedBytes?: number;
  averageSavingPercent?: number;
  queued?: number;
  running?: number;
  readyToReplace?: number;
  failed?: number;
  inQuarantine?: number;
}

export type ReplacementStatus = 'Pending' | 'Approved' | 'RolledBack';

export interface Replacement {
  id: number;
  status?: ReplacementStatus;
  jobId?: number;
  mediaFileId?: number;
  originalPath?: string;
  relativePath?: string;
  quarantinePath?: string;
  finalPath?: string;
  sourceSizeBytes?: number;
  outputSizeBytes?: number;
  approvedAt?: string | null;
  rolledBackAt?: string | null;
}

export interface ReplacementDetail extends Replacement {
  mediaId?: number;
}

export type WorkerOs = 'windows' | 'macos' | 'linux';
export type WorkerStatus = 'online' | 'offline';

export interface Worker {
  id: number;
  name: string;
  operatingSystem: WorkerOs;
  architecture?: string;
  online: boolean;
  protocolVersion?: number;
  sidecarVersion?: string | null;
  videoEncoders?: string[];
  audioEncoders?: string[];
  hardwareDecoders?: string[];
  cpuBusyFraction?: number | null;
  gpuBusyFraction?: number | null;
  activeJobs?: { jobId: number; relativePath: string; stage: string; progress?: number }[];
  heldLeases?: number;
  drainRequestedAt?: string | null;
  revokedAt?: string | null;
  lastSeenAt?: string;
  lastProblem?: string | null;
  lastProblemAt?: string | null;
}

export interface WorkerPairingCode {
  code: string;
  expiresAt?: string;
}
