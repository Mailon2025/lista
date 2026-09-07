import { MainLayout } from '@/components/layout/MainLayout';
import { ContentGrid } from '@/components/content/ContentGrid';
import { SearchBar } from '@/components/content/SearchBar';
import { CategoryFilter } from '@/components/content/CategoryFilter';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useSearch } from '@/hooks/useSearch';

export function LiveTVPage() {
  const { playlist, isLoading } = usePlaylist();
  const channels = playlist?.liveTV || [];

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredItems,
  } = useSearch(channels);

  return (
    <MainLayout title="TV Aberta" showBack>
      <div className="space-y-6">
        {/* Search */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar canais..."
        />

        {/* Categories */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Grid */}
        <ContentGrid
          channels={filteredItems}
          isLoading={isLoading}
          searchTerm={searchTerm}
          emptyMessage="Nenhum canal disponível nesta categoria"
        />
      </div>
    </MainLayout>
  );
}
