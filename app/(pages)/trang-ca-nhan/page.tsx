import React, { Suspense } from 'react';
import ProfileContent from '@/app/(pages)/trang-ca-nhan/ProfileContent';

export const metadata = {
  title: 'Trang cá nhân | LoFilm',
  description: 'Quản lý tài khoản, lịch sử xem phim và danh sách yêu thích của bạn tại LoFilm.',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#0f1115] pt-32 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/40 mt-4 font-bold uppercase tracking-widest text-xs">Đang tải...</p>
        </div>
    }>
        <ProfileContent />
    </Suspense>
  );
}
