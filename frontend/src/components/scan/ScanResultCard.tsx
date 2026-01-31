import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { WineTypeIcon, Badge } from '../common';
import { getWineTypeLabel, formatVintage } from '../../lib/utils';
import type { ScanResult } from '../../types';

interface ScanResultCardProps {
  result: ScanResult;
  onConfirm: () => void;
  onEdit: () => void;
  onRetry: () => void;
}

export function ScanResultCard({ result, onConfirm, onEdit, onRetry }: ScanResultCardProps) {
  const { wine, confidence, is_duplicate } = result;
  const isLowConfidence = confidence < 0.7;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Image Preview */}
      <div className="relative h-48 bg-gray-100">
        <img
          src={result.image_url}
          alt="Scanned wine"
          className="w-full h-full object-contain"
        />

        {/* Confidence Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant={confidence >= 0.8 ? 'success' : confidence >= 0.6 ? 'warning' : 'danger'}>
            {Math.round(confidence * 100)}% 일치
          </Badge>
        </div>

        {/* Duplicate Warning */}
        {is_duplicate && (
          <div className="absolute bottom-0 left-0 right-0 bg-yellow-500/90 text-white px-4 py-2 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">이미 보유 중인 와인입니다</span>
          </div>
        )}
      </div>

      {/* Wine Info */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-wine-50 rounded-full flex items-center justify-center">
            <WineTypeIcon type={wine.type} size="md" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{wine.name}</h3>
            {wine.producer && (
              <p className="text-sm text-gray-600">{wine.producer}</p>
            )}
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <span>{formatVintage(wine.vintage)}</span>
              <span className="text-gray-300">|</span>
              <span>{getWineTypeLabel(wine.type)}</span>
              {wine.region && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{wine.region}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Grape Varieties */}
        {wine.grape_variety && wine.grape_variety.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">품종</p>
            <p className="text-sm text-gray-700">{wine.grape_variety.join(', ')}</p>
          </div>
        )}

        {/* Food Pairing */}
        {wine.food_pairing && wine.food_pairing.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">음식 페어링</p>
            <div className="flex flex-wrap gap-1">
              {wine.food_pairing.slice(0, 5).map((food, idx) => (
                <Badge key={idx} size="sm" variant="default">{food}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Low Confidence Warning */}
        {isLowConfidence && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              인식 정확도가 낮습니다. 정보를 확인하고 필요시 수정해주세요.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            다시 스캔
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-wine-700 bg-wine-50 rounded-lg hover:bg-wine-100 transition-colors"
          >
            수정
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-wine-600 rounded-lg hover:bg-wine-700 transition-colors flex items-center justify-center gap-1"
          >
            <CheckCircleIcon className="h-4 w-4" />
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
