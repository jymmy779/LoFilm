"use client";
import { useState } from "react";
import { loginAdmin } from "@/app/actions/adminAuth";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        const formData = new FormData(e.currentTarget);
        const res = await loginAdmin(formData);
        
        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else {
            router.push("/admin/dashboard");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a1628]">
            <div className="bg-[#0d1b2e] p-8 rounded-lg w-full max-w-md border border-white/10 shadow-2xl">
                <div className="flex justify-center mb-6">
                    <img src="/lofilm_logo.webp" alt="LoFilm Logo" className="h-12" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-6 text-center">Đăng Nhập Quản Trị</h1>
                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm text-center">{error}</div>}
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="text-gray-400 text-sm mb-1 block">Tên đăng nhập</label>
                        <input name="username" type="text" required className="w-full bg-[#152740] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition" />
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm mb-1 block">Mật khẩu</label>
                        <input name="password" type="password" required className="w-full bg-[#152740] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold p-3 rounded mt-2 hover:bg-blue-700 transition flex items-center justify-center gap-2">
                        {loading ? (
                            <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
                        ) : "Đăng nhập"}
                    </button>
                </form>
            </div>
        </div>
    );
}
