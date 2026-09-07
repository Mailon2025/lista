import { MainLayout } from '@/components/layout/MainLayout';
import { ContentGrid } from '@/components/content/ContentGrid';
import { SearchBar } from '@/components/content/SearchBar';
import { CategoryFilter } from '@/components/content/CategoryFilter';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useSearch } from '@/hooks/useSearch';

export function MoviesPage() {
  const { playlist, isLoading } = usePlaylist();
  const movies = playlist?.movies || [];

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredItems,
  } = useSearch(movies);

  return (
    <MainLayout title="Filmes" showBack>
      <div className="space-y-6">
        {/* Search */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar filmes..."
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
          aspectRatio="poster"
          searchTerm={searchTerm}
          emptyMessage="Nenhum filme disponível nesta categoria"
        />
      </div>
    </MainLayout>
  );
}
