import AdminDashboard from "./AdminDashboard";
import Link from "next/link";
import { logoutAdmin } from "@/app/actions/adminAuth";

import { getSiteSettings } from "@/app/actions/adminSettings";
import { getStarredMovies } from "@/app/actions/adminStarred";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    let stats = { moviesCount: 0, episodesCount: 0, sourcesCount: 0 };
    let error: any = null;

    try {
        const { count: mCount } = await supabase.from('exclusive_movies').select('*', { count: 'exact', head: true });
        const { count: eCount } = await supabase.from('exclusive_episodes').select('*', { count: 'exact', head: true });
        stats = {
            moviesCount: mCount || 0,
            episodesCount: eCount || 0,
            sourcesCount: 0
        };
    } catch (e: any) {
        error = e;
        console.error("[Dashboard] Lỗi lấy thống kê:", e);
    }

    const settings = await getSiteSettings();
    const starredRes = await getStarredMovies();
    const starredMovies = starredRes.data || [];

    return (
        <div className="bg-[#0F1115] min-h-screen text-white">
            <header className="bg-[#0F1115] border-b border-white/10 top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <img src="/images/lofilm_logo.webp" alt="LoFilm Logo" className="h-8" />
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
                        <strong>Lỗi kết nối CSDL: </strong> {error.message}. <br />
                        <em>Vui lòng chắc chắn rằng bạn đã chạy đoạn mã SQL tạo bảng trong Supabase Dashboard.</em>
                    </div>
                ) : null}
                <AdminDashboard initialStats={stats} initialSettings={settings} initialStarredMovies={starredMovies} />
            </main>
        </div>
    );
}
