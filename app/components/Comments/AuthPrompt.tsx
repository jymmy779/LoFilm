/* app/components/Comments/AuthPrompt.tsx */
"use client";

import TransitionLink from "@/app/components/Transition/TransitionLink";
import { User } from "lucide-react";

export default function AuthPrompt() {
    return (
        <div className="auth-prompt">
            <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-amber-400/10 rounded-full flex items-center justify-center text-amber-400">
                    <User size={24} />
                </div>
            </div>
            <h4 className="text-white font-bold text-lg mb-2">Tham gia bình luận</h4>
            <p>Vui lòng đăng nhập để gửi ý kiến của bạn về bộ phim này!</p>
            <TransitionLink
                href="/dang-nhap"
                className="btn-login-prompt"
            >
                Đăng nhập ngay
            </TransitionLink>
        </div>
    );
}
