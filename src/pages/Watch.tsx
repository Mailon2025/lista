import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, X, SkipBack, SkipForward, Loader2, FastForward, Rewind, ExternalLink, Copy, Film } from 'lucide-react';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { normalizeRedundantPort } from '@/utils/streamProxy';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function WatchPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { getChannelById, getSeriesByName } = usePlaylist();
  const { addToHistory } = useFavorites();
  const { toast } = useToast();

  const channel = channelId ? getChannelById(channelId) : null;
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  const {
    videoRef,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    isFullscreen,
    error,
    isLoading,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    seekForward,
    seekBackward,
  } = useVideoPlayer(channel?.url || '');

  // URL DIRETA do vídeo (sem proxy nenhum) — é a única que funciona (IP residencial)
  const directUrl = useMemo(() => {
    if (!channel?.url) return '';
    // Remove porta :80 / :443 redundante (se a URL tiver)
    return normalizeRedundantPort(channel.url);
  }, [channel]);

  // VLC protocol (URI handler para abrir direto no VLC desktop)
  const vlcUrl = useMemo(() => {
    if (!directUrl) return '';
    return 'vlc://' + directUrl.replace(/^https?:\/\//i, '');
  }, [directUrl]);

  const handleCopyUrl = useCallback(() => {
    if (!directUrl) return;
    try {
      navigator.clipboard.writeText(directUrl);
      toast({ title: 'URL copiada!', description: 'Cole no VLC ou no navegador.' });
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  }, [directUrl, toast]);

  const handleOpenNewTab = useCallback(() => {
    if (!directUrl) return;
    // Top-level navigation: navegador NÃO bloqueia Mixed Content aqui, funciona 100%
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  }, [directUrl]);

  const handleOpenVlc = useCallback(() => {
    if (!vlcUrl) return;
    try {
      window.location.href = vlcUrl;
    } catch {
      handleCopyUrl();
    }
  }, [vlcUrl, handleCopyUrl]);

  // Calculate next episode
  const nextEpisode = useMemo(() => {
    if (channel?.type !== 'series' || !channel.seriesInfo) return null;

    const series = getSeriesByName(channel.seriesInfo.seriesName);
    if (!series) return null;

    // Sort seasons to ensure order
    const sortedSeasons = [...series.seasons].sort((a, b) => a.number - b.number);
    
    const currentSeason = sortedSeasons.find(s => s.number === channel.seriesInfo!.season);
    if (!currentSeason) return null;

    const currentEpisodeIndex = currentSeason.episodes.findIndex(e => e.id === channel.id);
    if (currentEpisodeIndex === -1) return null;

    // Check next episode in same season
    if (currentEpisodeIndex < currentSeason.episodes.length - 1) {
      return currentSeason.episodes[currentEpisodeIndex + 1];
    }

    // Check first episode of next season
    const currentSeasonIndex = sortedSeasons.findIndex(s => s.number === currentSeason.number);
    if (currentSeasonIndex < sortedSeasons.length - 1) {
      const nextSeason = sortedSeasons[currentSeasonIndex + 1];
      if (nextSeason.episodes.length > 0) {
        return nextSeason.episodes[0];
      }
    }

    return null;
  }, [channel, getSeriesByName]);

  const handleNextEpisode = useCallback(() => {
    if (nextEpisode) {
      navigate(`/watch/${nextEpisode.id}`);
    }
  }, [nextEpisode, navigate]);

  // Auto-play next episode when ended
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      if (nextEpisode) {
        handleNextEpisode();
      }
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [videoRef, nextEpisode, handleNextEpisode]);

  useEffect(() => {
    if (channel) {
      addToHistory(channel);
    }
  }, [channel, addToHistory]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => setShowControls(false), 3000);
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'm': case 'M': toggleMute(); break;
        case 'ArrowLeft': seekBackward(10); break;
        case 'ArrowRight': seekForward(10); break;
        case 'Escape': if (!isFullscreen) navigate(-1); break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, seekBackward, seekForward, isFullscreen, navigate]);

  if (!channel) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Canal não encontrado</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLive = channel.type === 'live';

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
    >
      <video ref={videoRef} className="w-full h-full object-contain" playsInline />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-10" onClick={(e) => e.stopPropagation()}>
          <div className="text-center max-w-md px-6 space-y-5">
            <div className="mb-2">
              <Film className="w-14 h-14 text-destructive mx-auto mb-3" />
              <p className="text-destructive font-semibold mb-1">Provedor bloqueou proxy de vídeo</p>
              <p className="text-sm text-muted-foreground">
                IPs de servidores (Cloudflare, proxies) são bloqueados no endpoint de vídeo.
                Use teu IP residencial através de uma das opções abaixo — funciona 100%.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 w-full">
              <Button onClick={handleOpenNewTab} className="w-full h-12 btn-primary-gradient text-base">
                <ExternalLink className="w-5 h-5 mr-2" />
                ▶️ Abrir em Nova Aba (recomendado)
              </Button>
              <Button variant="outline" onClick={handleOpenVlc} className="w-full h-12 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300">
                <Film className="w-5 h-5 mr-2" />
                🎬 Abrir no VLC (desktop)
              </Button>
              <Button variant="secondary" onClick={handleCopyUrl} className="w-full h-12">
                <Copy className="w-5 h-5 mr-2" />
                📋 Copiar URL (para colar onde quiser)
              </Button>
            </div>

            <div className="pt-2">
              <button onClick={() => navigate(-1)} className="px-6 py-2 rounded-full border border-border hover:bg-white/5 text-sm text-muted-foreground transition-colors">
                ← Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={cn('player-overlay transition-opacity duration-300', showControls ? 'opacity-100' : 'opacity-0')} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start p-4">
          <h2 className="text-lg font-semibold text-foreground truncate max-w-[70%]">{channel.name}</h2>
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {!isLive && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-foreground w-12">{formatTime(progress)}</span>
              <input type="range" min={0} max={duration || 100} value={progress} onChange={(e) => seek(Number(e.target.value))} className="flex-1 h-1 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full" />
              <span className="text-xs text-foreground w-12 text-right">{formatTime(duration)}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isLive && <button onClick={() => seekBackward(10)} className="p-2 rounded-full hover:bg-white/10"><Rewind className="w-5 h-5 text-foreground" /></button>}
              <button onClick={togglePlay} className="p-3 rounded-full bg-primary hover:bg-primary/80 transition-colors">
                {isPlaying ? <Pause className="w-6 h-6 text-primary-foreground" /> : <Play className="w-6 h-6 text-primary-foreground fill-current" />}
              </button>
              {!isLive && <button onClick={() => seekForward(10)} className="p-2 rounded-full hover:bg-white/10"><FastForward className="w-5 h-5 text-foreground" /></button>}
              
              {/* Next Episode Button */}
              {nextEpisode && (
                 <button onClick={handleNextEpisode} className="p-2 rounded-full hover:bg-white/10 ml-2" title="Próximo Episódio">
                    <SkipForward className="w-5 h-5 text-foreground" />
                 </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/10">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
                </button>
                <input type="range" min={0} max={1} step={0.1} value={isMuted ? 0 : volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-20 h-1 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:rounded-full" />
              </div>
              <button onClick={toggleFullscreen} className="p-2 rounded-full hover:bg-white/10">
                {isFullscreen ? <Minimize className="w-5 h-5 text-foreground" /> : <Maximize className="w-5 h-5 text-foreground" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

