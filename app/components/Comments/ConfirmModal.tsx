"use client";

import React, { useState, useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Xác nhận xóa",
  cancelLabel = "Hủy",
  isLoading = false,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 250); // Khớp với time của animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-6 ${isClosing ? "pointer-events-none" : ""}`}
      onClick={handleClose}
    >
      <div 
        className={`absolute inset-0 bg-black/80 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      />
      <div
        className={`relative bg-[#1a1c1e] border border-white/10 rounded-2xl p-8 w-full max-max-w-[400px] text-center ${
          isClosing ? "animate-pop-out" : "animate-pop-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">{title}</h3>
        <p className="modal-msg">{message}</p>
        <div className="modal-actions">
          <button
            className="btn-cancel"
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className="btn-confirm-delete"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
