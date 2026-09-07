// Cloudflare Worker — Proxy definitivo para IPTV em GitHub Pages (HTTPS → HTTP).
//
// Deploy:
//   1. Vá para https://dash.cloudflare.com/ → Workers & Pages → Create Worker
//   2. Cole TODO esse arquivo no editor → Deploy
//   3. Copie a URL final (ex: https://meu-proxy-abc.workers.dev/)
//   4. No app Cadene: Configurações → Proxy CORS → cole a URL → Salvar → Recarregar lista
//
// Esse worker resolve OS 3 problemas conhecidos de proxies públicos:
//   A) User-Agent e Referer falsificados (provedores bloqueiam curl/browser UA)
//   B) Rewrite de URLs INTERNAS em playlists M3U8 (master, variant, segments .ts/.m4s,
//      keys URI, INIT map) — para TUDO passar por esse worker, sem Mixed Content
//   C) Range / Accept / CORS headers e repasse binário eficiente (Streaming via ReadableStream)

const PROXY_QUERY = 'url';

const UA_VLC = 'VLC/3.0.20 LibVLC/3.0.20';
const UA_KODI = 'Kodi/21.0 (X11; Linux x86_64) App_Bitness/64 Version/21.0-Omega';

export default {
  async fetch(request, env, ctx) {
    const reqUrl = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request.headers.get('Origin')),
      });
    }

    const target = reqUrl.searchParams.get(PROXY_QUERY);
    if (!target) {
      return html(
        200,
        `<h1>Cadene Proxy OK</h1>
        <p>Use: <code>${reqUrl.origin}/?url=http://seu-provedor/playlist.m3u</code></p>`
      );
    }

    let parsedTarget;
    try { parsedTarget = new URL(target); } catch {
      return plain(400, 'URL inválida passada em ?url=');
    }

    // ---- Remove porta redundante :80/:443 (alguns upstream bloqueiam Host c/ porta explícita)
    if (
      (parsedTarget.protocol === 'http:' && parsedTarget.port === '80') ||
      (parsedTarget.protocol === 'https:' && parsedTarget.port === '443')
    ) {
      parsedTarget.port = '';
    }

    const isPlaylist = looksLikeM3U8(parsedTarget.pathname, request.headers.get('Accept') || '');

    // Constrói headers do upstream REPLICANDO O QUE O NAVEGADOR FARIA SE COLASSE A URL DIRETO.
    // O motivo do 403 em vídeos era os headers artificiais (Referer/Origin/Host explícito de player de nós setávamos.
    // Agora o único header "forjado" é APENAS o User-Agent navegador desktop padrão.
    // Vídeos e binários: enviamos Accept padrão (do navegador, sem headers supérfluos).
    // Playlists M3U: aceitam o spoof leve pq o get.php bloqueia de vez enquando VLC/Kodi aceita só spoof.
    const upstream = new Headers();
    const range = request.headers.get('Range');
    if (range) upstream.set('Range', range);

    if (isPlaylist) {
      const accept = request.headers.get('Accept');
      upstream.set('Accept', accept || '*/*');
      upstream.set('User-Agent', pickByExt(parsedTarget.pathname, UA_VLC, UA_KODI));
      try {
        const origin = parsedTarget.origin;
        upstream.set('Referer', origin + '/');
        upstream.set('Origin', origin);
      } catch {}
    } else {
      // VÍDEO/MP4/TS: headers idênticos a quando tu cola a URL direto no navegador
      const acceptVid = request.headers.get('Accept');
      upstream.set('Accept', acceptVid || 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5');
      upstream.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
      // NÃO enviamos Referer, NÃO enviamos Origin, NÃO enviamos Host explicito — igual navegador
      var chUA = request.headers.get('Sec-CH-UA');
      if (chUA) upstream.set('Sec-CH-UA', chUA);
      var chUAM = request.headers.get('Sec-CH-UA-Mobile');
      if (chUAM) upstream.set('Sec-CH-UA-Mobile', chUAM);
      var chUAP = request.headers.get('Sec-CH-UA-Platform');
      if (chUAP) upstream.set('Sec-CH-UA-Platform', chUAP);
      upstream.set('sec-fetch-site', 'none');
      upstream.set('sec-fetch-mode', 'navigate');
      upstream.set('sec-fetch-user', '?1');
      upstream.set('sec-fetch-dest', 'video');
    }

    const upstreamRequest = new Request(parsedTarget.toString(), {
      method: request.method,
      headers: upstream,
      // Não espalha cookies/credentials do navegador do usuário
      credentials: 'omit',
      // Desliga cache do Cloudflare — cacheamento do CF introduziu bloqueio 403 em vídeos
      cf: {
        cacheTtl: 0,
        cacheEverything: false,
      },
    });

    // ---- 1ª tentativa: headers normais (acima)
    let response = await fetch(upstreamRequest);

    // ---- Fallback: se der 403 (provedor bloqueou), retenta com headers MÍNIMOS
    // (idênticos a colar a URL direto na barra do Chrome: só UA + Accept, nada mais)
    if (response.status === 403 || response.status === 401 || response.status === 1003) {
      try {
        const minimal = new Headers();
        if (range) minimal.set('Range', range);
        minimal.set('Accept', request.headers.get('Accept') || '*/*');
        minimal.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
        const retryReq = new Request(parsedTarget.toString(), {
          method: request.method,
          headers: minimal,
          credentials: 'omit',
          redirect: 'follow',
          cf: { cacheTtl: 0, cacheEverything: false },
        });
        const r2 = await fetch(retryReq);
        // Só sobrescreve se for MELHOR status que 403
        if (r2.status !== 403 && r2.status !== 401 && r2.status !== 1003) {
          response = r2;
        }
      } catch { /* ignora, usa a response original */ }
    }

    const outHeaders = new Headers(response.headers);

    // ---- Playlist (.m3u8) REESCREVE TODAS AS URLs INTERNAS
    if (isPlaylist && response.ok && response.body) {
      const baseForResolve = parsedTarget.toString();
      const workerBase = reqUrl.origin + reqUrl.pathname;
      const text = await response.text();
      const rewritten = rewriteM3U8(text, baseForResolve, workerBase);
      outHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      outHeaders.set('Content-Length', String(new TextEncoder().encode(rewritten).length));
      Object.entries(corsHeaders(request.headers.get('Origin'))).forEach(
        ([k, v]) => outHeaders.set(k, v)
      );
      return new Response(rewritten, { status: response.status, headers: outHeaders });
    }

    // ---- Vídeo / áudio / binário: stream direto
    Object.entries(corsHeaders(request.headers.get('Origin'))).forEach(
      ([k, v]) => outHeaders.set(k, v)
    );
    outHeaders.delete('content-security-policy');
    outHeaders.delete('content-security-policy-report-only');
    outHeaders.delete('x-frame-options');
    outHeaders.delete('permissions-policy');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: outHeaders,
    });
  },
};

// -------- helpers ----------
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers':
      'Range, Accept, Origin, Content-Type, If-Modified-Since, If-None-Match',
    'Access-Control-Expose-Headers':
      'Content-Length, Content-Range, Accept-Ranges, Content-Type, Cache-Control',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
function plain(code, msg) { return new Response(msg, { status: code, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders('*') } }); }
function html(code, body) { return new Response(body, { status: code, headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders('*') } }); }
function looksLikeM3U8(path, accept) {
  const p = path.toLowerCase();
  if (p.endsWith('.m3u8') || p.endsWith('.m3u')) return true;
  if (/mpegurl|m3u8?|application\/(x-)?mpegurl/i.test(accept)) return true;
  return false;
}
function pickByExt(path, vlc, kodi) {
  const p = path.toLowerCase();
  if (p.endsWith('.m3u') || p.endsWith('.m3u8') || p.endsWith('.xml') || p.endsWith('.xmltv')) return vlc;
  if (p.endsWith('.ts') || p.endsWith('.m4s') || p.endsWith('.aac') || p.endsWith('.mp4') || p.endsWith('.mkv')) return kodi;
  return vlc;
}

function rewriteM3U8(body, baseUrl, workerBase) {
  const base = new URL(baseUrl);
  const lines = body.split('\n');
  const out = new Array(lines.length);
  for (let i = 0; i < lines.length; i++) {
    let ln = lines[i];
    const cr = ln.charCodeAt(ln.length - 1) === 13;
    if (cr) ln = ln.slice(0, -1);

    // URI="..." em EXT-X-KEY, EXT-X-MAP, EXT-X-SESSION-KEY, EXT-X-I-FRAME-STREAM-INF
    const attrUri = ln.match(/^(#[A-Z0-9-]+:.*?URI=)"([^"]*)"/);
    if (attrUri) {
      const resolved = resolveRef(attrUri[2], base);
      const proxied = workerBase + '?' + PROXY_QUERY + '=' + encodeURIComponent(resolved);
      ln = `${attrUri[1]}"${escAttr(proxied)}"` + ln.substring(attrUri[0].length);
      out[i] = cr ? ln + '\r' : ln;
      continue;
    }

    // Linha comentário vazia ou directive
    if (ln.length === 0 || ln.charCodeAt(0) === 35) {
      out[i] = cr ? ln + '\r' : ln;
      continue;
    }

    // URI de playlist/segmento
    const t = ln.trim();
    if (t.length > 0) {
      const resolved = resolveRef(t, base);
      const proxied = workerBase + '?' + PROXY_QUERY + '=' + encodeURIComponent(resolved);
      out[i] = cr ? proxied + '\r' : proxied;
      continue;
    }

    out[i] = cr ? ln + '\r' : ln;
  }
  return out.join('\n');
}

function resolveRef(ref, base) {
  try {
    const u = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(ref) ? new URL(ref) : new URL(ref, base);
    // Remove porta redundante (p1fast bloqueia Host: dominio:80 -> erro 1003)
    if (
      (u.protocol === 'http:' && u.port === '80') ||
      (u.protocol === 'https:' && u.port === '443')
    ) {
      u.port = '';
    }
    return u.toString();
  } catch { return ref; }
}
function escAttr(v) { return v.replace(/"/g, '%22'); }
