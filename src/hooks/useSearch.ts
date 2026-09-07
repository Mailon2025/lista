import { useState, useMemo, useCallback, useEffect } from 'react';
import { Channel } from '@/types/playlist';

export function useSearch(items: Channel[], debounceMs = 300) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Debounce the search term
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, debounceMs]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach(item => {
      if (item.group) {
        cats.add(item.group);
      }
    });
    return Array.from(cats).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by category
    if (selectedCategory) {
      result = result.filter(item => item.group === selectedCategory);
    }

    // Filter by search term
    if (debouncedTerm) {
      const term = debouncedTerm.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.group?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [items, selectedCategory, debouncedTerm]);

  const highlightMatch = useCallback((text: string) => {
    if (!debouncedTerm) return text;
    
    const regex = new RegExp(`(${debouncedTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-primary/30 text-foreground">$1</mark>');
  }, [debouncedTerm]);

  return {
    searchTerm,
    setSearchTerm: handleSearch,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredItems,
    highlightMatch,
  };
}
