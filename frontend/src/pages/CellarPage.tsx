import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CameraIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { Header } from '../components/layout';
import { WineCard, WineListItem, WineFilter } from '../components/wine';
import { Loading, EmptyState } from '../components/common';
import { wineService, tagService } from '../services';
import type { TagType, WineFilterParams } from '../types';

type ViewMode = 'grid' | 'list';

export function CellarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(
    searchParams.get('tag_id')
  );

  const hasExplicitStatusClear = searchParams.get('status_cleared') === '1';

  const filters: WineFilterParams = useMemo(() => ({
    type: searchParams.get('type') as WineFilterParams['type'] || undefined,
    status:
      (searchParams.get('status') as WineFilterParams['status'])
      || (hasExplicitStatusClear ? undefined : 'owned'),
    country: searchParams.get('country') || undefined,
    drinking_window: searchParams.get('drinking_window') as WineFilterParams['drinking_window'] || undefined,
    search: searchQuery || undefined,
    tag_id: selectedTag || undefined,
  }), [searchParams, searchQuery, selectedTag, hasExplicitStatusClear]);

  const includeAllStatuses = hasExplicitStatusClear && !filters.status;

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getTags(),
  });

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['user-wines', filters],
    queryFn: ({ pageParam = 1 }) =>
      wineService.getUserWines({
        ...filters,
        include_all_statuses: includeAllStatuses || undefined,
        page: pageParam,
        size: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  const wines = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const handleFilterChange = (newFilters: WineFilterParams) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    if (!newFilters.status) {
      params.set('status_cleared', '1');
    }

    setSearchParams(params);
  };

  const handleTagSelect = (tagId: string | null) => {
    setSelectedTag(tagId === selectedTag ? null : tagId);
  };

  const tagTypeOrder: Record<TagType, number> = {
    cellar: 0,
    location: 1,
    custom: 2,
  };
  const allTags = useMemo(
    () =>
      (tags?.tags ?? [])
        .slice()
        .sort((a, b) => {
          const typeOrderDiff = tagTypeOrder[a.type] - tagTypeOrder[b.type];
          if (typeOrderDiff !== 0) return typeOrderDiff;
          return a.sort_order - b.sort_order;
        }),
    [tags]
  );
  const initialTagCount = 6;
  const hasMoreTags = allTags.length > initialTagCount;
  const selectedTagItem = selectedTag
    ? allTags.find((tag) => tag.id === selectedTag) ?? null
    : null;
  const visibleTags = useMemo(() => {
    if (showAllTags) {
      return allTags;
    }

    const baseTags = allTags.slice(0, initialTagCount);
    if (selectedTagItem && !baseTags.some((tag) => tag.id === selectedTagItem.id)) {
      return [...baseTags, selectedTagItem];
    }
    return baseTags;
  }, [allTags, showAllTags, selectedTagItem]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="와인 셀러" showSettings />

      <div className="sticky top-14 z-30 bg-gray-50 border-b border-gray-200">
        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="와인 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
            />
          </div>
        </div>

        {/* Filter & View Controls */}
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WineFilter
              filters={filters}
              onChange={handleFilterChange}
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <ListBulletIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <Squares2X2Icon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="px-4 py-2">
            <div className="flex items-start gap-2">
              <div
                className={`flex gap-2 ${
                  showAllTags ? 'flex-wrap' : 'overflow-x-auto'
                }`}
              >
                <button
                  onClick={() => handleTagSelect(null)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    !selectedTag
                      ? 'bg-wine-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  전체
                </button>
                {visibleTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagSelect(tag.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      selectedTag === tag.id
                        ? 'bg-wine-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                    <span className="text-xs opacity-70">({tag.wine_count})</span>
                  </button>
                ))}
              </div>
              {hasMoreTags && (
                <button
                  onClick={() => setShowAllTags((prev) => !prev)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200"
                >
                  {showAllTags ? '접기' : '더보기'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Wine List */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" text="와인 목록을 불러오는 중..." />
          </div>
        ) : wines.length === 0 ? (
          <EmptyState
            icon={<TagIcon className="h-12 w-12" />}
            title="등록된 와인이 없습니다"
            description={
              Object.keys(filters).some((k) => filters[k as keyof WineFilterParams])
                ? '필터 조건에 맞는 와인이 없습니다'
                : '와인을 스캔해서 셀러에 추가해보세요'
            }
            action={
              <Link
                to="/scan"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-wine-600 rounded-lg hover:bg-wine-700"
              >
                <CameraIcon className="h-4 w-4 mr-2" />
                와인 스캔하기
              </Link>
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {wines.map((wine) => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
            {wines.map((wine) => (
              <WineListItem key={wine.id} wine={wine} />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasNextPage && (
          <div className="mt-4 text-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-4 py-2 text-sm font-medium text-wine-600 hover:text-wine-700 disabled:opacity-50"
            >
              {isFetchingNextPage ? '로딩 중...' : '더 보기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
