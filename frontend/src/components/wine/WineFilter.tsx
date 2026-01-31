import { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Modal } from '../common';
import { getWineTypeLabel } from '../../lib/utils';
import type { WineFilterParams, WineType, WineStatus } from '../../types';

interface WineFilterProps {
  filters: WineFilterParams;
  onChange: (filters: WineFilterParams) => void;
  countries?: string[];
  grapes?: string[];
}

const wineTypes: WineType[] = ['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified'];
const wineStatuses: { value: WineStatus; label: string }[] = [
  { value: 'owned', label: '보유 중' },
  { value: 'consumed', label: '마신 와인' },
  { value: 'gifted', label: '선물한 와인' },
];
const drinkingWindows = [
  { value: 'now', label: '지금 마시기 좋음' },
  { value: 'aging', label: '숙성 중' },
  { value: 'urgent', label: '빨리 마시기' },
];

export function WineFilter({ filters, onChange, countries = [], grapes = [] }: WineFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<WineFilterParams>(filters);

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  const handleOpen = () => {
    setTempFilters(filters);
    setIsOpen(true);
  };

  const handleApply = () => {
    onChange(tempFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempFilters({});
  };

  const updateFilter = (key: keyof WineFilterParams, value: string | undefined) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <FunnelIcon className="h-4 w-4" />
        필터
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-wine-600 text-white rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="필터" size="lg">
        <div className="space-y-6 mt-4">
          {/* Wine Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">와인 종류</label>
            <div className="flex flex-wrap gap-2">
              {wineTypes.map(type => (
                <button
                  key={type}
                  onClick={() => updateFilter('type', tempFilters.type === type ? undefined : type)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    tempFilters.type === type
                      ? 'bg-wine-600 text-white border-wine-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-wine-300'
                  }`}
                >
                  {getWineTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <div className="flex flex-wrap gap-2">
              {wineStatuses.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateFilter('status', tempFilters.status === value ? undefined : value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    tempFilters.status === value
                      ? 'bg-wine-600 text-white border-wine-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-wine-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Drinking Window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">음용 시기</label>
            <div className="flex flex-wrap gap-2">
              {drinkingWindows.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateFilter('drinking_window', tempFilters.drinking_window === value ? undefined : value as 'now' | 'aging' | 'urgent')}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    tempFilters.drinking_window === value
                      ? 'bg-wine-600 text-white border-wine-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-wine-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Country */}
          {countries.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">국가</label>
              <select
                value={tempFilters.country || ''}
                onChange={(e) => updateFilter('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
              >
                <option value="">전체</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          )}

          {/* Grape */}
          {grapes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">품종</label>
              <select
                value={tempFilters.grape || ''}
                onChange={(e) => updateFilter('grape', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
              >
                <option value="">전체</option>
                {grapes.map(grape => (
                  <option key={grape} value={grape}>{grape}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <XMarkIcon className="h-4 w-4 mr-1" />
            초기화
          </Button>
          <Button variant="primary" onClick={handleApply} className="flex-1">
            적용
          </Button>
        </div>
      </Modal>
    </>
  );
}
