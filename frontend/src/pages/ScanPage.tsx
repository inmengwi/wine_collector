import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  CameraIcon,
  PhotoIcon,
  Squares2X2Icon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Header } from '../components/layout';
import { CameraView, ScanResultCard } from '../components/scan';
import { Button, Loading, Modal } from '../components/common';
import { scanService, wineService } from '../services';
import { useScanStore } from '../stores';
import type { ScanResult, UserWineCreateRequest } from '../types';

type ScanMode = 'single' | 'batch' | 'continuous';

export function ScanPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('single');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const { isScanning, setIsScanning } = useScanStore();

  const scanMutation = useMutation({
    mutationFn: async (imageData: string) => {
      // Convert base64 to blob
      const res = await fetch(imageData);
      const blob = await res.blob();
      const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
      return scanService.scanWine(file);
    },
    onSuccess: (result) => {
      setScanResult(result);
      setShowCamera(false);
      setIsScanning(false);
    },
    onError: (error) => {
      console.error('Scan error:', error);
      setIsScanning(false);
      alert('와인 스캔에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const addWineMutation = useMutation({
    mutationFn: (request: UserWineCreateRequest) => wineService.createUserWine(request),
    onSuccess: (result) => {
      navigate(`/wine/${result.id}`);
    },
    onError: (error) => {
      console.error('Add wine error:', error);
      alert('와인 추가에 실패했습니다.');
    },
  });

  const handleCapture = (imageData: string) => {
    setIsScanning(true);
    scanMutation.mutate(imageData);
  };

  const handleConfirm = () => {
    if (!scanResult) return;

    // If an existing wine was found, use its ID; otherwise send the scanned wine data
    if (scanResult.existing_wine_id) {
      addWineMutation.mutate({
        wine_id: scanResult.existing_wine_id,
        quantity: 1,
      });
    } else {
      addWineMutation.mutate({
        wine_overrides: {
          name: scanResult.wine.name,
          producer: scanResult.wine.producer,
          vintage: scanResult.wine.vintage,
          grape_variety: scanResult.wine.grape_variety,
          region: scanResult.wine.region,
          country: scanResult.wine.country,
          type: scanResult.wine.type,
        },
        quantity: 1,
      });
    }
  };

  const handleRetry = () => {
    setScanResult(null);
    setShowCamera(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const result = await scanService.scanWine(file);
      setScanResult(result);
    } catch (error) {
      console.error('Scan error:', error);
      alert('와인 스캔에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsScanning(false);
    }
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

  if (scanResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="스캔 결과" showBack />
        <div className="p-4">
          <ScanResultCard
            result={scanResult}
            onConfirm={handleConfirm}
            onEdit={() => setShowEditModal(true)}
            onRetry={handleRetry}
          />
        </div>

        {/* Edit Modal - simplified for now */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="와인 정보 수정"
          size="lg"
        >
          <p className="text-gray-500">수정 기능은 추후 구현 예정입니다.</p>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShowEditModal(false)}>확인</Button>
          </div>
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
              onClick={() => setScanMode('single')}
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
              onClick={() => setScanMode('batch')}
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
              onClick={() => setScanMode('continuous')}
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
