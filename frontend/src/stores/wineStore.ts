import { create } from 'zustand';
import type { WineType, WineStatus, Tag } from '@/types';

interface WineFilters {
  status: WineStatus | null;
  type: WineType | null;
  country: string | null;
  grape: string | null;
  tagId: string | null;
  drinkingWindow: 'now' | 'aging' | 'urgent' | null;
  minPrice: number | null;
  maxPrice: number | null;
  search: string;
}

interface WineState {
  // Filters
  filters: WineFilters;
  sort: string;
  order: 'asc' | 'desc';
  viewMode: 'grid' | 'list';

  // Tags cache
  tags: Tag[];

  // Actions
  setFilter: <K extends keyof WineFilters>(key: K, value: WineFilters[K]) => void;
  resetFilters: () => void;
  setSort: (sort: string, order: 'asc' | 'desc') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setTags: (tags: Tag[]) => void;
}

const defaultFilters: WineFilters = {
  status: null,
  type: null,
  country: null,
  grape: null,
  tagId: null,
  drinkingWindow: null,
  minPrice: null,
  maxPrice: null,
  search: '',
};

export const useWineStore = create<WineState>((set) => ({
  filters: defaultFilters,
  sort: 'created_at',
  order: 'desc',
  viewMode: 'list',
  tags: [],

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () =>
    set({
      filters: defaultFilters,
    }),

  setSort: (sort, order) =>
    set({
      sort,
      order,
    }),

  setViewMode: (viewMode) =>
    set({
      viewMode,
    }),

  setTags: (tags) =>
    set({
      tags,
    }),
}));
