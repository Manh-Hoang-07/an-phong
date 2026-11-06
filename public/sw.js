'use strict';
/*
 * Service worker: giữ sẵn trên máy các file ĐÃ CÓ MÃ PHIÊN BẢN (file gộp /app.<mã>.js, ảnh ?v=, Phaser ?v=, font)
 * để lần sau mở game không phải tải lại, kể cả khi trình duyệt điện thoại dọn bộ nhớ đệm thông thường.
 * - File có mã phiên bản: lấy từ máy trước (nội dung không bao giờ đổi với cùng mã).
 * - Trang chính, /api/... và mọi thứ khác: luôn hỏi server (không bao giờ dùng bản cũ) → không lo kẹt phiên bản cũ.
 * - Khi có phiên bản mới, bản cũ cùng đường dẫn tự bị xóa.
 */
const CACHE = 'thuc-tinh-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

const isVersioned = (url) =>
  /^\/app\.[\w-]+\.js$/.test(url.pathname) || url.pathname.startsWith('/fonts/') || /(^|[?&])v=/.test(url.search);
// Cùng một "chỗ" nhưng khác phiên bản: /app.*.js là một chỗ; file khác thì cùng đường dẫn
const slot = (url) => (/^\/app\.[\w-]+\.js$/.test(url.pathname) ? '/app.js' : url.pathname);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || !isVersioned(url)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && res.status === 200) {
      const copy = res.clone();
      e.waitUntil((async () => {
        // xóa bản cũ của cùng chỗ rồi lưu bản mới
        for (const old of await cache.keys()) {
          const u = new URL(old.url);
          if (slot(u) === slot(url) && u.href !== url.href) await cache.delete(old);
        }
        await cache.put(req, copy);
      })());
    }
    return res;
  })());
});
