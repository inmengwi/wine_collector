import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  CakeIcon,
  FaceSmileIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { Header } from '../components/layout';
import { WineCard } from '../components/wine';
import { Loading, EmptyState, Button, Badge } from '../components/common';
import { recommendationService, aiSettingsService } from '../services';
import type { RecommendationResult, RecommendationRequest } from '../types';

type QueryType = 'food' | 'occasion' | 'mood';

const queryTypeOptions: { type: QueryType; label: string; icon: React.ElementType; placeholder: string }[] = [
  { type: 'food', label: '음식', icon: FireIcon, placeholder: '예: 스테이크, 파스타, 치즈...' },
  { type: 'occasion', label: '상황', icon: CakeIcon, placeholder: '예: 생일 파티, 기념일, 비즈니스 디너...' },
  { type: 'mood', label: '기분', icon: FaceSmileIcon, placeholder: '예: 가볍게, 진한 맛, 달콤한...' },
];

const quickSuggestions = [
  '스테이크',
  '파스타',
  '해산물',
  '치즈',
  '디저트',
  '피자',
  '바베큐',
  '아시안 음식',
];

export function RecommendPage() {
  const [queryType, setQueryType] = useState<QueryType>('food');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<RecommendationResult | null>(null);

  const selectedOption = queryTypeOptions.find((o) => o.type === queryType)!;

  const { data: aiSettings } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: () => aiSettingsService.getSettings(),
  });

  const recommendMutation = useMutation({
    mutationFn: (request: RecommendationRequest) =>
      recommendationService.getRecommendations(request),
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      console.error('Recommendation error:', error);
      alert('추천을 가져오는데 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleSearch = () => {
    if (!query.trim()) return;

    recommendMutation.mutate({
      query: query.trim(),
      query_type: queryType,
      preferences: {
        prioritize_expiring: true,
        max_results: 5,
      },
    });
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    recommendMutation.mutate({
      query: suggestion,
      query_type: 'food',
      preferences: {
        prioritize_expiring: true,
        max_results: 5,
      },
    });
  };

  const handleReset = () => {
    setQuery('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="와인 추천" showSettings />

      <div className="p-4 space-y-6">
        {/* Search Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          {/* Query Type Tabs */}
          <div className="flex gap-2 mb-4">
            {queryTypeOptions.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setQueryType(type)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  queryType === type
                    ? 'bg-wine-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={selectedOption.placeholder}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full mt-3"
            onClick={handleSearch}
            isLoading={recommendMutation.isPending}
            disabled={!query.trim()}
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            추천받기
          </Button>
        </div>

        {/* Quick Suggestions */}
        {!result && queryType === 'food' && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">빠른 선택</h3>
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-wine-300 hover:text-wine-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {recommendMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loading size="lg" />
            <p className="mt-4 text-gray-600">AI가 최적의 와인을 찾고 있습니다...</p>
            <p className="text-sm text-gray-400 mt-1">잠시만 기다려주세요</p>
          </div>
        )}

        {/* Results */}
        {result && !recommendMutation.isPending && (
          <div className="space-y-4">
            {/* Query Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-wine-600" />
                <span className="font-medium text-gray-900">"{result.query}" 추천 결과</span>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-wine-600 hover:text-wine-700"
              >
                다시 검색
              </button>
            </div>

            {/* General Advice */}
            {result.general_advice && (
              <div className="bg-wine-50 rounded-lg p-4">
                <p className="text-sm text-wine-800">{result.general_advice}</p>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 ? (
              <div className="space-y-4">
                {result.recommendations.map((rec) => (
                  <div key={rec.user_wine.id} className="space-y-2">
                    <WineCard wine={rec.user_wine} />
                    <div className="px-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={rec.match_score >= 0.8 ? 'success' : rec.match_score >= 0.6 ? 'warning' : 'default'}
                          size="sm"
                        >
                          {Math.round(rec.match_score * 100)}% 매칭
                        </Badge>
                        {rec.drinking_urgency === 'drink_now' && (
                          <Badge variant="danger" size="sm">지금 마시기</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{rec.reason}</p>
                      {rec.pairing_tips && (
                        <p className="text-xs text-gray-500 italic">{rec.pairing_tips}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<SparklesIcon className="h-12 w-12" />}
                title="적합한 와인을 찾지 못했습니다"
                description={result.no_match_alternatives || '다른 검색어로 다시 시도해보세요'}
              />
            )}
          </div>
        )}

        {/* Empty State - No search yet */}
        {!result && !recommendMutation.isPending && (
          <div className="bg-white rounded-xl p-6 text-center">
            <SparklesIcon className="h-12 w-12 text-wine-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">AI 와인 추천</h3>
            <p className="text-sm text-gray-500 mt-1">
              음식, 상황, 기분을 입력하면<br />
              셀러에서 가장 잘 어울리는 와인을 추천해드려요
            </p>
            {aiSettings && (
              <p className="text-xs text-gray-400 mt-3">
                추천 모델: {aiSettings.recommendation.provider} / {aiSettings.recommendation.model}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
