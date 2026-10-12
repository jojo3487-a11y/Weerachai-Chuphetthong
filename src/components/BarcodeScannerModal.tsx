import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Scan, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  products: Product[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  products,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualCode('');
      setCameraError(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์กล้อง หรือใช้ปุ่มทดสอบด้านล่าง');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const handleQuickTest = (barcode: string) => {
    onScan(barcode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base">สแกนเนอร์บาร์โค้ด</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Camera Viewfinder */}
          <div className="relative aspect-4/3 bg-stone-950 rounded-xl overflow-hidden flex flex-col items-center justify-center text-stone-400">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-2 border-dashed border-amber-400/80 m-8 rounded-lg pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-full h-0.5 bg-rose-500 shadow-xs shadow-rose-400 animate-bounce" />
                </div>
                <div className="absolute bottom-2 text-xs text-white/90 bg-black/50 px-2 py-1 rounded">
                  ส่องบาร์โค้ดให้อยู่ในกรอบ
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-3">
                <Camera className="w-10 h-10 mx-auto text-stone-500" />
                <p className="text-xs text-stone-400">
                  {cameraError || 'เปิดกล้องเพื่อสแกนบาร์โค้ดจริง หรือพิมพ์รหัสบาร์โค้ด'}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-lg transition-colors cursor-pointer"
                >
                  เปิดกล้องสแกน
                </button>
              </div>
            )}
          </div>

          {/* Manual Input */}
          <form onSubmit={handleSubmitManual} className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="พิมพ์เลขบาร์โค้ด หรือยิงเครื่องสแกน..."
              className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg transition-colors cursor-pointer"
            >
              ค้นหา/เพิ่ม
            </button>
          </form>

          {/* Quick Click Simulation for Convenience */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>ทดสอบยิงบาร์โค้ดด่วน (Quick Barcode Click):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {products.slice(0, 6).map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleQuickTest(prod.barcode)}
                  className="p-2 text-left border border-stone-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer truncate"
                >
                  <p className="font-medium text-stone-800 truncate">{prod.name}</p>
                  <p className="text-stone-400 font-mono text-[11px]">{prod.barcode}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
