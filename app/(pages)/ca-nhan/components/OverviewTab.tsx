"use client";

import React from "react";
import { User, Clock, Trophy } from "lucide-react";
import SettingsTab from "./SettingsTab";

interface OverviewTabProps {
  user: any;
  displayName: string;
  setShowPremiumModal: (show: boolean) => void;
  isEditMode?: boolean;
  newName?: string;
  setNewName?: (value: string) => void;
  isUpdating?: boolean;
  handleUpdateName?: () => void;
  password?: string;
  setPassword?: (value: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (value: string) => void;
  handleDirectUpdatePassword?: () => void;
  handleDeleteAccount?: () => void;
  watchRank?: number | null;
  totalWatchTime?: number;
}

export default function OverviewTab({ 
  user, 
  displayName, 
  setShowPremiumModal,
  isEditMode,
  newName,
  setNewName,
  isUpdating,
  handleUpdateName,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  handleDirectUpdatePassword,
  handleDeleteAccount,
  watchRank,
  totalWatchTime
}: OverviewTabProps) {
  const [isEditingName, setIsEditingName] = React.useState(true);
  const [isChangingPassword, setIsChangingPassword] = React.useState(true);
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : "Đang cập nhật";

  if (isEditMode) {
    return (
      <SettingsTab 
        user={user}
        newName={newName || ""}
        setNewName={setNewName || (() => {})}
        isEditingName={isEditingName}
        setIsEditingName={setIsEditingName}
        isUpdating={isUpdating || false}
        handleUpdateName={handleUpdateName || (() => {})}
        isChangingPassword={isChangingPassword}
        setIsChangingPassword={setIsChangingPassword}
        password={password || ""}
        setPassword={setPassword || (() => {})}
        confirmPassword={confirmPassword || ""}
        setConfirmPassword={setConfirmPassword || (() => {})}
        handleDirectUpdatePassword={handleDirectUpdatePassword || (() => {})}
        handleDeleteAccount={handleDeleteAccount || (() => {})}
      />
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm p-6 space-y-6">
      <div>
        <p className="text-xs text-zinc-600 uppercase font-bold tracking-widest mb-3">Thông tin cá nhân</p>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-600">Họ và tên</p>
              <p className="text-sm text-zinc-200 font-medium">{displayName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D497FF]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#D497FF] text-xs font-bold">@</span>
            </div>
            <div>
              <p className="text-xs text-zinc-600">Email</p>
              <p className="text-sm text-zinc-200 font-medium">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-600">Thành viên từ</p>
              <p className="text-sm text-zinc-200 font-medium">{joinDate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <p className="text-xs text-zinc-600 uppercase font-bold tracking-widest mb-3">Xếp hạng toàn thời gian</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-600/10 border border-[#D497FF]/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-400">{watchRank ? `Top ${watchRank}` : "Chưa có hạng"}</p>
            <p className="text-xs text-zinc-600">{totalWatchTime ? `${Math.floor(totalWatchTime / 60)} phút` : "Chưa có dữ liệu phút"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
