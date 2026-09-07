import { useEffect, useRef, useState, useCallback } from 'react';
import Hls, {
  type Loader,
  type LoaderCallbacks,
  type LoaderConfiguration,
  type LoaderContext,
  type LoaderStats,
  type FragmentLoaderContext,
} from 'hls.js';
import { resolveStreamUrl, rewriteM3U8Uris, type ProxyOptions } from '@/utils/streamProxy';
import { useSettings } from '@/contexts/SettingsContext';

export interface UseVideoPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  error: string | null;
  isLoading: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  seekForward: (seconds?: number) => void;
  seekBackward: (seconds?: number) => void;
}

type AnyCtx = LoaderContext | FragmentLoaderContext;

function makeHlsLoader(proxyOpts: ProxyOptions): new (config: Hls['config']) => Loader<AnyCtx> {
  return class ProxiedLoader implements Loader<AnyCtx> {
    private controller: AbortController | null = null;
    context: AnyCtx | null = null;
    stats: LoaderStats = {
      aborted: false,
      loaded: 0,
      retry: 0,
      total: 0,
      chunkCount: 0,
      bwEstimate: 0,
      loading: { start: 0, first: 0, end: 0 },
      parsing: { start: 0, end: 0 },
      buffering: { start: 0, first: 0, end: 0 },
    };

    destroy(): void {
      this.controller?.abort();
      this.controller = null;
    }

    abort(): void {
      this.stats.aborted = true;
      this.controller?.abort();
      this.controller = null;
    }

    load(
      context: AnyCtx,
      _config: LoaderConfiguration,
      callbacks: LoaderCallbacks<AnyCtx>,
      _networkDetails?: unknown
    ): void {
      this.context = context;
      this.stats = {
        aborted: false,
        loaded: 0,
        retry: 0,
        total: 0,
        chunkCount: 0,
        bwEstimate: 0,
        loading: { start: 0, first: 0, end: 0 },
        parsing: { start: 0, end: 0 },
        buffering: { start: 0, first: 0, end: 0 },
      };

      const abort = new AbortController();
      this.controller = abort;

      const rawUrl: string = (context as any).url ?? (context as any).uri;
      const isPlaylist =
        (context as any).type === 'manifest' ||
        (context as any).type === 'level' ||
        rawUrl.includes('.m3u8');

      const proxied = resolveStreamUrl(rawUrl, proxyOpts);
      const baseForRewrite = rawUrl;
      this.stats.loading.start = performance.now();

      fetch(proxied, {
        signal: abort.signal,
        credentials: 'omit',
      })
        .then(async (res) => {
          this.stats.loading.first = performance.now();

          if (!res.ok) {
            const total = parseInt(res.headers.get('Content-Length') || '0', 10);
            this.stats.total = total || this.stats.loaded;
            callbacks.onError(
              { code: (res.status as any) ?? 1000, text: res.statusText ?? 'Network error' } as any,
              context,
              null as any,
              this.stats
            );
            return;
          }

          if (isPlaylist) {
            const text = await res.text();
            const payload = rewriteM3U8Uris(text, baseForRewrite, proxyOpts);
            this.stats.loaded = payload.length;
            const totalHdr = parseInt(res.headers.get('Content-Length') || '0', 10);
            this.stats.total = totalHdr || payload.length;
            this.stats.loading.end = performance.now();
            callbacks.onSuccess(
              {
                url: proxied,
                data: payload as any,
                code: res.status as any,
              } as any,
              this.stats,
              context,
              null as any
            );
          } else {
            const buf = await res.arrayBuffer();
            this.stats.loaded = buf.byteLength;
            const totalHdr = parseInt(res.headers.get('Content-Length') || '0', 10);
            this.stats.total = totalHdr || buf.byteLength;
            this.stats.loading.end = performance.now();
            callbacks.onSuccess(
              {
                url: proxied,
                data: buf as any,
                code: res.status as any,
              } as any,
              this.stats,
              context,
              null as any
            );
          }
        })
        .catch((err) => {
          this.stats.loading.end = performance.now();
          if (err?.name === 'AbortError') {
            this.stats.aborted = true;
            callbacks.onAbort?.(this.stats, context, null as any);
          } else {
            callbacks.onError(
              { code: 1000 as any, text: err?.message ?? 'Network error' } as any,
              context,
              null as any,
              this.stats
            );
          }
        });
    }
  };
}

async function retryDirectStreamAsFetch(
  video: HTMLVideoElement,
  rawUrl: string,
  proxyOpts: ProxyOptions,
  setIsLoading: (v: boolean) => void,
  setError: (v: string | null) => void,
  _isHls: boolean
) {
  try {
    setIsLoading(true);
    const proxied = resolveStreamUrl(rawUrl, proxyOpts);
    const res = await fetch(proxied, {
      headers: { Accept: '*/*' },
      credentials: 'omit',
    });
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status} ${res.statusText || ''}`);
    }

    const contentType = res.headers.get('Content-Type') || '';
    // HLS: tenta jogar o body reescrito como blob no src
    if (contentType.includes('mpegurl') || rawUrl.toLowerCase().includes('.m3u8')) {
      const text = rewriteM3U8Uris(await res.text(), rawUrl, proxyOpts);
      const blob = new Blob([text], { type: 'application/vnd.apple.mpegurl' });
      const blobUrl = URL.createObjectURL(blob);
      video.src = blobUrl;
      video.addEventListener('loadedmetadata', () => setIsLoading(false), { once: true });
      video.play().catch(() => {});
      return;
    }

    // MP4 / AVI / MKV / etc: tenta src do blob primeiro se não der erro de memória.
    // Usa resposta direta primeiro (stream via blob só se tamanho < 2GB — unsafe de outra forma)
    // Usamos blob URL (não recomendado para +2GB; fallback src normal ainda é tentado antes)
    const contentLen = parseInt(res.headers.get('Content-Length') || '0', 10);
    if (contentLen > 0 && contentLen < 3 * 1024 * 1024 * 1024 /* <3GB */) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      video.src = blobUrl;
      video.addEventListener('loadedmetadata', () => setIsLoading(false), { once: true });
      video.play().catch(() => {});
      return;
    }
    throw new Error('Arquivo muito grande para fetch client-side (>3GB)');
  } catch (e) {
    setIsLoading(false);
    const msg = e instanceof Error ? e.message : String(e);
    setError(`Erro no stream (fallback): ${msg || 'desconhecido'}`);
  }
}

export function useVideoPlayer(url: string): UseVideoPlayerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const { settings } = useSettings();
  const proxyOpts: ProxyOptions = { customWorkerUrl: settings.customWorkerUrl || undefined };

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setIsLoading(true);
    setError(null);

    const isHLS = url.includes('.m3u8') || url.includes('m3u8');
    const ProxiedHlsLoader = makeHlsLoader(proxyOpts);

    if (Hls.isSupported() && isHLS) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        loader: ProxiedHlsLoader,
        fLoader: ProxiedHlsLoader as any,
        pLoader: ProxiedHlsLoader as any,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          const detail = data.details ?? '';
          setError(
            data.response?.code
              ? `Erro no stream (HTTP ${data.response.code})`
              : `Erro ao carregar o stream: ${detail}` || 'Erro ao carregar o stream'
          );
          setIsLoading(false);
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHLS) {
      video.src = resolveStreamUrl(url, proxyOpts);
      const onMeta = () => {
        setIsLoading(false);
        video.play().catch(() => {});
      };
      const onErr = () => retryDirectStreamAsFetch(video, url, proxyOpts, setIsLoading, setError, true);
      video.addEventListener('loadedmetadata', onMeta);
      video.addEventListener('error', onErr);
      return () => {
        video.removeEventListener('loadedmetadata', onMeta);
        video.removeEventListener('error', onErr);
      };
    } else {
      video.src = resolveStreamUrl(url, proxyOpts);
      const onMeta = () => {
        setIsLoading(false);
        video.play().catch(() => {});
      };
      const onErr = () => retryDirectStreamAsFetch(video, url, proxyOpts, setIsLoading, setError, isHLS);
      video.addEventListener('loadedmetadata', onMeta);
      video.addEventListener('error', onErr);
      return () => {
        video.removeEventListener('loadedmetadata', onMeta);
        video.removeEventListener('error', onErr);
      };
    }
  }, [url, settings.customWorkerUrl]);

  // Time update and state handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setProgress(video.currentTime);
      setDuration(video.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolumeState(video.volume);
      setIsMuted(video.muted);
    };
    const handleError = () => {
      setError('Erro ao reproduzir o vídeo');
      setIsLoading(false);
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current?.paused) {
      play();
    } else {
      pause();
    }
  }, [play, pause]);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, newVolume));
      if (newVolume > 0) {
        videoRef.current.muted = false;
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const seekForward = useCallback((seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + seconds
      );
    }
  }, []);

  const seekBackward = useCallback((seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        videoRef.current.currentTime - seconds
      );
    }
  }, []);

  return {
    videoRef,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    isFullscreen,
    error,
    isLoading,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    seekForward,
    seekBackward,
  };
}
