import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { SearchBar } from '@/components/content/SearchBar';
import { CategoryFilter } from '@/components/content/CategoryFilter';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { SeriesPoster } from '@/components/content/SeriesPoster';
import { useState, useMemo } from 'react';
import { SeriesGroup } from '@/types/playlist';
import { Play, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SeriesPage() {
  const navigate = useNavigate();
  const { playlist, isLoading } = usePlaylist();
  const series = playlist?.series || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    series.forEach((s) => {
      if (s.group) cats.add(s.group);
    });
    return Array.from(cats).sort();
  }, [series]);

  const filteredSeries = useMemo(() => {
    let result = series;

    if (selectedCategory) {
      result = result.filter((s) => s.group === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(term));
    }

    return result;
  }, [series, searchTerm, selectedCategory]);

  const handleSeriesClick = (seriesItem: SeriesGroup) => {
    navigate(`/series/${encodeURIComponent(seriesItem.name)}`);
  };

  return (
    <MainLayout title="Séries" showBack>
      <div className="space-y-6">
        {/* Search */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar séries..."
        />

        {/* Categories */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-poster bg-secondary rounded-lg mb-2" />
                <div className="h-4 bg-secondary rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm
                ? `Nenhum resultado para "${searchTerm}"`
                : 'Nenhuma série disponível'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredSeries.map((seriesItem) => (
              <SeriesCard
                key={seriesItem.name}
                series={seriesItem}
                onClick={() => handleSeriesClick(seriesItem)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function SeriesCard({
  series,
  onClick,
}: {
  series: SeriesGroup;
  onClick: () => void;
}) {
  const totalEpisodes = series.seasons.reduce(
    (acc, s) => acc + s.episodes.length,
    0
  );

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="content-card group"
    >
      {/* Poster */}
      <div className="aspect-poster relative bg-background-tertiary overflow-hidden">
        <SeriesPoster
          seriesName={series.name}
          originalLogo={series.poster}
          className="w-full h-full object-cover"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-3 rounded-full bg-primary">
            <Play className="w-6 h-6 text-primary-foreground fill-current" />
          </div>
        </div>

        {/* Season count badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium bg-black/70 text-foreground">
          {series.seasons.length} temp. • {totalEpisodes} ep.
        </div>
      </div>

      {/* Title */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground line-clamp-2">
          {series.name}
        </h3>
      </div>
    </div>
  );
}
