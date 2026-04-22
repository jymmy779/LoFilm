"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import CommonModal from "./CommonModal";

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

export default function ComingSoonModal({
    isOpen,
    onClose,
    title = "Tính năng sắp ra mắt!",
    message = "Chúng mình đang nỗ lực hoàn thiện tính năng này để mang lại trải nghiệm tốt nhất cho bạn. Hãy quay lại sau nhé!"
}: ComingSoonModalProps) {
    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            message={message}
            cancelText="Đã hiểu thưa Sếp!"
            icon={Sparkles}
            variant="warning"
        />
    );
}
