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
      }, 200); // Khớp với time của animation
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
      className={`modal-overlay ${isClosing ? "is-closing" : ""}`} 
      onClick={handleClose}
    >
      <div 
        className={`modal-content ${isClosing ? "is-closing" : ""}`} 
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
