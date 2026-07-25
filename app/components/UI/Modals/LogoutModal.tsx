"use client";

import { LogOut } from "lucide-react";
import CommonModal from "./CommonModal";

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Xác nhận đăng xuất?"
            message="Bạn có chắc chắn muốn kết thúc phiên làm việc này không? Mọi thay đổi chưa lưu sẽ bị mất."
            confirmText="Đăng xuất"
            cancelText="Hủy bỏ"
            icon={LogOut}
            variant="danger"
        />
    );
}
