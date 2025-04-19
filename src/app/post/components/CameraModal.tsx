// src/app/post/components/CameraModal.tsx
'use client';

import { useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useCamera } from '../../context/CameraContext';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const { setIsCameraOpen } = useCamera();

  // モーダル open/close に合わせてコンテキストを更新
  useEffect(() => {
    setIsCameraOpen(isOpen);
    return () => {
      // クリーンアップで閉じる
      setIsCameraOpen(false);
    };
  }, [isOpen, setIsCameraOpen]);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    const byteString = atob(imageSrc.split(',')[1]);
    const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const file = new File([ab], 'capture.jpg', { type: mimeString });
    onCapture(file);
  }, [onCapture]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-2xl w-full">
        <div className="space-y-4">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full rounded"
            videoConstraints={{ width: 1280, height: 720, facingMode: 'environment' }}
          />
          <div className="flex justify-center gap-4">
            <button
              onClick={capture}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              撮影
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
