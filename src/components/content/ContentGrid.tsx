import { Channel } from '@/types/playlist';
import { ContentCard } from './ContentCard';
import { EmptyState } from '@/components/common/ErrorMessage';
import { ContentSkeleton } from '@/components/common/LoadingSpinner';
import { Search, Film } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ContentGridProps {
  channels: Channel[];
  isLoading?: boolean;
  aspectRatio?: 'video' | 'poster';
  emptyMessage?: string;
  searchTerm?: string;
}

export function ContentGrid({
  channels,
  isLoading = false,
  aspectRatio = 'video',
  emptyMessage = 'Nenhum conteúdo disponível',
  searchTerm,
}: ContentGridProps) {
  const [visibleCount, setVisibleCount] = useState(50);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(50);
  }, [channels]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 50, channels.length));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [channels.length]);

  if (isLoading) {
    return <ContentSkeleton count={12} />;
  }

  if (channels.length === 0) {
    if (searchTerm) {
      return (
        <EmptyState
          icon={Search}
          title="Nenhum resultado encontrado"
          message={`Nenhum resultado para "${searchTerm}"`}
        />
      );
    }

    return (
      <EmptyState
        icon={Film}
        title="Nenhum conteúdo"
        message={emptyMessage}
      />
    );
  }

  const visibleChannels = channels.slice(0, visibleCount);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {visibleChannels.map((channel) => (
          <ContentCard
            key={channel.id}
            channel={channel}
            aspectRatio={aspectRatio}
          />
        ))}
      </div>
      {visibleCount < channels.length && (
        <div ref={observerTarget} className="h-20 w-full flex justify-center items-center p-4">
           <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </>
  );
}
