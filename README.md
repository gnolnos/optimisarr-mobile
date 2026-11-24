# Optimisarr Mobile (MVP)

Ứng dụng **React Native / Expo** để điều khiển và theo dõi server [Optimisarr](https://github.com/Jellman86/optimisarr) từ iPhone / Android — không cần mở web browser.

Bao quanh đúng API REST + SignalR mà web UI vốn dùng; không cần tác giả "mở" gì thêm.

## Tính năng (MVP)

- **Status** — số job đang xử lý / chờ / sẵn sàng thay, file đã tối ưu, dung lượng & % tiết kiệm, tạm dừng/tiếp tục queue.
- **Jobs** — danh sách job **realtime** (qua SignalR `/hubs/jobs`; tự fallback về polling nếu mất kết nối), tap vào một job để:
  - `Replace` nguyên bản, `Retry`, `Cancel`,
  - `Approve size preflight`, `Accept below target`,
  - xem log FFmpeg.
- **Approve** — danh sách bản chờ bạn quyết (`/api/replacements`): **Approve** (thay thế, bản gốc vào Quarantine) hoặc **Roll back**.
- **Workers** — danh sách worker (online/offline/draining, encoder, job đang chạy), `Tạm ngừng / nhận việc lại / Khóa`, và mục **Ghép worker mới** (tạo mã ghép để sidecar nhập/quét).
- **Cài đặt** — chọn **2 chế độ mạng**:
  - **Nội bộ (LAN)**: cho phép `http://` trần (vd `http://192.168.100.199:8787`).
  - **Bên ngoài**: **bắt buộc HTTPS**; nhập `http://` ở chế độ này bị chặn.
  - Ô nhập **Admin token** (Bearer); hiện cảnh báo nếu để trống.

## Chạy thử (cùng mạng LAN với server)

```bash
cd optimisarr-mobile
npm install
npx expo start
```

Mở **Expo Go** trên iPhone/Android (cùng wifi), quét QR. Vào tab **Cài đặt**, chọn **Nội bộ (LAN)**, nhập `http://192.168.100.199:8787`, bấm **Lưu & kiểm tra**.

> Bản chạy thử qua Expo Go không cần cấu hình thêm (Expo Go cho phép HTTP trần). Bản **standalone build** (iphone APK/TestFlight) đã bật `NSAllowsArbitraryLoads` / `usesCleartextTraffic` trong `app.json` để HTTP trần hoạt động.

## Bảo mật (nên làm trước khi dùng thật)

- Đặt **`OPTIMISARR_ADMIN_TOKEN`** trên container Unraid (Settings → Docker → Edit → thêm biến). Sau đó ai cũng phải nhập Bearer token. Token không được lưu ra ngoài — app giữ trong AsyncStorage.
- `http://` chỉ nên dùng **chế độ Nội bộ**. Ra mạng ngoài: dùng reverse proxy + HTTPS và chọn chế độ **Bên ngoài**.

## Cấu trúc

```
App.tsx                      # điều hướng (stack + bottom tabs, theme tối)
app.json                     # cấu hình Expo; ATS/cleartext cho standalone build
src/config.ts                # baseUrl + token + chế độ mạng (AsyncStorage)
src/api/client.ts            # fetch wrapper (Bearer, JSON, lỗi chuẩn hoá)
src/api/types.ts             # kiểu dữ liệu (khớp JSON server)
src/api/endpoints.ts         # hàm gọi các endpoint cần thiết
src/hooks/useJobsConnection.ts # SignalR + fallback poll
src/screens/                 # Status, Jobs, JobDetail, Approve, Workers, Settings
```

## Ghi chú

- Endpoint khớp source `web/src/lib/api.ts` của Optimisarr.
- SignalR dùng `@microsoft/signalr`; nếu connect thất bại app tự chuyển sang poll mỗi 5s.
- Chỉ là MVP — nhiều endpoint (setup, media plan/preview, quarantine, settings …) chưa đưa vào UI.
