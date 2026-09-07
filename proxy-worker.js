// Cloudflare Worker — proxy HTTP->HTTPS para lista M3U, EPG e streams de vídeo.
// Uso: https://SEU-WORKER.workers.dev/?url=http://endereco-original-completo

export default {
  async fetch(request) {
    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get("url");

    if (!target) {
      return new Response("Parâmetro ?url= ausente.", { status: 400 });
    }

    // Repassa Range (necessário para o player conseguir buscar trechos do vídeo)
    const upstreamHeaders = new Headers();
    const range = request.headers.get("Range");
    if (range) upstreamHeaders.set("Range", range);
    // Muitos painéis IPTV bloqueiam pedidos sem um User-Agent de player reconhecido
    upstreamHeaders.set("User-Agent", "VLC/3.0.20 LibVLC/3.0.20");

    let upstream;
    try {
      upstream = await fetch(target, { headers: upstreamHeaders });
    } catch (err) {
      return new Response("Falha ao buscar o recurso original: " + err.message, { status: 502 });
    }

    const headers = new Headers(upstream.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Headers", "Range");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  },
};
