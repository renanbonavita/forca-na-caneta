// Service worker do Dose de Força: funciona offline.
// Ao publicar mudanças, aumente a VERSAO para os celulares baixarem a versão nova.
const VERSAO = 'fnc-v9';

const ESSENCIAIS = [
  './', 'index.html', 'styles.css', 'app.js', 'js/logica.js',
  'exercicios.json', 'config.json', 'clinicas.json', 'manifest.json', 'termos.html',
  'icons/logo.svg', 'icons/favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
  'img/aquecimento.svg', 'img/descanso.svg', 'img/desaquecimento.svg', 'termos.js', 'og-image.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    // cache: 'reload' ignora o cache HTTP do navegador e garante os arquivos novos.
    await cache.addAll(ESSENCIAIS.map((u) => new Request(u, { cache: 'reload' })));
    // Placeholders, vídeos e áudios: guarda o que existir (arquivos ainda não gravados são ignorados).
    try {
      const [ex, cfg, cli] = await Promise.all(['exercicios.json', 'config.json', 'clinicas.json'].map((u) => fetch(u).then((r) => r.json())));
      const extras = new Set();
      (ex.exercicios || []).forEach((m) => {
        extras.add(m.placeholder);
        if (cfg.midia && cfg.midia.usar_videos) extras.add(m.video);
        if (cfg.audio && cfg.audio.usar_mp3) { extras.add(m.audio_intro); extras.add(m.audio_proximo); }
      });
      if (cfg.audio && cfg.audio.usar_mp3) {
        Object.keys(cfg.falas || {}).forEach((id) => extras.add(`audio/${id}.mp3`));
        const listas = { frases_durante: 'durante', frases_levantar: 'levantar', frases_toalha: 'toalha', frases_10s: 'dez', frases_descanso: 'descanso', frases_conclusao: 'conclusao' };
        Object.entries(listas).forEach(([k, p]) => (cfg[k] || []).forEach((_, i) => extras.add(`audio/${p}-${String(i + 1).padStart(2, '0')}.mp3`)));
      }
      (cli.clinicas || []).forEach((c) => c.logo && extras.add(c.logo));
      await Promise.allSettled([...extras].filter(Boolean).map((u) => cache.add(u)));
    } catch { /* segue com o essencial */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Safari pede vídeo em pedaços (Range). Responde 206 a partir do cache.
async function respostaParcial(request, resposta) {
  const range = request.headers.get('range');
  const blob = await resposta.blob();
  const m = /bytes=(\d+)-(\d*)/.exec(range);
  const inicio = Number(m[1]);
  const fim = m[2] ? Number(m[2]) : blob.size - 1;
  return new Response(blob.slice(inicio, fim + 1), {
    status: 206,
    headers: {
      'Content-Type': resposta.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': `bytes ${inicio}-${fim}/${blob.size}`,
      'Content-Length': String(fim - inicio + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Analytics: nunca do cache.
  if (/goatcounter\.com|gc\.zgo\.at|plausible\.io/.test(url.hostname)) return;

  // Fontes do Google: usa o cache e atualiza por trás.
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSAO);
      const salvo = await cache.match(req);
      const rede = fetch(req).then((r) => { cache.put(req, r.clone()); return r; }).catch(() => salvo);
      return salvo || rede;
    })());
    return;
  }
  if (url.origin !== location.origin) return;

  // Navegação (abrir o app, com ou sem ?c=clinica): rede primeiro, cache se offline.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const r = await fetch(req, { cache: 'no-cache' });
        const cache = await caches.open(VERSAO);
        cache.put(url.pathname.endsWith('termos.html') ? 'termos.html' : 'index.html', r.clone());
        return r;
      } catch {
        return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('index.html'));
      }
    })());
    return;
  }

  // Código e configuração (html, css, js, json): rede primeiro, para página, estilo e script
  // virem sempre da MESMA versão. O cache só entra quando está offline.
  if (/\.(html|css|js|mjs|json)$/.test(url.pathname)) {
    event.respondWith((async () => {
      try {
        const r = await fetch(req, { cache: 'no-cache' });
        if (r.ok) (await caches.open(VERSAO)).put(req, r.clone());
        return r;
      } catch { return caches.match(req, { ignoreSearch: true }); }
    })());
    return;
  }

  // Mídia (imagens, vídeos, áudios): cache primeiro.
  event.respondWith((async () => {
    const salvo = await caches.match(req, { ignoreSearch: true });
    if (salvo) return req.headers.has('range') ? respostaParcial(req, salvo) : salvo;
    const r = await fetch(req);
    if (r.ok && r.status === 200 && !req.headers.has('range')) (await caches.open(VERSAO)).put(req, r.clone());
    return r;
  })());
});
