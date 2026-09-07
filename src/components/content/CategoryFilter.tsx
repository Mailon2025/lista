import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll selected category into view
  useEffect(() => {
    if (selectedCategory && scrollRef.current) {
      const selectedElement = scrollRef.current.querySelector(
        `[data-category="${selectedCategory}"]`
      );
      selectedElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedCategory]);

  if (categories.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mb-2"
    >
      {/* All button */}
      <button
        onClick={() => onSelectCategory(null)}
        className={cn(
          'category-pill whitespace-nowrap flex-shrink-0',
          selectedCategory === null && 'active'
        )}
      >
        Todos
      </button>

      {/* Category buttons */}
      {categories.map((category) => (
        <button
          key={category}
          data-category={category}
          onClick={() => onSelectCategory(category)}
          className={cn(
            'category-pill whitespace-nowrap flex-shrink-0',
            selectedCategory === category && 'active'
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
