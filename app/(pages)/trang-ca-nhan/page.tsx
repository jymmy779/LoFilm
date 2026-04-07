import React, { Suspense } from 'react';
import ProfileContent from '@/app/(pages)/trang-ca-nhan/ProfileContent';

export const metadata = {
  title: 'Trang cá nhân | LoFilm',
  description: 'Quản lý tài khoản, lịch sử xem phim và danh sách yêu thích của bạn tại LoFilm.',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f1115]" />}>
        <ProfileContent />
    </Suspense>
  );
}
