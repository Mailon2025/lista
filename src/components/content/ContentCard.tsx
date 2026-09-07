import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Play, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Channel } from '@/types/playlist';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useParental } from '@/contexts/ParentalContext';
import { ParentalLockOverlay, ParentalBadge } from '@/components/settings/ParentalControl';

interface ContentCardProps {
  channel: Channel;
  aspectRatio?: 'video' | 'poster';
  showCategory?: boolean;
}

export function ContentCard({
  channel,
  aspectRatio = 'video',
  showCategory = true,
}: ContentCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isContentBlocked } = useParental();
  const [showPinModal, setShowPinModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isBlocked = isContentBlocked(channel.name, channel.group);
  const isFav = isFavorite(channel.id);

  const handleClick = () => {
    if (isBlocked) {
      setShowPinModal(true);
      return;
    }
    navigateToChannel();
  };

  const navigateToChannel = () => {
    if (channel.type === 'series' && channel.seriesInfo) {
      navigate(`/series/${encodeURIComponent(channel.seriesInfo.seriesName)}`);
    } else {
      navigate(`/watch/${channel.id}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(channel);
  };

  const handleUnlock = () => {
    setShowPinModal(false);
    navigateToChannel();
  };

  return (
    <>
      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        aria-label={`Assistir ${channel.name}`}
        className="content-card group relative"
      >
        {/* Image */}
        <div
          className={cn(
            'relative bg-background-tertiary overflow-hidden',
            aspectRatio === 'video' ? 'aspect-video-wide' : 'aspect-poster'
          )}
        >
          {channel.logo && !imageError ? (
            <img
              src={channel.logo}
              alt={`Logo de ${channel.name}`}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-8 h-8 text-muted-foreground/50" />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isBlocked ? (
              <Lock className="w-10 h-10 text-foreground" />
            ) : (
              <div className="p-3 rounded-full bg-primary">
                <Play className="w-6 h-6 text-primary-foreground fill-current" />
              </div>
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            className={cn(
              'absolute top-2 right-2 p-2 rounded-full transition-all z-10',
              'opacity-0 group-hover:opacity-100',
              isFav
                ? 'bg-primary text-primary-foreground opacity-100'
                : 'bg-black/50 text-foreground hover:bg-black/70'
            )}
            aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star
              className={cn('w-4 h-4', isFav && 'fill-current')}
            />
          </button>

          {/* Parental block overlay */}
          {isBlocked && <ParentalBadge />}

          {/* Category badge */}
          {showCategory && channel.group && (
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium bg-black/70 text-foreground">
              {channel.group}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-foreground line-clamp-2">
            {channel.name}
          </h3>
        </div>
      </div>

      {/* Parental PIN Modal */}
      <ParentalLockOverlay
        isOpen={showPinModal}
        onUnlock={handleUnlock}
        onCancel={() => setShowPinModal(false)}
      />
    </>
  );
}
