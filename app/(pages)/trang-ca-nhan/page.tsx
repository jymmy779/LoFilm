import React, { Suspense } from 'react';
import ProfileContent from '@/app/(pages)/trang-ca-nhan/ProfileContent';

export const metadata = {
  title: 'Trang cá nhân | LoFilm',
  description: 'Quản lý tài khoản, lịch sử xem phim và danh sách yêu thích của bạn tại LoFilm.',
};

import ProfileSkeleton from './components/ProfileSkeleton';

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
    </Suspense>
  );
}
