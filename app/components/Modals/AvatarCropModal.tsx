import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Crop, ZoomIn, ZoomOut } from 'lucide-react';
import getCroppedImg from '@/app/utils/cropImage';
import { toast } from 'react-hot-toast';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

export default function AvatarCropModal({ isOpen, onClose, imageSrc, onCropComplete }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    
    try {
      setIsProcessing(true);
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0
      );
      
      if (croppedImageBlob) {
        onCropComplete(croppedImageBlob);
      } else {
        toast.error("Không thể xử lý ảnh. Vui lòng thử lại!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Đã xảy ra lỗi khi cắt ảnh.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-2 sm:p-6 animate-fade-in">
      <div className="bg-[#12151C] w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-5 border-b border-white/10">
          <h3 className="text-base sm:text-lg font-medium text-white flex items-center gap-2">
            <Crop size={18} className="text-amber-400 sm:w-5 sm:h-5" />
            Cắt ảnh đại diện
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-[320px] sm:h-[450px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controls */}
        <div className="p-3 sm:p-5 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <ZoomOut size={18} className="text-white/50 sm:w-5 sm:h-5" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <ZoomIn size={18} className="text-white/50 sm:w-5 sm:h-5" />
          </div>

          <div className="flex justify-end gap-2 sm:gap-3 mt-1 sm:mt-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm bg-amber-400 hover:bg-amber-500 text-black transition-colors flex items-center justify-center min-w-[80px] sm:min-w-[100px]"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                "Lưu"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
