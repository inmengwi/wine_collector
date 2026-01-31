import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CameraIcon,
  ArchiveBoxIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Header } from '../components/layout';
import { WineCard, WineListItem } from '../components/wine';
import { Loading, EmptyState, Badge } from '../components/common';
import { dashboardService, wineService } from '../services';
import { useAuthStore } from '../stores';

export function HomePage() {
  const { user } = useAuthStore();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['cellar-summary'],
    queryFn: () => dashboardService.getCellarSummary(),
  });

  const { data: expiring, isLoading: expiringLoading } = useQuery({
    queryKey: ['expiring-wines'],
    queryFn: () => dashboardService.getExpiringWines(),
  });

  const { data: recentWines, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-wines'],
    queryFn: () => wineService.getUserWines({ size: 5, sort: 'created_at', order: 'desc' }),
  });

  const isLoading = summaryLoading || expiringLoading || recentLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="로딩 중..." />
      </div>
    );
  }

  const urgentCount = expiring?.urgent?.length || 0;
  const soonCount = expiring?.soon?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Wine Collector" showSettings />

      <div className="px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-wine-700 to-wine-900 rounded-2xl p-5 text-white">
          <h2 className="text-lg font-semibold">
            안녕하세요{user?.name ? `, ${user.name}님` : ''}!
          </h2>
          <p className="text-wine-200 text-sm mt-1">
            오늘은 어떤 와인을 드실까요?
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{summary?.total_bottles || 0}</div>
              <div className="text-xs text-wine-200">보유 병</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{summary?.total_wines || 0}</div>
              <div className="text-xs text-wine-200">와인 종류</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{summary?.consumed_this_month || 0}</div>
              <div className="text-xs text-wine-200">이번 달 소비</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            to="/scan"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-wine-200 transition-colors"
          >
            <div className="w-12 h-12 bg-wine-100 rounded-full flex items-center justify-center">
              <CameraIcon className="h-6 w-6 text-wine-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">스캔</span>
          </Link>

          <Link
            to="/cellar"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-wine-200 transition-colors"
          >
            <div className="w-12 h-12 bg-wine-100 rounded-full flex items-center justify-center">
              <ArchiveBoxIcon className="h-6 w-6 text-wine-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">셀러</span>
          </Link>

          <Link
            to="/recommend"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-wine-200 transition-colors"
          >
            <div className="w-12 h-12 bg-wine-100 rounded-full flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-wine-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">추천</span>
          </Link>
        </div>

        {/* Expiring Wines Alert */}
        {(urgentCount > 0 || soonCount > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">음용 시기 알림</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {urgentCount > 0 && `${urgentCount}병의 와인이 빨리 마셔야 합니다. `}
                  {soonCount > 0 && `${soonCount}병의 와인이 곧 최적 시기가 됩니다.`}
                </p>
                <Link
                  to="/cellar?drinking_window=urgent"
                  className="inline-flex items-center text-sm font-medium text-yellow-800 mt-2 hover:underline"
                >
                  확인하기
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Wine by Type */}
        {summary?.by_type && Object.keys(summary.by_type).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">종류별 와인</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Object.entries(summary.by_type).map(([type, data]) => (
                <Link
                  key={type}
                  to={`/cellar?type=${type}`}
                  className="flex-shrink-0 px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-wine-300 transition-colors"
                >
                  <div className="text-lg font-semibold text-wine-700">{data.bottles}</div>
                  <div className="text-xs text-gray-500 capitalize">{type}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Additions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">최근 추가</h3>
            <Link to="/cellar" className="text-sm text-wine-600 hover:text-wine-700">
              전체 보기
            </Link>
          </div>

          {recentWines?.items && recentWines.items.length > 0 ? (
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
              {recentWines.items.map(wine => (
                <WineListItem key={wine.id} wine={wine} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ArchiveBoxIcon className="h-12 w-12" />}
              title="아직 등록된 와인이 없습니다"
              description="와인을 스캔해서 셀러에 추가해보세요"
              action={
                <Link
                  to="/scan"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-wine-600 rounded-lg hover:bg-wine-700"
                >
                  <CameraIcon className="h-4 w-4 mr-2" />
                  와인 스캔하기
                </Link>
              }
              className="bg-white rounded-xl border border-gray-200 py-8"
            />
          )}
        </div>
      </div>
    </div>
  );
}
