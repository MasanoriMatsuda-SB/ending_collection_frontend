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

  useEffect(() => {
    setIsCameraOpen(isOpen);
    return () => setIsCameraOpen(false);
  }, [isOpen, setIsCameraOpen]);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    const byteString = atob(imageSrc.split(',')[1]);
    const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const file = new File([ab], 'capture.jpg', { type: mimeString });
    onCapture(file);
  }, [onCapture]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="
          bg-white rounded-lg shadow-lg 
          w-full max-w-xl 
          max-h-[90vh] flex flex-col overflow-hidden
        "
      >
        {/* video area が伸び縮みする */}
        <div className="flex-1 overflow-hidden">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{ width: 1280, height: 720, facingMode: 'environment' }}
          />
        </div>

        {/* ボタンは常に画面内下部に固定 */}
        <div
          className="
            flex justify-center gap-4 
            p-4 
            border-t border-gray-200 
            bg-white 
            sticky bottom-0 
            /* iOS Safe Area 対応 */
            pb-[env(safe-area-inset-bottom)]
          "
        >
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
  );
}