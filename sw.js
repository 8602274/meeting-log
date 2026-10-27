// 오프라인 캐시. 앱 파일을 고치면 VERSION을 올릴 것.
const VERSION = 'v1.6.4';
const APP = 'meeting-app-' + VERSION;
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(CORE.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('meeting-app-') && k !== APP).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 앱 화면: 인터넷 되면 최신본, 안 되면 저장본
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, {cache: 'no-cache'}).then(r => {   // 브라우저 HTTP 캐시(10분) 건너뛰고 서버에 확인
      const copy = r.clone(); caches.open(APP).then(c => c.put('./index.html', copy)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  // 그 밖의 앱 파일: 저장본 먼저 (새 버전 설치 때 HTTP 캐시 건너뛰고 새로 받음)
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
