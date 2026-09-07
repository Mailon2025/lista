export interface ProxyOptions {
  customWorkerUrl?: string;
}

export function needsStreamProxy(url: string): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.protocol !== 'https:') return false;
  return /^http:\/\//i.test(url);
}

function normalizeRedundantPort(u: string): string {
  // p1fast.com:80 bloqueia em alguns nginx com Host: dominio:80. Removemos porta redundante.
  try {
    const p = new URL(u);
    if ((p.protocol === 'http:' && p.port === '80') || (p.protocol === 'https:' && p.port === '443')) {
      p.port = '';
      return p.toString();
    }
    return u;
  } catch {
    return u;
  }
}

/**
 * Wraps a raw media / playlist / segment URL through the configured proxy chain.
 * Only wraps when the page is HTTPS and the target is HTTP (Mixed Content).
 * Uses custom Cloudflare Worker FIRST if provided, because it does M3U8 URL
 * rewriting + VLC User-Agent spoofing on the edge.
 */
export function resolveStreamUrl(url: string, opts: ProxyOptions = {}): string {
  const clean = normalizeRedundantPort(url);

  if (!needsStreamProxy(clean)) return clean;

  if (opts.customWorkerUrl && opts.customWorkerUrl.trim()) {
    let base = opts.customWorkerUrl.trim();
    if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}url=${encodeURIComponent(clean)}`;
  }

  return `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(clean)}`;
}

/**
 * Given an M3U8/HLS playlist body and the URL it was fetched from,
 * rewrites any relative or absolute internal URI references so that
 * they all go through the proxy too. Used client-side as a last-resort
 * when the edge worker hasn't done the rewrite itself.
 */
export function rewriteM3U8Uris(body: string, baseUrl: string, opts: ProxyOptions = {}): string {
  if (!body.includes('#EXTM3U') && !body.includes('#EXTINF')) return body;

  const base = safeUrl(baseUrl);
  if (!base) return body;

  const lines = body.split('\n');
  const out: string[] = new Array(lines.length);

  for (let i = 0; i < lines.length; i++) {
    let raw = lines[i];
    let ln = raw.trimEnd();

    // Lines that end with \r
    const cr = ln.charCodeAt(ln.length - 1) === 13;
    if (cr) ln = ln.slice(0, -1);

    // URI attribute in #EXT-X-KEY, #EXT-X-MAP, #EXT-X-SESSION-KEY
    const attrUri = ln.match(/^(#[A-Z0-9-]+:.*?URI=)"([^"]*)"/);
    if (attrUri) {
      const resolved = resolveUri(attrUri[2], base);
      const proxied = resolveStreamUrl(resolved, opts);
      ln = `${attrUri[1]}"${escapeAttr(proxied)}"` + ln.substring(attrUri[0].length);
      out[i] = cr ? ln + '\r' : ln;
      continue;
    }

    // Non-comment non-empty line = segment URI OR media playlist URI OR variant playlist
    if (ln.length > 0 && ln.charCodeAt(0) !== 35 /* '#' */) {
      const trimmed = ln.trim();
      if (trimmed.length > 0) {
        const resolved = resolveUri(trimmed, base);
        out[i] = resolveStreamUrl(resolved, opts) + (cr ? '\r' : '');
        continue;
      }
    }

    out[i] = raw;
  }

  return out.join('\n');
}

function safeUrl(u: string): URL | null {
  try { return new URL(u); } catch { return null; }
}

function resolveUri(ref: string, base: URL): string {
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(ref)) return ref; // absolute
  try { return new URL(ref, base).toString(); } catch { return ref; }
}

function escapeAttr(v: string): string {
  return v.replace(/"/g, '%22');
}
