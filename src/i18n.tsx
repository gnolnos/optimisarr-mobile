import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'vi' | 'en';

const DICT = {
  vi: {
    // tab / headers
    t_status: 'Trạng thái',
    t_jobs: 'Jobs',
    t_approve: 'Quyết định',
    t_workers: 'Workers',
    t_settings: 'Cài đặt kết nối',
    // status
    st_running: 'Đang xử lý',
    st_queued: 'Chờ',
    st_ready: 'Sẵn sàng thay',
    st_optimised: 'File đã tối ưu',
    st_saved: 'Tiết kiệm dung lượng',
    st_avg: 'Mức tiết kiệm TB',
    st_pause: '⏸ Tạm dừng queue',
    st_resume: '▶ Tiếp tục',
    st_blocked: 'Queue dừng:',
    // jobs
    jobs_empty: 'Chưa có job nào.',
    untitled: '(không có tên)',
    jd_encoder: 'encoder',
    jd_worker: 'worker',
    jd_progress: 'tiến độ',
    jd_note: 'Ghi chú',
    jd_cancel: 'Huỷ job',
    jd_retry: 'Retry',
    jd_preflight: 'Duyệt dung lượng',
    jd_accept: 'Chấp nhận dưới target',
    jd_log: 'Xem log',
    jd_replace: 'Replace nguyên bản',
    log_ffmpeg: 'Log (FFmpeg)',
    // approve
    ap_none: 'Không có bản ghi nào chờ quyết.',
    ap_approve: 'Approve',
    ap_rollback: 'Roll back',
    // workers
    wk_pair_title: 'Ghép worker mới',
    wk_gen: '+ Tạo mã ghép',
    wk_cancel_code: 'Huỷ mã',
    wk_hint: 'Nhập mã này trên sidecar (hoặc quét) để ghép.',
    wk_online: 'online',
    wk_offline: 'offline',
    wk_draining: 'draining',
    wk_revoked: 'revoked',
    wk_encoders: 'encoders:',
    wk_busy: 'đang:',
    wk_idle: 'rảnh',
    wk_idle_cpu: '(% CPU: ',
    wk_drain: 'Tạm ngừng',
    wk_resume: 'Nhận việc lại',
    wk_lock: 'Khóa',
    wk_drain_q: 'Ngừng nhận việc mới cho "{name}"?',
    wk_resume_q: 'Cho "{name}" nhận việc lại?',
    wk_lock_q: 'Tạm khóa worker "{name}"?',
    // settings
    set_mode: 'Chế độ mạng',
    set_internal: 'Nội bộ (LAN)',
    set_internal_sub: 'HTTP trần được phép',
    set_external: 'Bên ngoài',
    set_external_sub: 'Bắt buộc HTTPS',
    set_url: 'Địa chỉ server (URL gốc)',
    set_url_ph_in: 'http://192.168.100.199:8787',
    set_url_ph_out: 'https://optimisarr.example.com',
    set_token: 'Admin token (Bearer)',
    set_token_opt: '— để trống nếu server chưa đặt',
    set_token_ph: '(tuỳ chọn)',
    set_save_test: 'Lưu & kiểm tra',
    set_save: 'Chỉ lưu',
    set_testing: 'Đang thử…',
    set_foot: 'Nội bộ: phone phải cùng mạng LAN mới vào được. Bên ngoài: cần reverse proxy + HTTPS và đặt admin token. URL không thêm /api — app tự nối.',
    // shared
    c_confirm: 'Xác nhận',
    c_cancel: 'Huỷ',
    c_ok: 'Đồng ý',
    c_lock: 'Khóa',
    c_done: 'Đã thực hiện',
    c_success: 'Thành công.',
    c_error: 'Lỗi',
    c_saved: 'Đã lưu',
    c_saved_msg: 'Cấu hình đã lưu.',
    c_conn_ok: 'Kết nối OK',
    c_conn_fail: 'Không kết nối được',
    c_missing_url: 'Thiếu địa chỉ server',
    c_missing_url_msg: 'Nhập URL gốc, ví dụ http://192.168.100.199:8787.',
    c_http_ext: 'HTTP không được phép ở chế độ Bên ngoài',
    c_http_ext_msg: 'Ra mạng ngoài phải dùng HTTPS. Dùng https:// hoặc đổi sang chế độ Nội bộ.',
    c_missing_https: 'Thiếu https://',
    c_missing_https_msg: 'Ở chế độ Bên ngoài, URL phải bắt đầu bằng https://',
    c_missing_scheme: 'Thiếu giao thức',
    c_missing_scheme_msg: 'Nên thêm http:// hoặc https:// vào đầu URL.',
    c_still_save: 'Vẫn lưu',
    c_token_warn: 'Chưa nhập admin token',
    c_token_warn_msg: 'Nếu server đã đặt token, mọi yêu cầu sẽ trả 401 tới khi bạn nhập. Nếu server chưa đặt, dữ liệu không được xác thực — nên đặt token ở container Unraid.',
    c_still_go: 'Vẫn tiếp tục',
    c_no_config: 'Server URL chưa được cấu hình. Vào tab Cài đặt để nhập.',
  },
  en: {
    t_status: 'Status',
    t_jobs: 'Jobs',
    t_approve: 'Approve',
    t_workers: 'Workers',
    t_settings: 'Connection settings',
    st_running: 'Running',
    st_queued: 'Queued',
    st_ready: 'Ready to replace',
    st_optimised: 'Files optimised',
    st_saved: 'Storage saved',
    st_avg: 'Avg saving',
    st_pause: '⏸ Pause queue',
    st_resume: '▶ Resume',
    st_blocked: 'Queue stopped:',
    jobs_empty: 'No jobs yet.',
    untitled: '(untitled)',
    jd_encoder: 'encoder',
    jd_worker: 'worker',
    jd_progress: 'progress',
    jd_note: 'Note',
    jd_cancel: 'Cancel job',
    jd_retry: 'Retry',
    jd_preflight: 'Approve size preflight',
    jd_accept: 'Accept below target',
    jd_log: 'View log',
    jd_replace: 'Replace original',
    log_ffmpeg: 'Log (FFmpeg)',
    ap_none: 'Nothing waiting for your decision.',
    ap_approve: 'Approve',
    ap_rollback: 'Roll back',
    wk_pair_title: 'Pair a new worker',
    wk_gen: '+ Create pairing code',
    wk_cancel_code: 'Cancel code',
    wk_hint: 'Enter this code on the sidecar (or scan it) to pair.',
    wk_online: 'online',
    wk_offline: 'offline',
    wk_draining: 'draining',
    wk_revoked: 'revoked',
    wk_encoders: 'encoders:',
    wk_busy: 'processing:',
    wk_idle: 'idle',
    wk_idle_cpu: '(% CPU: ',
    wk_drain: 'Pause',
    wk_resume: 'Resume',
    wk_lock: 'Revoke',
    wk_drain_q: 'Stop giving new work to "{name}"?',
    wk_resume_q: 'Let "{name}" take work again?',
    wk_lock_q: 'Revoke worker "{name}"?',
    set_mode: 'Network mode',
    set_internal: 'Internal (LAN)',
    set_internal_sub: 'Plain HTTP allowed',
    set_external: 'External',
    set_external_sub: 'HTTPS required',
    set_url: 'Server address (base URL)',
    set_url_ph_in: 'http://192.168.100.199:8787',
    set_url_ph_out: 'https://optimisarr.example.com',
    set_token: 'Admin token (Bearer)',
    set_token_opt: '— leave empty if the server has none',
    set_token_ph: '(optional)',
    set_save_test: 'Save & test',
    set_save: 'Save only',
    set_testing: 'Testing…',
    set_foot: 'Internal: the phone must be on the same LAN. External: use a reverse proxy + HTTPS and set an admin token. Donot add /api — the app adds it.',
    c_confirm: 'Confirm',
    c_cancel: 'Cancel',
    c_ok: 'OK',
    c_lock: 'Revoke',
    c_done: 'Done',
    c_success: 'Success.',
    c_error: 'Error',
    c_saved: 'Saved',
    c_saved_msg: 'Configuration saved.',
    c_conn_ok: 'Connection OK',
    c_conn_fail: 'Cannot connect',
    c_missing_url: 'Server URL missing',
    c_missing_url_msg: 'Enter the base URL, e.g. http://192.168.100.199:8787.',
    c_http_ext: 'HTTP not allowed in External mode',
    c_http_ext_msg: 'Outside your network you must use HTTPS. Use https:// or switch to Internal mode.',
    c_missing_https: 'Missing https://',
    c_missing_https_msg: 'In External mode the URL must start with https://',
    c_missing_scheme: 'Missing scheme',
    c_missing_scheme_msg: 'Start the URL with http:// or https://.',
    c_still_save: 'Save anyway',
    c_token_warn: 'Admin token missing',
    c_token_warn_msg: 'If the server has a token set, every request will return 401 until you enter it. If it has none, data on the LAN is not authenticated — consider setting a token on the Unraid container.',
    c_still_go: 'Continue anyway',
    c_no_config: 'Server URL not configured. Open the Settings tab to enter it.',
  },
} as const;

type K = keyof (typeof DICT)['vi'];

const LangCtx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: K) => string;
}>({ lang: 'vi', setLang: () => {}, t: (k) => k });

const KEY_LANG = 'opti.lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi');
  useEffect(() => {
    AsyncStorage.getItem(KEY_LANG)
      .then((v) => {
        if (v === 'en' || v === 'vi') setLangState(v);
      })
      .catch(() => {});
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(KEY_LANG, l).catch(() => {});
  };
  const t = (k: K) => DICT[lang][k] ?? DICT.en[k] ?? k;
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

// Reused pieces that need a value: strings with a {name} slot.
export function fill(t: (k: string) => string, key: string, vars: Record<string, string>): string {
  let s = t(key as never);
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}
