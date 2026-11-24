import { getBaseUrl, getToken } from '../config';

const JSON_METHODS = new Set(['POST', 'PUT', 'PATCH']);

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const base = await getBaseUrl();
  if (!base) throw new ApiError(0, 'Server URL chưa được cấu hình. Vào tab Cài đặt để nhập.');

  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = await getToken();
  if (token) headers.authorization = `Bearer ${token}`;

  let body: string | undefined;
  if (opts.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { method, headers, body });
  } catch {
    throw new ApiError(0, 'Không kết nối được tới server. Kiểm tra mạng cùng LAN và địa chỉ.');
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    let code: string | undefined;
    try {
      const d = (await res.json()) as { error?: string; detail?: string; code?: string };
      msg = d.error ?? d.detail ?? msg;
      code = d.code;
    } catch { /* not json */ }
    throw new ApiError(res.status, msg, code);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function contentUrl(kind: 'output' | 'replacement', id: number): Promise<string> {
  // Media endpoints stream bytes; the caller must fetch them with the same auth header.
  return (async () => {
    const base = await getBaseUrl();
    const token = await getToken();
    const path =
      kind === 'output'
        ? `/api/jobs/${id}/output/content`
        : `/api/replacements/${id}/replacement/content`;
    return `${base}${path}${token ? `?access_token=${encodeURIComponent(token)}` : ''}`;
  })();
}
