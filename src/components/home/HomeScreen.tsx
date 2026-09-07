import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Film, Clapperboard, History, Star, ChevronRight, Play } from 'lucide-react';
import { CategoryCard } from './CategoryCard';
import { MainLayout } from '@/components/layout/MainLayout';
import { OnboardingScreen } from '@/components/home/OnboardingScreen';
import { ContentCard } from '@/components/content/ContentCard';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Channel } from '@/types/playlist';

export function HomeScreen() {
  const { playlist, isLoading, playlistUrl } = usePlaylist();
  const { getFavoriteChannels, getRecentChannels } = useFavorites();

  // Show onboarding if no playlist is configured or loaded
  if ((!playlistUrl || !playlist) && !isLoading) {
    return <OnboardingScreen />;
  }

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Carregando lista..." />
        </div>
      </MainLayout>
    );
  }

  const allChannels = playlist?.channels || [];
  const favoriteChannels = getFavoriteChannels(allChannels);
  const recentChannels = getRecentChannels(allChannels);

  return (
    <MainLayout>
      <div className="space-y-10">
        {/* Category Cards */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <CategoryCard
              title="TV Aberta"
              count={playlist?.liveTV.length || 0}
              icon={Tv}
              href="/live"
            />
            <CategoryCard
              title="Séries"
              count={playlist?.series.length || 0}
              icon={Clapperboard}
              href="/series"
            />
            <CategoryCard
              title="Filmes"
              count={playlist?.movies.length || 0}
              icon={Film}
              href="/movies"
            />
          </div>
        </section>

        {/* Continue Watching Section */}
        {recentChannels.length > 0 && (
          <ContentSection
            title="Continuar Assistindo"
            icon={History}
            channels={recentChannels}
          />
        )}

        {/* Favorites Section */}
        {favoriteChannels.length > 0 && (
          <ContentSection
            title="Favoritos"
            icon={Star}
            channels={favoriteChannels}
          />
        )}

        {/* Empty state if no playlist loaded */}
        {!playlist && (
          <div className="text-center py-12">
            <Play className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum conteúdo disponível
            </h3>
            <p className="text-muted-foreground">
              Configure sua lista M3U nas configurações para começar a assistir.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function ContentSection({
  title,
  icon: Icon,
  channels,
  viewAllHref,
}: {
  title: string;
  icon: React.ElementType;
  channels: Channel[];
  viewAllHref?: string;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </h2>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {channels.slice(0, 5).map((channel) => (
          <ContentCard key={channel.id} channel={channel} />
        ))}
      </div>
    </section>
  );
}
