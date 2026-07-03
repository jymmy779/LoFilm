import { createClient } from "@/app/utils/supabase/server";
import AdminDashboard from "./AdminDashboard";
import Link from "next/link";
import { logoutAdmin } from "@/app/actions/adminAuth";

import { getSiteSettings } from "@/app/actions/adminSettings";

export default async function AdminPage() {
    const supabase = await createClient();
    
    // Cơ chế Retry tự động cho Supabase Cold Start (để tránh lỗi fetch failed do timeout)
    let movies: any = [];
    let error: any = null;
    
    for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error: sbError } = await supabase
            .from('exclusive_movies')
            .select(`
                *,
                exclusive_episodes (*)
            `)
            .order('created_at', { ascending: false });

        if (!sbError) {
            movies = data;
            error = null;
            break;
        }
        
        error = sbError;
        console.warn(`[Dashboard] Lỗi lấy phim (thử lần ${attempt + 1}):`, sbError.message);
        if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
    }

    const settings = await getSiteSettings();

    return (
        <div className="bg-[#0a1628] min-h-screen text-white">
            <header className="bg-[#0d1b2e] border-b border-white/10 sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <img src="/lofilm_logo.webp" alt="LoFilm Logo" className="h-8" />
                        </Link>
                        <span className="text-gray-400 font-medium border-l border-white/20 pl-4">Admin Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-sm text-gray-400 hover:text-white transition">Về trang chủ</Link>
                        <form action={logoutAdmin}>
                            <button type="submit" className="text-sm bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded transition">
                                Đăng xuất
                            </button>
                        </form>
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto px-4 py-8">
                {error ? (
                    <div className="bg-red-500/10 border border-red-500/50 p-4 rounded text-red-500 mb-6">
                        <strong>Lỗi kết nối CSDL: </strong> {error.message}. <br/>
                        <em>Vui lòng chắc chắn rằng bạn đã chạy đoạn mã SQL tạo bảng trong Supabase Dashboard.</em>
                    </div>
                ) : null}
                <AdminDashboard initialMovies={movies || []} initialSettings={settings} />
            </main>
        </div>
    );
}
