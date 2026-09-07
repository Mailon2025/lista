import { useParams, useNavigate } from 'react-router-dom';
import { Play, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { cn } from '@/lib/utils';
import { SeriesPoster } from '@/components/content/SeriesPoster';
import { useState } from 'react';

export function SeriesDetailPage() {
  const { seriesName } = useParams<{ seriesName: string }>();
  const navigate = useNavigate();
  const { getSeriesByName } = usePlaylist();
  const { addToHistory } = useFavorites();

  const series = seriesName ? getSeriesByName(decodeURIComponent(seriesName)) : null;
  const [selectedSeason, setSelectedSeason] = useState(1);

  if (!series) {
    return (
      <MainLayout title="Série não encontrada" showBack>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Série não encontrada</p>
        </div>
      </MainLayout>
    );
  }

  const currentSeason = series.seasons.find((s) => s.number === selectedSeason);
  const episodes = currentSeason?.episodes || [];

  const handlePlayEpisode = (episodeId: string) => {
    const episode = episodes.find((e) => e.id === episodeId);
    if (episode) {
      addToHistory(episode);
      navigate(`/watch/${episodeId}`);
    }
  };

  return (
    <MainLayout title={series.name} showBack>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <div className="w-full md:w-48 lg:w-56 flex-shrink-0">
            <div className="aspect-poster bg-card rounded-xl overflow-hidden">
              <SeriesPoster
                seriesName={series.name}
                originalLogo={series.poster}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {series.name}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{series.seasons.length} temporadas</span>
              <span>•</span>
              <span>
                {series.seasons.reduce((acc, s) => acc + s.episodes.length, 0)}{' '}
                episódios
              </span>
            </div>

            {/* Season Selector */}
            <div className="flex flex-wrap gap-2">
              {series.seasons.map((season) => (
                <button
                  key={season.number}
                  onClick={() => setSelectedSeason(season.number)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    selectedSeason === season.number
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-card-hover'
                  )}
                >
                  T{season.number}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Episodes List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Temporada {selectedSeason}
          </h2>

          <div className="space-y-2">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => handlePlayEpisode(episode.id)}
                className="w-full flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-card-hover transition-colors group"
              >
                {/* Episode number */}
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary transition-colors">
                  <span className="text-sm font-bold text-foreground group-hover:text-primary-foreground">
                    {episode.seriesInfo?.episode || '?'}
                  </span>
                </div>

                {/* Episode info */}
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-foreground line-clamp-1">
                    {episode.seriesInfo?.episodeTitle || episode.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    S{episode.seriesInfo?.season.toString().padStart(2, '0')}E
                    {episode.seriesInfo?.episode.toString().padStart(2, '0')}
                  </p>
                </div>

                {/* Play button */}
                <div className="p-2 rounded-full bg-secondary group-hover:bg-primary transition-colors">
                  <Play className="w-5 h-5 text-foreground group-hover:text-primary-foreground fill-current" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
