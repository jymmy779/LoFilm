"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsTabProps {
  user: any;
  newName: string;
  setNewName: (value: string) => void;
  isEditingName: boolean;
  setIsEditingName: (value: boolean) => void;
  isUpdating: boolean;
  handleUpdateName: () => void;
  isChangingPassword: boolean;
  setIsChangingPassword: (value: boolean) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  handleDirectUpdatePassword: () => void;
  handleDeleteAccount: () => void;
}

export default function SettingsTab({
  user,
  newName,
  setNewName,
  isEditingName,
  setIsEditingName,
  isUpdating,
  handleUpdateName,
  isChangingPassword,
  setIsChangingPassword,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  handleDirectUpdatePassword,
  handleDeleteAccount,
}: SettingsTabProps) {
  return (
    <div className="space-y-10">
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl text-white tracking-tighter uppercase italic">Cài đặt LoFilm+</h1>
        <p className="text-white/40 text-sm mt-1">Quản trị các tùy chọn cá nhân và bảo mật tài khoản.</p>
      </div>

      <div className="space-y-6">
        <div className="p-5 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-sm md:text-base font-bold text-white">Tên hiển thị</h4>
              <p className="text-white/30 text-[10px] md:text-xs">
                Họ tên hiện tại: <span className="text-white/50 font-bold ml-1">{user?.user_metadata?.full_name || "Chưa đặt"}</span>
              </p>
            </div>
            {!isEditingName && (
              <button
                onClick={() => setIsEditingName(true)}
                className="px-4 md:px-5 py-2 bg-white/5 hover:bg-white text-white hover:text-black text-[10px] md:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                Thay đổi
              </button>
            )}
          </div>

          <AnimatePresence>
            {isEditingName && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex flex-col sm:flex-row gap-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 bg-[#111b33] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
                    placeholder="Nhập tên mới..."
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleUpdateName}
                      disabled={isUpdating}
                      className="px-6 py-2 bg-amber-400 text-black text-[10px] font-bold rounded-xl hover:bg-amber-300 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isUpdating ? "..." : "Lưu"}
                    </button>
                    <button
                      onClick={() => { setIsEditingName(false); setNewName(user?.user_metadata?.full_name || ""); }}
                      className="px-4 py-2 bg-white/5 text-white text-[10px] font-bold rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-5 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm md:text-base font-bold text-white">Mật khẩu</h4>
              <p className="text-white/30 text-[10px] md:text-xs">Nên cập nhật thường xuyên</p>
            </div>
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="px-4 md:px-5 py-2 bg-white/5 hover:bg-white text-white hover:text-black text-[10px] md:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                Đổi mật khẩu
              </button>
            )}
          </div>

          <AnimatePresence>
            {isChangingPassword && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                    className="w-full bg-[#111b33] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới"
                    className="w-full bg-[#111b33] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setIsChangingPassword(false)}
                      className="px-4 py-2 text-[10px] font-bold text-white/50 hover:text-white transition-all cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleDirectUpdatePassword}
                      disabled={isUpdating}
                      className="px-6 py-2 bg-amber-400 text-black text-[10px] font-bold rounded-xl hover:bg-amber-300 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isUpdating ? "..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-5 md:p-6 bg-red-500/5 rounded-2xl md:rounded-3xl border border-red-500/10 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm md:text-base font-bold text-red-400">Xóa tài khoản</h4>
            <p className="text-red-500/40 text-[10px] md:text-xs italic">Cảnh báo: Dữ liệu sẽ mất vĩnh viễn</p>
          </div>
          <button
            onClick={handleDeleteAccount}
            className="px-4 md:px-5 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[10px] md:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            Xóa vĩnh viễn
          </button>
        </div>
      </div>
    </div>
  );
}
