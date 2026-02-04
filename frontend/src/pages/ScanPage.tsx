import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CameraIcon,
  PhotoIcon,
  Squares2X2Icon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Header } from '../components/layout';
import { CameraView, ScanResultCard } from '../components/scan';
import { Button, Loading, Modal } from '../components/common';
import { scanService, wineService, tagService } from '../services';
import { useScanStore } from '../stores';
import type {
  BatchScanResult,
  ScanResult,
  UserWineCreateRequest,
  ScannedWine,
  WineType,
} from '../types';

type ScanMode = 'single' | 'batch' | 'continuous';

const WINE_TYPES: { value: WineType; label: string }[] = [
  { value: 'red', label: '레드' },
  { value: 'white', label: '화이트' },
  { value: 'rose', label: '로제' },
  { value: 'sparkling', label: '스파클링' },
  { value: 'dessert', label: '디저트' },
  { value: 'fortified', label: '주정강화' },
  { value: 'other', label: '기타' },
];

export function ScanPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedWine, setEditedWine] = useState<ScannedWine | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const {
    mode: scanMode,
    setMode: setScanMode,
    isScanning,
    setScanning,
    batchResult,
    setBatchResult,
    continuousResults,
    addContinuousResult,
    clearContinuousResults,
    continuousSessionActive,
    setContinuousSessionActive,
  } = useScanStore();

  // Fetch cellar tags for selection
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getTags(),
  });

  const cellarTags = tagsData?.tags.filter((t) => t.type === 'cellar') || [];

  const scanMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const res = await fetch(imageData);
      const blob = await res.blob();
      const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });

      if (scanMode === 'batch') {
        return scanService.scanBatch(file);
      }
      return scanService.scanSingle(file);
    },
    onSuccess: (result) => {
      if (scanMode === 'batch') {
        setBatchResult(result as BatchScanResult);
      } else if (scanMode === 'continuous') {
        addContinuousResult(result as ScanResult);
        setContinuousSessionActive(true);
      } else {
        setScanResult(result as ScanResult);
      }

      setShowCamera(false);
      setScanning(false);
    },
    onError: (error) => {
      console.error('Scan error:', error);
      setScanning(false);
      alert('와인 스캔에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const addWineMutation = useMutation({
    mutationFn: (request: UserWineCreateRequest) => wineService.createWine(request),
    onSuccess: (result) => {
      navigate(`/wine/${result.id}`);
    },
    onError: (error) => {
      console.error('Add wine error:', error);
      alert('와인 추가에 실패했습니다.');
    },
  });

  const handleCapture = (imageData: string) => {
    if (scanMode === 'batch') {
      setBatchResult(null);
    }
    if (scanMode === 'single') {
      setScanResult(null);
    }
    setScanning(true);
    scanMutation.mutate(imageData);
  };

  const handleConfirm = () => {
    if (!scanResult) return;

    const baseRequest: UserWineCreateRequest = {
      quantity: 1,
      tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    };

    // If an existing wine was found, use its ID; otherwise send the scanned wine data
    if (scanResult.existing_wine_id) {
      addWineMutation.mutate({
        ...baseRequest,
        wine_id: scanResult.existing_wine_id,
      });
    } else {
      addWineMutation.mutate({
        ...baseRequest,
        wine_overrides: {
          name: scanResult.wine.name,
          producer: scanResult.wine.producer,
          vintage: scanResult.wine.vintage,
          grape_variety: scanResult.wine.grape_variety,
          region: scanResult.wine.region,
          country: scanResult.wine.country,
          type: scanResult.wine.type,
        },
      });
    }
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleRetry = () => {
    setScanResult(null);
    setSelectedTagIds([]);
    setShowCamera(true);
  };

  const handleContinuousNext = () => {
    setShowCamera(true);
  };

  const handleContinuousFinish = () => {
    setContinuousSessionActive(false);
    clearContinuousResults();
  };

  const handleOpenEdit = () => {
    if (scanResult) {
      setEditedWine({ ...scanResult.wine });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = () => {
    if (scanResult && editedWine) {
      setScanResult({
        ...scanResult,
        wine: editedWine,
        existing_wine_id: null, // Clear existing wine ID since user edited the data
      });
      setShowEditModal(false);
    }
  };

  const handleEditFieldChange = (field: keyof ScannedWine, value: string | number | null) => {
    if (editedWine) {
      setEditedWine({ ...editedWine, [field]: value });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      if (scanMode === 'batch') {
        setBatchResult(null);
        const result = await scanService.scanBatch(file);
        setBatchResult(result);
      } else {
        setScanResult(null);
        const result = await scanService.scanSingle(file);
        if (scanMode === 'continuous') {
          addContinuousResult(result);
          setContinuousSessionActive(true);
        } else {
          setScanResult(result);
        }
      }
    } catch (error) {
      console.error('Scan error:', error);
      alert('와인 스캔에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setScanning(false);
    }
  };

  const handleModeChange = (mode: ScanMode) => {
    setScanMode(mode);
    setScanResult(null);
    setSelectedTagIds([]);
    setBatchResult(null);
    clearContinuousResults();
    setContinuousSessionActive(mode === 'continuous');
  };

  if (showCamera) {
    return (
      <CameraView
        onCapture={handleCapture}
        onClose={() => setShowCamera(false)}
        mode={scanMode === 'batch' ? 'batch' : 'single'}
      />
    );
  }

  if (isScanning || scanMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-gray-600">와인을 분석하고 있습니다...</p>
          <p className="text-sm text-gray-400 mt-1">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (scanMode === 'batch' && batchResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="일괄 스캔 결과" showBack />
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">스캔 요약</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">감지</p>
                <p className="text-xl font-semibold text-gray-900">
                  {batchResult.total_detected}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-600">성공</p>
                <p className="text-xl font-semibold text-green-700">
                  {batchResult.successfully_recognized}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-sm text-red-600">실패</p>
                <p className="text-xl font-semibold text-red-700">{batchResult.failed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">세부 결과</h3>
            <div className="space-y-3">
              {batchResult.wines.map((item) => (
                <div
                  key={item.index}
                  className={`rounded-lg border p-3 ${
                    item.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        #{item.index + 1}{' '}
                        {item.wine?.name ? `· ${item.wine.name}` : '인식 실패'}
                      </p>
                      {item.wine?.producer && (
                        <p className="text-xs text-gray-600">{item.wine.producer}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        item.status === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {item.status === 'success' ? '성공' : '실패'}
                    </span>
                  </div>
                  {item.status === 'success' && (
                    <p className="mt-2 text-xs text-gray-600">
                      신뢰도: {item.confidence ? `${Math.round(item.confidence * 100)}%` : '-'}
                    </p>
                  )}
                  {item.status === 'failed' && item.error && (
                    <p className="mt-2 text-xs text-red-700">사유: {item.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              setBatchResult(null);
              setShowCamera(true);
            }}
          >
            다시 스캔하기
          </Button>
        </div>
      </div>
    );
  }

  if (scanMode === 'continuous' && (continuousResults.length > 0 || continuousSessionActive)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="연속 스캔" showBack />
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">연속 스캔 진행 중</h2>
            <p className="text-sm text-gray-600">
              촬영한 결과가 누적됩니다. 다음 스캔을 이어가거나 종료할 수 있어요.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={handleContinuousNext}>
                다음 촬영
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                갤러리에서 선택
              </Button>
            </div>
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={handleContinuousFinish}
            >
              연속 스캔 종료
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {continuousResults.length > 0 ? (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                누적 결과 ({continuousResults.length})
              </h3>
              <div className="space-y-3">
                {continuousResults.map((result, index) => (
                  <div
                    key={`${result.scan_id}-${index}`}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {index + 1}. {result.wine.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {result.wine.producer || '생산자 정보 없음'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      신뢰도: {Math.round(result.confidence * 100)}%
                      {result.is_duplicate ? ' · 중복 가능성 있음' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 shadow-sm text-center text-sm text-gray-500">
              아직 스캔된 결과가 없습니다. 첫 촬영을 진행해주세요.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (scanResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="스캔 결과" showBack />
        <div className="p-4 space-y-4">
          <ScanResultCard
            result={scanResult}
            onConfirm={handleConfirm}
            onEdit={handleOpenEdit}
            onRetry={handleRetry}
          />

          {/* Cellar Tag Selection */}
          {cellarTags.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                셀러 선택
                {selectedTagIds.length > 0 && (
                  <span className="ml-2 text-wine-600">
                    ({selectedTagIds.length}개 선택됨)
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap gap-2">
                {cellarTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTagSelection(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'ring-2 ring-offset-1 ring-wine-500'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: tag.color,
                        color: '#fff',
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                와인 등록 시 견출지 번호가 자동으로 생성됩니다
              </p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="와인 정보 수정"
          size="lg"
        >
          {editedWine && (
            <div className="space-y-4">
              {/* Wine Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  와인 이름 *
                </label>
                <input
                  type="text"
                  value={editedWine.name}
                  onChange={(e) => handleEditFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
                  required
                />
              </div>

              {/* Producer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  생산자
                </label>
                <input
                  type="text"
                  value={editedWine.producer || ''}
                  onChange={(e) => handleEditFieldChange('producer', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
                />
              </div>

              {/* Vintage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  빈티지
                </label>
                <input
                  type="number"
                  value={editedWine.vintage || ''}
                  onChange={(e) => handleEditFieldChange('vintage', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>

              {/* Wine Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  와인 종류
                </label>
                <select
                  value={editedWine.type}
                  onChange={(e) => handleEditFieldChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
                >
                  {WINE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  지역
                </label>
                <input
                  type="text"
                  value={editedWine.region || ''}
                  onChange={(e) => handleEditFieldChange('region', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  국가
                </label>
                <input
                  type="text"
                  value={editedWine.country || ''}
                  onChange={(e) => handleEditFieldChange('country', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
                />
              </div>

              {/* Grape Variety */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  품종 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={editedWine.grape_variety?.join(', ') || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const varieties = value ? value.split(',').map(v => v.trim()).filter(v => v) : null;
                    setEditedWine({ ...editedWine, grape_variety: varieties });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
                  placeholder="예: 카베르네 소비뇽, 메를로"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSaveEdit}
                  disabled={!editedWine.name}
                >
                  저장
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="와인 스캔" showBack />

      <div className="p-4 space-y-6">
        {/* Scan Mode Selection */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">스캔 모드</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleModeChange('single')}
              className={`p-3 rounded-lg border text-center transition-colors ${
                scanMode === 'single'
                  ? 'border-wine-500 bg-wine-50 text-wine-700'
                  : 'border-gray-200 text-gray-600 hover:border-wine-200'
              }`}
            >
              <CameraIcon className="h-6 w-6 mx-auto mb-1" />
              <span className="text-xs font-medium">단일</span>
            </button>
            <button
              onClick={() => handleModeChange('batch')}
              className={`p-3 rounded-lg border text-center transition-colors ${
                scanMode === 'batch'
                  ? 'border-wine-500 bg-wine-50 text-wine-700'
                  : 'border-gray-200 text-gray-600 hover:border-wine-200'
              }`}
            >
              <Squares2X2Icon className="h-6 w-6 mx-auto mb-1" />
              <span className="text-xs font-medium">일괄</span>
            </button>
            <button
              onClick={() => handleModeChange('continuous')}
              className={`p-3 rounded-lg border text-center transition-colors ${
                scanMode === 'continuous'
                  ? 'border-wine-500 bg-wine-50 text-wine-700'
                  : 'border-gray-200 text-gray-600 hover:border-wine-200'
              }`}
            >
              <ArrowPathIcon className="h-6 w-6 mx-auto mb-1" />
              <span className="text-xs font-medium">연속</span>
            </button>
          </div>
        </div>

        {/* Scan Options */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => setShowCamera(true)}
          >
            <CameraIcon className="h-5 w-5 mr-2" />
            카메라로 스캔하기
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <PhotoIcon className="h-5 w-5 mr-2" />
            갤러리에서 선택하기
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Scan Tips */}
        <div className="bg-wine-50 rounded-xl p-4">
          <h3 className="font-medium text-wine-900 mb-2">스캔 팁</h3>
          <ul className="text-sm text-wine-700 space-y-1">
            <li>• 와인 라벨이 잘 보이도록 촬영해주세요</li>
            <li>• 밝은 곳에서 촬영하면 인식률이 높아집니다</li>
            <li>• 라벨 전체가 프레임에 들어오도록 해주세요</li>
            <li>• 일괄 모드는 여러 병을 한번에 스캔할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
