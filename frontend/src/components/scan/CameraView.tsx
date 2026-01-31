import { useRef, useEffect, useState, useCallback } from 'react';
import { CameraIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button, Loading } from '../common';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  mode?: 'single' | 'batch';
}

export function CameraView({ onCapture, onClose, mode = 'single' }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setError('카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.');
      setIsLoading(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(imageData);
  };

  const toggleCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={handleClose} className="p-2 text-white">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <span className="text-white font-medium">
          {mode === 'batch' ? '일괄 스캔' : '와인 스캔'}
        </span>
        <button onClick={toggleCamera} className="p-2 text-white">
          <ArrowPathIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Camera View */}
      <div className="relative h-full flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loading size="lg" text="카메라 연결 중..." className="text-white" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center">
              <CameraIcon className="h-12 w-12 text-white/50 mx-auto mb-4" />
              <p className="text-white mb-4">{error}</p>
              <Button variant="outline" onClick={startCamera}>
                다시 시도
              </Button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scan Guide Overlay */}
        {!isLoading && !error && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-8 border-2 border-white/30 rounded-lg">
              <div className="absolute -top-px -left-px w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
              <div className="absolute -top-px -right-px w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
              <div className="absolute -bottom-px -left-px w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
              <div className="absolute -bottom-px -right-px w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
            </div>
            <p className="absolute top-20 left-0 right-0 text-center text-white text-sm">
              와인 라벨이 프레임 안에 오도록 위치해주세요
            </p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <button
          onClick={handleCapture}
          disabled={isLoading || !!error}
          className="w-20 h-20 rounded-full bg-white border-4 border-wine-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 rounded-full bg-wine-600" />
        </button>
      </div>
    </div>
  );
}
